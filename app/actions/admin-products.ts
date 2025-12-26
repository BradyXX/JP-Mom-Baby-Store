'use server';

import { createClient } from '@supabase/supabase-js';

// 初始化 Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const STORAGE_BUCKET = 'product-images';

/**
 * 批量删除商品
 * 关联的 Storage 图片通常不自动删除（取决于Supabase配置），这里仅删除 DB 记录
 */
export async function deleteProducts(productIds: number[]) {
  if (!productIds || productIds.length === 0) {
    return { success: false, message: 'IDが指定されていません' };
  }

  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .in('id', productIds);

    if (error) throw error;

    return { success: true, count: productIds.length };
  } catch (e: any) {
    console.error('Batch Delete Error:', e);
    return { success: false, message: e.message };
  }
}
