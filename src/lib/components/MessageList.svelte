<!--
@component
@name MessageList
@description 聊天訊息列表元件，負責顯示所有聊天訊息並處理自動滾動
@example
  ```svelte
  <MessageList
    messages={[{role: 'user', content: '你好'}, {role: 'ai', content: '你好，我能幫你什麼？'}]}
    loading={false}
    isRoleplayMode={false}
    characterName="AI助手"
    avatarBase64="data:image/png;base64,..."
  />
  ```
-->
<script lang="ts">
	import { tick } from 'svelte'
	import MessageItem from './MessageItem.svelte'
	import type { ChatMessage } from '$lib/types'

	/**
	 * 元件屬性
	 * @prop {ChatMessage[]} [messages=[]] - 聊天訊息列表
	 * @prop {boolean} [loading=false] - 是否正在載入（顯示思考中狀態）
	 * @prop {boolean} [isRoleplayMode=false] - 是否為角色扮演模式
	 * @prop {string} [characterName='AI'] - 角色名稱，在角色扮演模式下顯示
	 * @prop {string} [avatarBase64] - AI 頭像的 Base64 字串 (可選)
	 */
	const {
		messages = [],
		loading = false,
		isRoleplayMode = false,
		characterName = 'AI',
		avatarBase64 = undefined // 新增：接收頭像 prop
	} = $props<{
		messages?: ChatMessage[]
		loading?: boolean
		isRoleplayMode?: boolean
		characterName?: string
		avatarBase64?: string // 新增：定義頭像 prop 類型
	}>()

	/** 訊息列表容器元素引用 */
	let messageListElement: HTMLDivElement | null = null

	/**
	 * 當訊息更新時自動滾動到底部
	 * 透過 $effect 實現響應式更新
	 */
	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom()
		}
	})

	/**
	 * 滾動訊息列表到底部的方法
	 * 使用 svelte 的 tick 確保 DOM 更新後再執行滾動
	 */
	async function scrollToBottom() {
		await tick()
		if (messageListElement) {
			messageListElement.scrollTop = messageListElement.scrollHeight
		}
	}

	/** 處理圖片載入錯誤，設置為預設圖標 */
	function handleImageError(event: Event) {
		console.warn('頭像圖片載入失敗，使用預設圖標。')
		const imgElement = event.currentTarget as HTMLImageElement
		imgElement.src = '/favicon.png'
	}
</script>

<!-- 訊息列表容器，綁定元素引用以便操作滾動 -->
<div class="message-list" bind:this={messageListElement}>
	<!-- 顯示所有訊息 -->
	{#each messages as message, i (i)}
		<!-- 將 avatarBase64 傳遞給 MessageItem -->
		<MessageItem {message} {isRoleplayMode} {characterName} {avatarBase64} />
	{/each}

	<!-- 載入中狀態顯示 -->
	{#if loading}
		<div class="message ai loading">
			<!-- 在載入中也顯示頭像 -->
			{#if isRoleplayMode && avatarBase64}
				<img src={avatarBase64} alt="AI Avatar" class="avatar" onerror={handleImageError} />
			{/if}
			<div class="content">
				<strong>{isRoleplayMode ? characterName || 'AI' : 'AI'}:</strong>
				<p>思考中...</p>
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	.message-list {
		flex-grow: 1;
		overflow-y: auto;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background-color: var(--background-color);
	}

	/* 載入中訊息的樣式調整以容納頭像 */
	.message.loading {
		display: flex; /* 使用 flex 佈局 */
		align-items: flex-start; /* 頭像和內容頂部對齊 */
		gap: 10px; /* 頭像和內容之間的間距 */

		& .avatar {
			width: 35px; /* 頭像大小 */
			height: 35px;
			border-radius: 50%;
			object-fit: cover;
			margin-top: 5px; /* 微調頭像垂直位置 */
			flex-shrink: 0; /* 防止頭像被壓縮 */
		}

		& .content {
			display: flex;
			flex-direction: column;
			/* background-color: var(--message-ai-bg); */ /* 思考中不需要背景色 */
			/* padding: 10px 15px; */
			/* border-radius: 8px; */
			/* max-width: 85%; */
		}

		& strong {
			font-weight: bold;
			margin-bottom: 4px;
			color: var(--text-color);
		}

		& p {
			margin: 0;
			font-style: italic;
			opacity: 0.7;
			color: var(--text-color);
		}
	}
</style>
