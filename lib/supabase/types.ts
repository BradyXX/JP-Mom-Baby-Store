
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface AppSettings {
  id: number;
  shop_name: string;
  banner_text: string | null;
  hero_slides: Json; // Array of { image_url: string, link: string, alt: string }
  whatsapp_numbers: string[];
  currency: string;
  free_shipping_threshold: number;
  global_coupon_code: string | null;
  line_enabled: boolean;
  line_oas: string[]; // Changed from complex object array to simple string array ["@handle1", "@handle2"]
  line_rr_index: number;
}

export interface Product {
  id: number;
  created_at: string;
  slug: string;
  title_jp: string;
  sku: string;
  images: string[];
  price: number;
  compare_at_price: number | null;
  in_stock: boolean;
  stock_qty: number;
  short_desc_jp: string | null;
  long_desc_sections: Json; // Array of { title: string, content: string }
  tags: string[];
  collection_handles: string[];
  variants: Json; // Array of { id: string, title: string, sku: string, price: number, stock: number }
  recommended_product_ids: number[];
  active: boolean;
  sort_order: number;
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

export interface OrderItem {
  sku: string;
  title: string;
  price: number;
  qty: number;
  image: string;
  variant?: string;
  productId: number;
  collectionHandles: string[];
}

export interface Order {
  id?: number; // Optional because we don't know it before insert
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
  items: OrderItem[]; // Store full JSON structure
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  total: number;
  coupon_code: string | null;
  payment_method: 'COD' | 'STRIPE' | 'PAYPAL'; // Primarily COD
  payment_status: 'pending' | 'paid' | 'failed';
  status: 'new' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  utm: Json;
  line_oa_handle: string | null;
  line_confirmed: boolean;
}

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
