'use server';

import { createClient } from '@supabase/supabase-js';
import { Product } from '@/lib/supabase/types';

// 初始化 Supabase Admin Client (用于服务端操作)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'product-images';

/**
 * 迁移单个商品的图片
 * 1. 遍历 images 数组
 * 2. 识别非本站(非Supabase)的 URL
 * 3. 下载 -> 上传 -> 获取新 URL
 * 4. 更新数据库
 */
export async function migrateProductImages(productId: number, slug: string, imageUrls: string[]) {
  if (!imageUrls || imageUrls.length === 0) {
    return { success: true, message: '画像がありません', updatedImages: [] };
  }

  const newImages: string[] = [];
  let hasChanges = false;
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];

    // 1. 检查是否已经是 Supabase 的图片 (根据域名判断)
    if (url.includes('supabase.co') || url.startsWith('/')) {
      newImages.push(url);
      continue;
    }

    // 2. 尝试下载外链图片
    try {
      console.log(`[Migrate] Fetching: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      
      // 3. 确定文件扩展名和 Content-Type
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('gif')) ext = 'gif';

      // 4. 生成唯一文件名: slug-index-timestamp.ext
      const fileName = `${slug}-${i}-${Date.now()}.${ext}`;
      const filePath = `migrated/${fileName}`;

      // 5. 上传到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, buffer, {
          contentType,
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 6. 获取公开链接
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      newImages.push(publicUrl);
      hasChanges = true;
      successCount++;
      
    } catch (error) {
      console.error(`[Migrate] Failed to migrate image: ${url}`, error);
      // 失败时保留原 URL，避免数据丢失，但前端需做好兜底
      newImages.push(url);
      failCount++;
    }
  }

  // 7. 如果有变动，更新数据库
  if (hasChanges) {
    const { error: dbError } = await supabase
      .from('products')
      .update({ images: newImages })
      .eq('id', productId);

    if (dbError) {
      throw new Error('Database update failed: ' + dbError.message);
    }
  }

  return {
    success: true,
    message: `完了: 成功 ${successCount}件, 失敗/スキップ ${failCount}件`,
    updatedImages: newImages
  };
}