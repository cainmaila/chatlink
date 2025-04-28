<script lang="ts">
	import { ChatOllama } from '@langchain/ollama'
	import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from '@langchain/core/messages'
	import { tick } from 'svelte'
	import { onMount } from 'svelte'

	// 定義消息的介面類型
	interface ChatMessage {
		role: 'user' | 'ai' | 'system'
		content: string
	}

	// 定義模型介面
	interface OllamaModel {
		name: string
		[key: string]: any // 其他可能的屬性
	}

	// --- State ---
	let messages = $state<ChatMessage[]>([])
	let userInput = $state('')
	let loading = $state(false)
	let selectedModel = $state('gemma3:12b')
	let ollamaBaseUrl = $state('http://localhost:11434')
	let messageListElement = $state<HTMLDivElement | null>(null)
	let availableModels = $state<string[]>([])
	let fetchError = $state<string | null>(null)
	let isModelValid = $state(true)

	// 角色扮演相關狀態
	let systemPrompt = $state('') // 系統提示詞
	let characterName = $state('AI助手') // AI 角色名稱
	let characterRole = $state('') // AI 角色
	let sceneDescription = $state('') // 場景描述
	let scenarioDescription = $state('') // 情境描述
	let isRoleplayMode = $state(false) // 是否啟用角色扮演模式
	let showRoleplaySettings = $state(false) // 是否顯示角色扮演設定面板

	// --- Local Storage Keys ---
	const MODEL_STORAGE_KEY = 'ollama_selected_model'
	const URL_STORAGE_KEY = 'ollama_base_url'
	const ROLEPLAY_SETTINGS_KEY = 'roleplay_settings'

	// --- Derived State ---
	// 根據選擇的模型和 URL 重新初始化 LLM
	let llm = $derived(
		new ChatOllama({
			model: selectedModel,
			baseUrl: ollamaBaseUrl,
			temperature: 0.7 // 角色扮演場景下，溫度可以稍微高一些以增加創意
		})
	)

	// 組合系統提示詞
	let fullSystemPrompt = $derived.by(() => {
		if (!isRoleplayMode) return ''

		let prompt = '你是一個角色扮演的AI助手。'

		if (characterName) {
			prompt += `\n你的名字是「${characterName}」。`
		}

		if (characterRole) {
			prompt += `\n你的角色是「${characterRole}」。`
		}

		if (sceneDescription) {
			prompt += `\n當前場景：${sceneDescription}`
		}

		if (scenarioDescription) {
			prompt += `\n當前情境：${scenarioDescription}`
		}

		if (systemPrompt) {
			prompt += `\n\n額外指令：${systemPrompt}`
		}

		prompt +=
			'\n\n請始終保持這個角色，不要打破第四面牆。不要提及你是AI或語言模型，完全沉浸在角色中回應用戶。'

		return prompt
	})

	// --- Effects ---
	onMount(() => {
		const storedModel = localStorage.getItem(MODEL_STORAGE_KEY)
		const storedUrl = localStorage.getItem(URL_STORAGE_KEY)
		const storedRoleplaySettings = localStorage.getItem(ROLEPLAY_SETTINGS_KEY)

		if (storedModel) {
			selectedModel = storedModel
		}
		if (storedUrl) {
			ollamaBaseUrl = storedUrl
		} else {
			localStorage.setItem(URL_STORAGE_KEY, ollamaBaseUrl)
		}

		// 載入角色扮演設定
		if (storedRoleplaySettings) {
			try {
				const settings = JSON.parse(storedRoleplaySettings)
				characterName = settings.characterName || characterName
				characterRole = settings.characterRole || ''
				sceneDescription = settings.sceneDescription || ''
				scenarioDescription = settings.scenarioDescription || ''
				systemPrompt = settings.systemPrompt || ''
				isRoleplayMode = settings.isRoleplayMode || false
			} catch (e) {
				console.error('無法解析儲存的角色扮演設定:', e)
			}
		}

		fetchModels()
	})

	// 當 selectedModel 改變時，存入 localStorage 並驗證模型有效性
	$effect(() => {
		localStorage.setItem(MODEL_STORAGE_KEY, selectedModel)
		validateModel()
	})

	// 當 ollamaBaseUrl 改變時，存入 localStorage 並重新獲取模型
	$effect(() => {
		localStorage.setItem(URL_STORAGE_KEY, ollamaBaseUrl)
		fetchModels()
	})

	// 當角色扮演設定改變時，儲存到 localStorage
	$effect(() => {
		const settings = {
			characterName,
			characterRole,
			sceneDescription,
			scenarioDescription,
			systemPrompt,
			isRoleplayMode
		}
		localStorage.setItem(ROLEPLAY_SETTINGS_KEY, JSON.stringify(settings))
	})

	// --- Functions ---
	async function fetchModels() {
		fetchError = null
		isModelValid = false
		availableModels = []
		loading = true

		try {
			const response = await fetch(`${ollamaBaseUrl}/api/tags`)
			if (!response.ok) {
				throw new Error(`無法連接到 Ollama API (狀態碼: ${response.status})`)
			}
			const data = await response.json()

			if (data && Array.isArray(data.models)) {
				availableModels = data.models.map((model: OllamaModel) => model.name).sort()
				if (availableModels.length > 0) {
					validateModel()
				} else {
					fetchError = 'Ollama 中沒有可用的模型。'
					isModelValid = false
				}
			} else {
				throw new Error('從 Ollama API 收到的模型列表格式不正確。')
			}
		} catch (error: unknown) {
			console.error('獲取 Ollama 模型列表時發生錯誤:', error)
			fetchError = `獲取模型列表失敗：${error instanceof Error ? error.message : '未知錯誤'}`
			isModelValid = false
		} finally {
			loading = false
		}
	}

	function validateModel() {
		isModelValid = availableModels.includes(selectedModel)
		if (!isModelValid && availableModels.length > 0) {
			// 可選：如果選擇的模型無效，可以提示用戶，或者自動選擇第一個
		} else if (availableModels.length === 0 && !fetchError) {
			isModelValid = false
		}
	}

	async function scrollToBottom() {
		await tick()
		if (messageListElement) {
			messageListElement.scrollTop = messageListElement.scrollHeight
		}
	}

	// 清除對話歷史
	function clearMessages() {
		messages = []
		if (isRoleplayMode && fullSystemPrompt) {
			messages = [{ role: 'system', content: fullSystemPrompt }]
		}
	}

	// 開始新的角色扮演對話
	function startRoleplay() {
		clearMessages()
		isRoleplayMode = true

		if (fullSystemPrompt) {
			messages = [{ role: 'system', content: fullSystemPrompt }]
		}

		if (characterName || characterRole) {
			const welcomeMsg = `*${characterName || 'AI'}${characterRole ? `（${characterRole}）` : ''}已進入對話。*`
			messages = [...messages, { role: 'ai', content: welcomeMsg }]
		}

		showRoleplaySettings = false
	}

	// 切換是否顯示角色扮演設定面板
	function toggleRoleplaySettings() {
		showRoleplaySettings = !showRoleplaySettings
	}

	// 套用預設角色模板
	function applyTemplate(template: string) {
		switch (template) {
			case 'fantasy-adventure':
				characterName = '艾爾文'
				characterRole = '魔法師導遊'
				sceneDescription = '埃爾德林中世紀奇幻王國，充滿魔法與神秘生物的翡翠森林'
				scenarioDescription = '帶領冒險者穿越危險的翡翠森林，尋找失落的龍族寶藏'
				systemPrompt =
					'使用華麗的語言描述環境和魔法，創造冒險氛圍。當用戶面臨選擇時，提供多種冒險分支。'
				break
			case 'sci-fi':
				characterName = 'Nova-7'
				characterRole = '星際飛船AI'
				sceneDescription = '銀河聯邦太空站阿爾法-9，位於仙女座星系邊緣'
				scenarioDescription = '太空站遇到引力波干擾，需要幫助乘客解決各種宇宙難題'
				systemPrompt = '使用科幻術語和技術語言，呈現未來科技感。結合故障排除和太空冒險元素。'
				break
			case 'detective':
				characterName = '夏洛克'
				characterRole = '名偵探'
				sceneDescription = '霧氣彌漫的維多利亞時代英國倫敦，貝克街221B'
				scenarioDescription = '調查一起發生在泰晤士河畔的神秘珠寶失竊案，需要分析線索、詢問目擊者'
				systemPrompt =
					'使用推理和邏輯分析，協助用戶解開謎題。偶爾提供一些模糊的線索，鼓勵用戶思考。'
				break
			case 'historical':
				characterName = '教授'
				characterRole = '歷史學者'
				sceneDescription = '亞歷山大港古代圖書館，公元前三世紀的埃及'
				scenarioDescription = '探索古埃及、古希臘與古羅馬的歷史事件，解答歷史謎團'
				systemPrompt = '提供準確的歷史知識，並用生動的方式描述歷史場景。可以角色化地講述歷史故事。'
				break
			case 'custom':
			default:
				break
		}
	}

	async function sendMessage() {
		if (!userInput.trim() || loading || !isModelValid) return

		const currentInput = userInput
		messages = [...messages, { role: 'user', content: currentInput }]
		userInput = ''
		loading = true
		let aiMessageIndex = -1
		scrollToBottom()

		try {
			const history = messages.map((msg: ChatMessage) => {
				if (msg.role === 'user') {
					return new HumanMessage(msg.content)
				} else if (msg.role === 'ai') {
					return new AIMessage(msg.content)
				} else if (msg.role === 'system') {
					return new SystemMessage(msg.content)
				} else {
					return new HumanMessage(msg.content)
				}
			})

			if (
				isRoleplayMode &&
				fullSystemPrompt &&
				!messages.some((m: ChatMessage) => m.role === 'system')
			) {
				history.unshift(new SystemMessage(fullSystemPrompt))
			}

			messages = [...messages, { role: 'ai', content: '' }]
			aiMessageIndex = messages.length - 1
			scrollToBottom()

			const stream = await llm.stream(history)

			for await (const chunk of stream) {
				if (chunk.content && typeof chunk.content === 'string') {
					messages[aiMessageIndex].content += chunk.content
					messages = messages
					scrollToBottom()
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
			scrollToBottom()
		} finally {
			loading = false
			scrollToBottom()
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			sendMessage()
		}
	}
</script>

<div class="chat-container">
	<h1>
		{#if isRoleplayMode}
			角色扮演：{characterName || 'AI助手'}{characterRole ? `（${characterRole}）` : ''}
		{:else}
			Ollama 聊天機器人
		{/if}
		<button class="icon-button" onclick={toggleRoleplaySettings} title="角色扮演設定"> ⚙️ </button>
	</h1>

	{#if showRoleplaySettings}
		<div class="roleplay-settings">
			<h2>角色扮演設定</h2>

			<div class="template-buttons">
				<span>快速模板：</span>
				<button onclick={() => applyTemplate('fantasy-adventure')}>奇幻冒險</button>
				<button onclick={() => applyTemplate('sci-fi')}>科幻太空</button>
				<button onclick={() => applyTemplate('detective')}>偵探推理</button>
				<button onclick={() => applyTemplate('historical')}>歷史探索</button>
			</div>

			<div class="settings-grid">
				<label>
					角色名稱：
					<input
						type="text"
						bind:value={characterName}
						placeholder="例如：艾爾文、Nova-7、夏洛克..."
					/>
				</label>

				<label>
					角色身份：
					<input
						type="text"
						bind:value={characterRole}
						placeholder="例如：魔法師、星際飛船AI、名偵探..."
					/>
				</label>

				<label>
					場景描述：
					<textarea
						bind:value={sceneDescription}
						placeholder="在哪裡？什麼樣的環境？例如：中世紀城堡、未來太空站..."
					></textarea>
				</label>

				<label>
					情境描述：
					<textarea
						bind:value={scenarioDescription}
						placeholder="正在發生什麼事？例如：探索遺跡、解決太空船故障..."
					></textarea>
				</label>

				<label>
					額外系統指令：
					<textarea
						bind:value={systemPrompt}
						placeholder="其他想對AI說的指示，例如：使用特定的語氣或風格回應..."
					></textarea>
				</label>
			</div>

			<div class="preview-section">
				<h3>系統提示預覽：</h3>
				<pre class="system-preview">{fullSystemPrompt}</pre>
			</div>

			<div class="roleplay-buttons">
				<button class="start-button" onclick={startRoleplay} disabled={!isModelValid}>
					{isRoleplayMode ? '重新開始角色扮演' : '開始角色扮演'}
				</button>
				<button
					class="clear-button"
					onclick={() => {
						isRoleplayMode = false
						clearMessages()
					}}
				>
					關閉角色扮演
				</button>
			</div>
		</div>
	{/if}

	<div class="settings">
		<label>
			模型:
			{#if availableModels.length > 0}
				<select bind:value={selectedModel} disabled={loading}>
					{#each availableModels as model (model)}
						<option value={model}>{model}</option>
					{/each}
				</select>
				{#if !isModelValid}
					<span
						class="error-tooltip"
						title={`選擇的模型 "${selectedModel}" 目前不可用或不存在於此 Ollama 實例中。`}>⚠️</span
					>
				{/if}
			{:else if fetchError}
				<span class="error-text">無法載入模型</span>
			{:else}
				<span>載入中...</span>
			{/if}
		</label>
		<label>
			Ollama URL:
			<input
				type="text"
				bind:value={ollamaBaseUrl}
				placeholder="例如：http://localhost:11434"
				disabled={loading}
			/>
		</label>
		{#if fetchError}
			<p class="error-text global-error">錯誤: {fetchError}</p>
		{/if}
	</div>

	<div class="message-list" bind:this={messageListElement}>
		{#each messages as message, i (i)}
			{#if message.role === 'system'}
				<div class="message system">
					<strong>系統提示:</strong>
					<p>{message.content}</p>
				</div>
			{:else}
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
		{/each}
		{#if loading}
			<div class="message ai loading">
				<strong>{isRoleplayMode ? characterName || 'AI' : 'AI'}:</strong>
				<p>思考中...</p>
			</div>
		{/if}
	</div>

	<div class="input-area">
		<textarea
			bind:value={userInput}
			onkeydown={handleKeydown}
			placeholder={isRoleplayMode ? `與${characterName || 'AI'}對話...` : '輸入訊息...'}
			disabled={loading}
			rows="1"
			oninput={(e) => {
				const target = e.currentTarget as HTMLTextAreaElement
				target.style.height = 'auto'
				target.style.height = `${target.scrollHeight}px`
			}}
		></textarea>
		<button onclick={sendMessage} disabled={loading || !userInput.trim() || !isModelValid}>
			{#if !isModelValid}
				模型無效
			{:else if loading}
				傳送中...
			{:else}
				傳送
			{/if}
		</button>
	</div>
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

	.roleplay-settings {
		background-color: var(--secondary-bg-color);
		border-bottom: 1px solid var(--border-color);
		padding: 15px;

		& h2 {
			margin-top: 0;
			margin-bottom: 15px;
			font-size: 1.2em;
			color: var(--text-color);
		}

		& h3 {
			margin-top: 15px;
			margin-bottom: 5px;
			font-size: 1em;
			color: var(--text-color);
		}
	}

	.template-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 15px;
		align-items: center;

		& span {
			color: var(--text-color);
		}

		& button {
			padding: 6px 12px;
			background-color: var(--message-ai-bg);
			color: var(--text-color);
			border: 1px solid var(--border-color);
			border-radius: 12px;
			font-size: 0.9em;
			cursor: pointer;
			transition: background-color 0.2s;

			&:hover {
				background-color: var(--primary-color);
				color: white;
			}
		}
	}

	.settings-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px;

		@media (max-width: 600px) {
			grid-template-columns: 1fr;
		}

		& label {
			display: flex;
			flex-direction: column;
			gap: 5px;
			color: var(--text-color);
		}

		& input,
		& textarea {
			padding: 8px;
			border: 1px solid var(--border-color);
			border-radius: 4px;
			background-color: var(--input-bg);
			color: var(--text-color);
			font-size: 0.9em;
		}

		& textarea {
			min-height: 70px;
			resize: vertical;
		}
	}

	.preview-section {
		margin-top: 15px;

		& .system-preview {
			padding: 10px;
			background-color: rgba(0, 0, 0, 0.05);
			border-radius: 4px;
			font-family: monospace;
			font-size: 0.85em;
			white-space: pre-wrap;
			max-height: 150px;
			overflow-y: auto;
			color: var(--text-color);
		}
	}

	.roleplay-buttons {
		display: flex;
		justify-content: center;
		gap: 15px;
		margin-top: 15px;

		& .start-button {
			background-color: var(--primary-color);
			color: white;
			padding: 8px 16px;
			border: none;
			border-radius: 4px;
			cursor: pointer;

			&:hover:not(:disabled) {
				background-color: var(--primary-hover-color);
			}

			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
		}

		& .clear-button {
			background-color: var(--error-color);
			color: white;
			padding: 8px 16px;
			border: none;
			border-radius: 4px;
			cursor: pointer;

			&:hover {
				opacity: 0.9;
			}
		}
	}

	.settings {
		display: flex;
		flex-wrap: wrap;
		gap: 15px;
		padding: 10px 15px;
		background-color: var(--secondary-bg-color);
		border-bottom: 1px solid var(--border-color);
		font-size: 0.9em;

		& label {
			display: flex;
			align-items: center;
			gap: 5px;
			color: var(--text-color);
		}

		& input,
		& select {
			padding: 5px 8px;
			border: 1px solid var(--border-color);
			border-radius: 4px;
			font-size: 1em;
			background-color: var(--input-bg);
			color: var(--text-color);
		}

		& .error-tooltip {
			cursor: help;
			color: var(--warning-color);
			font-weight: bold;
			margin-left: 5px;
		}

		& .error-text {
			color: var(--error-color);
			font-size: 0.9em;
			margin: 0;
		}

		& .global-error {
			width: 100%;
			text-align: center;
			padding-top: 5px;
		}
	}

	.message-list {
		flex-grow: 1;
		overflow-y: auto;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background-color: var(--background-color);
	}

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

		&.loading p {
			font-style: italic;
			opacity: 0.7;
		}
	}

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
