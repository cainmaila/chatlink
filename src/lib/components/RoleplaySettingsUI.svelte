<!--
@component
@name RoleplaySettingsUI
@description 角色扮演設定面板，包含模板選擇和設定表單
-->
<script lang="ts">
	import type { RoleplaySettings } from '$lib/types'
	import type { RoleplayService, RoleplayTemplate } from '$lib/services/RoleplayService'
	import { deepClone } from '$lib/utils/jsonUtils'
	import TemplateSelector from './TemplateSelector.svelte'
	import RoleplaySettingsForm from './RoleplaySettingsForm.svelte'

	const {
		settings,
		isModelValid = false,
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

	// --- 本地狀態 ---
	let templateNames = $derived(roleplayService.getTemplateNames())
	let newTemplateName = $state('')
	let isGeneratingAI = $state(false)
	let isUploadingImage = $state(false)

	// 新增：預覽相關狀態
	let currentTemplateName = $state(findCurrentTemplateName())
	let previewSettings = $state<RoleplaySettings>(deepClone(settings))

	/** 找出當前設定對應的模板名稱 */
	function findCurrentTemplateName(): string {
		for (const name of templateNames) {
			const template = roleplayService.getTemplate(name)
			if (template && isSettingsMatchTemplate(settings, template)) {
				return name
			}
		}
		return ''
	}

	/** 比對設定是否與模板匹配 */
	function isSettingsMatchTemplate(
		settings: RoleplaySettings,
		template: RoleplayTemplate
	): boolean {
		return (
			settings.characterName === template.characterName &&
			settings.characterRole === template.characterRole &&
			settings.sceneDescription === template.sceneDescription &&
			settings.scenarioDescription === template.scenarioDescription &&
			settings.systemPrompt === template.systemPrompt &&
			settings.avatarBase64 === template.avatarBase64
		)
	}

	/** 處理模板預覽 */
	function handlePreviewTemplate(templateName: string) {
		if (templateName) {
			const template = roleplayService.getTemplate(templateName)
			if (template) {
				previewSettings = {
					...settings,
					...template,
					avatarBase64: template.avatarBase64 // 確保頭像被包含在預覽中
				}
			}
		} else {
			previewSettings = deepClone(settings)
		}
	}

	/** 處理確認套用模板 */
	function handleConfirmTemplate(templateName: string) {
		currentTemplateName = templateName
		onApplyTemplate(templateName)
	}

	/** 處理刪除模板 */
	function handleDeleteTemplate(templateName: string) {
		const success = roleplayService.deleteTemplate(templateName)
		if (success) {
			if (templateName === currentTemplateName) {
				currentTemplateName = ''
			}
			onTemplateListChange()
		} else {
			console.error(`無法刪除模板 "${templateName}"。`)
		}
	}

	/** 更新預覽設定 */
	function updatePreviewSetting(key: keyof RoleplaySettings, value: any) {
		previewSettings = {
			...previewSettings,
			[key]: value
		}
	}

	/** 處理儲存為新模板 */
	function handleSaveTemplate() {
		if (!newTemplateName.trim()) return

		const templateSettings: RoleplayTemplate = {
			characterName: previewSettings.characterName,
			characterRole: previewSettings.characterRole,
			sceneDescription: previewSettings.sceneDescription,
			scenarioDescription: previewSettings.scenarioDescription,
			systemPrompt: previewSettings.systemPrompt,
			avatarBase64: previewSettings.avatarBase64 // 確保頭像被保存到模板中
		}

		const success = roleplayService.saveTemplate(newTemplateName.trim(), templateSettings)
		if (success) {
			newTemplateName = ''
			onTemplateListChange()
		}
	}

	/** 處理 AI 生成模板 */
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

	<TemplateSelector
		{templateNames}
		currentTemplate={currentTemplateName}
		onPreviewTemplate={handlePreviewTemplate}
		onConfirmTemplate={handleConfirmTemplate}
		onDeleteTemplate={handleDeleteTemplate}
	/>

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
		settings={previewSettings}
		{isUploadingImage}
		onSettingsChange={updatePreviewSetting}
	/>

	<div class="preview-section">
		<h3>系統提示預覽：</h3>
		<pre class="system-prompt">{systemPrompt}</pre>

		<div class="roleplay-controls">
			{#if settings.isRoleplayMode}
				<button class="warning" onclick={onCloseRoleplay}>結束角色扮演</button>
			{:else}
				<button class="primary" onclick={onStartRoleplay}>開始角色扮演</button>
			{/if}
		</div>
	</div>
</div>

<style lang="postcss">
	.roleplay-settings {
		background-color: var(--secondary-bg-color);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 15px;

		& h2 {
			margin-top: 0;
			margin-bottom: 15px;
			color: var(--text-color);
		}
	}

	.template-save {
		display: flex;
		gap: 10px;
		margin-bottom: 15px;
		flex-wrap: wrap;

		& input {
			flex: 1;
			min-width: 200px;
			padding: 6px;
			border: 1px solid var(--border-color);
			border-radius: 4px;
			background-color: var(--input-bg);
			color: var(--text-color);
		}
	}

	.preview-section {
		margin-top: 20px;
		padding: 15px;
		background-color: var(--background-color);
		border: 1px solid var(--border-color);
		border-radius: 4px;

		& h3 {
			margin-top: 0;
			margin-bottom: 10px;
			color: var(--text-color);
		}

		& .system-prompt {
			white-space: pre-wrap;
			background-color: var(--secondary-bg-color);
			padding: 10px;
			border-radius: 4px;
			color: var(--text-color);
			font-family: monospace;
			margin: 0;
		}
	}

	.roleplay-controls {
		display: flex;
		justify-content: center;
		margin-top: 15px;
		gap: 10px;

		& button {
			padding: 8px 16px;
			border: none;
			border-radius: 4px;
			cursor: pointer;
			font-weight: 500;
			transition: background-color 0.2s;

			&.primary {
				background-color: var(--primary-color);
				color: white;

				&:hover:not(:disabled) {
					background-color: var(--primary-hover-color);
				}
			}

			&.warning {
				background-color: var(--warning-color);
				color: white;

				&:hover:not(:disabled) {
					background-color: var(--warning-hover-color);
				}
			}

			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
		}
	}
</style>
