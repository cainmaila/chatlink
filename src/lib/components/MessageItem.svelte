<!--
@component
@name MessageItem
@description 聊天訊息項目元件，負責顯示單條聊天訊息
@example
  ```svelte
  <MessageItem
    message={{ role: 'user', content: '你好' }}
    isRoleplayMode={false}
    characterName="AI助手"
  />
  ```
-->
<script lang="ts">
	import type { ChatMessage } from '$lib/types'

	/**
	 * 元件屬性
	 * @prop {ChatMessage} message - 訊息物件，包含角色和內容
	 * @prop {boolean} [isRoleplayMode=false] - 是否為角色扮演模式
	 * @prop {string} [characterName='AI'] - 角色名稱，在角色扮演模式下顯示
	 */
	const {
		message,
		isRoleplayMode = false,
		characterName = 'AI'
	} = $props<{
		message: ChatMessage
		isRoleplayMode?: boolean
		characterName?: string
	}>()
</script>

<!-- 若訊息是系統訊息，則使用系統訊息樣式 -->
{#if message.role === 'system'}
	<div class="message system">
		<strong>系統提示:</strong>
		<p>{message.content}</p>
	</div>
{:else}
	<!-- 其他訊息類型（使用者或 AI）使用對應樣式 -->
	<div class="message {message.role}">
		<strong>
			{#if message.role === 'user'}
				你:
			{:else if isRoleplayMode}
				{characterName || 'AI'}:
			{:else}
				AI:
			{/if}
		</strong>
		<p style="white-space: pre-wrap;">{message.content}</p>
	</div>
{/if}

<style lang="postcss">
	.message {
		padding: 10px 15px;
		border-radius: 18px;
		max-width: 85%;
		word-wrap: break-word;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

		& strong {
			display: block;
			margin-bottom: 5px;
			font-size: 0.85em;
			color: inherit;
			opacity: 0.8;
		}

		& p {
			margin: 0;
			line-height: 1.5;
			white-space: pre-wrap;
		}

		&.user {
			background-color: var(--message-user-bg);
			color: var(--message-user-text);
			align-self: flex-end;
			border-bottom-right-radius: 5px;

			& strong {
				color: rgba(255, 255, 255, 0.8);
			}
		}

		&.ai {
			background-color: var(--message-ai-bg);
			color: var(--message-ai-text);
			align-self: flex-start;
			border-bottom-left-radius: 5px;

			& strong {
				color: inherit;
				opacity: 0.7;
			}
		}

		&.system {
			background-color: rgba(0, 0, 0, 0.05);
			color: var(--text-color);
			opacity: 0.8;
			font-size: 0.9em;
			align-self: center;
			max-width: 90%;
			border-radius: 10px;

			& strong {
				color: var(--primary-color);
			}
		}
	}
</style>
