/**
 * @file jsonUtils.ts
 * @description 提供 JSON 相關的工具函數
 */

/**
 * 安全地解析 JSON 字符串
 * @param jsonString JSON 字符串
 * @param defaultValue 解析失敗時的默認值
 * @returns 解析後的對象或默認值
 */
export function safeParseJSON<T>(jsonString: string | null, defaultValue: T): T {
  if (!jsonString) return defaultValue
  
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('JSON 解析失敗:', error)
    return defaultValue
  }
}

/**
 * 深拷貝對象
 * @param obj 要拷貝的對象
 * @returns 深拷貝後的對象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}