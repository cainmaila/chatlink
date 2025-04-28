<!--
@component
@name ModelSettings
@description 模型設定元件，用於選擇 Ollama 模型和設置 API URL
@example
  ```svelte
  <ModelSettings
    selectedModel="llama2"
    ollamaBaseUrl="http://localhost:11434"
    availableModels={["llama2", "mistral", "codellama"]}
    fetchError={null}
    loading={false}
    isModelValid={true}
    onModelChange={handleModelChange}
    onUrlChange={handleUrlChange}
  />
  ```
-->
<script lang="ts">
	import type { OllamaModel } from '$lib/types'

	/**
	 * 元件屬性
	 * @prop {string} [selectedModel=''] - 當前選擇的模型名稱
	 * @prop {string} [ollamaBaseUrl='http://localhost:11434'] - Ollama API 的基礎 URL
	 * @prop {string[]} [availableModels=[]] - 可用模型列表
	 * @prop {string|null} [fetchError=null] - 獲取模型時的錯誤訊息
	 * @prop {boolean} [loading=false] - 是否正在載入模型
	 * @prop {boolean} [isModelValid=true] - 當前選擇的模型是否有效
	 * @prop {function} [onModelChange] - 模型變更時的回調函數
	 * @prop {function} [onUrlChange] - URL 變更時的回調函數
	 */
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

<!-- 設定面板容器 -->
<div class="settings">
	<!-- 模型選擇區域 -->
	<label>
		模型:
		{#if availableModels.length > 0}
			<!-- 有可用模型時顯示下拉選單 -->
			<select
				value={selectedModel}
				onchange={(e) => onModelChange((e.target as HTMLSelectElement).value)}
				disabled={loading}
			>
				{#each availableModels as model (model)}
					<option value={model}>{model}</option>
				{/each}
			</select>
			<!-- 若選擇的模型無效，顯示警告圖示 -->
			{#if !isModelValid}
				<span
					class="error-tooltip"
					title={`選擇的模型 "${selectedModel}" 目前不可用或不存在於此 Ollama 實例中。`}>⚠️</span
				>
			{/if}
		{:else if fetchError}
			<!-- 獲取模型失敗時顯示錯誤訊息 -->
			<span class="error-text">無法載入模型</span>
		{:else}
			<!-- 正在載入時顯示載入訊息 -->
			<span>載入中...</span>
		{/if}
	</label>

	<!-- Ollama URL 設置區域 -->
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

	<!-- 全域錯誤訊息顯示 -->
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
