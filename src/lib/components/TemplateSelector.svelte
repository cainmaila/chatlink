<!--
@component
@name TemplateSelector
@description 角色扮演模板選擇器組件，提供模板的選擇、套用和刪除功能
@example
```svelte
<TemplateSelector
  templateNames={['模板1', '模板2']}
  onApplyTemplate={(templateName) => console.log(`套用模板: ${templateName}`)}
  onDeleteTemplate={(templateName) => console.log(`刪除模板: ${templateName}`)}
/>
```
-->
<script lang="ts">
	/**
	 * 元件屬性
	 * @prop {string[]} templateNames - 可用的模板名稱列表
	 * @prop {(templateName: string) => void} onApplyTemplate - 套用模板時的回調函數
	 * @prop {(templateName: string) => void} onDeleteTemplate - 刪除模板時的回調函數
	 */
	const {
		templateNames = [],
		onApplyTemplate,
		onDeleteTemplate
	} = $props<{
		templateNames: string[]
		onApplyTemplate: (templateName: string) => void
		onDeleteTemplate: (templateName: string) => void
	}>()

	let selectedTemplate = $state('')

	/** 處理刪除模板 */
	function handleDeleteTemplate() {
		if (!selectedTemplate) return
		if (confirm(`確定要刪除模板 "${selectedTemplate}" 嗎？此操作無法復原。`)) {
			onDeleteTemplate(selectedTemplate)
			selectedTemplate = '' // 清空選擇
		}
	}
</script>

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

		& .delete-button {
			background-color: var(--error-color-secondary);
			&:hover:not(:disabled) {
				background-color: var(--error-color);
				color: white;
			}
		}
	}
</style>
