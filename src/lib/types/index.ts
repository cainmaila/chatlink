// 聊天訊息介面類型
export interface ChatMessage {
	role: 'user' | 'ai' | 'system'
	content: string
}

// Ollama 模型介面
export interface OllamaModel {
	name: string
	[key: string]: unknown // 其他可能的屬性
}

// 角色扮演設定介面
export interface RoleplaySettings {
	characterName: string
	characterRole: string
	sceneDescription: string
	scenarioDescription: string
	systemPrompt: string
	isRoleplayMode: boolean
	avatarBase64?: string // 新增：AI 頭像的 Base64 字串 (可選)
}

// 模型設定介面
export interface ModelSettings {
	selectedModel: string
	ollamaBaseUrl: string
}
