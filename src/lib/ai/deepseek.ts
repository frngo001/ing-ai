import { createDeepSeek } from '@ai-sdk/deepseek'

// Central DeepSeek client (native provider)
export const deepseek = createDeepSeek({
    apiKey: process.env.DEEPSEEK_API_KEY ?? '',
    // Für FIM laut Docs: beta-Endpoint nutzen; env kann überschreiben.
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/beta',
})

// Model configurations
export const DEEPSEEK_CHAT_MODEL = 'deepseek-chat'
export const DEEPSEEK_REASONER_MODEL = 'deepseek-reasoner'

// Default settings
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_MAX_TOKENS = 2000
