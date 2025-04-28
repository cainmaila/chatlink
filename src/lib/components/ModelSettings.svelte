<script lang="ts">
	const {
		selectedModel = '',
		ollamaBaseUrl = 'http://localhost:11434',
		availableModels = [],
		fetchError = null,
		loading = false,
		isModelValid = true,
		onModelChange = (model: string) => {},
		onUrlChange = (url: string) => {}
	} = $props<{
		selectedModel?: string
		ollamaBaseUrl?: string
		availableModels?: string[]
		fetchError?: string | null
		loading?: boolean
		isModelValid?: boolean
		onModelChange?: (model: string) => void
		onUrlChange?: (url: string) => void
	}>()
</script>

<div class="settings">
	<label>
		模型:
		{#if availableModels.length > 0}
			<select
				value={selectedModel}
				onchange={(e) => onModelChange((e.target as HTMLSelectElement).value)}
				disabled={loading}
			>
				{#each availableModels as model (model)}
					<option value={model}>{model}</option>
				{/each}
			</select>
			{#if !isModelValid}
				<span
					class="error-tooltip"
					title={`選擇的模型 "${selectedModel}" 目前不可用或不存在於此 Ollama 實例中。`}>⚠️</span
				>
			{/if}
		{:else if fetchError}
			<span class="error-text">無法載入模型</span>
		{:else}
			<span>載入中...</span>
		{/if}
	</label>
	<label>
		Ollama URL:
		<input
			type="text"
			value={ollamaBaseUrl}
			onchange={(e) => onUrlChange((e.target as HTMLInputElement).value)}
			placeholder="例如：http://localhost:11434"
			disabled={loading}
		/>
	</label>
	{#if fetchError}
		<p class="error-text global-error">錯誤: {fetchError}</p>
	{/if}
</div>

<style lang="postcss">
	.settings {
		display: flex;
		flex-wrap: wrap;
		gap: 15px;
		padding: 10px 15px;
		background-color: var(--secondary-bg-color);
		border-bottom: 1px solid var(--border-color);
		font-size: 0.9em;

		& label {
			display: flex;
			align-items: center;
			gap: 5px;
			color: var(--text-color);
		}

		& input,
		& select {
			padding: 5px 8px;
			border: 1px solid var(--border-color);
			border-radius: 4px;
			font-size: 1em;
			background-color: var(--input-bg);
			color: var(--text-color);
		}

		& .error-tooltip {
			cursor: help;
			color: var(--warning-color);
			font-weight: bold;
			margin-left: 5px;
		}

		& .error-text {
			color: var(--error-color);
			font-size: 0.9em;
			margin: 0;
		}

		& .global-error {
			width: 100%;
			text-align: center;
			padding-top: 5px;
		}
	}
</style>
