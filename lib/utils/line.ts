import { Order } from "@/lib/supabase/types";

/**
 * 格式化 Handle：由于数据库已存为 @handle 格式，这里直接返回。
 * 仅做基础非空检查。
 */
function getValidHandle(handle: string | null): string {
  return handle || '';
}

/**
 * 完整消息内容：用于复制到剪贴板
 */
export function formatLineMessage(order: Order): string {
  const itemsText = order.items.map(item => 
    `- ${item.title} x${item.qty}${item.variant ? ` [${item.variant}]` : ''}`
  ).join('\n');

  return `注文確認（COD）
注文番号：${order.order_no}
お名前：${order.customer_name} 様
電話：${order.phone}
住所：〒${order.postal_code} ${order.prefecture}${order.city}${order.address_line1} ${order.address_line2 || ''}

商品：
${itemsText}

合計：¥${order.total.toLocaleString()}
備考：${order.notes || 'なし'}

※このメッセージを送信して注文を確定してください。`;
}

/**
 * 短版消息内容：专门用于移动端 Deep Link，确保 URL 长度在安全范围内
 */
export function formatShortLineMessage(order: Order): string {
  const firstItem = order.items[0];
  const itemsSummary = order.items.length > 1 
    ? `${firstItem.title} 外${order.items.length - 1}点`
    : firstItem.title;

  return `注文確定:${order.order_no}
氏名:${order.customer_name}
内容:${itemsSummary}
合計:¥${order.total.toLocaleString()}
※このまま送信してください`;
}

/**
 * 获取 LINE OA 消息链接 (Universal Link)
 * 禁止使用 www.line.me
 * 格式: https://line.me/R/oaMessage/{HANDLE}/?{ENCODED_MESSAGE}
 */
export function getLineUniversalLink(oaHandle: string | null, message: string): string {
  const handle = getValidHandle(oaHandle);
  if (!handle) return 'https://line.me';
  const encodedMessage = encodeURIComponent(message);
  return `https://line.me/R/oaMessage/${handle}/?${encodedMessage}`;
}

/**
 * 获取 LINE App Scheme 链接 (原生唤起)
 * 格式: line://R/oaMessage/{HANDLE}/?{ENCODED_MESSAGE}
 */
export function getLineSchemeLink(oaHandle: string | null, message: string): string {
  const handle = getValidHandle(oaHandle);
  if (!handle) return 'line://';
  const encodedMessage = encodeURIComponent(message);
  return `line://R/oaMessage/${handle}/?${encodedMessage}`;
}

/**
 * 获取 LINE 加好友链接 (兜底方案)
 * 格式: https://line.me/R/ti/p/{HANDLE}
 */
export function getLineAddFriendLink(oaHandle: string | null): string {
  const handle = getValidHandle(oaHandle);
  if (!handle) return 'https://line.me';
  return `https://line.me/R/ti/p/${handle}`;
}
