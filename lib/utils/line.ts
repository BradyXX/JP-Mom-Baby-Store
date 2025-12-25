import { Order } from "@/lib/supabase/types";

/**
 * 规范化 Handle，确保包含 @ 且无多余空格
 */
export function normalizeHandle(handle: string | null): string {
  if (!handle) return "";
  const trimmed = handle.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/**
 * 完整消息内容：用于复制到剪贴板（日本电商风格）
 */
export function formatLineMessage(order: Order): string {
  const itemsText = order.items && order.items.length > 0 
    ? order.items.map(item => `・${item.title} x${item.qty}${item.variant ? ` [${item.variant}]` : ""}`).join("\n")
    : "（商品情報なし）";

  return `【注文確認（代金引換）】
注文番号：${order.order_no}
お名前：${order.customer_name || "未設定"} 様
電話番号：${order.phone || "未設定"}
配送先：〒${order.postal_code || ""}
${order.prefecture || ""}${order.city || ""}${order.address_line1 || ""}
${order.address_line2 || ""}

商品内容：
${itemsText}

合計金額：¥${(order.total || 0).toLocaleString()}
備考：${order.notes || "なし"}

→ このメッセージを送信して注文を確定してください。`;
}

/**
 * 短版消息内容：用于 URL 传参（避免超过长度限制导致唤起失败）
 */
export function formatShortLineMessage(order: Order): string {
  if (!order.items || order.items.length === 0) {
    return `注文確定:${order.order_no}\n合計:¥${(order.total || 0).toLocaleString()}`;
  }
  const firstItem = order.items[0].title;
  const summary = order.items.length > 1 ? `${firstItem} 外${order.items.length - 1}点` : firstItem;

  return `注文確定:${order.order_no}\n氏名:${order.customer_name}\n内容:${summary}\n合計:¥${(order.total || 0).toLocaleString()}\n※このまま送信してください`;
}

/**
 * 获取 Universal Link
 * 格式：https://line.me/R/oaMessage/@handle/?{MSG}
 */
export function getLineUniversalLink(oaHandle: string | null, message: string): string {
  const handle = normalizeHandle(oaHandle);
  if (!handle) return "https://line.me";
  return `https://line.me/R/oaMessage/${handle}/?${encodeURIComponent(message)}`;
}

/**
 * 获取 App Scheme
 * 格式：line://R/oaMessage/@handle/?{MSG}
 */
export function getLineSchemeLink(oaHandle: string | null, message: string): string {
  const handle = normalizeHandle(oaHandle);
  if (!handle) return "line://";
  return `line://R/oaMessage/${handle}/?${encodeURIComponent(message)}`;
}

/**
 * 获取加好友链接
 */
export function getLineAddFriendLink(oaHandle: string | null): string {
  const handle = normalizeHandle(oaHandle);
  if (!handle) return "https://line.me";
  return `https://line.me/R/ti/p/${handle}`;
}
