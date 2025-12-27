
/**
 * 强力标准化字符串数组
 * 输入可以是: string[] | string | null | undefined
 * 输出一定是: string[] (无空字符串，无 null)
 * 
 * @example
 * normalizeStringArray(null) -> []
 * normalizeStringArray("") -> []
 * normalizeStringArray("apple") -> ["apple"]
 * normalizeStringArray("apple, banana") -> ["apple", "banana"]
 * normalizeStringArray("['apple', 'banana']") -> ["apple", "banana"] (JSON string)
 */
export function normalizeStringArray(input: any): string[] {
  if (input === null || input === undefined) return [];

  // 1. 如果已经是数组
  if (Array.isArray(input)) {
    return input
      .map(String) // 确保元素是字符串
      .map(s => s.trim())
      .filter(s => s.length > 0); // 过滤空值
  }

  // 2. 如果是字符串
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.length === 0) return [];

    // A. 尝试当作 JSON 解析 (处理脏数据 "['tag1', 'tag2']")
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map(String)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        }
      } catch (e) {
        // JSON 解析失败，回退到分割逻辑
      }
    }

    // B. 分割逻辑 (逗号、中文逗号、换行)
    return trimmed
      .split(/[,\n，]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // 3. 其他类型 (number, object 等) -> 强转字符串后放入数组
  const str = String(input).trim();
  return str.length > 0 ? [str] : [];
}

/**
 * 强力标准化数字数组
 * 用于 recommended_product_ids 等 int8[] 字段
 */
export function normalizeNumberArray(input: any): number[] {
  if (input === null || input === undefined) return [];

  if (Array.isArray(input)) {
    return input
      .map(Number)
      .filter(n => !isNaN(n) && isFinite(n));
  }

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.length === 0) return [];

    // JSON check
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
           return parsed.map(Number).filter(n => !isNaN(n) && isFinite(n));
        }
      } catch {}
    }

    return trimmed
      .split(/[,\n，]+/)
      .map(Number)
      .filter(n => !isNaN(n) && isFinite(n));
  }

  if (typeof input === 'number') {
    return [input];
  }

  return [];
}
