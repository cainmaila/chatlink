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
	import { RoleplayService } from '$lib/services/RoleplayService'
	import TemplateSelector from './TemplateSelector.svelte'
	import RoleplaySettingsForm from './RoleplaySettingsForm.svelte'

	const {
		settings,
		isModelValid = true,
		roleplayService,
		onStartRoleplay,
		onCloseRoleplay,
		onApplyTemplate,
		onSettingsChange,
		onTemplateListChange,
		onGenerateTemplateAI,
		systemPrompt = ''
	} = $props<{
		settings: RoleplaySettings
		isModelValid?: boolean
		roleplayService: RoleplayService
		onStartRoleplay: () => void
		onCloseRoleplay: () => void
		onApplyTemplate: (templateName: string) => void
		onSettingsChange: (updatedSettings: RoleplaySettings) => void
		onTemplateListChange: () => void
		onGenerateTemplateAI: (description: string) => Promise<void>
		systemPrompt?: string
	}>()

	// --- 本地元件狀態 ---
	// 只保留必要的狀態
	let templateNames = $derived(roleplayService.getTemplateNames()) // 改為 derived
	let selectedTemplate = $state('')
	let newTemplateName = $state('')
	let isGeneratingAI = $state(false)
	let isUploadingImage = $state(false)
	let localSettings = $state<RoleplaySettings>(JSON.parse(JSON.stringify(settings)))

	// --- 效果：當外部 settings 變化時，同步本地狀態 (除非正在預覽模板) ---
	$effect(() => {
		if (!selectedTemplate) {
			localSettings = JSON.parse(JSON.stringify(settings))
		}
	})

	// --- 效果：當選擇的模板變化時，更新本地狀態以預覽 ---
	$effect(() => {
		const newSettings = selectedTemplate
			? roleplayService.getTemplate(selectedTemplate)
			: JSON.parse(JSON.stringify(settings))

		if (newSettings) {
			localSettings = {
				...localSettings,
				...(selectedTemplate ? newSettings : {}),
				isRoleplayMode: localSettings.isRoleplayMode // 保持原有的模式
			}
			onSettingsChange(localSettings)
		}
	})

	/** 處理設定值更新 */
	function updateLocalSetting(key: keyof RoleplaySettings, value: any) {
		localSettings = {
			...localSettings,
			[key]: value
		}
		onSettingsChange(localSettings)
	}

	/** 處理保存模板 */
	function handleSaveTemplate() {
		if (!newTemplateName.trim()) return
		const { isRoleplayMode, ...templateSettingsWithAvatar } = localSettings
		const success = roleplayService.saveTemplate(newTemplateName.trim(), templateSettingsWithAvatar)
		if (success) {
			const savedName = newTemplateName.trim()
			newTemplateName = ''
			templateNames = roleplayService.getTemplateNames()
			selectedTemplate = savedName
			onTemplateListChange()
		} else {
			console.error(`無法保存模板 "${newTemplateName.trim()}"。`)
		}
	}

	/** 處理刪除模板 */
	function handleDeleteTemplate(templateToDelete: string) {
		const success = roleplayService.deleteTemplate(templateToDelete)
		if (success) {
			templateNames = roleplayService.getTemplateNames()
			if (selectedTemplate === templateToDelete) {
				selectedTemplate = ''
			}
			onTemplateListChange()
		} else {
			console.error(`無法刪除模板 "${templateToDelete}"。`)
		}
	}

	/** 處理 AI 生成模板請求 */
	async function handleGenerateTemplateAI() {
		const description = prompt(
			'請輸入您想生成的角色基本描述（例如：一個住在未來都市的賽博龐克偵探）：',
			''
		)
		if (description?.trim()) {
			isGeneratingAI = true
			try {
				await onGenerateTemplateAI(description.trim())
			} catch (error) {
				console.error('AI 模板生成過程中發生錯誤:', error)
				alert(`AI 模板生成失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
			} finally {
				isGeneratingAI = false
			}
		}
	}
</script>

<div class="roleplay-settings">
	<h2>角色扮演設定</h2>

	<TemplateSelector {templateNames} {onApplyTemplate} onDeleteTemplate={handleDeleteTemplate} />

	<div class="template-save">
		<input type="text" bind:value={newTemplateName} placeholder="輸入新模板名稱..." />
		<button onclick={handleSaveTemplate} disabled={!newTemplateName.trim()}>
			將當前設定另存為模板
		</button>
		<button onclick={handleGenerateTemplateAI} disabled={isGeneratingAI || !isModelValid}>
			{isGeneratingAI ? '生成中...' : '✨ AI 生成角色樣板'}
		</button>
	</div>

	<RoleplaySettingsForm
		settings={localSettings}
		{isUploadingImage}
		onSettingsChange={updateLocalSetting}
	/>

	<div class="preview-section">
		<h3>系統提示預覽：</h3>
		<pre class="system-preview">{systemPrompt}</pre>
	</div>

	<div class="roleplay-buttons">
		<button class="start-button" onclick={onStartRoleplay} disabled={!isModelValid}>
			{settings.isRoleplayMode ? '重新開始角色扮演' : '開始角色扮演'}
		</button>
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

	.template-save {
		display: flex;
		gap: 10px;
		margin-bottom: 15px;
		align-items: center;
		flex-wrap: wrap;

		& input[type='text'] {
			padding: 6px;
			border: 1px solid var(--border-color);
			border-radius: 4px;
			background-color: var(--input-bg);
			color: var(--text-color);
			flex-grow: 1;
			min-width: 150px;
		}

		& button {
			padding: 6px 12px;
			background-color: var(--message-user-bg);
			color: var(--text-color);
			border: 1px solid var(--border-color);
			border-radius: 4px;
			cursor: pointer;
			transition: background-color 0.2s;
			white-space: nowrap;

			&:hover:not(:disabled) {
				background-color: var(--primary-color);
				color: white;
			}
			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
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
