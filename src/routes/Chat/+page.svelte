<script lang="ts">
	import { onMount } from 'svelte'
	import type { ChatMessage } from '$lib/types'
	import { OllamaService } from '$lib/services/OllamaService'
	import { RoleplayService } from '$lib/services/RoleplayService'
	import MessageList from '$lib/components/MessageList.svelte'
	import InputArea from '$lib/components/InputArea.svelte'
	import ModelSettings from '$lib/components/ModelSettings.svelte'
	import RoleplaySettings from '$lib/components/RoleplaySettings.svelte'

	// --- State ---
	let messages = $state<ChatMessage[]>([])
	let userInput = $state('')
	let loading = $state(false)
	let availableModels = $state<string[]>([])
	let fetchError = $state<string | null>(null)
	let isModelValid = $state(true)
	let showRoleplaySettings = $state(false)

	$inspect(messages)

	// --- Services ---
	let ollamaService = $state(new OllamaService())
	let roleplayService = $state(new RoleplayService())

	// --- Derived State ---
	// 載入設定 - 使用 $derived 確保當 ollamaService 變化時自動更新
	let modelSettings = $derived(ollamaService.loadSettings())
	let roleplaySettings = $state(roleplayService.loadSettings())
	let selectedModel = $derived(modelSettings.model)
	let ollamaBaseUrl = $derived(modelSettings.baseUrl)

	// 生成系統提示詞 - 不再使用 $derived，將在 sendMessage 中即時生成
	// let fullSystemPrompt = $derived(roleplayService.generateSystemPrompt())
	let previousSystemPrompt = $state('') // 仍然可以用於比較，但不再觸發 message 清除

	// 注意：不再使用 $derived 創建 LLM，因為在發送消息時會直接創建最新的實例
	// 移除 $effect 和 updateSystemPromptInMessages，因為 startRoleplay 和 sendMessage 會處理提示詞

	// --- Effects ---
	onMount(() => {
		fetchModels()
	})

	// 當 roleplaySettings 改變時，儲存設定
	$effect(() => {
		roleplayService.saveSettings(roleplaySettings)
	})

	// --- Functions ---
	async function fetchModels() {
		fetchError = null
		isModelValid = false
		availableModels = []
		loading = true

		try {
			const result = await ollamaService.fetchModels()

			if (result.error) {
				fetchError = result.error
				isModelValid = false
			} else {
				availableModels = result.models.map((model) => model.name).sort()
				if (availableModels.length > 0) {
					validateModel()
				} else {
					fetchError = 'Ollama 中沒有可用的模型。'
					isModelValid = false
				}
			}
		} finally {
			loading = false
		}
	}
	// 驗證選擇的模型是否有效
	function validateModel() {
		isModelValid = availableModels.includes(selectedModel)
		if (!isModelValid && availableModels.length > 0) {
			// 可選：如果選擇的模型無效，可以提示用戶，或者自動選擇第一個
		} else if (availableModels.length === 0 && !fetchError) {
			isModelValid = false
		}
	}

	// 處理模型改變
	function handleModelChange(model: string) {
		selectedModel = model
		ollamaService.setModel(model)
		validateModel()
	}

	// 處理 URL 改變
	function handleUrlChange(url: string) {
		ollamaBaseUrl = url
		ollamaService.setBaseUrl(url)
		fetchModels()
	}

	// 套用角色模板
	function applyTemplate(template: string) {
		// 如果已經在角色扮演模式且有對話歷史，提示用戶
		if (roleplaySettings.isRoleplayMode && messages.length > 0) {
			if (!confirm('切換角色模板將清除所有現有對話歷史，確定要繼續嗎？')) {
				return
			}
			// clearMessages()
		}

		const newSettings = roleplayService.applyTemplate(template)
		roleplaySettings = newSettings

		// 如果已經在角色扮演模式，自動重新開始對話
		if (roleplaySettings.isRoleplayMode) {
			startRoleplay()
		}
	}

	// 清除對話歷史 - 簡化為完全清空
	function clearMessages() {
		messages = []
		console.log('clearMessages executed. Messages cleared.')
	}

	// 開始新的角色扮演對話 - 強化初始化邏輯
	function startRoleplay() {
		// 1. 確保 isRoleplayMode 為 true (可能已被 onSettingsChange 或 applyTemplate 設置)
		roleplaySettings.isRoleplayMode = true
		console.log('Ensured roleplay mode is true.')

		// 2. **先保存**當前設定到 Service，確保 Service 內部狀態最新
		//    這樣後續 generateSystemPrompt 就會使用最新的設定
		roleplayService.saveSettings(roleplaySettings)
		console.log('Saved current roleplaySettings to service.')

		// 3. 生成最新的系統提示詞 (現在基於 Service 最新的內部狀態)
		const newSystemPrompt = roleplayService.generateSystemPrompt()
		console.log('Starting roleplay with prompt:', newSystemPrompt)

		// 4. 重新初始化 OllamaService
		ollamaService = new OllamaService(ollamaBaseUrl, selectedModel)
		console.log('OllamaService re-initialized.')

		// 5. 徹底清空消息歷史
		clearMessages()

		// 6. 設置新的初始消息 (系統提示 + 歡迎訊息)
		let initialMessages: ChatMessage[] = []
		if (newSystemPrompt) {
			initialMessages.push({ role: 'system', content: newSystemPrompt })
		}
		const welcomeMessage = roleplayService.generateWelcomeMessage()
		if (welcomeMessage) {
			initialMessages.push(welcomeMessage)
		}
		messages = initialMessages
		console.log('After startRoleplay initialization, messages:', JSON.stringify(messages))

		// 7. 關閉設定面板
		showRoleplaySettings = false
	}

	// 關閉角色扮演 - 確保清空 messages
	function closeRoleplay() {
		// 提示用戶確認是否關閉角色扮演
		if (messages.length > 0) {
			if (!confirm('關閉角色扮演將清除所有現有對話歷史，確定要繼續嗎？')) {
				return
			}
		}

		roleplaySettings.isRoleplayMode = false
		roleplayService.saveSettings(roleplaySettings)

		// 重新初始化 OllamaService
		ollamaService = new OllamaService(ollamaBaseUrl, selectedModel)

		// 徹底清空消息歷史
		clearMessages()
		console.log('Roleplay closed. Messages cleared.')
	}

	// 切換是否顯示角色扮演設定面板
	function toggleRoleplaySettings() {
		showRoleplaySettings = !showRoleplaySettings
	}

	// 發送訊息
	async function sendMessage() {
		if (!userInput.trim() || loading || !isModelValid) return

		const currentInput = userInput
		messages = [...messages, { role: 'user', content: currentInput }]
		userInput = ''
		loading = true
		let aiMessageIndex = -1

		try {
			// 深度複製消息以避免影響原始數組
			let historyMessages = JSON.parse(JSON.stringify(messages))

			// 在角色扮演模式下，確保使用最新的系統提示詞
			if (roleplaySettings.isRoleplayMode) {
				const currentSystemPrompt = roleplayService.generateSystemPrompt() // <-- 即時生成
				console.log('sendMessage: Using system prompt:', currentSystemPrompt) // <-- 使用即時生成的提示詞
				// 移除現有的系統提示詞（如果有）
				historyMessages = historyMessages.filter((msg: ChatMessage) => msg.role !== 'system')
				// 將最新的系統提示詞添加到歷史記錄的開頭
				if (currentSystemPrompt) {
					// 確保提示詞存在
					historyMessages.unshift({ role: 'system', content: currentSystemPrompt })
				}
			}

			// 確保 LLM 實例是最新的
			const currentLLM = ollamaService.createLLM()

			messages = [...messages, { role: 'ai', content: '' }]
			aiMessageIndex = messages.length - 1

			// 轉換消息為 LangChain 格式
			const history = ollamaService.convertMessages(historyMessages)

			// 使用最新創建的 LLM 實例
			const stream = await currentLLM.stream(history)

			for await (const chunk of stream) {
				if (chunk.content && typeof chunk.content === 'string') {
					messages[aiMessageIndex].content += chunk.content
					messages = messages
				}
			}
		} catch (error: unknown) {
			console.error('呼叫 Ollama stream 時發生錯誤:', error)
			const errorContent = `發生錯誤：${error instanceof Error ? error.message : '未知錯誤'}`
			if (aiMessageIndex !== -1 && messages[aiMessageIndex]) {
				messages[aiMessageIndex].content = errorContent
			} else {
				messages = [...messages, { role: 'ai', content: errorContent }]
			}
			messages = messages
		} finally {
			loading = false
		}
	}
</script>

<div class="chat-container">
	<h1>
		{#if roleplaySettings.isRoleplayMode}
			角色扮演：{roleplaySettings.characterName || 'AI助手'}{roleplaySettings.characterRole
				? `（${roleplaySettings.characterRole}）`
				: ''}
		{:else}
			Ollama 聊天機器人
		{/if}
		<button class="icon-button" onclick={toggleRoleplaySettings} title="角色扮演設定"> ⚙️ </button>
	</h1>

	{#if showRoleplaySettings}
		<RoleplaySettings
			settings={roleplaySettings}
			{isModelValid}
			onStartRoleplay={startRoleplay}
			onCloseRoleplay={closeRoleplay}
			onApplyTemplate={applyTemplate}
			onSettingsChange={(newSettings) => {
				const wasRoleplayMode = roleplaySettings.isRoleplayMode
				const isNowRoleplayMode = newSettings.isRoleplayMode
				const roleDetailsChanged =
					roleplaySettings.characterName !== newSettings.characterName ||
					roleplaySettings.characterRole !== newSettings.characterRole ||
					roleplaySettings.sceneDescription !== newSettings.sceneDescription ||
					roleplaySettings.scenarioDescription !== newSettings.scenarioDescription ||
					roleplaySettings.systemPrompt !== newSettings.systemPrompt

				// 處理設定變更的核心邏輯
				const processSettingsChange = () => {
					console.log('onSettingsChange triggered. New settings:', newSettings)
					console.log('Current messages length:', messages.length)
					console.log(
						'Was roleplay:',
						wasRoleplayMode,
						'Is now roleplay:',
						isNowRoleplayMode,
						'Details changed:',
						roleDetailsChanged
					)

					// 情況 1: 從非角色扮演模式切換到角色扮演模式
					if (!wasRoleplayMode && isNowRoleplayMode) {
						console.log('Case 1: Enabling roleplay mode.')
						roleplaySettings = newSettings // 先更新設定，讓 startRoleplay 能讀取到
						startRoleplay() // 使用 startRoleplay 處理初始化
						return
					}

					// 情況 2: 角色扮演模式下，角色細節發生變化
					if (wasRoleplayMode && isNowRoleplayMode && roleDetailsChanged) {
						console.log('Case 2: Role details changed while in roleplay mode.')
						// 檢查是否有 user/ai 訊息 (messages[0] 通常是 system prompt)
						if (messages.length > 1) {
							console.log('History exists, prompting user.')
							if (confirm('修改角色設定將清除所有現有對話歷史，確定要繼續嗎？')) {
								console.log('User confirmed history clear.')
								roleplaySettings = newSettings // 更新設定
								startRoleplay() // 調用 startRoleplay 處理重置
							} else {
								console.log('User cancelled history clear.')
								// 如果用戶取消，則不做任何事，設定維持不變
							}
						} else {
							// 如果沒有對話歷史 (只有 system prompt 或為空)，直接應用新設定並重新開始
							console.log('No significant history, applying changes and restarting.')
							roleplaySettings = newSettings
							startRoleplay()
						}
						return
					}

					// 情況 3: 從角色扮演模式切換到非角色扮演模式
					// 這個應該由 RoleplaySettings 元件內部的 "關閉角色扮演" 按鈕觸發 onCloseRoleplay 回調處理，
					// onSettingsChange 不應該處理 isNowRoleplayMode 為 false 的情況，除非是保存非角色扮演模式下的設定。
					if (wasRoleplayMode && !isNowRoleplayMode) {
						console.warn(
							'Case 3: Attempting to disable roleplay via onSettingsChange? This should be handled by onCloseRoleplay.'
						)
						// 為保險起見，僅保存設定，但不調用 closeRoleplay (避免重複確認)
						roleplaySettings = newSettings
						roleplayService.saveSettings(roleplaySettings)
						return
					}

					// 情況 4: 其他情況（例如，僅改變 isRoleplayMode 但未觸發情況1，或未改變角色細節）
					// 只更新和保存設定，不重置對話 (除非是從 false -> true，已在情況1處理)
					if (isNowRoleplayMode === wasRoleplayMode) {
						console.log(
							'Case 4: Settings changed, but no roleplay state change or major detail change requiring reset.'
						)
						roleplaySettings = newSettings
						roleplayService.saveSettings(roleplaySettings)
						// 如果只是在非角色扮演模式下修改了某些欄位，保存即可
						// 如果在角色扮演模式下修改了非角色細節的欄位（例如溫度等，如果有的話），也只保存
					} else {
						// 捕捉未預期的狀態轉換
						console.warn('Unhandled case in onSettingsChange:', {
							wasRoleplayMode,
							isNowRoleplayMode,
							roleDetailsChanged
						})
						roleplaySettings = newSettings // 默認保存設定
						roleplayService.saveSettings(roleplaySettings)
					}
				}

				processSettingsChange()
			}}
			systemPrompt={roleplayService.generateSystemPrompt()}
		/>
	{/if}

	<ModelSettings
		{selectedModel}
		{ollamaBaseUrl}
		{availableModels}
		{fetchError}
		{loading}
		{isModelValid}
		onModelChange={handleModelChange}
		onUrlChange={handleUrlChange}
	/>

	<MessageList
		{messages}
		{loading}
		isRoleplayMode={roleplaySettings.isRoleplayMode}
		characterName={roleplaySettings.characterName}
	/>

	<InputArea
		{userInput}
		onInputChange={(value) => (userInput = value)}
		{loading}
		{isModelValid}
		isRoleplayMode={roleplaySettings.isRoleplayMode}
		characterName={roleplaySettings.characterName}
		onSend={sendMessage}
	/>
</div>

<style lang="postcss">
	.chat-container {
		display: flex;
		flex-direction: column;
		height: 90vh;
		max-width: 800px;
		margin: 20px auto;
		border: 1px solid var(--border-color);
		border-radius: 8px;
		overflow: hidden;
		font-family: sans-serif;
		background-color: var(--background-color);
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);

		& h1 {
			text-align: center;
			padding: 15px;
			margin: 0;
			background-color: var(--secondary-bg-color);
			border-bottom: 1px solid var(--border-color);
			font-size: 1.4em;
			color: var(--text-color);
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 10px;
		}
	}

	.icon-button {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2em;
		padding: 5px;
		border-radius: 50%;
		transition: background-color 0.2s;

		&:hover {
			background-color: rgba(0, 0, 0, 0.1);
		}
	}
</style>
