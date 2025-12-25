
import { Order } from "@/lib/supabase/types";

/**
 * 完整消息内容：用于复制到剪贴板，包含详细地址和商品清单
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
 * 短版消息内容：专门用于移动端 Deep Link，避免 URL 过长导致无法唤起 LINE
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
 * 获取 LINE OA 消息链接
 * 规则：handle 必须去掉 @，消息必须进行双重编码（部分环境下）
 */
export function getLineDeepLink(oaHandle: string | null, message: string): string {
  if (!oaHandle) return 'https://line.me';
  // 去掉 @ 符号
  const oaId = oaHandle.startsWith('@') ? oaHandle.substring(1) : oaHandle;
  const encodedMessage = encodeURIComponent(message);
  // 使用官方推荐的 oaMessage 格式
  return `https://line.me/R/oaMessage/${oaId}/?${encodedMessage}`;
}

/**
 * 获取 LINE 加好友链接
 */
export function getLineAddFriendLink(oaHandle: string | null): string {
  if (!oaHandle) return 'https://line.me';
  const oaId = oaHandle.startsWith('@') ? oaHandle.substring(1) : oaHandle;
  return `https://line.me/R/ti/p/@${oaId}`;
}
