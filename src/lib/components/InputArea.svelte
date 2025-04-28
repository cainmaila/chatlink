<script lang="ts">
	const {
		userInput = '',
		onInputChange,
		onSend,
		isModelValid = true,
		isRoleplayMode = false,
		characterName = 'AI',
		loading = false
	} = $props<{
		userInput?: string
		onInputChange: (value: string) => void
		onSend: () => void
		isModelValid?: boolean
		isRoleplayMode?: boolean
		characterName?: string
		loading?: boolean
	}>()

	// 本地輸入值，用於即時響應
	let localInput = $state(userInput)

	// 當父組件的 userInput 變化時，更新本地值
	$effect(() => {
		localInput = userInput
	})

	function handleInputChange(e: Event) {
		const target = e.target as HTMLTextAreaElement
		localInput = target.value
		onInputChange(target.value)

		// 調整文本區域高度
		target.style.height = 'auto'
		target.style.height = `${target.scrollHeight}px`
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			onSend()
		}
	}
</script>

<div class="input-area">
	<textarea
		value={localInput}
		onkeydown={handleKeydown}
		oninput={handleInputChange}
		placeholder={isRoleplayMode ? `與${characterName || 'AI'}對話...` : '輸入訊息...'}
		disabled={loading}
		rows="1"
	></textarea>
	<button onclick={onSend} disabled={loading || !localInput.trim() || !isModelValid}>
		{#if !isModelValid}
			模型無效
		{:else if loading}
			傳送中...
		{:else}
			傳送
		{/if}
	</button>
</div>

<style lang="postcss">
	.input-area {
		display: flex;
		align-items: flex-end;
		padding: 15px;
		border-top: 1px solid var(--border-color);
		background-color: var(--secondary-bg-color);

		& textarea {
			flex-grow: 1;
			padding: 12px;
			border: 1px solid var(--border-color);
			border-radius: 18px;
			resize: none;
			min-height: 48px;
			max-height: 200px;
			overflow-y: auto;
			margin-right: 10px;
			font-size: 1em;
			line-height: 1.5;
			box-sizing: border-box;
			background-color: var(--input-bg);
			color: var(--text-color);
		}

		& button {
			padding: 12px 18px;
			background-color: var(--primary-color);
			color: white;
			border: none;
			border-radius: 18px;
			cursor: pointer;
			font-size: 1em;
			font-weight: bold;
			transition: background-color 0.2s ease-in-out;
			height: 48px;
			box-sizing: border-box;

			&:disabled {
				background-color: #aaa;
				cursor: not-allowed;
				opacity: 0.6;
			}

			&:hover:not(:disabled) {
				background-color: var(--primary-hover-color);
			}
		}
	}
</style>
