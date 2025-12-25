import { Order } from "@/lib/supabase/types";

/**
 * Full message including address and full item list (for copying)
 */
export function formatLineMessage(order: Order): string {
  const itemsText = order.items.map(item => 
    `- ${item.title} x${item.qty} ${item.variant ? `(${item.variant})` : ''}`
  ).join('\n');

  return `注文確認（COD）
注文番号：${order.order_no}
お名前：${order.customer_name}
電話：${order.phone}
住所：〒${order.postal_code} ${order.prefecture}${order.city} ${order.address_line1} ${order.address_line2 || ''}

商品：
${itemsText}

合計：¥${order.total.toLocaleString()}
備考：${order.notes || 'なし'}

※このメッセージを送信して注文確定してください。`;
}

/**
 * Shortened version for deep links to avoid URL length issues on mobile
 */
export function formatShortLineMessage(order: Order): string {
  const firstItem = order.items[0];
  const itemsSummary = order.items.length > 1 
    ? `${firstItem.title} ほか${order.items.length - 1}点`
    : firstItem.title;

  return `注文確認:${order.order_no}
氏名:${order.customer_name}
商品:${itemsSummary}
合計:¥${order.total.toLocaleString()}

※送信ボタンを押してください`;
}

export function getLineDeepLink(oaHandle: string | null, message: string): string {
  if (!oaHandle) return '#';
  const oaId = oaHandle.startsWith('@') ? oaHandle.substring(1) : oaHandle;
  const encodedMessage = encodeURIComponent(message);
  return `https://line.me/R/oaMessage/${oaId}/?${encodedMessage}`;
}

export function getLineAddFriendLink(oaHandle: string | null): string {
  if (!oaHandle) return '#';
  const oaId = oaHandle.startsWith('@') ? oaHandle.substring(1) : oaHandle;
  return `https://line.me/R/ti/p/@${oaId}`;
}

export function getLineTextScheme(message: string): string {
  return `line://msg/text/${encodeURIComponent(message)}`;
}
