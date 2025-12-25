import { Order } from "@/lib/supabase/types";

/**
 * 规范化 Handle：确保 handle 永远以 @ 开头
 */
export function normalizeHandle(handle: string | null): string {
  if (!handle) return "";
  const trimmed = handle.trim();
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

/**
 * 完整消息内容：用于手动复制 / 桌面端
 */
export function formatLineMessage(order: Order): string {
  const itemsText = (order.items && order.items.length > 0)
    ? order.items.map(item => `・${item.title || "商品"} x${item.qty || 1}${item.variant ? ` [${item.variant}]` : ""}`).join("\n")
    : "（商品情報がありません）";

  return `【注文確認（代金引換）】
注文番号：${order.order_no || "---"}
お名前：${order.customer_name || "未設定"} 様
電話番号：${order.phone || "未設定"}
住所：〒${order.postal_code || ""} ${order.prefecture || ""}${order.city || ""}${order.address_line1 || ""} ${order.address_line2 || ""}

商品内容：
${itemsText}

合計金額：¥${(order.total || 0).toLocaleString()}
備考：${order.notes || "なし"}

→ このメッセージを送信して注文を確定してください。`;
}

/**
 * 短版消息内容：专门用于手机端跳转链接，防止 URL 过长导致无法唤起
 */
export function formatShortLineMessage(order: Order): string {
  const firstItem = (order.items && order.items.length > 0) ? order.items[0].title : "商品";
  const itemSummary = order.items && order.items.length > 1 ? `${firstItem} 外${order.items.length - 1}点` : firstItem;

  return `注文確定:${order.order_no || "---"}
氏名:${order.customer_name || "未設定"}
内容:${itemSummary}
合計:¥${(order.total || 0).toLocaleString()}
※このまま送信してください`;
}

/**
 * 【核心】生成实测稳定的 Universal Link
 * 格式：https://line.me/R/oaMessage/@handle/?{ENCODED_MESSAGE}
 */
export function getLineOrderLink(oaHandle: string | null, message: string): string {
  const handle = normalizeHandle(oaHandle);
  if (!handle) return "https://line.me";
  const encodedMsg = encodeURIComponent(message);
  // 必须使用 line.me，禁止使用 www.line.me
  return `https://line.me/R/oaMessage/${handle}/?${encodedMsg}`;
}

/**
 * 获取官方账号主页链接（不预填文本的兜底方案）
 */
export function getLineAddFriendLink(oaHandle: string | null): string {
  const handle = normalizeHandle(oaHandle);
  if (!handle) return "https://line.me";
  return `https://line.me/R/ti/p/${handle}`;
}
