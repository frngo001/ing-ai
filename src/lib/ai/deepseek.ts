import { createOpenAI } from '@ai-sdk/openai'

// Deepseek uses OpenAI-compatible API
export const deepseek = createOpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
})

// Model configurations
export const DEEPSEEK_CHAT_MODEL = 'deepseek-chat'
export const DEEPSEEK_CODER_MODEL = 'deepseek-coder'

// Default settings
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_MAX_TOKENS = 2000
