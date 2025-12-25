import { Order } from "@/lib/supabase/types";

export function formatLineMessage(order: Order): string {
  const itemsText = order.items.map(item => 
    `- ${item.title} (${item.sku}) x${item.qty} ${item.variant ? item.variant : ''}`
  ).join('\n');

  return `新規注文（COD）📦
注文番号：${order.order_no}
お名前：${order.customer_name}
電話：${order.phone}
住所：〒${order.postal_code} ${order.prefecture}${order.city} ${order.address_line1} ${order.address_line2 || ''}

商品：
${itemsText}

小計：¥${order.subtotal.toLocaleString()}
割引：-¥${order.discount_total.toLocaleString()}${order.coupon_code ? ` (${order.coupon_code})` : ''}
送料：¥${order.shipping_fee.toLocaleString()}
合計：¥${order.total.toLocaleString()}

備考：${order.notes || 'なし'}

※このメッセージを送信して注文確定してください。`;
}

export function getLineDeepLink(oaHandle: string | null, message: string): string {
  if (!oaHandle) return '#';
  
  // Remove '@' from handle if present for the ID in URL
  const oaId = oaHandle.startsWith('@') ? oaHandle.substring(1) : oaHandle;
  const encodedMessage = encodeURIComponent(message);
  
  return `https://line.me/R/oaMessage/${oaId}/?${encodedMessage}`;
}
