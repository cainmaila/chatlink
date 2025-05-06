// 聊天訊息介面類型
export interface ChatMessage {
	/** 訊息角色 */
	role: 'ai' | 'user' | 'system'
	/** 訊息內容 */
	content: string
}

// Ollama 模型介面
export interface OllamaModel {
	name: string
	[key: string]: unknown // 其他可能的屬性
}

// 角色扮演設定介面
export interface RoleplaySettings {
	/** 角色名稱 */
	characterName: string
	/** 角色身份 */
	characterRole: string
	/** 場景描述 */
	sceneDescription: string
	/** 情境描述 */
	scenarioDescription: string
	/** 額外系統指令 */
	systemPrompt: string
	/** 是否啟用角色扮演模式 */
	isRoleplayMode: boolean
	/** 角色頭像的 Base64 字串 */
	avatarBase64?: string
}

// 模型設定介面
export interface ModelSettings {
	selectedModel: string
	ollamaBaseUrl: string
}
