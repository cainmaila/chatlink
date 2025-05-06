/**
 * @file storageUtils.ts
 * @description 提供本地儲存相關的工具函數
 */

/**
 * 儲存數據到 localStorage
 * @param key 儲存的鍵名
 * @param value 要儲存的值
 */
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`儲存數據到 localStorage 失敗 (key: ${key}):`, error)
  }
}

/**
 * 從 localStorage 讀取數據
 * @param key 儲存的鍵名
 * @param defaultValue 默認值
 * @returns 讀取的數據或默認值
 */
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const storedValue = localStorage.getItem(key)
    if (!storedValue) return defaultValue
    return JSON.parse(storedValue) as T
  } catch (error) {
    console.error(`從 localStorage 讀取數據失敗 (key: ${key}):`, error)
    return defaultValue
  }
}

/**
 * 從 localStorage 移除數據
 * @param key 要移除的鍵名
 */
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`從 localStorage 移除數據失敗 (key: ${key}):`, error)
  }
}

/**
 * 檢查 localStorage 中是否存在某個鍵
 * @param key 要檢查的鍵名
 * @returns boolean
 */
export function existsInStorage(key: string): boolean {
  return localStorage.getItem(key) !== null
}