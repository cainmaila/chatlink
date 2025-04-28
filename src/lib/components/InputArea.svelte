<!--
@component
@name InputArea
@description 用戶輸入區域元件，處理用戶訊息輸入並提供發送功能
@example
  ```svelte
  <InputArea
    userInput={inputText}
    onInputChange={(value) => inputText = value}
    onSend={handleSend}
    isModelValid={true}
    loading={false}
    isRoleplayMode={false}
    characterName="AI助手"
  />
  ```
-->
<script lang="ts">
	/**
	 * 元件屬性
	 * @prop {string} [userInput=''] - 輸入文字值，與父組件同步
	 * @prop {function} onInputChange - 輸入變更時的回調函數
	 * @prop {function} onSend - 發送訊息時的回調函數
	 * @prop {boolean} [isModelValid=true] - 模型是否有效
	 * @prop {boolean} [isRoleplayMode=false] - 是否為角色扮演模式
	 * @prop {string} [characterName='AI'] - 角色名稱
	 * @prop {boolean} [loading=false] - 是否正在載入
	 */
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

	/** 本地輸入值，用於即時響應 */
	let localInput = $state(userInput)

	/**
	 * 響應外部 userInput 變化
	 * 當父組件的 userInput 變化時，更新本地值
	 */
	$effect(() => {
		localInput = userInput
	})

	/**
	 * 處理輸入變化
	 * 更新本地狀態並通知父組件，同時調整文本區域高度
	 * @param {Event} e - 輸入事件
	 */
	function handleInputChange(e: Event) {
		const target = e.target as HTMLTextAreaElement
		localInput = target.value
		onInputChange(target.value)

		// 調整文本區域高度
		target.style.height = 'auto'
		target.style.height = `${target.scrollHeight}px`
	}

	/**
	 * 處理鍵盤事件
	 * 按下 Enter 鍵（不含 Shift）發送訊息
	 * @param {KeyboardEvent} event - 鍵盤事件
	 */
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			onSend()
		}
	}
</script>

<!-- 輸入區域容器 -->
<div class="input-area">
	<!-- 文本輸入框，支持自動高度調整 -->
	<textarea
		value={localInput}
		onkeydown={handleKeydown}
		oninput={handleInputChange}
		placeholder={isRoleplayMode ? `與${characterName || 'AI'}對話...` : '輸入訊息...'}
		disabled={loading}
		rows="1"
	></textarea>

	<!-- 發送按鈕，根據狀態顯示不同文字 -->
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
