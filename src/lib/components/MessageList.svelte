<script lang="ts">
	import { tick } from 'svelte'
	import MessageItem from './MessageItem.svelte'
	import type { ChatMessage } from '$lib/types'

	const { messages = [], loading = false, isRoleplayMode = false, characterName = 'AI' } = $props<{
		messages?: ChatMessage[];
		loading?: boolean;
		isRoleplayMode?: boolean;
		characterName?: string;
	}>()

	let messageListElement: HTMLDivElement | null = null

	// 當訊息更新時自動滾動到底部
	$effect(() => {
		if (messages.length > 0) {
			scrollToBottom()
		}
	})

	// 滾動到底部
	async function scrollToBottom() {
		await tick()
		if (messageListElement) {
			messageListElement.scrollTop = messageListElement.scrollHeight
		}
	}
</script>

<div class="message-list" bind:this={messageListElement}>
	{#each messages as message, i (i)}
		<MessageItem {message} {isRoleplayMode} {characterName} />
	{/each}

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
