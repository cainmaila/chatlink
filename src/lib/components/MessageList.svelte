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
	 */
	const {
		messages = [],
		loading = false,
		isRoleplayMode = false,
		characterName = 'AI'
	} = $props<{
		messages?: ChatMessage[]
		loading?: boolean
		isRoleplayMode?: boolean
		characterName?: string
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
</script>

<!-- 訊息列表容器，綁定元素引用以便操作滾動 -->
<div class="message-list" bind:this={messageListElement}>
	<!-- 顯示所有訊息 -->
	{#each messages as message, i (i)}
		<MessageItem {message} {isRoleplayMode} {characterName} />
	{/each}

	<!-- 載入中狀態顯示 -->
	{#if loading}
		<div class="message ai loading">
			<strong>{isRoleplayMode ? characterName || 'AI' : 'AI'}:</strong>
			<p>思考中...</p>
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

	.loading p {
		font-style: italic;
		opacity: 0.7;
	}
</style>
