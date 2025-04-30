/**
 * @file RoleplayService.ts
 * @description 提供角色扮演功能的服務類，管理角色設定、模板應用和系統提示詞生成
 */

import type { RoleplaySettings, ChatMessage } from '../types';

/** 角色扮演設定在 localStorage 中的鍵名 */
export const ROLEPLAY_SETTINGS_KEY = 'roleplay_settings';
/** 角色扮演模板在 localStorage 中的鍵名 */
export const ROLEPLAY_TEMPLATES_KEY = 'roleplay_templates';

// 定義模板類型，包含頭像
export type RoleplayTemplate = Omit<RoleplaySettings, 'isRoleplayMode'>;

// 定義預設模板
const DEFAULT_TEMPLATES: Record<string, RoleplayTemplate> = {
	'奇幻冒險': {
		characterName: '艾爾文',
		characterRole: '魔法師導遊',
		avatarBase64: undefined, // 模板包含頭像欄位
		sceneDescription: '埃爾德林中世紀奇幻王國，充滿魔法與神秘生物的翡翠森林',
		scenarioDescription: '帶領冒險者穿越危險的翡翠森林，尋找失落的龍族寶藏',
		systemPrompt:
			'使用華麗的語言描述環境和魔法，創造冒險氛圍。當用戶面臨選擇時，提供多種冒險分支。'
	},
	'科幻宇宙': {
		characterName: 'Nova-7',
		characterRole: '星際飛船AI',
		avatarBase64: undefined,
		sceneDescription: '銀河聯邦太空站阿爾法-9，位於仙女座星系邊緣',
		scenarioDescription: '太空站遇到引力波干擾，需要幫助乘客解決各種宇宙難題',
		systemPrompt: '使用科幻術語和技術語言，呈現未來科技感。結合故障排除和太空冒險元素。'
	},
	'偵探推理': {
		characterName: '夏洛克',
		characterRole: '名偵探',
		avatarBase64: undefined,
		sceneDescription: '霧氣彌漫的維多利亞時代英國倫敦，貝克街221B',
		scenarioDescription: '調查一起發生在泰晤士河畔的神秘珠寶失竊案，需要分析線索、詢問目擊者',
		systemPrompt:
			'使用推理和邏輯分析，協助用戶解開謎題。偶爾提供一些模糊的線索，鼓勵用戶思考。'
	},
	'歷史探索': {
		characterName: '教授',
		characterRole: '歷史學者',
		avatarBase64: undefined,
		sceneDescription: '亞歷山大港古代圖書館，公元前三世紀的埃及',
		scenarioDescription: '探索古埃及、古希臘與古羅馬的歷史事件，解答歷史謎團',
		systemPrompt: '提供準確的歷史知識，並用生動的方式描述歷史場景。可以角色化地講述歷史故事。'
	}
};


/**
 * 角色扮演服務類
 * 管理角色扮演相關的設定、模板和系統提示詞生成
 */
export class RoleplayService {
	/** 當前角色扮演設定對象 */
	private settings: RoleplaySettings;
	/** 所有角色扮演模板 (名稱 -> 設定) */
	private templates: Record<string, RoleplayTemplate>; // 使用新的模板類型

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
			avatarBase64: undefined // 新增：初始化頭像為 undefined
		};
		this.templates = {}; // 初始化為空物件

		this.loadSettings();
		this.loadTemplates(); // 載入模板
	}

	/**
	 * 從 localStorage 載入角色扮演設定
	 * @returns {RoleplaySettings} 載入的角色扮演設定
	 */
	loadSettings(): RoleplaySettings {
		const storedSettings = localStorage.getItem(ROLEPLAY_SETTINGS_KEY);

		if (storedSettings) {
			try {
				const parsedSettings = JSON.parse(storedSettings);
				// 合併載入的設定和預設值，確保所有欄位都存在
				this.settings = {
					...this.settings, // 先放入預設值
					...parsedSettings // 用載入的值覆蓋
				};
			} catch (e) {
				console.error('無法解析儲存的角色扮演設定:', e);
				// 如果解析失敗，保留預設值
			}
		}
		return this.settings;
	}

	/**
	 * 儲存角色扮演設定到 localStorage
	 * @param {RoleplaySettings} settings - 要保存的角色扮演設定
	 */
	saveSettings(settings: RoleplaySettings) {
		this.settings = settings;
		localStorage.setItem(ROLEPLAY_SETTINGS_KEY, JSON.stringify(settings));
	}

	/**
	 * 獲取當前角色扮演設定的副本
	 * @returns {RoleplaySettings} 當前角色扮演設定的副本
	 */
	getSettings(): RoleplaySettings {
		// 返回一個深拷貝以防止外部修改內部狀態
		return JSON.parse(JSON.stringify(this.settings));
	}

	// --- 模板管理 ---

	/**
	 * 從 localStorage 載入模板，如果不存在則初始化預設模板
	 */
	private loadTemplates() {
		const storedTemplates = localStorage.getItem(ROLEPLAY_TEMPLATES_KEY);
		if (storedTemplates) {
			try {
				this.templates = JSON.parse(storedTemplates);
				// 可選：檢查載入的模板結構是否有效
			} catch (e) {
				console.error('無法解析儲存的角色扮演模板，將使用預設模板:', e);
				this.initializeDefaultTemplates();
			}
		} else {
			// 如果 localStorage 中沒有模板，則初始化預設模板
			this.initializeDefaultTemplates();
		}
	}

	/**
	 * 初始化預設模板並儲存
	 */
	private initializeDefaultTemplates() {
		this.templates = { ...DEFAULT_TEMPLATES };
		this.saveTemplates();
	}

	/**
	 * 儲存當前模板列表到 localStorage
	 */
	private saveTemplates() {
		localStorage.setItem(ROLEPLAY_TEMPLATES_KEY, JSON.stringify(this.templates));
	}

	/**
	 * 獲取所有模板名稱列表
	 * @returns {string[]} 模板名稱陣列
	 */
	getTemplateNames(): string[] {
		return Object.keys(this.templates).sort(); // 返回排序後的名稱
	}

	/**
	 * 根據名稱獲取模板設定
	 * @param {string} name - 模板名稱
	 * @returns {RoleplayTemplate | undefined} 模板設定或 undefined
	 */
	getTemplate(name: string): RoleplayTemplate | undefined { // 返回包含頭像的完整模板
		return this.templates[name] ? { ...this.templates[name] } : undefined;
	}

	/**
	 * 將指定設定儲存為新模板或覆蓋現有模板
	 * @param {string} name - 模板名稱
	 * @param {RoleplayTemplate} templateSettings - 要儲存的模板設定 (包含頭像)
	 * @returns {boolean} 是否成功儲存
	 */
	saveTemplate(name: string, templateSettings: RoleplayTemplate): boolean { // 接收包含頭像的模板
		if (!name || !name.trim()) {
			console.error('模板名稱不能為空');
			return false;
		}
		this.templates[name.trim()] = templateSettings;
		this.saveTemplates();
		return true;
	}

	/**
	 * 刪除指定名稱的模板
	 * @param {string} name - 要刪除的模板名稱
	 * @returns {boolean} 是否成功刪除
	 */
	deleteTemplate(name: string): boolean {
		if (this.templates[name]) {
			delete this.templates[name];
			this.saveTemplates();
			return true;
		}
		return false; // 模板不存在
	}

	/**
	 * 套用指定名稱的角色扮演模板到當前設定
	 * @param {string} templateName - 模板名稱
	 * @returns {RoleplaySettings | null} 套用模板後的角色扮演設定，如果模板不存在則返回 null
	 */
	applyTemplate(templateName: string): RoleplaySettings | null {
		const template = this.getTemplate(templateName); // 獲取包含頭像的模板
		if (template) {
			// 合併模板設定到當前設定，保留 isRoleplayMode
			// 模板中的 avatarBase64 會直接覆蓋當前的
			this.settings = {
				...this.settings, // 保留 isRoleplayMode
				...template // 用模板覆蓋相關欄位 (包括 avatarBase64)
			};
			// 注意：這裡不自動保存 settings，讓調用者決定何時保存
			return this.getSettings(); // 返回更新後的設定副本
		}
		console.warn(`模板 "${templateName}" 不存在。`);
		return null; // 模板不存在
	}

	// --- 提示詞與訊息生成 ---

	/**
	 * 根據當前角色扮演設定生成系統提示詞
	 * 將各設定項組合成一個完整的系統提示指令
	 * @returns {string} 生成的系統提示詞
	 */
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

	/**
	 * 生成角色扮演的歡迎訊息
	 * 當開始角色扮演時顯示角色已進入對話的提示
	 * @returns {ChatMessage | null} 歡迎訊息，若非角色扮演模式則返回 null
	 */
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
