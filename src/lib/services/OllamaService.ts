/**
 * @file OllamaService.ts
 * @description 提供與 Ollama API 交互的服務類，處理模型選擇、API 調用和消息格式轉換等功能
 */

import { ChatOllama } from '@langchain/ollama'
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import type { ChatMessage, OllamaModel } from '../types'

/** 存儲選定模型的 localStorage 鍵名 */
export const MODEL_STORAGE_KEY = 'ollama_selected_model'
/** 存儲基礎 URL 的 localStorage 鍵名 */
export const URL_STORAGE_KEY = 'ollama_base_url'

/**
 * Ollama 服務類
 * 提供與 Ollama API 的集成，包括模型獲取、消息轉換和設置管理
 */
export class OllamaService {
	/** Ollama API 的基礎 URL */
	private baseUrl: string
	/** 當前使用的模型名稱 */
	private model: string
	/** 生成回應的溫度參數 (0-1) */
	private temperature: number

	/**
	 * 創建 OllamaService 實例
	 * @param {string} baseUrl - Ollama API 的基礎 URL
	 * @param {string} model - 默認使用的模型名稱
	 * @param {number} temperature - 生成回應的溫度參數
	 */
	constructor(
		baseUrl: string = 'http://localhost:11434',
		model: string = 'gemma:7b',
		temperature: number = 0.7
	) {
		this.baseUrl = baseUrl
		this.model = model
		this.temperature = temperature
	}

	/**
	 * 創建 LangChain 的 ChatOllama 實例
	 * @returns {ChatOllama} 配置好的 ChatOllama 實例
	 */
	createLLM() {
		return new ChatOllama({
			model: this.model,
			baseUrl: this.baseUrl,
			temperature: this.temperature
		})
	}

	/**
	 * 從 Ollama API 獲取可用模型列表
	 * @returns {Promise<{models: OllamaModel[], error: string | null}>} 可用模型列表和可能的錯誤
	 */
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

	/**
	 * 將聊天訊息轉換為 LangChain 消息格式
	 * @param {ChatMessage[]} messages - 應用程序內部的聊天消息格式
	 * @returns {(HumanMessage | AIMessage | SystemMessage)[]} LangChain 格式的消息數組
	 */
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

	/**
	 * 設置 Ollama API 的基礎 URL
	 * @param {string} url - 新的基礎 URL
	 */
	setBaseUrl(url: string) {
		this.baseUrl = url
		localStorage.setItem(URL_STORAGE_KEY, url)
	}

	/**
	 * 設置使用的模型
	 * @param {string} model - 模型名稱
	 */
	setModel(model: string) {
		this.model = model
		localStorage.setItem(MODEL_STORAGE_KEY, model)
	}

	/**
	 * 從 localStorage 載入設定
	 * @returns {{baseUrl: string, model: string}} 載入的設定
	 */
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
