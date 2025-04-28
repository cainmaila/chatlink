import type { RoleplaySettings, ChatMessage } from '../types'

// 角色扮演設定的 localStorage key
export const ROLEPLAY_SETTINGS_KEY = 'roleplay_settings'

export class RoleplayService {
	private settings: RoleplaySettings

	constructor() {
		// 設定默認值
		this.settings = {
			characterName: 'AI助手',
			characterRole: '',
			sceneDescription: '',
			scenarioDescription: '',
			systemPrompt: '',
			isRoleplayMode: false
		}

		this.loadSettings()
	}

	// 從 localStorage 載入設定
	loadSettings(): RoleplaySettings {
		const storedSettings = localStorage.getItem(ROLEPLAY_SETTINGS_KEY)

		if (storedSettings) {
			try {
				const parsedSettings = JSON.parse(storedSettings)
				this.settings = {
					characterName: parsedSettings.characterName || this.settings.characterName,
					characterRole: parsedSettings.characterRole || this.settings.characterRole,
					sceneDescription: parsedSettings.sceneDescription || this.settings.sceneDescription,
					scenarioDescription:
						parsedSettings.scenarioDescription || this.settings.scenarioDescription,
					systemPrompt: parsedSettings.systemPrompt || this.settings.systemPrompt,
					isRoleplayMode: parsedSettings.isRoleplayMode || this.settings.isRoleplayMode
				}
			} catch (e) {
				console.error('無法解析儲存的角色扮演設定:', e)
			}
		}

		return this.settings
	}

	// 儲存設定到 localStorage
	saveSettings(settings: RoleplaySettings) {
		this.settings = settings
		localStorage.setItem(ROLEPLAY_SETTINGS_KEY, JSON.stringify(settings))
	}

	// 獲取當前設定
	getSettings(): RoleplaySettings {
		return { ...this.settings }
	}

	// 套用預設角色模板
	applyTemplate(template: string): RoleplaySettings {
		switch (template) {
			case 'fantasy-adventure':
				this.settings = {
					...this.settings,
					characterName: '艾爾文',
					characterRole: '魔法師導遊',
					sceneDescription: '埃爾德林中世紀奇幻王國，充滿魔法與神秘生物的翡翠森林',
					scenarioDescription: '帶領冒險者穿越危險的翡翠森林，尋找失落的龍族寶藏',
					systemPrompt:
						'使用華麗的語言描述環境和魔法，創造冒險氛圍。當用戶面臨選擇時，提供多種冒險分支。'
				}
				break
			case 'sci-fi':
				this.settings = {
					...this.settings,
					characterName: 'Nova-7',
					characterRole: '星際飛船AI',
					sceneDescription: '銀河聯邦太空站阿爾法-9，位於仙女座星系邊緣',
					scenarioDescription: '太空站遇到引力波干擾，需要幫助乘客解決各種宇宙難題',
					systemPrompt: '使用科幻術語和技術語言，呈現未來科技感。結合故障排除和太空冒險元素。'
				}
				break
			case 'detective':
				this.settings = {
					...this.settings,
					characterName: '夏洛克',
					characterRole: '名偵探',
					sceneDescription: '霧氣彌漫的維多利亞時代英國倫敦，貝克街221B',
					scenarioDescription: '調查一起發生在泰晤士河畔的神秘珠寶失竊案，需要分析線索、詢問目擊者',
					systemPrompt:
						'使用推理和邏輯分析，協助用戶解開謎題。偶爾提供一些模糊的線索，鼓勵用戶思考。'
				}
				break
			case 'historical':
				this.settings = {
					...this.settings,
					characterName: '教授',
					characterRole: '歷史學者',
					sceneDescription: '亞歷山大港古代圖書館，公元前三世紀的埃及',
					scenarioDescription: '探索古埃及、古希臘與古羅馬的歷史事件，解答歷史謎團',
					systemPrompt: '提供準確的歷史知識，並用生動的方式描述歷史場景。可以角色化地講述歷史故事。'
				}
				break
		}

		this.saveSettings(this.settings)
		return this.settings
	}

	// 生成系統提示詞
	generateSystemPrompt(): string {
		if (!this.settings.isRoleplayMode) return ''

		let prompt = '你是一個角色扮演的AI助手。'

		if (this.settings.characterName) {
			prompt += `\n你的名字是「${this.settings.characterName}」。`
		}

		if (this.settings.characterRole) {
			prompt += `\n你的角色是「${this.settings.characterRole}」。`
		}

		if (this.settings.sceneDescription) {
			prompt += `\n當前場景：${this.settings.sceneDescription}`
		}

		if (this.settings.scenarioDescription) {
			prompt += `\n當前情境：${this.settings.scenarioDescription}`
		}

		if (this.settings.systemPrompt) {
			prompt += `\n\n額外指令：${this.settings.systemPrompt}`
		}

		prompt +=
			'\n\n請始終保持這個角色，不要打破第四面牆。不要提及你是AI或語言模型，完全沉浸在角色中回應用戶。'

		return prompt
	}

	// 生成歡迎訊息
	generateWelcomeMessage(): ChatMessage | null {
		if (!this.settings.isRoleplayMode) return null

		if (this.settings.characterName || this.settings.characterRole) {
			const welcomeMsg = `*${this.settings.characterName || 'AI'}${
				this.settings.characterRole ? `（${this.settings.characterRole}）` : ''
			}已進入對話。*`

			return { role: 'ai', content: welcomeMsg }
		}

		return null
	}
}
