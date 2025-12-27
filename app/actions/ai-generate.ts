'use server';

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. Initialize Gemini
// Note: process.env.API_KEY is required in .env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Fetch Image to Base64 ---
async function fetchImageAsBase64(url: string): Promise<{ data: string, mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/jpeg';
    return { data: base64, mimeType };
  } catch (e) {
    console.error(`Failed to fetch image: ${url}`, e);
    return null;
  }
}

// --- Types ---
export type AiGenerateResult = {
  success: boolean;
  short_desc_jp?: string;
  long_desc_text?: string;
  error?: string;
};

export type BatchGenerateResult = {
  processed: number;
  success: number;
  failed: number;
  logs: { id: number; title: string; status: 'ok' | 'error' | 'skipped'; msg?: string }[];
};

// --- Core Logic: Generate for One Product ---
export async function generateProductDescription(
  title: string,
  images: string[],
  existingData?: { category?: string, tags?: string[] }
): Promise<AiGenerateResult> {
  try {
    if (!process.env.API_KEY) {
      return { success: false, error: 'API_KEY is missing' };
    }

    // 1. Prepare Inputs
    // Limit to top 3 images to save tokens and latency
    const targetImages = images.slice(0, 3);
    const imageParts = [];

    for (const url of targetImages) {
      const imgData = await fetchImageAsBase64(url);
      if (imgData) {
        imageParts.push({
          inlineData: imgData
        });
      }
    }

    // If no images could be fetched, fallback to text-only prompt
    if (imageParts.length === 0) {
      // Logic could continue with text-only, but quality drops. Let's proceed with text-only warning.
      // return { success: false, error: '有効な画像が見つかりませんでした' };
    }

    // 2. Build Prompt
    const context = `
      商品名: ${title}
      カテゴリー: ${existingData?.category || '未分類'}
      タグ: ${existingData?.tags?.join(', ') || 'なし'}
    `;

    const systemPrompt = `
      あなたは日本の「MOM & BABY」専門店のベテランWebライターです。
      ターゲットは日本のママ（20代〜30代）。
      トーン＆マナー：優しく、安心感があり、少し可愛らしい。専門用語は避け、親しみやすい言葉を使う。
      
      タスク：
      提供された商品画像と情報から、以下の2つを作成してください。
      
      1. 【短い説明】 (short_desc): 
         - 検索一覧などで表示。40〜70文字程度。
         - 1〜2文で、パッと見て「良さそう！」と思わせるキャッチコピー。
      
      2. 【詳細説明】 (long_desc):
         - 商品詳細ページ用。250〜500文字程度。
         - 以下の構成を含めて、自然な文章にまとめてください（見出し記号などは不要、改行で区切る）。
           - 導入：どんな商品か、どんなシーンで役立つか
           - こだわりポイント：素材、安全性、デザイン、機能性など（画像から推測して魅力的に）
           - ママへのメリット：「洗濯しやすい」「着せやすい」「長く使える」など
           - 注意点やサイズ感（もし画像から推測できれば。できなければ「ギフトにもおすすめです」などで締める）
    `;

    const userPrompt = `この商品の説明文をJSON形式で生成してください。\n商品情報:\n${context}`;

    // 3. Define Output Schema
    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        short_desc: { type: Type.STRING, description: "Short description (40-70 chars)" },
        long_desc: { type: Type.STRING, description: "Long description (250-500 chars)" },
      },
      required: ["short_desc", "long_desc"],
    };

    // 4. Call Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [...imageParts, { text: userPrompt }]
      },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, // Creativity balance
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Gemini");

    const data = JSON.parse(jsonText);

    return {
      success: true,
      short_desc_jp: data.short_desc,
      long_desc_text: data.long_desc
    };

  } catch (e: any) {
    console.error("Gemini Generation Error:", e);
    return { success: false, error: e.message };
  }
}


// --- Batch Logic: Server-Side Loop ---
export async function batchGenerateDescriptions(
  productIds: number[],
  forceUpdate: boolean = false
): Promise<BatchGenerateResult> {
  const results: BatchGenerateResult = {
    processed: 0,
    success: 0,
    failed: 0,
    logs: []
  };

  // 1. Fetch Products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .in('id', productIds);

  if (error || !products) {
    results.logs.push({ id: 0, title: 'DB Error', status: 'error', msg: error?.message });
    return results;
  }

  // 2. Loop with Concurrency Control
  // Simple sequential loop for stability (Gemini Rate limits are usually RPM based). 
  // For production with many items, Promise.all with chunks of 3 is better.
  const CHUNK_SIZE = 3;
  
  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    
    await Promise.all(chunk.map(async (p) => {
      // Check Skip Logic
      const hasContent = p.short_desc_jp && p.long_desc_sections && (p.long_desc_sections as any[]).length > 0;
      if (hasContent && !forceUpdate) {
        results.logs.push({ id: p.id, title: p.title_jp, status: 'skipped', msg: 'Already exists' });
        results.processed++;
        return;
      }

      if (!p.images || p.images.length === 0) {
        results.logs.push({ id: p.id, title: p.title_jp, status: 'skipped', msg: 'No images' });
        results.processed++;
        results.failed++;
        return;
      }

      // Generate
      const genResult = await generateProductDescription(
        p.title_jp,
        p.images,
        {
          category: p.collection_handles?.[0],
          tags: p.tags // Supabase returns string[] usually if defined correctly, handled by generic type
        }
      );

      if (genResult.success && genResult.short_desc_jp && genResult.long_desc_text) {
        // Update DB
        const longDescPayload = [{ type: 'text', content: genResult.long_desc_text }];
        
        const { error: updateError } = await supabase
          .from('products')
          .update({
            short_desc_jp: genResult.short_desc_jp,
            long_desc_sections: longDescPayload
          })
          .eq('id', p.id);

        if (updateError) {
          results.logs.push({ id: p.id, title: p.title_jp, status: 'error', msg: 'DB Update Failed' });
          results.failed++;
        } else {
          results.logs.push({ id: p.id, title: p.title_jp, status: 'ok' });
          results.success++;
        }
      } else {
        results.logs.push({ id: p.id, title: p.title_jp, status: 'error', msg: genResult.error || 'AI Error' });
        results.failed++;
      }
      
      results.processed++;
    }));
  }

  return results;
}
