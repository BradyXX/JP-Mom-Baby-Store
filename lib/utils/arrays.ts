
/**
 * 强力标准化字符串数组
 * 输入可以是: string[] | string | null | undefined
 * 输出一定是: string[] (无空字符串，无 null)
 * 
 * @example
 * normalizeStringArray(null) -> []
 * normalizeStringArray("apple") -> ["apple"]
 * normalizeStringArray("apple, banana") -> ["apple", "banana"]
 * normalizeStringArray("['apple', 'banana']") -> ["apple", "banana"] (JSON string)
 * normalizeStringArray(["a", "", null]) -> ["a"]
 */
export function normalizeStringArray(input: any): string[] {
  if (input === null || input === undefined) return [];

  // 1. 如果已经是数组
  if (Array.isArray(input)) {
    return input
      .map(item => (item === null || item === undefined) ? '' : String(item))
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  // 2. 如果是字符串
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.length === 0) return [];

    // A. 尝试当作 JSON 解析 (处理脏数据 "['tag1', 'tag2']" 或 '["tag1", "tag2"]')
    if ((trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        // Replace single quotes with double quotes for JSON.parse if strictly needed, 
        // but handle carefully to not break content. 
        // Simple approach: try parse directly first.
        const parsed = JSON.parse(trimmed.replace(/'/g, '"')); 
        if (Array.isArray(parsed)) {
          return parsed
            .map(item => (item === null || item === undefined) ? '' : String(item))
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
 * 
 * @example
 * normalizeNumberArray("1, 2, 3") -> [1, 2, 3]
 * normalizeNumberArray(["1", "abc", 2]) -> [1, 2]
 */
export function normalizeNumberArray(input: any): number[] {
  if (input === null || input === undefined) return [];

  let rawArray: any[] = [];

  if (Array.isArray(input)) {
    rawArray = input;
  } else if (typeof input === 'number') {
    return [input];
  } else if (typeof input === 'string') {
    const trimmed = input.trim();
    if (trimmed.length === 0) return [];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) rawArray = parsed;
      } catch {
        // Fallback to split
        rawArray = trimmed.split(/[,\n，]+/);
      }
    } else {
      rawArray = trimmed.split(/[,\n，]+/);
    }
  }

  // Filter and map to numbers
  return rawArray
    .map(n => Number(n))
    .filter(n => !isNaN(n) && isFinite(n));
}
