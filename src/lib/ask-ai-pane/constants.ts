import type { ContextSelection } from './types'

export const SLASH_STORAGE_KEY = "ask-ai-slash-commands"
export const CHAT_HISTORY_STORAGE_KEY = "ask-ai-chat-history"
export const SAVED_MESSAGES_STORAGE_KEY = "ask-ai-saved-messages"

export const defaultContext: ContextSelection = {
  document: true, // Aktiviert für Bachelor-Agent
  web: true,
  agentMode: 'bachelor',
}

// DEPRECATED: Use translations instead (askAi.streamingThinking, etc.)
// Kept for backwards compatibility only
export const STREAMING_PHRASES = [
  "Agent is thinking...",
  "Agent is processing your request...",
  "Agent is analyzing data...",
  "Almost done...",
]

