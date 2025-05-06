import imageCompression from 'browser-image-compression'

/**
 * @file imageUtils.ts
 * @description 提供圖片處理相關的工具函數
 */

/**
 * 壓縮圖片並轉換為 Base64
 * @param file 要處理的圖片文件
 * @param options 壓縮選項
 * @returns Promise<string> 壓縮後的 Base64 字符串
 */
export async function compressImageToBase64(
	file: File,
	options: Partial<ImageCompressionOptions> = {}
): Promise<string> {
	const finalOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options }

	try {
		const compressedFile = await imageCompression(file, finalOptions)
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onloadend = () => {
				const base64String = reader.result as string
				resolve(base64String)
			}
			reader.onerror = reject
			reader.readAsDataURL(compressedFile)
		})
	} catch (error) {
		console.error('圖片壓縮失敗:', error)
		throw new Error(`圖片壓縮失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
	}
}

/**
 * 驗證圖片大小和類型
 * @param file 要驗證的圖片文件
 * @param maxSizeMB 最大文件大小（MB）
 * @returns {boolean} 是否通過驗證
 */
export function validateImage(file: File, maxSizeMB: number = 2): boolean {
	const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
	if (!validTypes.includes(file.type)) {
		throw new Error('不支援的圖片格式。請使用 JPG、PNG、GIF 或 WebP 格式。')
	}

	if (file.size > maxSizeMB * 1024 * 1024) {
		throw new Error(`圖片大小不能超過 ${maxSizeMB}MB。`)
	}

	return true
}

/**
 * 處理圖片載入錯誤
 * @param event 圖片錯誤事件
 * @param fallbackSrc 備用圖片路徑
 */
export function handleImageError(event: Event, fallbackSrc: string = '/favicon.png'): void {
	console.warn('圖片載入失敗，使用預設圖標。')
	const imgElement = event.currentTarget as HTMLImageElement
	imgElement.src = fallbackSrc
}

export interface ImageCompressionOptions {
	maxSizeMB: number
	maxWidthOrHeight: number
	useWebWorker?: boolean
	initialQuality?: number
}

const DEFAULT_COMPRESSION_OPTIONS: ImageCompressionOptions = {
	maxSizeMB: 0.5,
	maxWidthOrHeight: 300,
	useWebWorker: true,
	initialQuality: 0.7
}
