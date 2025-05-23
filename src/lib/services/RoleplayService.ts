/**
 * @file RoleplayService.ts
 * @description 提供角色扮演功能的服務類，管理角色設定、模板應用和系統提示詞生成
 */

import type { RoleplaySettings, ChatMessage } from '../types'
import { loadFromStorage, saveToStorage } from '../utils/storageUtils'
import { generateRoleplaySystemPrompt, generateWelcomeMessage } from '../utils/promptUtils'
import { deepClone } from '../utils/jsonUtils'

/** 角色扮演設定在 localStorage 中的鍵名 */
export const ROLEPLAY_SETTINGS_KEY = 'roleplay_settings'
/** 角色扮演模板在 localStorage 中的鍵名 */
export const ROLEPLAY_TEMPLATES_KEY = 'roleplay_templates'

// 定義模板類型，包含頭像
export type RoleplayTemplate = Omit<RoleplaySettings, 'isRoleplayMode'>

// 定義預設模板
const DEFAULT_TEMPLATES: Record<string, RoleplayTemplate> = {
	奇幻冒險: {
		characterName: '艾爾文',
		characterRole: '魔法師導遊',
		avatarBase64: undefined, // 模板包含頭像欄位
		sceneDescription: '埃爾德林中世紀奇幻王國，充滿魔法與神秘生物的翡翠森林',
		scenarioDescription: '帶領冒險者穿越危險的翡翠森林，尋找失落的龍族寶藏',
		systemPrompt: '使用華麗的語言描述環境和魔法，創造冒險氛圍。當用戶面臨選擇時，提供多種冒險分支。'
	},
	科幻宇宙: {
		characterName: 'Nova-7',
		characterRole: '星際飛船AI',
		avatarBase64: undefined,
		sceneDescription: '銀河聯邦太空站阿爾法-9，位於仙女座星系邊緣',
		scenarioDescription: '太空站遇到引力波干擾，需要幫助乘客解決各種宇宙難題',
		systemPrompt: '使用科幻術語和技術語言，呈現未來科技感。結合故障排除和太空冒險元素。'
	},
	偵探推理: {
		characterName: '夏洛克',
		characterRole: '名偵探',
		avatarBase64: undefined,
		sceneDescription: '霧氣彌漫的維多利亞時代英國倫敦，貝克街221B',
		scenarioDescription: '調查一起發生在泰晤士河畔的神秘珠寶失竊案，需要分析線索、詢問目擊者',
		systemPrompt: '使用推理和邏輯分析，協助用戶解開謎題。偶爾提供一些模糊的線索，鼓勵用戶思考。'
	},
	歷史探索: {
		characterName: '教授',
		characterRole: '歷史學者',
		avatarBase64: undefined,
		sceneDescription: '亞歷山大港古代圖書館，公元前三世紀的埃及',
		scenarioDescription: '探索古埃及、古希臘與古羅馬的歷史事件，解答歷史謎團',
		systemPrompt: '提供準確的歷史知識，並用生動的方式描述歷史場景。可以角色化地講述歷史故事。'
	}
}

/**
 * 角色扮演服務類
 * 管理角色扮演相關的設定、模板和系統提示詞生成
 */
export class RoleplayService {
	/** 當前角色扮演設定對象 */
	private settings: RoleplaySettings
	/** 所有角色扮演模板 (名稱 -> 設定) */
	private templates: Record<string, RoleplayTemplate>

	/**
	 * 創建 RoleplayService 實例
	 * 初始化預設設定並嘗試從 localStorage 載入已保存的設定和模板
	 */
	constructor() {
		// 設定默認值
		this.settings = {
			characterName: 'AI助手',
			characterRole: '',
			sceneDescription: '',
			scenarioDescription: '',
			systemPrompt: '',
			isRoleplayMode: false,
			avatarBase64: undefined
		}
		this.templates = {}

		this.loadSettings()
		this.loadTemplates()
	}

	/**
	 * 從 localStorage 載入角色扮演設定
	 */
	loadSettings(): RoleplaySettings {
		const defaultSettings: RoleplaySettings = {
			characterName: 'AI助手',
			characterRole: '',
			sceneDescription: '',
			scenarioDescription: '',
			systemPrompt: '',
			isRoleplayMode: false,
			avatarBase64: undefined
		}

		const savedSettings = loadFromStorage<RoleplaySettings>(ROLEPLAY_SETTINGS_KEY, defaultSettings)
		if (savedSettings) {
			// 確保所有必要欄位都存在
			this.settings = {
				...defaultSettings,
				...savedSettings,
				avatarBase64: savedSettings.avatarBase64 || undefined
			}
		}
		return deepClone(this.settings)
	}

	/**
	 * 儲存角色扮演設定到 localStorage
	 */
	saveSettings(settings: RoleplaySettings) {
		// 確保在儲存時保留頭像
		this.settings = {
			...settings,
			avatarBase64: settings.avatarBase64
		}
		saveToStorage(ROLEPLAY_SETTINGS_KEY, this.settings)
	}

	/**
	 * 從 localStorage 載入模板
	 */
	private loadTemplates() {
		this.templates = loadFromStorage(ROLEPLAY_TEMPLATES_KEY, DEFAULT_TEMPLATES)
	}

	/**
	 * 儲存當前模板列表到 localStorage
	 */
	private saveTemplates() {
		saveToStorage(ROLEPLAY_TEMPLATES_KEY, this.templates)
	}

	/**
	 * 獲取所有模板名稱列表
	 */
	getTemplateNames(): string[] {
		return Object.keys(this.templates).sort()
	}

	/**
	 * 根據名稱獲取模板設定
	 */
	getTemplate(name: string): RoleplayTemplate | undefined {
		return this.templates[name] ? deepClone(this.templates[name]) : undefined
	}

	/**
	 * 將指定設定儲存為新模板
	 */
	saveTemplate(name: string, templateSettings: RoleplayTemplate): boolean {
		if (!name || !name.trim()) {
			console.error('模板名稱不能為空')
			return false
		}
		this.templates[name.trim()] = templateSettings
		this.saveTemplates()
		return true
	}

	/**
	 * 刪除指定名稱的模板
	 */
	deleteTemplate(name: string): boolean {
		if (this.templates[name]) {
			delete this.templates[name]
			this.saveTemplates()
			return true
		}
		return false
	}

	/**
	 * 套用指定名稱的角色扮演模板到當前設定
	 */
	applyTemplate(templateName: string): RoleplaySettings | null {
		const template = this.getTemplate(templateName)
		if (template) {
			this.settings = {
				...this.settings,
				...template
			}
			return deepClone(this.settings)
		}
		console.warn(`模板 "${templateName}" 不存在。`)
		return null
	}

	/**
	 * 根據當前角色扮演設定生成系統提示詞
	 */
	generateSystemPrompt(): string {
		return generateRoleplaySystemPrompt(this.settings)
	}

	/**
	 * 生成角色扮演的歡迎訊息
	 */
	generateWelcomeMessage(): ChatMessage | null {
		return generateWelcomeMessage(this.settings)
	}
}
