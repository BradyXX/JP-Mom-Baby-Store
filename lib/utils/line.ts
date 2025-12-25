import { Order } from "@/lib/supabase/types";

// 定义 OA 结构接口
export interface LineOA {
  name: string;
  handle: string;
  enabled: boolean;
}

/**
 * 1. 规范化 Handle
 * 逻辑：去除空格，确保 @ 前缀
 * 输入： " 586jucbg " -> "@586jucbg"
 */
export function normalizeHandle(handle: string | null): string {
  if (!handle) return "";
  const trimmed = handle.trim();
  // 移除可能存在的 line.me 前缀或其他杂质，只保留 ID 部分
  const cleanId = trimmed.replace(/^(https?:\/\/)?(line\.me\/R\/ti\/p\/|@)?/, "");
  return `@${cleanId}`;
}

/**
 * 2. 核心：OA 选择逻辑
 * 策略：【First Available】(取第一个启用的账号)
 * 原因：这是最稳定、可控的策略。避免客户端轮询造成的不确定性。
 */
export function getActiveLineOA(lineOas: any[] | null): string | null {
  if (!Array.isArray(lineOas)) return null;

  // 1. 过滤出所有 enabled: true 且有 handle 的账号
  const available = lineOas.filter((oa: LineOA) => oa.enabled && oa.handle);

  if (available.length === 0) return null;

  // 2. 直接返回第一个可用的 handle (Deterministic)
  // 如果需要负载均衡，可以在这里改为随机或轮询，但"首个可用"最容易排查问题
  return normalizeHandle(available[0].handle);
}

/**
 * 3. 消息格式化 (完整版 - 用于复制)
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
 * 4. 消息格式化 (短版 - 用于 URL 跳转)
 * 手机端 URL 长度有限，必须精简
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
 * 5. 核心：生成 Universal Link
 * 规则：严格遵循 https://line.me/R/oaMessage/@handle/?{msg}
 */
export function getLineOrderLink(oaHandle: string | null, message: string): string {
  const handle = normalizeHandle(oaHandle);
  
  // 如果没有有效 Handle，兜底跳转到 LINE 主页，避免死链
  if (!handle || handle === "@") return "https://line.me";

  const encodedMsg = encodeURIComponent(message);
  
  // ✅ 唯一验证通过的格式
  return `https://line.me/R/oaMessage/${handle}/?${encodedMsg}`;
}

/**
 * 6. 加好友链接 (兜底)
 */
export function getLineAddFriendLink(oaHandle: string | null): string {
  const handle = normalizeHandle(oaHandle);
  if (!handle || handle === "@") return "https://line.me";
  return `https://line.me/R/ti/p/${handle}`;
}
