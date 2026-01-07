import type { ContextSelection } from './types'

export const SLASH_STORAGE_KEY = "ask-ai-slash-commands"
export const CHAT_HISTORY_STORAGE_KEY = "ask-ai-chat-history"
export const SAVED_MESSAGES_STORAGE_KEY = "ask-ai-saved-messages"

export const defaultContext: ContextSelection = {
  document: true, // Aktiviert für Bachelor-Agent
  web: true,
  agentMode: 'bachelor',
}

export const STREAMING_PHRASES = [
  "Agent denkt nach...",
  "Agent verarbeitet deine Anfrage...",
  "Agent analysiert die Daten...",
  "Fast fertig...",
]

