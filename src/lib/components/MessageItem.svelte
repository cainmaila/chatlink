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
	 * @prop {string} [avatarBase64] - AI 頭像的 Base64 字串 (可選)
	 */
	const {
		message,
		isRoleplayMode = false,
		characterName = 'AI',
		avatarBase64 = undefined // 新增：接收頭像 prop
	} = $props<{
		message: ChatMessage
		isRoleplayMode?: boolean
		characterName?: string
		avatarBase64?: string // 新增：定義頭像 prop 類型
	}>()

	/** 處理圖片載入錯誤，設置為預設圖標 */
	function handleImageError(event: Event) {
		console.warn('頭像圖片載入失敗，使用預設圖標。')
		const imgElement = event.currentTarget as HTMLImageElement
		imgElement.src = '/favicon.png'
	}
</script>

<!-- 若訊息是系統訊息，則使用系統訊息樣式 -->
{#if message.role === 'system'}
	<div class="message system">
		<strong>系統提示:</strong>
		<p>{message.content}</p>
	</div>
{:else}
	<!-- 其他訊息類型（使用者或 AI）使用對應樣式 -->
	<div
		class="message {message.role} {message.role === 'ai' && isRoleplayMode && avatarBase64
			? 'with-avatar'
			: ''}"
	>
		<!-- AI 訊息且有頭像時顯示 -->
		{#if message.role === 'ai' && isRoleplayMode && avatarBase64}
			<img
				src={avatarBase64}
				alt="{characterName || 'AI'} Avatar"
				class="avatar"
				onerror={handleImageError}
			/>
		{/if}
		<div class="content">
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

		/* 包含頭像時的樣式調整 */
		&.with-avatar {
			display: flex;
			align-items: flex-start; /* 頭像和內容頂部對齊 */
			gap: 10px; /* 頭像和內容之間的間距 */
		}

		& .avatar {
			width: 35px; /* 頭像大小 */
			height: 35px;
			border-radius: 50%;
			object-fit: cover;
			margin-top: 5px; /* 微調頭像垂直位置 */
			flex-shrink: 0; /* 防止頭像被壓縮 */
		}

		& .content {
			/* 當有頭像時，內容區塊不需要額外背景或邊框 */
			/* padding: 0; */
			/* background-color: transparent; */
			/* border-radius: 0; */
			/* box-shadow: none; */
			/* max-width: 100%; */ /* 讓內容自然填充 */
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

			/* AI 訊息有頭像時，調整背景和邊框到 content 上 */
			&.with-avatar {
				background-color: transparent; /* 移除外層背景 */
				box-shadow: none;
				padding: 0; /* 移除外層 padding */
				max-width: 85%; /* 限制整體寬度 */

				& .content {
					background-color: var(--message-ai-bg);
					color: var(--message-ai-text);
					padding: 10px 15px;
					border-radius: 18px;
					border-bottom-left-radius: 5px; /* 保持尖角 */
					box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
				}
			}

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
