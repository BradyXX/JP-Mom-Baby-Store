
import { supabase } from './client';
import { AppSettings, Product, Coupon, Order } from './types';

export interface ProductListOptions {
  limit?: number;
  page?: number;
  pageSize?: number;
  sort?: 'new' | 'popular' | 'price_asc' | 'price_desc';
  inStockOnly?: boolean;
  tagFilters?: string[];
  priceMin?: number;
  priceMax?: number;
}

// --- Settings ---

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .single();
  
  if (error) {
    // Return default settings if table is empty or missing
    return {
      id: 1,
      shop_name: 'MOM&BABY Japan',
      banner_text: 'やさしさを、かたちに。',
      hero_slides: [],
      whatsapp_numbers: [],
      currency: 'JPY',
      free_shipping_threshold: 10000,
      global_coupon_code: null,
      line_enabled: true,
      line_oas: [], // Default to empty string array
      line_rr_index: 0
    };
  }
  return data;
}

export async function adminUpdateSettings(settings: Partial<AppSettings>) {
  const { data, error } = await supabase
    .from('settings')
    .update(settings)
    .eq('id', settings.id);
  if (error) throw error;
  return data;
}

// --- Products ---

export async function listProductsByCollection(handle: string, options: ProductListOptions = {}): Promise<Product[]> {
  let query = supabase.from('products').select('*').eq('active', true);

  if (handle !== 'all') {
    query = query.contains('collection_handles', [handle]);
  }

  if (options.inStockOnly) {
    query = query.eq('in_stock', true);
  }

  if (options.priceMin !== undefined) {
    query = query.gte('price', options.priceMin);
  }

  if (options.priceMax !== undefined) {
    query = query.lte('price', options.priceMax);
  }

  if (options.tagFilters && options.tagFilters.length > 0) {
    query = query.contains('tags', options.tagFilters);
  }

  // Sorting
  switch (options.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('sort_order', { ascending: true });
      break;
    case 'new':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  // Pagination
  if (options.limit) {
    query = query.limit(options.limit);
  } else if (options.page && options.pageSize) {
    const from = (options.page - 1) * options.pageSize;
    const to = from + options.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function listProductsByIds(ids: number[]): Promise<Product[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);
  if (error) return [];
  return data || [];
}

export async function searchProducts(queryText: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`title_jp.ilike.%${queryText}%,short_desc_jp.ilike.%${queryText}%`)
    .eq('active', true)
    .limit(10);
  if (error) return [];
  return data || [];
}

// --- Collections ---

export async function listCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data;
}

// --- Coupons ---

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .maybeSingle();
  if (error) return null;
  return data;
}

// --- Orders ---

export async function createOrder(order: any) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Admin Queries ---

export async function adminGetStats() {
  const [ordersRes, productsRes] = await Promise.all([
    supabase.from('orders').select('total, payment_status, created_at'),
    supabase.from('products').select('id', { count: 'exact' })
  ]);

  const orders = ordersRes.data || [];
  const productCount = productsRes.count || 0;
  
  const gmv = orders.reduce((sum, o) => sum + o.total, 0);
  const paidTotal = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0);

  // Simple daily stats for last 30 days
  const dailyStats: Record<string, { gmv: number, count: number }> = {};
  orders.forEach(o => {
    const date = new Date(o.created_at).toISOString().split('T')[0];
    if (!dailyStats[date]) dailyStats[date] = { gmv: 0, count: 0 };
    dailyStats[date].gmv += o.total;
    dailyStats[date].count += 1;
  });

  return {
    orderCount: orders.length,
    productCount,
    gmv,
    paidTotal,
    dailyStats
  };
}

export async function adminListProducts(page: number = 1, limit: number = 50) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);
}

export async function adminGetProduct(id: number) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function adminUpsertProduct(product: Partial<Product>) {
  const { data, error } = await supabase
    .from('products')
    .upsert(product)
    .select();
  if (error) throw error;
  return data;
}

export async function adminBatchUpsertProducts(products: Partial<Product>[]) {
  const { data, error } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'slug' });
  if (error) throw error;
  return data;
}

export async function adminDeleteProduct(id: number) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function adminListOrders(page: number = 1, limit: number = 50, status?: string) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);
  return await query.range(from, to);
}

export async function adminGetOrder(id: number) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function adminUpdateOrder(id: number, patch: Partial<Order>) {
  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', id);
  if (error) throw error;
  return data;
}

export async function adminListCoupons() {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adminUpsertCoupon(coupon: Partial<Coupon>) {
  const { data, error } = await supabase.from('coupons').upsert(coupon).select();
  if (error) throw error;
  return data;
}

export async function adminDeleteCoupon(id: number) {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw error;
}
