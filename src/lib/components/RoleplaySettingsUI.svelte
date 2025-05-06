<!--
@component
@name RoleplaySettings
@description 角色扮演設定元件，提供角色扮演相關參數配置和模板選擇
@example
  ```svelte
  <RoleplaySettings
    settings={roleplaySettings}
    isModelValid={true}
    onStartRoleplay={startRoleplay}
    onCloseRoleplay={closeRoleplay}
    onApplyTemplate={applyTemplate}
    onSettingsChange={handleSettingsChange}
    systemPrompt="你是一個專業的角色扮演AI..."
  />
  ```
-->
<script lang="ts">
	import type { RoleplaySettings } from '$lib/types'
	import { RoleplayService } from '$lib/services/RoleplayService' // 引入 Service 以便調用方法
	import imageCompression from 'browser-image-compression' // 新增：匯入圖片壓縮庫

	/**
	 * 元件屬性
	 * @prop {RoleplaySettings} settings - 角色扮演設定對象
	 * @prop {boolean} [isModelValid=true] - 模型是否有效
	 * @prop {RoleplayService} roleplayService - 角色扮演服務實例 (用於模板管理)
	 * @prop {function} onStartRoleplay - 開始/重新開始角色扮演的回調函數
	 * @prop {function} onCloseRoleplay - 關閉角色扮演的回調函數
	 * @prop {function} onApplyTemplate - 應用角色扮演模板的回調函數 (父組件處理)
	 * @prop {function} onTemplateListChange - 模板列表變更時的回調 (通知父組件刷新列表)
	 * @prop {function} onApplyTemplate - 應用角色扮演模板的回調函數 (父組件處理)
	 * @prop {function} onSettingsChange - 設定變更時的回調函數 (父組件處理)
	 * @prop {function} onTemplateListChange - 模板列表變更時的回調 (通知父組件刷新列表)
	 * @prop {function} onGenerateTemplateAI - 觸發 AI 生成模板的回調函數 (父組件處理)
	 * @prop {string} [systemPrompt=''] - 系統提示詞，用於預覽
	 */
	const {
		// Back to const
		settings, // No longer bindable
		isModelValid = true,
		roleplayService, // 接收 Service 實例
		onStartRoleplay,
		onCloseRoleplay,
		onApplyTemplate, // 父組件處理套用邏輯
		onSettingsChange, // ADDED BACK
		onTemplateListChange, // 新增回調，通知父組件模板列表已變更
		onGenerateTemplateAI, // 新增：觸發 AI 生成的回調
		systemPrompt = ''
	} = $props<{
		settings: RoleplaySettings
		isModelValid?: boolean
		roleplayService: RoleplayService // 必須傳入
		onStartRoleplay: () => void
		onCloseRoleplay: () => void
		onApplyTemplate: (templateName: string) => void
		onSettingsChange: (updatedSettings: RoleplaySettings) => void // ADDED BACK
		onTemplateListChange: () => void // 新增回調
		onGenerateTemplateAI: (description: string) => Promise<void> // 新增：接收描述並觸發生成
		systemPrompt?: string
	}>()

	// --- 本地元件狀態 ---
	let templateNames = $state(roleplayService.getTemplateNames()) // 從 Service 獲取模板名稱
	let selectedTemplate = $state('') // 用於下拉選單綁定
	let newTemplateName = $state('') // 用於保存新模板的名稱輸入
	let isGeneratingAI = $state(false) // 新增：用於顯示 AI 生成按鈕的加載狀態
	let isUploadingImage = $state(false) // 新增：用於顯示圖片上傳狀態
	// let avatarKey = $state(0); // 移除：不再使用 key 屬性
	// --- 新增：本地表單狀態 ---
	let localSettings = $state<RoleplaySettings>(JSON.parse(JSON.stringify(settings))) // Deep copy initial settings
	let displayedAvatarSrc = $state<string | undefined>(localSettings.avatarBase64) // 新增：用於綁定 img src 的狀態

	// --- 效果：當外部 settings 變化時，同步本地狀態 (除非正在預覽模板) ---
	$effect(() => {
		// 只有在沒有選擇模板預覽時，才用外部 settings 更新本地狀態
		if (!selectedTemplate) {
			localSettings = JSON.parse(JSON.stringify(settings)) // Deep copy
		} else {
		}
	})

	// --- 效果：當選擇的模板變化時，更新本地狀態以預覽，並通知父元件 ---
	$effect(() => {
		if (selectedTemplate) {
			const templateData = roleplayService.getTemplate(selectedTemplate)
			if (templateData) {
				// 更新本地狀態以預覽模板，保留 isRoleplayMode
				localSettings = {
					...localSettings, // 保留 isRoleplayMode
					characterName: templateData.characterName,
					characterRole: templateData.characterRole,
					sceneDescription: templateData.sceneDescription,
					scenarioDescription: templateData.scenarioDescription,
					systemPrompt: templateData.systemPrompt,
					avatarBase64: templateData.avatarBase64 // 新增：從模板中獲取 avatarBase64
				}
			}
		} else {
			// 如果取消選擇模板，恢復到父元件傳入的 settings
			localSettings = JSON.parse(JSON.stringify(settings)) // Deep copy
		}
		// 無論是選擇模板預覽還是取消選擇，都通知父元件狀態變更
		onSettingsChange(localSettings)
	})

	// --- 函數 ---
	// --- 效果：當 localSettings.avatarBase64 變化時，更新 displayedAvatarSrc ---
	$effect(() => {
		displayedAvatarSrc = localSettings.avatarBase64
	})

	/**
	 * 處理本地設定值的更新
	 * 更新特定本地設定屬性並通知父組件
	 * @param {keyof RoleplaySettings} key - 要更新的設定屬性名
	 * @param {any} value - 新的設定值
	 */
	function updateLocalSetting(key: keyof RoleplaySettings, value: any) {
		// 更新本地狀態
		localSettings = {
			...localSettings,
			[key]: value
		}
		// 同步通知父元件
		onSettingsChange(localSettings)

		// 如果使用者手動修改了欄位，且當前正在預覽某個模板，
		// 可以考慮取消模板的選中狀態，因為表單內容不再是純粹的模板預覽了。
		// if (selectedTemplate) {
		//   selectedTemplate = ''; // 取消選中
		// }
	}

	// --- 事件處理 ---

	/** 處理保存模板 - 使用本地狀態 */
	function handleSaveTemplate() {
		if (!newTemplateName.trim()) return
		// 從當前 localSettings 提取模板相關部分，這次要包含 avatarBase64
		const { isRoleplayMode, ...templateSettingsWithAvatar } = localSettings // 解構時保留 avatarBase64
		const success = roleplayService.saveTemplate(newTemplateName.trim(), templateSettingsWithAvatar) // 傳遞包含頭像的設定
		if (success) {
			const savedName = newTemplateName.trim()
			newTemplateName = ''
			templateNames = roleplayService.getTemplateNames()
			selectedTemplate = savedName // 自動選中剛保存的模板
			onTemplateListChange()
		} else {
			console.error(`無法保存模板 "${newTemplateName.trim()}"。`)
		}
	}

	/** 處理刪除模板 */
	function handleDeleteTemplate() {
		if (!selectedTemplate) return
		if (confirm(`確定要刪除模板 "${selectedTemplate}" 嗎？此操作無法復原。`)) {
			const success = roleplayService.deleteTemplate(selectedTemplate)
			if (success) {
				const deletedTemplateName = selectedTemplate
				templateNames = roleplayService.getTemplateNames() // 更新模板列表狀態
				// 如果刪除的是當前選中的，清空選中狀態
				if (selectedTemplate === deletedTemplateName) {
					selectedTemplate = ''
				}
				onTemplateListChange() // 通知父組件列表已更新
			} else {
				console.error(`無法刪除模板 "${selectedTemplate}"。`)
			}
		}
	}

	/** 處理 AI 生成模板請求 */
	async function handleGenerateTemplateAI() {
		const description = prompt(
			'請輸入您想生成的角色基本描述（例如：一個住在未來都市的賽博龐克偵探）：',
			''
		)
		if (description && description.trim()) {
			isGeneratingAI = true
			try {
				await onGenerateTemplateAI(description.trim())
				// 成功後，父元件會更新 settings，UI 會自動刷新
			} catch (error) {
				console.error('AI 模板生成過程中發生錯誤:', error)
				alert(`AI 模板生成失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
			} finally {
				isGeneratingAI = false
			}
		}
	}

	/** 處理圖片上傳 */
	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement
		const file = target.files?.[0]

		if (!file) return

		isUploadingImage = true

		const options = {
			maxSizeMB: 0.5, // 最大檔案大小 (MB) - 調整此值以平衡品質和大小
			maxWidthOrHeight: 300, // 最大寬度或高度 (像素)
			useWebWorker: true,
			initialQuality: 0.7 // 初始壓縮品質 (0-1)
		}

		try {
			const compressedFile = await imageCompression(file, options)

			const reader = new FileReader()
			reader.onloadend = () => {
				const base64String = reader.result as string
				console.log(
					'圖片讀取完成，Base64 字符串生成:',
					base64String ? base64String.substring(0, 50) + '...' : 'null'
				) // 記錄 Base64 字符串（部分）
				// 更新本地狀態並通知父元件
				updateLocalSetting('avatarBase64', base64String) // <--- 改用 updateLocalSetting
				isUploadingImage = false
			}
			reader.onerror = (error) => {
				console.error('讀取壓縮圖片時發生錯誤:', error)
				alert('讀取圖片失敗。')
				isUploadingImage = false
			}
			reader.readAsDataURL(compressedFile)
		} catch (error) {
			console.error('圖片壓縮失敗:', error)
			alert(`圖片壓縮失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
			isUploadingImage = false
		} finally {
			console.log('圖片上傳處理結束') // 記錄處理結束
			// 清空 input value 允許再次選擇同一個檔案
			target.value = ''
		}
	}

	/** 處理圖片載入錯誤，設置為預設圖標 */
	function handleImageError(event: Event) {
		// 簡化類型，讓 Svelte 推斷
		// 使用類型斷言來訪問 src
		const imgElement = event.currentTarget as HTMLImageElement
		imgElement.src = '/favicon.png'
		// 可選：移除 onerror 處理器，避免無限循環（如果預設圖標也載入失敗）
		// event.currentTarget.onerror = null; // 在 Svelte 中通常不需要手動移除
	}
</script>

<!-- 角色扮演設定面板 -->
<div class="roleplay-settings">
	<h2>角色扮演設定</h2>

	<!-- 動態模板選擇區域 -->
	<div class="template-management">
		<label for="template-select">選擇模板：</label>
		<select id="template-select" bind:value={selectedTemplate}>
			<option value="">-- 請選擇模板 --</option>
			{#each templateNames as name}
				<option value={name}>{name}</option>
			{/each}
		</select>
		<button
			onclick={() => selectedTemplate && onApplyTemplate(selectedTemplate)}
			disabled={!selectedTemplate}
		>
			套用選定模板
		</button>
		<button class="delete-button" onclick={handleDeleteTemplate} disabled={!selectedTemplate}>
			刪除選定模板
		</button>
	</div>

	<!-- 保存當前設定為模板 -->
	<div class="template-save">
		<input type="text" bind:value={newTemplateName} placeholder="輸入新模板名稱..." />
		<button onclick={handleSaveTemplate} disabled={!newTemplateName.trim()}>
			將當前設定另存為模板
		</button>
		<button onclick={handleGenerateTemplateAI} disabled={isGeneratingAI || !isModelValid}>
			{isGeneratingAI ? '生成中...' : '✨ AI 生成角色樣板'}
		</button>
	</div>

	<!-- 角色扮演設定表單 -->
	<div class="settings-grid">
		<!-- 頭像上傳與預覽 -->
		<div class="avatar-section">
			<label for="avatar-upload">AI 頭像：</label>
			<div class="avatar-controls">
				<img
					src={displayedAvatarSrc || '/favicon.png'}
					alt="AI 頭像預覽"
					class="avatar-preview"
					onerror={handleImageError}
					data-test="test"
				/>
				<input
					type="file"
					id="avatar-upload"
					accept="image/*"
					onchange={handleImageUpload}
					style="display: none;"
					disabled={isUploadingImage}
				/>
				<button
					class="upload-button"
					onclick={() => document.getElementById('avatar-upload')?.click()}
					disabled={isUploadingImage}
				>
					{isUploadingImage ? '上傳中...' : '選擇圖片'}
				</button>
				{#if localSettings.avatarBase64}
					<button
						class="remove-button"
						onclick={() => updateLocalSetting('avatarBase64', undefined)}
						disabled={isUploadingImage}
						title="移除頭像"
					>
						❌
					</button>
				{/if}
			</div>
			<small>建議使用方形圖片，將自動壓縮至 300x300px 以下。</small>
		</div>

		<!-- 角色名稱設定 -->
		<label>
			角色名稱：
			<input
				type="text"
				bind:value={localSettings.characterName}
				oninput={(e: Event & { currentTarget: HTMLInputElement }) =>
					updateLocalSetting('characterName', e.currentTarget.value)}
				placeholder="例如：艾爾文、Nova-7、夏洛克..."
			/>
		</label>

		<!-- 角色身份設定 -->
		<label>
			角色身份：
			<input
				type="text"
				bind:value={localSettings.characterRole}
				oninput={(e: Event & { currentTarget: HTMLInputElement }) =>
					updateLocalSetting('characterRole', e.currentTarget.value)}
				placeholder="例如：魔法師、星際飛船AI、名偵探..."
			/>
		</label>

		<!-- 場景描述設定 -->
		<label>
			場景描述：
			<textarea
				bind:value={localSettings.sceneDescription}
				oninput={(e: Event & { currentTarget: HTMLTextAreaElement }) =>
					updateLocalSetting('sceneDescription', e.currentTarget.value)}
				placeholder="在哪裡？什麼樣的環境？例如：中世紀城堡、未來太空站..."
			></textarea>
		</label>

		<!-- 情境描述設定 -->
		<label>
			情境描述：
			<textarea
				bind:value={localSettings.scenarioDescription}
				oninput={(e: Event & { currentTarget: HTMLTextAreaElement }) =>
					updateLocalSetting('scenarioDescription', e.currentTarget.value)}
				placeholder="正在發生什麼事？例如：探索遺跡、解決太空船故障..."
			></textarea>
		</label>

		<!-- 額外系統指令設定 -->
		<label>
			額外系統指令：
			<textarea
				bind:value={localSettings.systemPrompt}
				oninput={(e: Event & { currentTarget: HTMLTextAreaElement }) =>
					updateLocalSetting('systemPrompt', e.currentTarget.value)}
				placeholder="其他想對AI說的指示，例如：使用特定的語氣或風格回應..."
			></textarea>
		</label>
	</div>

	<!-- 系統提示預覽區域 -->
	<div class="preview-section">
		<h3>系統提示預覽：</h3>
		<pre class="system-preview">{systemPrompt}</pre>
	</div>

	<!-- 操作按鈕區域 -->
	<div class="roleplay-buttons">
		<!-- 開始/重新開始角色扮演按鈕 -->
		<button class="start-button" onclick={onStartRoleplay} disabled={!isModelValid}>
			{settings.isRoleplayMode ? '重新開始角色扮演' : '開始角色扮演'}
		</button>
		<!-- 關閉角色扮演按鈕 -->
		<button class="clear-button" onclick={onCloseRoleplay}> 關閉角色扮演 </button>
	</div>
</div>

<style lang="postcss">
	.roleplay-settings {
		background-color: var(--secondary-bg-color);
		border-bottom: 1px solid var(--border-color);
		padding: 15px;

		& h2 {
			margin-top: 0;
			margin-bottom: 15px;
			font-size: 1.2em;
			color: var(--text-color);
		}

		& h3 {
			margin-top: 15px;
			margin-bottom: 5px;
			font-size: 1em;
			color: var(--text-color);
		}
	}

	.template-management,
	.template-save {
		display: flex;
		gap: 10px;
		margin-bottom: 15px;
		align-items: center;
		flex-wrap: wrap; /* 允許換行 */

		& label {
			color: var(--text-color);
		}

		& select,
		& input[type='text'] {
			padding: 6px;
			border: 1px solid var(--border-color);
			border-radius: 4px;
			background-color: var(--input-bg);
			color: var(--text-color);
			flex-grow: 1; /* 讓輸入框填滿空間 */
			min-width: 150px; /* 最小寬度 */
		}

		& button {
			padding: 6px 12px;
			background-color: var(--message-user-bg); /* 區分按鈕顏色 */
			color: var(--text-color);
			border: 1px solid var(--border-color);
			border-radius: 4px;
			cursor: pointer;
			transition: background-color 0.2s;
			white-space: nowrap; /* 防止按鈕文字換行 */

			&:hover:not(:disabled) {
				background-color: var(--primary-color);
				color: white;
			}
			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
		}
		& .delete-button {
			background-color: var(--error-color-secondary); /* 刪除按鈕用不同顏色 */
			&:hover:not(:disabled) {
				background-color: var(--error-color);
				color: white;
			}
		}
	}

	.avatar-section {
		grid-column: 1 / -1; /* 讓頭像區塊橫跨所有欄位 */
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 10px; /* 與下方設定保持間距 */

		& label {
			font-weight: bold;
			color: var(--text-color);
		}

		& .avatar-controls {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		& .avatar-preview {
			width: 60px;
			height: 60px;
			border-radius: 50%;
			object-fit: cover;
			border: 1px solid var(--border-color);
			background-color: var(--input-bg); /* 背景色以防圖片透明 */
		}

		& .upload-button,
		& .remove-button {
			padding: 5px 10px;
			font-size: 0.9em;
			background-color: var(--message-user-bg);
			color: var(--text-color);
			border: 1px solid var(--border-color);
			border-radius: 4px;
			cursor: pointer;
			transition: background-color 0.2s;

			&:hover:not(:disabled) {
				background-color: var(--primary-color);
				color: white;
			}
			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
		}
		& .remove-button {
			background-color: transparent;
			border: none;
			font-size: 1.2em;
			padding: 0 5px;
			&:hover:not(:disabled) {
				background-color: rgba(255, 0, 0, 0.1);
			}
		}

		& small {
			font-size: 0.8em;
			color: var(--secondary-text-color);
		}
	}

	.settings-grid {
		display: grid;
		/* grid-template-columns: 1fr 1fr; */ /* 頭像區塊已橫跨，這裡可以調整或移除 */
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); /* 改為自動適應欄位 */
		gap: 15px;

		/* @media (max-width: 600px) {
			grid-template-columns: 1fr;
		} */ /* auto-fit 已處理響應式 */
		/* } */ /* 移除多餘的括號 */

		& label {
			display: flex;
			flex-direction: column;
			gap: 5px;
			color: var(--text-color);
		}

		& input,
		& textarea {
			padding: 8px;
			border: 1px solid var(--border-color);
			border-radius: 4px;
			background-color: var(--input-bg);
			color: var(--text-color);
			font-size: 0.9em;
		}

		& textarea {
			min-height: 70px;
			resize: vertical;
		}
	}

	.preview-section {
		margin-top: 15px;

		& .system-preview {
			padding: 10px;
			background-color: rgba(0, 0, 0, 0.05);
			border-radius: 4px;
			font-family: monospace;
			font-size: 0.85em;
			white-space: pre-wrap;
			max-height: 150px;
			overflow-y: auto;
			color: var(--text-color);
		}
	}

	.roleplay-buttons {
		display: flex;
		justify-content: center;
		gap: 15px;
		margin-top: 15px;

		& .start-button {
			background-color: var(--primary-color);
			color: white;
			padding: 8px 16px;
			border: none;
			border-radius: 4px;
			cursor: pointer;

			&:hover:not(:disabled) {
				background-color: var(--primary-hover-color);
			}

			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
		}

		& .clear-button {
			background-color: var(--error-color);
			color: white;
			padding: 8px 16px;
			border: none;
			border-radius: 4px;
			cursor: pointer;

			&:hover {
				opacity: 0.9;
			}
		}
	}
</style>
