
import { supabase } from './client';
import { AppSettings, Product, Coupon, Order } from './types';
import { normalizeStringArray, normalizeNumberArray } from '@/lib/utils/arrays';

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

// --- Default Fallbacks ---

const DEFAULT_SETTINGS: AppSettings = {
  id: 0,
  shop_name: "MOM&BABY Japan",
  banner_text: "赤ちゃんとママの\n毎日を笑顔に",
  hero_slides: [], // Empty slides will trigger default Hero UI
  currency: "JPY",
  free_shipping_threshold: 10000,
  global_coupon_code: null,
  line_enabled: false,
  line_rr_index: 0,
  line_oas: []
};

// --- Settings ---

export async function getSettings(): Promise<AppSettings> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      // We try to find the row marked as singleton, or fallback to the first row found.
      .order('id', { ascending: true }) 
      .limit(1)
      .maybeSingle(); // Use maybeSingle to avoid error on empty table
    
    if (error) {
      console.warn("Supabase fetch error (using defaults):", error.message);
      return DEFAULT_SETTINGS;
    }
    
    if (!data) {
      console.warn("No settings found in 'app_settings' (using defaults).");
      return DEFAULT_SETTINGS;
    }

    return data;
  } catch (e) {
    console.error("Critical error in getSettings (using defaults):", e);
    return DEFAULT_SETTINGS;
  }
}

export async function adminUpdateSettings(settings: Partial<AppSettings>) {
  const current = await getSettings();
  
  // If we are using defaults (id=0), we might need to insert a row first
  if (current.id === 0) {
     const { data, error } = await supabase.from('app_settings').insert(settings).select().single();
     if (error) throw error;
     return data;
  }

  const { data, error } = await supabase
    .from('app_settings')
    .update(settings)
    .eq('id', current.id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// --- Products ---

export async function listProductsByCollection(handle: string, options: ProductListOptions = {}): Promise<Product[]> {
  try {
    // START QUERY: Base filter for active products
    let query = supabase.from('products').select('*').eq('active', true);

    // FILTER: Collection Handle (Array contains)
    // Note: This relies on collection_handles being a TEXT[] column in Postgres
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
    if (error) {
      console.warn(`Failed to fetch products for ${handle}:`, error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error(`Exception in listProductsByCollection (${handle}):`, e);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // USE .single() INSTEAD OF .maybeSingle() for stricter matching
    // If slug is not unique (which shouldn't happen), .single() throws an error, which is better than returning a random row.
    // If slug is not found, it returns error code PGRST116.
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      // PGRST116: The result contains 0 rows
      if (error.code !== 'PGRST116') {
        console.error("Error fetching product by slug:", slug, error);
      }
      return null;
    }
    return data;
  } catch (e) {
    console.error("Exception fetching product by slug:", slug, e);
    return null;
  }
}

export async function listProductsByIds(ids: number[]): Promise<Product[]> {
  if (!ids.length) return [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .in('id', ids);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

export async function searchProducts(queryText: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`title_jp.ilike.%${queryText}%,short_desc_jp.ilike.%${queryText}%`)
      .eq('active', true)
      .limit(10);
    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
}

// --- Collections ---

export async function listCollections() {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (error) return [];
    return data;
  } catch {
    return [];
  }
}

// --- Coupons ---

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .maybeSingle();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// --- Orders ---

export async function createOrder(order: Partial<Order>) {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
    
  if (error) {
    console.error("Create Order Error:", error);
    throw error;
  }
  return data;
}

// --- Admin Queries ---

export async function adminGetStats() {
  try {
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('total, payment_status, created_at'),
      supabase.from('products').select('id', { count: 'exact' })
    ]);

    const orders = ordersRes.data || [];
    const productCount = productsRes.count || 0;
    
    const gmv = orders.reduce((sum, o) => sum + o.total, 0);
    const paidTotal = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total, 0);

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
  } catch (e) {
    return { orderCount: 0, productCount: 0, gmv: 0, paidTotal: 0, dailyStats: {} };
  }
}

export interface AdminProductListOptions {
  page?: number;
  limit?: number;
  sort?: { column: string, ascending: boolean };
  category?: string;
}

export async function adminListProducts(
  page: number = 1, 
  limit: number = 50,
  sort: { column: string, ascending: boolean } = { column: 'id', ascending: true },
  category?: string
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  let query = supabase.from('products').select('*');
  
  if (category && category !== 'all') {
    query = query.contains('collection_handles', [category]);
  }
  
  return await query
    .order(sort.column, { ascending: sort.ascending })
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
  const cleanProduct = JSON.parse(JSON.stringify(product));
  
  // NORMALIZE ARRAYS before sending to Supabase
  // This ensures even if the frontend sends dirty data, we clean it before DB.
  if (cleanProduct.images) {
    cleanProduct.images = normalizeStringArray(cleanProduct.images);
  }
  if (cleanProduct.collection_handles) {
    cleanProduct.collection_handles = normalizeStringArray(cleanProduct.collection_handles);
  }
  if (cleanProduct.tags) {
    cleanProduct.tags = normalizeStringArray(cleanProduct.tags);
  }
  if (cleanProduct.recommended_product_ids) {
    cleanProduct.recommended_product_ids = normalizeNumberArray(cleanProduct.recommended_product_ids);
  }
  
  const { data, error } = await supabase
    .from('products')
    .upsert(cleanProduct)
    .select();
  if (error) throw error;
  return data;
}

export async function adminBatchUpsertProducts(products: Partial<Product>[]) {
  // Normalize each product in batch
  const cleanProducts = products.map(p => {
    const cp = { ...p };
    if (cp.images) cp.images = normalizeStringArray(cp.images);
    if (cp.collection_handles) cp.collection_handles = normalizeStringArray(cp.collection_handles);
    if (cp.tags) cp.tags = normalizeStringArray(cp.tags);
    if (cp.recommended_product_ids) cp.recommended_product_ids = normalizeNumberArray(cp.recommended_product_ids);
    return cp;
  });

  const { data, error } = await supabase
    .from('products')
    .upsert(cleanProducts, { onConflict: 'slug' });
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

export async function adminDeleteOrders(ids: number[]) {
  const { error } = await supabase
    .from('orders')
    .delete()
    .in('id', ids);
  if (error) throw error;
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
