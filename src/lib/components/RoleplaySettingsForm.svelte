<!--
@component
@name RoleplaySettingsForm
@description 角色扮演設定表單組件，包含了角色名稱、身份、場景描述等設定欄位
-->
<script lang="ts">
	import type { RoleplaySettings } from '$lib/types'
	import imageCompression from 'browser-image-compression'

	const {
		settings,
		isUploadingImage = false,
		onSettingsChange
	} = $props<{
		settings: RoleplaySettings
		isUploadingImage?: boolean
		onSettingsChange: (key: keyof RoleplaySettings, value: any) => void
	}>()

	// 使用 $derived 替代原本的狀態
	let displayedAvatarSrc = $derived(settings.avatarBase64)
	let hasAvatar = $derived(!!settings.avatarBase64)

	/** 處理圖片上傳 */
	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement
		const file = target.files?.[0]
		if (!file) return

		const options = {
			maxSizeMB: 0.5,
			maxWidthOrHeight: 300,
			useWebWorker: true,
			initialQuality: 0.7
		}

		try {
			const compressedFile = await imageCompression(file, options)
			const reader = new FileReader()
			reader.onloadend = () => {
				const base64String = reader.result as string
				onSettingsChange('avatarBase64', base64String)
			}
			reader.readAsDataURL(compressedFile)
		} catch (error) {
			console.error('圖片壓縮失敗:', error)
			alert(`圖片壓縮失敗：${error instanceof Error ? error.message : '未知錯誤'}`)
		} finally {
			target.value = ''
		}
	}

	/** 處理圖片載入錯誤 */
	function handleImageError(event: Event) {
		const imgElement = event.currentTarget as HTMLImageElement
		imgElement.src = '/favicon.png'
	}
</script>

<div class="settings-grid">
	<!-- 頭像上傳與預覽 -->
	<div class="avatar-section">
		<label for="avatar-upload">AI 頭像：</label>
		<div class="avatar-controls">
			<img
				src={displayedAvatarSrc || '/favicon.png'}
				alt="AI 頭像預覽"
				class="avatar-preview"
				onerror={handleImageError}
			/>
			<input
				type="file"
				id="avatar-upload"
				accept="image/*"
				onchange={handleImageUpload}
				style="display: none;"
				disabled={isUploadingImage}
			/>
			<button
				class="upload-button"
				onclick={() => document.getElementById('avatar-upload')?.click()}
				disabled={isUploadingImage}
			>
				{isUploadingImage ? '上傳中...' : '選擇圖片'}
			</button>
			{#if hasAvatar}
				<button
					class="remove-button"
					onclick={() => onSettingsChange('avatarBase64', undefined)}
					disabled={isUploadingImage}
					title="移除頭像"
				>
					❌
				</button>
			{/if}
		</div>
		<small>建議使用方形圖片，將自動壓縮至 300x300px 以下。</small>
	</div>

	<!-- 角色名稱設定 -->
	<label>
		角色名稱：
		<input
			type="text"
			value={settings.characterName}
			oninput={(e: Event & { currentTarget: HTMLInputElement }) =>
				onSettingsChange('characterName', e.currentTarget.value)}
			placeholder="例如：艾爾文、Nova-7、夏洛克..."
		/>
	</label>

	<!-- 角色身份設定 -->
	<label>
		角色身份：
		<input
			type="text"
			value={settings.characterRole}
			oninput={(e: Event & { currentTarget: HTMLInputElement }) =>
				onSettingsChange('characterRole', e.currentTarget.value)}
			placeholder="例如：魔法師、星際飛船AI、名偵探..."
		/>
	</label>

	<!-- 場景描述設定 -->
	<label>
		場景描述：
		<textarea
			value={settings.sceneDescription}
			oninput={(e: Event & { currentTarget: HTMLTextAreaElement }) =>
				onSettingsChange('sceneDescription', e.currentTarget.value)}
			placeholder="在哪裡？什麼樣的環境？例如：中世紀城堡、未來太空站..."
		></textarea>
	</label>

	<!-- 情境描述設定 -->
	<label>
		情境描述：
		<textarea
			value={settings.scenarioDescription}
			oninput={(e: Event & { currentTarget: HTMLTextAreaElement }) =>
				onSettingsChange('scenarioDescription', e.currentTarget.value)}
			placeholder="正在發生什麼事？例如：探索遺跡、解決太空船故障..."
		></textarea>
	</label>

	<!-- 額外系統指令設定 -->
	<label>
		額外系統指令：
		<textarea
			value={settings.systemPrompt}
			oninput={(e: Event & { currentTarget: HTMLTextAreaElement }) =>
				onSettingsChange('systemPrompt', e.currentTarget.value)}
			placeholder="其他想對AI說的指示，例如：使用特定的語氣或風格回應..."
		></textarea>
	</label>
</div>

<style lang="postcss">
	.settings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 15px;

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

	.avatar-section {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 10px;

		& label {
			font-weight: bold;
			color: var(--text-color);
		}

		& .avatar-controls {
			display: flex;
			align-items: center;
			gap: 10px;
		}

		& .avatar-preview {
			width: 60px;
			height: 60px;
			border-radius: 50%;
			object-fit: cover;
			border: 1px solid var(--border-color);
			background-color: var(--input-bg);
		}

		& .upload-button,
		& .remove-button {
			padding: 5px 10px;
			font-size: 0.9em;
			background-color: var(--message-user-bg);
			color: var(--text-color);
			border: 1px solid var(--border-color);
			border-radius: 4px;
			cursor: pointer;
			transition: background-color 0.2s;

			&:hover:not(:disabled) {
				background-color: var(--primary-color);
				color: white;
			}
			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}
		}

		& .remove-button {
			background-color: transparent;
			border: none;
			font-size: 1.2em;
			padding: 0 5px;
			&:hover:not(:disabled) {
				background-color: rgba(255, 0, 0, 0.1);
			}
		}

		& small {
			font-size: 0.8em;
			color: var(--secondary-text-color);
		}
	}
</style>
