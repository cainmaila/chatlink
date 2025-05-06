/**
 * @file promptUtils.ts
 * @description 提供提示詞生成相關的工具函數
 */

import type { RoleplaySettings } from '../types'

/**
 * 生成角色扮演系統提示詞
 * @param settings 角色扮演設定
 * @returns 生成的系統提示詞
 */
export function generateRoleplaySystemPrompt(settings: RoleplaySettings): string {
  if (!settings.isRoleplayMode) return ''

  const promptParts: string[] = ['你是一個角色扮演的AI助手。']

  if (settings.characterName) {
    promptParts.push(`你的名字是「${settings.characterName}」。`)
  }

  if (settings.characterRole) {
    promptParts.push(`你的角色是「${settings.characterRole}」。`)
  }

  if (settings.sceneDescription) {
    promptParts.push(`當前場景：${settings.sceneDescription}`)
  }

  if (settings.scenarioDescription) {
    promptParts.push(`當前情境：${settings.scenarioDescription}`)
  }

  if (settings.systemPrompt) {
    promptParts.push(`額外指令：${settings.systemPrompt}`)
  }

  // 添加通用指令
  promptParts.push('請始終保持這個角色，不要打破第四面牆。不要提及你是AI或語言模型，完全沉浸在角色中回應用戶。')

  return promptParts.join('\n\n')
}

/**
 * 生成角色扮演歡迎訊息
 * @param settings 角色扮演設定
 * @returns 歡迎訊息對象
 */
export function generateWelcomeMessage(settings: RoleplaySettings) {
  if (!settings.isRoleplayMode) return null

  let welcomeContent = `歡迎來到`
  if (settings.sceneDescription) {
    welcomeContent += `${settings.sceneDescription}。`
  }

  if (settings.scenarioDescription) {
    welcomeContent += `\n${settings.scenarioDescription}`
  }

  welcomeContent += `\n我是${settings.characterName || 'AI助手'}`
  if (settings.characterRole) {
    welcomeContent += `，${settings.characterRole}`
  }
  welcomeContent += '。有什麼我可以幫助你的嗎？'

  return {
    role: 'ai' as const,
    content: welcomeContent
  }
}

/**
 * 生成 AI 角色模板的提示詞
 * @param description 用戶輸入的角色描述
 * @returns AI 生成模板的提示詞
 */
export function generateTemplatePrompt(description: string): string {
  return `
基於以下使用者描述，生成一個角色扮演模板設定。請嚴格按照指定的 JSON 格式回傳，不要包含任何額外的文字、註解或 markdown 格式標籤。

使用者描述：
"${description}"

JSON 格式：
{
  "characterName": "角色名稱",
  "characterRole": "角色身份",
  "sceneDescription": "場景描述",
  "scenarioDescription": "情境描述",
  "systemPrompt": "額外系統指令"
}

請生成 JSON：`
}