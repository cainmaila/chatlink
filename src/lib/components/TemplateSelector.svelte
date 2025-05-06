<!--
@component
@name TemplateSelector
@description 角色扮演模板選擇器組件，提供模板的選擇、預覽和刪除功能
-->
<script lang="ts">
	const {
		templateNames = [],
		currentTemplate = '', // 新增：當前使用中的模板
		onPreviewTemplate, // 新增：預覽模板的回調
		onConfirmTemplate, // 新增：確認套用模板的回調
		onDeleteTemplate
	} = $props<{
		templateNames: string[]
		currentTemplate: string
		onPreviewTemplate: (templateName: string) => void
		onConfirmTemplate: (templateName: string) => void
		onDeleteTemplate: (templateName: string) => void
	}>()

	let selectedTemplate = $state(currentTemplate)
	let hasChanges = $derived(selectedTemplate !== currentTemplate)
	let canConfirm = $derived(hasChanges && selectedTemplate !== '')
	let canDelete = $derived(!!selectedTemplate)

	/** 處理模板選擇變更 */
	function handleTemplateChange(templateName: string) {
		selectedTemplate = templateName
		onPreviewTemplate(templateName)
	}

	/** 處理確認套用模板 */
	function handleConfirmTemplate() {
		if (canConfirm) {
			onConfirmTemplate(selectedTemplate)
		}
	}

	/** 處理刪除模板 */
	function handleDeleteTemplate() {
		if (!selectedTemplate) return
		if (confirm(`確定要刪除模板 "${selectedTemplate}" 嗎？此操作無法復原。`)) {
			onDeleteTemplate(selectedTemplate)
			if (selectedTemplate === currentTemplate) {
				selectedTemplate = ''
				onPreviewTemplate('')
			}
		}
	}
</script>

<div class="template-management">
	<label for="template-select">角色模板：</label>
	<select
		id="template-select"
		value={selectedTemplate}
		onchange={(e) => handleTemplateChange((e.target as HTMLSelectElement).value)}
	>
		<option value="">-- 請選擇模板 --</option>
		{#each templateNames as name}
			<option value={name} selected={name === currentTemplate}>{name}</option>
		{/each}
	</select>

	{#if canConfirm}
		<button class="confirm-button" onclick={handleConfirmTemplate}> 確認套用此角色 </button>
	{/if}

	<button class="delete-button" onclick={handleDeleteTemplate} disabled={!canDelete}>
		刪除選定模板
	</button>
</div>

<style lang="postcss">
	.template-management {
		display: flex;
		gap: 10px;
		margin-bottom: 15px;
		align-items: center;
		flex-wrap: wrap;

		& label {
			color: var(--text-color);
		}

		& select {
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

		& .confirm-button {
			background-color: var(--primary-color);
			color: white;
			&:hover:not(:disabled) {
				background-color: var(--primary-hover-color);
			}
		}

		& .delete-button {
			background-color: var(--error-color-secondary);
			&:hover:not(:disabled) {
				background-color: var(--error-color);
				color: white;
			}
		}
	}
</style>
