<script lang="ts">
	import { onMount } from 'svelte'
	import type { ChatMessage } from '$lib/types'
	import { OllamaService } from '$lib/services/OllamaService'
	import { RoleplayService } from '$lib/services/RoleplayService'
	import MessageList from '$lib/components/MessageList.svelte'
	import InputArea from '$lib/components/InputArea.svelte'
	import ModelSettings from '$lib/components/ModelSettings.svelte'
	import RoleplaySettings from '$lib/components/RoleplaySettings.svelte'
	import { SystemMessage } from '@langchain/core/messages'

	// --- State ---
	let messages = $state<ChatMessage[]>([])
	let userInput = $state('')
	let loading = $state(false)
	let availableModels = $state<string[]>([])
	let fetchError = $state<string | null>(null)
	let isModelValid = $state(true)
	let showRoleplaySettings = $state(false)

	// --- Services ---
	let ollamaService = $state(new OllamaService())
	let roleplayService = $state(new RoleplayService())

	// --- Derived State ---
	// 載入設定
	let modelSettings = $state(ollamaService.loadSettings())
	let roleplaySettings = $state(roleplayService.loadSettings())
	let selectedModel = $state(modelSettings.model)
	let ollamaBaseUrl = $state(modelSettings.baseUrl)

	// 生成系統提示詞
	let fullSystemPrompt = $derived(roleplayService.generateSystemPrompt())

	// 創建 LLM
	let llm = $derived(ollamaService.createLLM())

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
		const newSettings = roleplayService.applyTemplate(template)
		roleplaySettings = newSettings
	}

	// 清除對話歷史
	function clearMessages() {
		messages = []
		if (roleplaySettings.isRoleplayMode && fullSystemPrompt) {
			messages = [{ role: 'system', content: fullSystemPrompt }]
		}
	}

	// 開始新的角色扮演對話
	function startRoleplay() {
		roleplaySettings.isRoleplayMode = true
		roleplayService.saveSettings(roleplaySettings)

		clearMessages()

		if (fullSystemPrompt) {
			messages = [{ role: 'system', content: fullSystemPrompt }]
		}

		const welcomeMessage = roleplayService.generateWelcomeMessage()
		if (welcomeMessage) {
			messages = [...messages, welcomeMessage]
		}

		showRoleplaySettings = false
	}

	// 關閉角色扮演
	function closeRoleplay() {
		roleplaySettings.isRoleplayMode = false
		roleplayService.saveSettings(roleplaySettings)
		clearMessages()
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
			const history = ollamaService.convertMessages(messages)

			if (
				roleplaySettings.isRoleplayMode &&
				fullSystemPrompt &&
				!messages.some((m: ChatMessage) => m.role === 'system')
			) {
				history.unshift(new SystemMessage(fullSystemPrompt))
			}

			messages = [...messages, { role: 'ai', content: '' }]
			aiMessageIndex = messages.length - 1

			const stream = await llm.stream(history)

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
			onSettingsChange={(newSettings) => (roleplaySettings = newSettings)}
			systemPrompt={fullSystemPrompt}
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
