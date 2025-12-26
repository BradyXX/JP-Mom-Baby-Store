
import { Order } from "@/lib/supabase/types";

// ==========================================
// 1. Handle Normalization (Critical)
// ==========================================

/**
 * 规范化 LINE OA Handle
 * 规则：必须包含 @ 前缀，去除空格，去除 URL 前缀
 * 输入: "586jucbg" -> "@586jucbg"
 * 输入: "@586jucbg" -> "@586jucbg"
 * 输入: "https://line.me/.../@586jucbg" -> "@586jucbg"
 */
export function normalizeHandle(handle: string | null | undefined): string {
  if (!handle) return "";
  
  let clean = handle.trim();
  
  // 移除完整的 URL 前缀
  clean = clean.replace(/^(https?:\/\/)?(www\.)?line\.me\/R\/ti\/p\//, "");
  clean = clean.replace(/^(https?:\/\/)?(www\.)?line\.me\//, "");
  
  // 确保 @ 前缀
  if (!clean.startsWith("@")) {
    clean = `@${clean}`;
  }
  
  return clean;
}

// ==========================================
// 2. OA Selection Strategy
// ==========================================

export function getRotatedLineOA(handles: string[] | null): string | null {
  if (!Array.isArray(handles) || handles.length === 0) return null;

  const available = handles
    .map(h => normalizeHandle(h))
    .filter(h => h.length > 1); // "@" + at least 1 char

  if (available.length === 0) return null;

  let index = 0;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('line_rr_idx');
    if (stored) {
      index = parseInt(stored, 10);
      if (isNaN(index)) index = 0;
    } else {
      index = Math.floor(Math.random() * available.length);
    }
  }

  const targetHandle = available[index % available.length];

  if (typeof window !== 'undefined') {
    localStorage.setItem('line_rr_idx', (index + 1).toString());
  }

  return targetHandle;
}

// ==========================================
// 3. Message Formatting
// ==========================================

/**
 * 完整版消息：用于【复制到剪贴板】
 * 包含所有详情，格式工整
 */
export function formatLineMessage(order: Order): string {
  const itemsText = (order.items && order.items.length > 0)
    ? order.items.map(item => `・${item.title} x${item.qty}${item.variant ? ` [${item.variant}]` : ""}`).join("\n")
    : "（商品情報なし）";

  // 使用 || "" 防止 undefined/null 出现在文本中
  return `【注文確認（代金引換）】
注文番号：${order.order_no || "---"}
お名前：${order.customer_name || "---"} 様
電話番号：${order.phone || "---"}
住所：〒${order.postal_code || ""} ${order.prefecture || ""}${order.city || ""}${order.address_line1 || ""} ${order.address_line2 || ""}

商品内容：
${itemsText}

合計金額：¥${(order.total || 0).toLocaleString()}
備考：${order.notes || "なし"}

→ このメッセージを送信して注文を確定してください。`;
}

/**
 * 短消息：用于【URL Deep Link】
 * 尽可能短，防止 URL 过长截断或编码错误
 */
export function formatShortLineMessage(order: Order): string {
  const firstItem = (order.items && order.items.length > 0) ? order.items[0].title : "商品";
  const extraCount = (order.items && order.items.length > 1) ? ` 他${order.items.length - 1}点` : "";
  
  // 精简格式
  return `注文:${order.order_no || ""}
氏名:${order.customer_name || ""}
内訳:${firstItem}${extraCount}
合計:¥${(order.total || 0).toLocaleString()}
※このまま送信してください`;
}

// ==========================================
// 4. Link Generation (Strict)
// ==========================================

/**
 * 生成 Universal Link (主通道)
 * 格式: https://line.me/R/oaMessage/@handle/?{encoded_msg}
 */
export function getLineUniversalLink(oaHandle: string | null, message: string): string {
  const handle = normalizeHandle(oaHandle);
  if (!handle || handle === "@") return "https://line.me"; // Fallback to home

  const encodedMsg = encodeURIComponent(message);
  return `https://line.me/R/oaMessage/${handle}/?${encodedMsg}`;
}

/**
 * 生成 Add Friend Link (兜底)
 * 格式: https://line.me/R/ti/p/@handle
 */
export function getLineAddFriendLink(oaHandle: string | null): string {
  const handle = normalizeHandle(oaHandle);
  if (!handle || handle === "@") return "https://line.me";
  return `https://line.me/R/ti/p/${handle}`;
}

// ==========================================
// 5. Execution Logic (Dual Strategy)
// ==========================================

/**
 * 核心唤起逻辑
 * @param oaHandle - 原始 Handle
 * @param shortMsg - 用于 URL 的短消息
 * @param onFallback - 失败/超时后的回调（用于显示 Modal）
 */
export function openLineDual(
  oaHandle: string | null, 
  shortMsg: string, 
  onFallback: () => void
) {
  const handle = normalizeHandle(oaHandle);
  if (!handle || handle === "@") {
    onFallback();
    return;
  }

  const universalUrl = getLineUniversalLink(handle, shortMsg);
  
  // 1. 启动定时器，如果在一定时间内页面没有跳转（或用户返回），则触发兜底
  // 注意：在部分移动浏览器中，如果成功唤起 APP，JS 计时器可能会暂停，
  // 但用户返回浏览器时，计时器会恢复并触发 onFallback，这正好符合“用户返回后看到帮助弹窗”的需求。
  const timer = setTimeout(() => {
    onFallback();
  }, 1500); // 1.5秒后认为可能失败或用户已返回

  // 2. 尝试跳转 (主通道：Universal Link)
  // 使用 location.href 在移动端唤起 App 的成功率通常高于 window.open
  window.location.href = universalUrl;

  // 3. 可选：清理定时器 (虽然页面跳转后可能不再执行，但在 SPA 中保持良好习惯)
  // 这里的逻辑有点 tricky：如果 href 跳转成功，当前页面可能会 unload，timer 自然销毁。
  // 如果是 Deep Link 唤起 App 但页面保留，timer 会执行，显示兜底 Modal，这是合理的。
}
