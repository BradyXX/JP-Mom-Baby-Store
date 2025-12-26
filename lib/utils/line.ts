
import { Order } from "@/lib/supabase/types";

/**
 * 1. 规范化 Handle
 * 逻辑：去除空格，确保 @ 前缀
 * 输入： " 586jucbg " -> "@586jucbg"
 * 输入： "https://line.me/R/ti/p/@586jucbg" -> "@586jucbg"
 */
export function normalizeHandle(handle: string | null): string {
  if (!handle) return "";
  const trimmed = handle.trim();
  // 移除可能存在的 line.me 前缀或其他杂质，只保留 ID 部分
  const cleanId = trimmed.replace(/^(https?:\/\/)?(line\.me\/R\/ti\/p\/|@)?/, "");
  if (!cleanId) return "";
  return `@${cleanId}`;
}

/**
 * 2. 核心：OA 选择逻辑 (字符串数组版)
 * 策略：【Load Balanced Round Robin】
 * 逻辑：
 * 1. 接收字符串数组 ["@a", "@b"]
 * 2. 过滤掉空字符串
 * 3. 读取本地 localStorage 的轮询游标。
 * 4. 取模运算选择账号。
 * 5. 游标 +1 并存回本地。
 */
export function getRotatedLineOA(handles: string[] | null): string | null {
  if (!Array.isArray(handles) || handles.length === 0) return null;

  // 1. 过滤无效 handle
  const available = handles
    .map(h => normalizeHandle(h))
    .filter(h => h.length > 1); // must have @ and at least 1 char

  if (available.length === 0) return null;

  let index = 0;

  // 仅在客户端执行存储逻辑
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('line_rr_idx');
    
    if (stored) {
      // 如果有历史记录，继续轮询
      index = parseInt(stored, 10);
      if (isNaN(index)) index = 0;
    } else {
      // 随机起始点
      index = Math.floor(Math.random() * available.length);
    }
  }

  // 2. 取模获取目标账号
  const targetHandle = available[index % available.length];

  // 3. 更新游标供下一次使用
  if (typeof window !== 'undefined') {
    localStorage.setItem('line_rr_idx', (index + 1).toString());
  }

  return targetHandle;
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
  
  // 如果没有有效 Handle，兜底跳转到 LINE 主页
  if (!handle || handle === "@") return "https://line.me";

  const encodedMsg = encodeURIComponent(message);
  
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
