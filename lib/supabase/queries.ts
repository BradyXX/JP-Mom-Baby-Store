import { supabase } from './client';
import { AppSettings, Product, Coupon, Order } from './types';

// --- Client Functions (Existing) ---

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !data) {
    return {
      id: 1,
      shop_name: 'MOM&BABY Japan',
      banner_text: '全品送料無料キャンペーン実施中！',
      hero_slides: [],
      whatsapp_numbers: [],
      currency: 'JPY',
      free_shipping_threshold: 10000,
      global_coupon_code: null,
      line_enabled: false,
      line_oas: [],
      line_rr_index: 0
    };
  }
  return data;
}

export interface ProductListOptions {
  limit?: number;
  inStockOnly?: boolean;
  tagFilters?: string[];
  priceMin?: number;
  priceMax?: number;
  sort?: 'popular' | 'new' | 'price_asc' | 'price_desc';
  page?: number;
  pageSize?: number;
}

export async function listProductsByCollection(
  handle: string, 
  options: ProductListOptions = {}
): Promise<Product[]> {
  const { 
    limit, 
    inStockOnly, 
    tagFilters, 
    priceMin, 
    priceMax, 
    sort = 'new',
    page = 1,
    pageSize = 20
  } = options;

  let query = supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .contains('collection_handles', [handle]);

  if (inStockOnly) query = query.eq('in_stock', true);
  if (tagFilters && tagFilters.length > 0) query = query.contains('tags', tagFilters);
  if (priceMin !== undefined) query = query.gte('price', priceMin);
  if (priceMax !== undefined) query = query.lte('price', priceMax);

  switch (sort) {
    case 'popular':
      query = query.order('sort_order', { ascending: true }).order('created_at', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'new':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  if (page && pageSize) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  }
  
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error(`Error fetching collection ${handle}:`, error);
    return [];
  }
  return data as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error) return null;
  return data;
}

export async function listProductsByIds(ids: number[]): Promise<Product[]> {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .in('id', ids)
    .limit(10);
  if (error) return [];
  return data as Product[];
}

export async function searchProducts(keyword: string): Promise<Product[]> {
  if (!keyword.trim()) return [];
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .or(`title_jp.ilike.%${keyword}%,tags.cs.{${keyword}}`)
    .limit(20);
  if (error) return [];
  return data as Product[];
}

export async function listActiveCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('active', true)
    .gte('valid_to', new Date().toISOString());
  if (error) return [];
  return data as Coupon[];
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .single();
  if (error) return null;
  return data as Coupon;
}

export async function createOrder(payload: Partial<Order>) {
  const { error } = await supabase.from('orders').insert([payload]);
  if (error) throw error;
  return true;
}

// --- Admin Functions ---

export async function isAdmin(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // FIXED: Check user_id column instead of id, and use maybeSingle
  const { data } = await supabase
    .from('admin_users')
    .select('user_id, role')
    .eq('user_id', user.id)
    .maybeSingle();
    
  return !!data;
}

export async function adminGetStats() {
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  
  // For GMV and aggregations, usually requires RPC or client-side calc if simple
  const { data: orders } = await supabase.from('orders').select('total, payment_status, created_at');
  
  let gmv = 0;
  let paidTotal = 0;
  const dailyStats: Record<string, { count: number, gmv: number }> = {};
  
  // Init last 30 days
  for(let i=0; i<30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    dailyStats[key] = { count: 0, gmv: 0 };
  }

  orders?.forEach(o => {
    gmv += o.total;
    if (o.payment_status === 'paid') paidTotal += o.total;
    
    const dateKey = new Date(o.created_at!).toISOString().split('T')[0];
    if (dailyStats[dateKey]) {
      dailyStats[dateKey].count += 1;
      dailyStats[dateKey].gmv += o.total;
    }
  });

  return { productCount, orderCount, gmv, paidTotal, dailyStats };
}

// Admin Products
export async function adminListProducts(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  const { data, count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
    
  if (error) throw error;
  return { data: data as Product[], count };
}

export async function adminGetProduct(id: number) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Product;
}

export async function adminUpsertProduct(product: Partial<Product>) {
  // If it's an update, remove id from payload to avoid issues if needed, or keep it for upsert
  const { data, error } = await supabase
    .from('products')
    .upsert(product)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminDeleteProduct(id: number) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Admin Orders
export async function adminListOrders(page = 1, pageSize = 20, status?: string) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  
  const { data, count, error } = await query;
  if (error) throw error;
  return { data: data as Order[], count };
}

export async function adminGetOrder(id: number) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Order;
}

export async function adminUpdateOrder(id: number, patch: Partial<Order>) {
  const { error } = await supabase.from('orders').update(patch).eq('id', id);
  if (error) throw error;
}

// Admin Coupons
export async function adminListCoupons() {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Coupon[];
}

export async function adminUpsertCoupon(coupon: Partial<Coupon>) {
  const { error } = await supabase.from('coupons').upsert(coupon);
  if (error) throw error;
}

export async function adminDeleteCoupon(id: number) {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw error;
}

// Admin Settings
export async function adminUpdateSettings(settings: Partial<AppSettings>) {
  const { error } = await supabase.from('app_settings').update(settings).eq('id', 1);
  if (error) throw error;
}