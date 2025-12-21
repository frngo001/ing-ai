import type { ChatMessage, StoredConversation, SlashCommand, SavedMessage } from './types'
import { SLASH_STORAGE_KEY, CHAT_HISTORY_STORAGE_KEY, SAVED_MESSAGES_STORAGE_KEY } from './constants'
import { deriveConversationTitle } from './message-utils'

/**
 * Prüft, ob localStorage im aktuellen Kontext verfügbar ist
 * (nur im Browser, nicht während SSR)
 */
const isLocalStorageAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export const saveSlashCommands = (commands: SlashCommand[]) => {
  if (!isLocalStorageAvailable()) return
  localStorage.setItem(SLASH_STORAGE_KEY, JSON.stringify(commands))
}

export const loadSlashCommands = (): SlashCommand[] => {
  if (!isLocalStorageAvailable()) {
    return getDefaultSlashCommands()
  }
  const stored = localStorage.getItem(SLASH_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as SlashCommand[]
    } catch (error) {
      console.error("Failed to parse slash commands", error)
      return getDefaultSlashCommands()
    }
  }
  return getDefaultSlashCommands()
}

export const getDefaultSlashCommands = (): SlashCommand[] => {
  return [
    { id: "outline", label: "Outline", content: "/outline Gliedere den Text in Abschnitte." },
    { id: "summary", label: "Summary", content: "/summary Fasse den Inhalt kurz zusammen." },
    { id: "improve", label: "Improve", content: "/improve Verbessere Stil und Klarheit." },
  ]
}

export const persistConversation = (msgs: ChatMessage[], id: string, setHistory: (updater: (prev: StoredConversation[]) => StoredConversation[]) => void) => {
  const title = deriveConversationTitle(msgs)
  setHistory((prev) => {
    const nextConversation: StoredConversation = {
      id,
      title,
      messages: msgs,
      updatedAt: Date.now(),
    }
    const filtered = prev.filter((item) => item.id !== id)
    const next = [nextConversation, ...filtered].slice(0, 50)
    if (isLocalStorageAvailable()) {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(next))
    }
    return next
  })
}

export const loadChatHistory = (): StoredConversation[] => {
  if (!isLocalStorageAvailable()) {
    return []
  }
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as StoredConversation[]
      if (Array.isArray(parsed)) {
        return [...parsed].sort((a, b) => b.updatedAt - a.updatedAt)
      }
    }
  } catch (error) {
    console.error("Failed to load chat history", error)
  }
  return []
}

export const saveMessage = (message: ChatMessage, conversationId: string): SavedMessage => {
  const savedMessage: SavedMessage = {
    id: crypto.randomUUID(),
    messageId: message.id,
    conversationId,
    content: message.content,
    role: message.role,
    timestamp: Date.now(),
    preview: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
  }
  
  const saved = loadSavedMessages()
  const updated = [savedMessage, ...saved.filter(m => m.messageId !== message.id)]
  if (isLocalStorageAvailable()) {
    localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
  }
  return savedMessage
}

export const removeSavedMessage = (messageId: string): void => {
  if (!isLocalStorageAvailable()) return
  const saved = loadSavedMessages()
  const updated = saved.filter(m => m.messageId !== messageId)
  localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
}

export const loadSavedMessages = (): SavedMessage[] => {
  if (!isLocalStorageAvailable()) {
    return []
  }
  try {
    const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored) as SavedMessage[]
      if (Array.isArray(parsed)) {
        return [...parsed].sort((a, b) => b.timestamp - a.timestamp)
      }
    }
  } catch (error) {
    console.error("Failed to load saved messages", error)
  }
  return []
}

export const isMessageSaved = (messageId: string): boolean => {
  if (!isLocalStorageAvailable()) {
    return false
  }
  const saved = loadSavedMessages()
  return saved.some(m => m.messageId === messageId)
}

