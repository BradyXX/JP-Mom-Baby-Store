import { CartItem, Coupon } from "@/lib/supabase/types";

export function validateCoupon(coupon: Coupon, subtotal: number): { valid: boolean; error?: string } {
  const now = new Date();

  if (!coupon.active) return { valid: false, error: 'このクーポンは無効です' };
  
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return { valid: false, error: 'このクーポンはまだ使用できません' };
  }
  
  if (coupon.valid_to && new Date(coupon.valid_to) < now) {
    return { valid: false, error: 'このクーポンは期限切れです' };
  }

  if (subtotal < coupon.min_order_amount) {
    return { valid: false, error: `最低購入金額（¥${coupon.min_order_amount.toLocaleString()}）に達していません` };
  }

  // Check usage limit if applicable (Client side check is weak, server should double check, but sufficient for UI)
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, error: 'クーポンの使用上限に達しました' };
  }

  return { valid: true };
}

export function calculateDiscountAmount(coupon: Coupon, cartItems: CartItem[], subtotal: number): number {
  let eligibleAmount = 0;

  if (coupon.scope === 'global') {
    eligibleAmount = subtotal;
  } else if (coupon.scope === 'product') {
    // Sum price of items that match the product IDs
    cartItems.forEach(item => {
      if (coupon.applies_to_product_ids?.includes(item.productId)) {
        eligibleAmount += item.price * item.quantity;
      }
    });
  } else if (coupon.scope === 'collection') {
    // Sum price of items where item.collectionHandles intersects with coupon.applies_to_collection_handles
    cartItems.forEach(item => {
      const hasIntersection = item.collectionHandles.some(handle => 
        coupon.applies_to_collection_handles?.includes(handle)
      );
      if (hasIntersection) {
        eligibleAmount += item.price * item.quantity;
      }
    });
  }

  if (eligibleAmount === 0) return 0;

  // Calculate percentage discount
  const discount = Math.round(eligibleAmount * (coupon.discount_percentage / 100));
  return discount;
}
