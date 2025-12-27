
'use server';

import { createClient } from '@supabase/supabase-js';
import { Product } from '@/lib/supabase/types';
import { normalizeStringArray, normalizeNumberArray } from '@/lib/utils/arrays';

// Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_BUCKET = 'product-images';

// --- Helper: Slug & SKU Generators ---

function generateRandomSku(slugBase: string): string {
  const prefix = slugBase.charAt(0).toLowerCase() || 'p';
  const randomNum = Math.floor(100000 + Math.random() * 900000); 
  return `${prefix}${randomNum}`;
}

function sanitizeSlug(text: string): string {
  if (!text) return `prod-${Date.now()}`;
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') 
    .replace(/^-+|-+$/g, '') || `prod-${Date.now()}`;
}

// --- Helper: Price Calculation ---

function calculatePrice(raw: any, rate: number, rounding: 10 | 50 | 100): number {
  const val = Number(raw);
  if (isNaN(val) || val <= 0) return 0;
  
  const jpy = val * rate;
  return Math.ceil(jpy / rounding) * rounding;
}

// --- Helper: Image Migration ---

async function migrateImage(url: string, slug: string, index: number): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http')) return null;
  if (cleanUrl.includes('supabase.co')) return cleanUrl;

  try {
    const res = await fetch(cleanUrl);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const type = res.headers.get('content-type') || 'image/jpeg';
    
    let ext = 'jpg';
    if (type.includes('png')) ext = 'png';
    else if (type.includes('webp')) ext = 'webp';

    const filename = `imported/${slug}-${index}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filename, buffer, { contentType: type, upsert: true });

    if (error) throw error;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  } catch (e) {
    console.error(`Failed to migrate image ${cleanUrl}:`, e);
    return null;
  }
}

// --- Main Action ---

export type ImportSettings = {
  exchangeRate: number;
  roundingRule: 10 | 50 | 100;
  defaultStock: number;
  collectionHandle: string;
  mode: 'insert' | 'upsert';
};

export type ImportResult = {
  success: boolean;
  rowResults: {
    index: number;
    title: string;
    status: 'success' | 'error' | 'skipped';
    message?: string;
  }[];
};

export async function processImportBatch(
  rows: any[], 
  mapping: Record<string, string>, // CSV Header -> DB Field
  settings: ImportSettings
): Promise<ImportResult> {
  const rowResults: ImportResult['rowResults'] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const row = rows[idx];
    const rowTitle = row[Object.keys(row).find(k => mapping[k] === 'title_jp') || ''] || 'Unknown Product';
    
    try {
      // 1. Map Fields
      const rawData: any = {};
      Object.entries(mapping).forEach(([csvHeader, dbField]) => {
        if (dbField && dbField !== 'ignore') {
          rawData[dbField] = row[csvHeader];
        }
      });

      // 2. Data Cleaning & Defaults
      
      const title_jp = rawData.title_jp?.trim();
      if (!title_jp) throw new Error('商品名(title_jp)が必須です');

      let slug = rawData.slug ? sanitizeSlug(rawData.slug) : sanitizeSlug(title_jp);
      const sku = rawData.sku ? String(rawData.sku).trim() : generateRandomSku(slug);

      const price = calculatePrice(rawData.price, settings.exchangeRate, settings.roundingRule);
      const compare_at = rawData.compare_at_price 
        ? calculatePrice(rawData.compare_at_price, settings.exchangeRate, settings.roundingRule) 
        : null;

      // Images (Normalized using util)
      const imageUrls = normalizeStringArray(rawData.images);

      // 🚀 Image Migration
      const newImages: string[] = [];
      const imagePromises = imageUrls.map((url, i) => migrateImage(url, slug, i));
      const migratedResults = await Promise.all(imagePromises);
      migratedResults.forEach(res => { if(res) newImages.push(res); });

      // Collections (Strict normalization)
      const csvCollections = normalizeStringArray(rawData.collection_handles);
      const collection_handles = settings.collectionHandle 
        ? [...csvCollections, settings.collectionHandle] 
        : csvCollections;
      const uniqueCollections = Array.from(new Set(collection_handles)); // Dedupe

      // Tags (Strict normalization)
      const tags = normalizeStringArray(rawData.tags);

      const short_desc = rawData.short_desc_jp || '';

      // 3. Construct Payload
      const productPayload: Partial<Product> = {
        title_jp,
        slug,
        sku,
        price,
        compare_at_price: compare_at,
        stock_qty: rawData.stock_qty ? Number(rawData.stock_qty) : settings.defaultStock,
        in_stock: true,
        active: true,
        images: newImages, // guaranteed string[]
        collection_handles: uniqueCollections, // guaranteed string[]
        tags, // guaranteed string[]
        short_desc_jp: short_desc,
        long_desc_sections: [],
        variants: [],
        recommended_product_ids: [],
        sort_order: 0,
      };

      // 4. DB Operation
      let error: any = null;

      if (settings.mode === 'upsert') {
         const { error: upsertError } = await supabase
           .from('products')
           .upsert(productPayload, { onConflict: 'slug', ignoreDuplicates: false });
         error = upsertError;
      } else {
         const { data: existing } = await supabase.from('products').select('id').eq('slug', slug).maybeSingle();
         if (existing) {
             productPayload.slug = `${slug}-${Math.floor(Math.random()*1000)}`;
             productPayload.sku = `${sku}-${Math.floor(Math.random()*1000)}`;
         }
         const { error: insertError } = await supabase
           .from('products')
           .insert(productPayload);
         error = insertError;
      }

      if (error) throw new Error(error.message);

      rowResults.push({ index: idx, title: title_jp, status: 'success' });

    } catch (e: any) {
      rowResults.push({ 
        index: idx, 
        title: rowTitle, 
        status: 'error', 
        message: e.message 
      });
    }
  }

  return { success: true, rowResults };
}
