<script lang="ts">
	import type { RoleplaySettings } from '$lib/types'

	const {
		settings,
		isModelValid = true,
		onStartRoleplay,
		onCloseRoleplay,
		onApplyTemplate,
		onSettingsChange, // 添加新的回調函數用於設置更新
		systemPrompt = ''
	} = $props<{
		settings: RoleplaySettings
		isModelValid?: boolean
		onStartRoleplay: () => void
		onCloseRoleplay: () => void
		onApplyTemplate: (template: string) => void
		onSettingsChange: (updatedSettings: RoleplaySettings) => void
		systemPrompt?: string
	}>()

	// 處理各種設定值的變更
	function updateSetting(key: keyof RoleplaySettings, value: any) {
		onSettingsChange({
			...settings,
			[key]: value
		})
	}
</script>

<div class="roleplay-settings">
	<h2>角色扮演設定</h2>

	<div class="template-buttons">
		<span>快速模板：</span>
		<button onclick={() => onApplyTemplate('fantasy-adventure')}>奇幻冒險</button>
		<button onclick={() => onApplyTemplate('sci-fi')}>科幻太空</button>
		<button onclick={() => onApplyTemplate('detective')}>偵探推理</button>
		<button onclick={() => onApplyTemplate('historical')}>歷史探索</button>
	</div>

	<div class="settings-grid">
		<label>
			角色名稱：
			<input
				type="text"
				value={settings.characterName}
				oninput={(e) => updateSetting('characterName', (e.target as HTMLInputElement).value)}
				placeholder="例如：艾爾文、Nova-7、夏洛克..."
			/>
		</label>

		<label>
			角色身份：
			<input
				type="text"
				value={settings.characterRole}
				oninput={(e) => updateSetting('characterRole', (e.target as HTMLInputElement).value)}
				placeholder="例如：魔法師、星際飛船AI、名偵探..."
			/>
		</label>

		<label>
			場景描述：
			<textarea
				value={settings.sceneDescription}
				oninput={(e) => updateSetting('sceneDescription', (e.target as HTMLTextAreaElement).value)}
				placeholder="在哪裡？什麼樣的環境？例如：中世紀城堡、未來太空站..."
			></textarea>
		</label>

		<label>
			情境描述：
			<textarea
				value={settings.scenarioDescription}
				oninput={(e) =>
					updateSetting('scenarioDescription', (e.target as HTMLTextAreaElement).value)}
				placeholder="正在發生什麼事？例如：探索遺跡、解決太空船故障..."
			></textarea>
		</label>

		<label>
			額外系統指令：
			<textarea
				value={settings.systemPrompt}
				oninput={(e) => updateSetting('systemPrompt', (e.target as HTMLTextAreaElement).value)}
				placeholder="其他想對AI說的指示，例如：使用特定的語氣或風格回應..."
			></textarea>
		</label>
	</div>

	<div class="preview-section">
		<h3>系統提示預覽：</h3>
		<pre class="system-preview">{systemPrompt}</pre>
	</div>

	<div class="roleplay-buttons">
		<button class="start-button" onclick={onStartRoleplay} disabled={!isModelValid}>
			{settings.isRoleplayMode ? '重新開始角色扮演' : '開始角色扮演'}
		</button>
		<button class="clear-button" onclick={onCloseRoleplay}> 關閉角色扮演 </button>
	</div>
</div>

<style lang="postcss">
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
</style>
