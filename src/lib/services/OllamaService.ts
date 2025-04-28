import { ChatOllama } from '@langchain/ollama'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import type { ChatMessage, OllamaModel } from '../types'

// Local Storage Keys
export const MODEL_STORAGE_KEY = 'ollama_selected_model'
export const URL_STORAGE_KEY = 'ollama_base_url'

export class OllamaService {
	private baseUrl: string
	private model: string
	private temperature: number

	constructor(
		baseUrl: string = 'http://localhost:11434',
		model: string = 'gemma:7b',
		temperature: number = 0.7
	) {
		this.baseUrl = baseUrl
		this.model = model
		this.temperature = temperature
	}

	// 創建 ChatOllama 實例
	createLLM() {
		return new ChatOllama({
			model: this.model,
			baseUrl: this.baseUrl,
			temperature: this.temperature
		})
	}

	// 獲取可用模型列表
	async fetchModels(): Promise<{ models: OllamaModel[]; error: string | null }> {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`)
			if (!response.ok) {
				throw new Error(`無法連接到 Ollama API (狀態碼: ${response.status})`)
			}
			const data = await response.json()

			if (data && Array.isArray(data.models)) {
				return { models: data.models, error: null }
			} else {
				throw new Error('從 Ollama API 收到的模型列表格式不正確。')
			}
		} catch (error: unknown) {
			console.error('獲取 Ollama 模型列表時發生錯誤:', error)
			return {
				models: [],
				error: `獲取模型列表失敗：${error instanceof Error ? error.message : '未知錯誤'}`
			}
		}
	}

	// 將聊天訊息轉換為 LangChain 消息格式
	convertMessages(messages: ChatMessage[]) {
		return messages.map((msg) => {
			if (msg.role === 'user') {
				return new HumanMessage(msg.content)
			} else if (msg.role === 'ai') {
				return new AIMessage(msg.content)
			} else if (msg.role === 'system') {
				return new SystemMessage(msg.content)
			} else {
				return new HumanMessage(msg.content)
			}
		})
	}

	// 設置基礎 URL
	setBaseUrl(url: string) {
		this.baseUrl = url
		localStorage.setItem(URL_STORAGE_KEY, url)
	}

	// 設置模型
	setModel(model: string) {
		this.model = model
		localStorage.setItem(MODEL_STORAGE_KEY, model)
	}

	// 從 localStorage 載入設定
	loadSettings() {
		const storedModel = localStorage.getItem(MODEL_STORAGE_KEY)
		const storedUrl = localStorage.getItem(URL_STORAGE_KEY)

		if (storedModel) {
			this.model = storedModel
		}
		if (storedUrl) {
			this.baseUrl = storedUrl
		} else {
			localStorage.setItem(URL_STORAGE_KEY, this.baseUrl)
		}

		return {
			baseUrl: this.baseUrl,
			model: this.model
		}
	}
}
