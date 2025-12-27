
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface AppSettings {
  id: number;
  created_at?: string;
  shop_name: string;
  banner_text: string | null;
  hero_slides: Json; // DB: jsonb (Array of objects)
  support_email?: string;
  support_line?: string;
  whatsapp_numbers?: string[]; // DB: text[]
  currency: string;
  free_shipping_threshold: number;
  global_coupon_code: string | null;
  
  // Singleton control
  singleton?: boolean;

  // LINE Settings
  line_enabled: boolean;
  line_channel?: string;
  line_notify_mode?: string;
  line_target_default?: string;
  line_oas: Json; // DB: jsonb (Stores string[] e.g. ["@abc", "@def"])
  line_rr_index: number;
}

// DEFINITION FOR VARIANTS
export interface ProductVariant {
  sku: string;
  options: { [key: string]: string }; // e.g. { "Size": "M", "Color": "Red" }
  price?: number; // Optional: usually inherited from parent
  compare_at_price?: number; // Optional
  stock_qty: number;
  in_stock: boolean;
  image?: string; // URL specific to this variant
}

export interface Product {
  id: number;
  created_at: string;
  slug: string;
  title_jp: string;
  sku: string;
  images: string[]; // DB: text[]
  price: number;
  compare_at_price: number | null;
  in_stock: boolean;
  stock_qty: number;
  short_desc_jp: string | null;
  description: string | null; // Legacy description field
  long_desc_sections: Json; // DB: jsonb
  tags: string[]; // DB: text[]
  collection_handles: string[]; // DB: text[]
  variants: ProductVariant[]; // DB: jsonb (Strictly typed as Array of Variant)
  recommended_product_ids: number[]; // DB: int8[]
  active: boolean;
  sort_order: number;
}

export interface OrderItem {
  sku: string;
  title: string;
  price: number;
  qty: number;
  image: string;
  variant?: string;
  productId: number;
}

export interface Order {
  id?: number;
  created_at?: string;
  order_no: string;
  customer_name: string;
  phone: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2: string | null;
  notes: string | null;
  items: Json; // DB: jsonb (Stores OrderItem[])
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  total: number;
  coupon_code: string | null;
  payment_method: string;
  payment_status: string;
  status: string;
  
  // Marketing & Tracking
  utm: Json; // DB: jsonb
  line_oa_handle: string | null;
  line_confirmed: boolean;
}

export interface Coupon {
  id: number;
  code: string;
  discount_percentage: number;
  scope: 'global' | 'product' | 'collection';
  applies_to_product_ids: number[];
  applies_to_collection_handles: string[];
  min_order_amount: number;
  valid_from: string | null;
  valid_to: string | null;
  stackable: boolean;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
}

// Helper types for App usage
export interface CartItem {
  productId: number;
  collectionHandles: string[];
  slug: string;
  title: string;
  variantId?: string;
  variantTitle?: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}
