<script lang="ts">
	import { onMount } from 'svelte'
	import type { ChatMessage } from '$lib/types'
	import { OllamaService } from '$lib/services/OllamaService'
	import { RoleplayService } from '$lib/services/RoleplayService'
	import { generateTemplatePrompt } from '$lib/utils/promptUtils'
	import { deepClone } from '$lib/utils/jsonUtils'
	import MessageList from '$lib/components/MessageList.svelte'
	import InputArea from '$lib/components/InputArea.svelte'
	import ModelSettings from '$lib/components/ModelSettings.svelte'
	import RoleplaySettingsUI from '$lib/components/RoleplaySettingsUI.svelte'
	import type { RoleplaySettings } from '$lib/types'

	// --- State ---
	let messages = $state<ChatMessage[]>([])
	let userInput = $state('')
	let loading = $state(false)
	let availableModels = $state<string[]>([])
	let fetchError = $state<string | null>(null)
	let isModelValid = $state(true)
	let showRoleplaySettings = $state(false)

	// --- Services ---
	const ollamaService = new OllamaService()
	const roleplayService = new RoleplayService()

	// --- Derived State ---
	let modelSettings = $derived(ollamaService.loadSettings())
	let roleplaySettings = $derived(roleplayService.loadSettings())

	// --- Effects ---
	onMount(() => {
		fetchModels()
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

	/** 驗證選擇的模型是否有效 */
	function validateModel() {
		isModelValid = availableModels.includes(modelSettings.model)
		if (!isModelValid && availableModels.length > 0) {
			if (modelSettings.model === '') {
				handleModelChange(availableModels[0])
			}
		} else if (availableModels.length === 0 && !fetchError) {
			isModelValid = false
		}
	}

	/** 處理模型變更 */
	function handleModelChange(model: string) {
		ollamaService.setModel(model)
		validateModel()
	}

	/** 處理 URL 變更 */
	function handleUrlChange(url: string) {
		ollamaService.setBaseUrl(url)
		fetchModels()
	}

	/** 處理角色扮演設定變更 */
	function handleSettingsChange(settings: RoleplaySettings) {
		roleplaySettings = settings
		// 確保儲存完整設定，包括頭像
		roleplayService.saveSettings(roleplaySettings)
	}

	/** 使用 AI 生成角色扮演模板 */
	async function generateTemplateAI(description: string) {
		if (!isModelValid) {
			alert('請先選擇一個有效的 Ollama 模型。')
			throw new Error('無效的模型')
		}

		loading = true
		fetchError = null

		try {
			const generatorLLM = ollamaService.createLLM()
			const generationPrompt = generateTemplatePrompt(description)
			const aiResponse = await generatorLLM.invoke(generationPrompt)

			try {
				const jsonString = aiResponse.content
					.toString()
					.trim()
					.replace(/^```json\s*/, '')
					.replace(/```$/, '')
					.trim()
				const generatedData = JSON.parse(jsonString)

				if (
					!generatedData.characterName ||
					!generatedData.characterRole ||
					!generatedData.sceneDescription ||
					!generatedData.scenarioDescription ||
					generatedData.systemPrompt === undefined
				) {
					throw new Error('AI 回傳的 JSON 缺少必要欄位。')
				}

				roleplaySettings = {
					...roleplaySettings,
					characterName: generatedData.characterName,
					characterRole: generatedData.characterRole,
					sceneDescription: generatedData.sceneDescription,
					scenarioDescription: generatedData.scenarioDescription,
					systemPrompt: generatedData.systemPrompt,
					avatarBase64: undefined
				}
				roleplayService.saveSettings(roleplaySettings)
			} catch (parseError) {
				console.error('解析 AI 回應 JSON 時發生錯誤:', parseError)
				console.error('無法解析的 AI 回應內容:', aiResponse.content)
				throw new Error(
					`無法解析 AI 生成的內容：${parseError instanceof Error ? parseError.message : '未知解析錯誤'}`
				)
			}
		} catch (error) {
			console.error('呼叫 AI 生成模板時發生錯誤:', error)
			fetchError = `AI 生成模板失敗：${error instanceof Error ? error.message : '未知錯誤'}`
			alert(fetchError)
			throw error
		} finally {
			loading = false
		}
	}

	/** 套用角色模板 */
	function applyTemplate(template: string) {
		if (roleplaySettings.isRoleplayMode && messages.length > 0) {
			if (!confirm('切換角色模板將清除所有現有對話歷史，確定要繼續嗎？')) {
				return
			}
		}

		const newSettings = roleplayService.applyTemplate(template)
		if (newSettings) {
			roleplaySettings = newSettings
			// 確保儲存完整設定，包括頭像
			roleplayService.saveSettings(roleplaySettings)

			if (roleplaySettings.isRoleplayMode) {
				startRoleplay()
			}
		} else {
			console.error(`無法套用模板 "${template}"。`)
		}
	}

	/** 清除對話歷史 */
	function clearMessages() {
		messages = []
	}

	/** 開始新的角色扮演對話 */
	function startRoleplay() {
		roleplaySettings.isRoleplayMode = true
		roleplayService.saveSettings(roleplaySettings)

		const newSystemPrompt = roleplayService.generateSystemPrompt()
		clearMessages()

		let initialMessages: ChatMessage[] = []
		if (newSystemPrompt) {
			initialMessages.push({ role: 'system', content: newSystemPrompt })
		}

		const welcomeMessage = roleplayService.generateWelcomeMessage()
		if (welcomeMessage) {
			initialMessages.push(welcomeMessage)
		}

		messages = initialMessages
		showRoleplaySettings = false
	}

	/** 關閉角色扮演 */
	function closeRoleplay() {
		if (messages.length > 0) {
			if (!confirm('關閉角色扮演將清除所有現有對話歷史，確定要繼續嗎？')) {
				return
			}
		}

		roleplaySettings.isRoleplayMode = false
		roleplayService.saveSettings(roleplaySettings)
		clearMessages()
	}

	/** 切換顯示角色扮演設定面板 */
	function toggleRoleplaySettings() {
		showRoleplaySettings = !showRoleplaySettings
	}

	/** 發送訊息 */
	async function sendMessage() {
		if (!userInput.trim() || loading || !isModelValid) return

		const currentInput = userInput
		messages = [...messages, { role: 'user', content: currentInput }]
		userInput = ''
		loading = true
		let aiMessageIndex = -1

		try {
			let historyMessages = deepClone(messages)

			if (roleplaySettings.isRoleplayMode) {
				const currentSystemPrompt = roleplayService.generateSystemPrompt()
				historyMessages = historyMessages.filter((msg: ChatMessage) => msg.role !== 'system')
				if (currentSystemPrompt) {
					historyMessages.unshift({ role: 'system', content: currentSystemPrompt })
				}
			}

			const currentLLM = ollamaService.createLLM()
			messages = [...messages, { role: 'ai', content: '' }]
			aiMessageIndex = messages.length - 1

			const history = ollamaService.convertMessages(historyMessages)
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
		<RoleplaySettingsUI
			settings={roleplaySettings}
			{isModelValid}
			{roleplayService}
			onStartRoleplay={startRoleplay}
			onCloseRoleplay={closeRoleplay}
			onApplyTemplate={applyTemplate}
			onTemplateListChange={() => {
				// 模板列表變化時的回調 (目前僅 log)
			}}
			onSettingsChange={handleSettingsChange}
			onGenerateTemplateAI={generateTemplateAI}
			systemPrompt={roleplayService.generateSystemPrompt()}
		/>
	{/if}

	<ModelSettings
		selectedModel={modelSettings.model}
		ollamaBaseUrl={modelSettings.baseUrl}
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
		avatarBase64={roleplaySettings.avatarBase64}
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
