/**
 * Storage Utilities für Chat-Nachrichten und Konversationen
 * 
 * Diese Datei enthält alle Funktionen zum Speichern und Laden von:
 * - Chat-Konversationen und Nachrichten
 * - Slash Commands
 * - Gespeicherte Favoriten-Nachrichten
 */

import type { ChatMessage, StoredConversation, SlashCommand, SavedMessage } from './types'
import { SLASH_STORAGE_KEY, CHAT_HISTORY_STORAGE_KEY, SAVED_MESSAGES_STORAGE_KEY } from './constants'
import { deriveConversationTitle } from './message-utils'
import { getCurrentUserId } from '@/lib/supabase/utils/auth'
import * as chatConversationsUtils from '@/lib/supabase/utils/chat-conversations'
import * as chatMessagesUtils from '@/lib/supabase/utils/chat-messages'
import * as savedMessagesUtils from '@/lib/supabase/utils/saved-messages'
import * as slashCommandsUtils from '@/lib/supabase/utils/slash-commands'

// ============================================================================
// Hilfsfunktionen
// ============================================================================

/**
 * Prüft, ob localStorage im aktuellen Kontext verfügbar ist
 * (nur im Browser, nicht während SSR)
 */
const isLocalStorageAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

/**
 * Konvertiert eine lokale ChatMessage in das Datenbank-Format
 */
const convertToDbMessage = (msg: ChatMessage, conversationId: string, index: number) => ({
  id: msg.id,
  role: msg.role as 'user' | 'assistant',
  content: msg.content,
  reasoning: msg.reasoning || null,
  parts: msg.parts || [],
  toolInvocations: msg.toolInvocations || [],
  toolSteps: msg.toolSteps || [],
  files: msg.files || [],
  context: msg.context || [],
  mentions: msg.mentions || [],
})

/**
 * Konvertiert eine Datenbank-Message in das lokale ChatMessage-Format
 */
const convertFromDbMessage = (msg: any): ChatMessage => ({
  id: msg.id,
  role: msg.role,
  content: msg.content,
  reasoning: msg.reasoning || undefined,
  parts: Array.isArray(msg.parts) ? msg.parts : [],
  toolInvocations: Array.isArray(msg.tool_invocations) ? msg.tool_invocations : [],
  toolSteps: Array.isArray(msg.tool_steps) ? msg.tool_steps : [],
  files: Array.isArray(msg.files) ? msg.files : undefined,
  context: Array.isArray(msg.context) ? msg.context : undefined,
  mentions: Array.isArray(msg.mentions) ? msg.mentions : undefined,
})

// ============================================================================
// Slash Commands
// ============================================================================

export const saveSlashCommands = async (commands: SlashCommand[]) => {
  const userId = await getCurrentUserId()

  if (userId) {
    try {
      await slashCommandsUtils.deleteAllSlashCommands(userId)
      if (commands.length > 0) {
        await slashCommandsUtils.createSlashCommands(
          commands.map(cmd => ({
            user_id: userId,
            label: cmd.label,
            content: cmd.content,
          }))
        )
      }
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Speichern der Slash Commands:', error)
      if (isLocalStorageAvailable()) {
        localStorage.setItem(SLASH_STORAGE_KEY, JSON.stringify(commands))
      }
    }
  } else if (isLocalStorageAvailable()) {
    localStorage.setItem(SLASH_STORAGE_KEY, JSON.stringify(commands))
  }
}

export const saveSingleSlashCommand = async (command: SlashCommand): Promise<SlashCommand> => {
  const userId = await getCurrentUserId()

  if (userId) {
    try {
      const created = await slashCommandsUtils.createSlashCommand({
        user_id: userId,
        label: command.label,
        content: command.content,
      })
      return { id: created.id, label: created.label, content: created.content }
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Speichern des Slash Commands:', error)
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(SLASH_STORAGE_KEY)
        const commands = stored ? JSON.parse(stored) as SlashCommand[] : []
        const updated = [...commands, command]
        localStorage.setItem(SLASH_STORAGE_KEY, JSON.stringify(updated))
      }
      return command
    }
  } else {
    if (isLocalStorageAvailable()) {
      const stored = localStorage.getItem(SLASH_STORAGE_KEY)
      const commands = stored ? JSON.parse(stored) as SlashCommand[] : []
      const updated = [...commands, command]
      localStorage.setItem(SLASH_STORAGE_KEY, JSON.stringify(updated))
    }
    return command
  }
}

export const loadSlashCommands = async (): Promise<SlashCommand[]> => {
  const userId = await getCurrentUserId()

  if (userId) {
    try {
      const commands = await slashCommandsUtils.getSlashCommands(userId)
      return commands.map(cmd => ({
        id: cmd.id,
        label: cmd.label,
        content: cmd.content,
      }))
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Laden der Slash Commands:', error)
    }
  }

  // Fallback auf localStorage
  if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem(SLASH_STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored) as SlashCommand[]
      } catch {
        // Ignoriere Parse-Fehler
      }
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

// ============================================================================
// Chat-Konversationen und Nachrichten
// ============================================================================

/**
 * Speichert eine Konversation mit allen Nachrichten in Supabase
 * 
 * Verwendet die neue atomare syncChatMessages-Funktion für zuverlässiges Speichern:
 * - Neue Nachrichten werden erstellt
 * - Geänderte Nachrichten werden aktualisiert (inkl. parts, reasoning, etc.)
 * - Gelöschte Nachrichten werden entfernt
 * - Reihenfolge wird über order_index garantiert
 */
export const persistConversation = async (
  msgs: ChatMessage[],
  id: string,
  setHistory: (updater: (prev: StoredConversation[]) => StoredConversation[]) => void,
  agentMode?: 'bachelor' | 'general' | 'standard',
  projectId?: string
) => {
  const userId = await getCurrentUserId()
  const title = deriveConversationTitle(msgs)

  if (userId) {
    try {
      // 1. Erstelle oder aktualisiere Conversation
      let conversation = await chatConversationsUtils.getChatConversationById(id, userId)

      if (!conversation) {
        conversation = await chatConversationsUtils.createChatConversation({
          id,
          user_id: userId,
          title,
          project_id: projectId || null,
        })
      } else {
        conversation = await chatConversationsUtils.updateChatConversation(id, {
          title,
          updated_at: new Date().toISOString(),
        }, userId)
      }

      // 2. Synchronisiere Nachrichten mit atomarer Funktion
      if (msgs.length > 0) {
        await chatMessagesUtils.syncChatMessages(id, msgs.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          reasoning: msg.reasoning || null,
          parts: msg.parts || [],
          toolInvocations: msg.toolInvocations || [],
          toolSteps: msg.toolSteps || [],
          files: msg.files || [],
          context: msg.context || [],
          mentions: msg.mentions || [],
        })))
      } else {
        await chatMessagesUtils.deleteChatMessagesByConversation(id)
      }
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Speichern der Conversation:', error)
      // Fallback auf localStorage
      if (isLocalStorageAvailable()) {
        const nextConversation: StoredConversation = {
          id,
          title,
          messages: msgs,
          updatedAt: Date.now(),
          agentMode,
        }
        const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
        const prev = stored ? JSON.parse(stored) as StoredConversation[] : []
        const filtered = prev.filter((item) => item.id !== id)
        const next = [nextConversation, ...filtered].slice(0, 50)
        localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(next))
      }
    }
  } else {
    // Fallback auf localStorage wenn kein User eingeloggt
    if (isLocalStorageAvailable()) {
      const nextConversation: StoredConversation = {
        id,
        title,
        messages: msgs,
        updatedAt: Date.now(),
        agentMode,
      }
      const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
      const prev = stored ? JSON.parse(stored) as StoredConversation[] : []
      const filtered = prev.filter((item) => item.id !== id)
      const next = [nextConversation, ...filtered].slice(0, 50)
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(next))
    }
  }

  // Update lokalen State
  setHistory((prev) => {
    const nextConversation: StoredConversation = {
      id,
      title,
      messages: msgs,
      updatedAt: Date.now(),
      agentMode,
    }
    const filtered = prev.filter((item) => item.id !== id)
    const next = [nextConversation, ...filtered].slice(0, 50)
    return next
  })
}

/**
 * Lädt die Chat-Historie aus Supabase
 * 
 * Nachrichten werden nach order_index sortiert, um die korrekte Reihenfolge zu garantieren.
 * Alle Felder (parts, reasoning, toolSteps, etc.) werden korrekt konvertiert.
 */
export const loadChatHistory = async (projectId?: string): Promise<StoredConversation[]> => {
  const userId = await getCurrentUserId()

  if (userId) {
    try {
      const conversations = await chatConversationsUtils.getChatConversations(userId, projectId)

      // Lade Messages für jede Conversation
      const conversationsWithMessages: StoredConversation[] = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await chatMessagesUtils.getChatMessages(conv.id)
          return {
            id: conv.id,
            title: conv.title,
            messages: messages.map(convertFromDbMessage),
            updatedAt: new Date(conv.updated_at).getTime(),
          }
        })
      )

      return conversationsWithMessages.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Laden der Chat History:', error)
    }
  }

  // Fallback auf localStorage
  if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredConversation[]
        if (Array.isArray(parsed)) {
          return [...parsed].sort((a, b) => b.updatedAt - a.updatedAt)
        }
      } catch {
        // Ignoriere Parse-Fehler
      }
    }
  }
  return []
}

// ============================================================================
// Gespeicherte Nachrichten (Favoriten)
// ============================================================================

export const saveMessage = async (message: ChatMessage, conversationId: string): Promise<SavedMessage> => {
  const userId = await getCurrentUserId()
  const savedMessage: SavedMessage = {
    id: crypto.randomUUID(),
    messageId: message.id,
    conversationId,
    content: message.content,
    role: message.role,
    timestamp: Date.now(),
    preview: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
  }

  if (userId) {
    try {
      await savedMessagesUtils.createSavedMessage({
        user_id: userId,
        message_id: message.id,
        conversation_id: conversationId,
        content: message.content,
        role: message.role,
        preview: savedMessage.preview,
      })
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Speichern der Message:', error)
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
        const saved = stored ? JSON.parse(stored) as SavedMessage[] : []
        const updated = [savedMessage, ...saved.filter(m => m.messageId !== message.id)]
        localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
      }
    }
  } else if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
    const saved = stored ? JSON.parse(stored) as SavedMessage[] : []
    const updated = [savedMessage, ...saved.filter(m => m.messageId !== message.id)]
    localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
  }

  return savedMessage
}

export const removeSavedMessage = async (messageId: string): Promise<void> => {
  const userId = await getCurrentUserId()

  if (userId) {
    try {
      await savedMessagesUtils.deleteSavedMessageByMessageId(messageId, userId)
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Löschen der Message:', error)
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
        const saved = stored ? JSON.parse(stored) as SavedMessage[] : []
        const updated = saved.filter(m => m.messageId !== messageId)
        localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
      }
    }
  } else if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
    const saved = stored ? JSON.parse(stored) as SavedMessage[] : []
    const updated = saved.filter(m => m.messageId !== messageId)
    localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
  }
}

export const loadSavedMessages = async (): Promise<SavedMessage[]> => {
  const userId = await getCurrentUserId()

  if (userId) {
    try {
      const messages = await savedMessagesUtils.getSavedMessages(userId)
      return messages.map(msg => ({
        id: msg.id,
        messageId: msg.message_id,
        conversationId: msg.conversation_id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.created_at).getTime(),
        preview: msg.preview || '',
      }))
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Laden der Saved Messages:', error)
    }
  }

  // Fallback auf localStorage
  if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SavedMessage[]
        if (Array.isArray(parsed)) {
          return [...parsed].sort((a, b) => b.timestamp - a.timestamp)
        }
      } catch {
        // Ignoriere Parse-Fehler
      }
    }
  }
  return []
}

export const isMessageSaved = async (messageId: string): Promise<boolean> => {
  const userId = await getCurrentUserId()

  if (userId) {
    try {
      const message = await savedMessagesUtils.getSavedMessageByMessageId(messageId, userId)
      return !!message
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Prüfen der Message:', error)
    }
  }

  // Fallback auf localStorage
  if (isLocalStorageAvailable()) {
    const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
    if (stored) {
      try {
        const saved = JSON.parse(stored) as SavedMessage[]
        return saved.some(m => m.messageId === messageId)
      } catch {
        // Ignoriere Parse-Fehler
      }
    }
  }
  return false
}
