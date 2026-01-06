import type { ChatMessage, StoredConversation, SlashCommand, SavedMessage } from './types'
import { SLASH_STORAGE_KEY, CHAT_HISTORY_STORAGE_KEY, SAVED_MESSAGES_STORAGE_KEY } from './constants'
import { deriveConversationTitle } from './message-utils'
import { getCurrentUserId } from '@/lib/supabase/utils/auth'
import * as chatConversationsUtils from '@/lib/supabase/utils/chat-conversations'
import * as chatMessagesUtils from '@/lib/supabase/utils/chat-messages'
import * as savedMessagesUtils from '@/lib/supabase/utils/saved-messages'
import * as slashCommandsUtils from '@/lib/supabase/utils/slash-commands'

/**
 * Prüft, ob localStorage im aktuellen Kontext verfügbar ist
 * (nur im Browser, nicht während SSR)
 */
const isLocalStorageAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export const saveSlashCommands = async (commands: SlashCommand[]) => {
  const userId = await getCurrentUserId()
  
  if (userId) {
    try {
      // Lösche alle bestehenden Commands
      await slashCommandsUtils.deleteAllSlashCommands(userId)
      
      // Erstelle neue Commands
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
      // Fallback auf localStorage
      if (isLocalStorageAvailable()) {
        localStorage.setItem(SLASH_STORAGE_KEY, JSON.stringify(commands))
      }
    }
  } else {
    // Fallback auf localStorage wenn kein User eingeloggt
    if (isLocalStorageAvailable()) {
      localStorage.setItem(SLASH_STORAGE_KEY, JSON.stringify(commands))
    }
  }
}

export const saveSingleSlashCommand = async (command: SlashCommand): Promise<SlashCommand> => {
  const userId = await getCurrentUserId()
  
  if (userId) {
    try {
      // Erstelle neuen Command in der Datenbank
      const created = await slashCommandsUtils.createSlashCommand({
        user_id: userId,
        label: command.label,
        content: command.content,
      })
      
      return {
        id: created.id,
        label: created.label,
        content: created.content,
      }
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Speichern des Slash Commands:', error)
      // Fallback auf localStorage
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(SLASH_STORAGE_KEY)
        const commands = stored ? JSON.parse(stored) as SlashCommand[] : []
        const updated = [...commands, command]
        localStorage.setItem(SLASH_STORAGE_KEY, JSON.stringify(updated))
      }
      return command
    }
  } else {
    // Fallback auf localStorage wenn kein User eingeloggt
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
      // Fallback auf localStorage
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(SLASH_STORAGE_KEY)
        if (stored) {
          try {
            return JSON.parse(stored) as SlashCommand[]
          } catch {
            return getDefaultSlashCommands()
          }
        }
      }
      return getDefaultSlashCommands()
    }
  }
  
  // Fallback auf localStorage wenn kein User eingeloggt
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

export const persistConversation = async (msgs: ChatMessage[], id: string, setHistory: (updater: (prev: StoredConversation[]) => StoredConversation[]) => void) => {
  const userId = await getCurrentUserId()
  const title = deriveConversationTitle(msgs)
  
  if (userId) {
    try {
      // Erstelle oder aktualisiere Conversation
      let conversation = await chatConversationsUtils.getChatConversationById(id, userId)
      
      if (!conversation) {
        conversation = await chatConversationsUtils.createChatConversation({
          id,
          user_id: userId,
          title,
        })
      } else {
        conversation = await chatConversationsUtils.updateChatConversation(id, {
          title,
          updated_at: new Date().toISOString(),
        }, userId)
      }

      // Sichere Strategie: Erstelle zuerst neue Messages, dann lösche alte
      // Dies verhindert Datenverlust bei Fehlern während des Deployments
      if (msgs.length > 0) {
        // Hole bestehende Messages VOR dem Erstellen (als Backup)
        const existingMessagesBefore = await chatMessagesUtils.getChatMessages(id)
        
        // Erstelle neue Messages zuerst (bekommen neue UUIDs)
        const createdMessages = await chatMessagesUtils.createChatMessages(
          msgs.map(msg => ({
            conversation_id: id,
            role: msg.role,
            content: msg.content,
            reasoning: msg.reasoning || null,
            parts: msg.parts || [],
            tool_invocations: msg.toolInvocations || [],
            tool_steps: msg.toolSteps || [],
            files: msg.files || [],
            context: msg.context || [],
          }))
        )
        
        // Lösche nur Messages, die vor dem Erstellen existierten
        // Die neuen Messages haben neue UUIDs und sind daher nicht in existingMessageIds
        for (const oldMessage of existingMessagesBefore) {
          try {
            await chatMessagesUtils.deleteChatMessage(oldMessage.id)
          } catch (deleteError) {
            // Logge Fehler, aber breche nicht ab - neue Messages sind bereits erstellt
            console.warn(`[STORAGE] Konnte alte Message ${oldMessage.id} nicht löschen:`, deleteError)
          }
        }
      } else {
        // Wenn keine Messages vorhanden sind, lösche alle
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
    }
    const filtered = prev.filter((item) => item.id !== id)
    const next = [nextConversation, ...filtered].slice(0, 50)
    return next
  })
}

export const loadChatHistory = async (): Promise<StoredConversation[]> => {
  const userId = await getCurrentUserId()
  
  if (userId) {
    try {
      const conversations = await chatConversationsUtils.getChatConversations(userId)
      
      // Lade Messages für jede Conversation
      const conversationsWithMessages: StoredConversation[] = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await chatMessagesUtils.getChatMessages(conv.id)
          return {
            id: conv.id,
            title: conv.title,
            messages: messages.map(msg => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              reasoning: msg.reasoning || undefined,
              parts: msg.parts as ChatMessage['parts'],
              toolInvocations: msg.tool_invocations as ChatMessage['toolInvocations'],
              toolSteps: msg.tool_steps as ChatMessage['toolSteps'],
              files: (msg.files as ChatMessage['files']) || undefined,
              context: (msg.context as ChatMessage['context']) || undefined,
            })),
            updatedAt: new Date(conv.updated_at).getTime(),
          }
        })
      )
      
      return conversationsWithMessages.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Laden der Chat History:', error)
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
            return []
          }
        }
      }
      return []
    }
  }
  
  // Fallback auf localStorage wenn kein User eingeloggt
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
      // Fallback auf localStorage
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
        const saved = stored ? JSON.parse(stored) as SavedMessage[] : []
        const updated = [savedMessage, ...saved.filter(m => m.messageId !== message.id)]
        localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
      }
    }
  } else {
    // Fallback auf localStorage wenn kein User eingeloggt
    if (isLocalStorageAvailable()) {
      const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
      const saved = stored ? JSON.parse(stored) as SavedMessage[] : []
      const updated = [savedMessage, ...saved.filter(m => m.messageId !== message.id)]
      localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
    }
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
      // Fallback auf localStorage
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
        const saved = stored ? JSON.parse(stored) as SavedMessage[] : []
        const updated = saved.filter(m => m.messageId !== messageId)
        localStorage.setItem(SAVED_MESSAGES_STORAGE_KEY, JSON.stringify(updated))
      }
    }
  } else {
    // Fallback auf localStorage wenn kein User eingeloggt
    if (!isLocalStorageAvailable()) return
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
            return []
          }
        }
      }
      return []
    }
  }
  
  // Fallback auf localStorage wenn kein User eingeloggt
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

export const isMessageSaved = async (messageId: string): Promise<boolean> => {
  const userId = await getCurrentUserId()
  
  if (userId) {
    try {
      const message = await savedMessagesUtils.getSavedMessageByMessageId(messageId, userId)
      return !!message
    } catch (error) {
      console.error('❌ [STORAGE] Fehler beim Prüfen der Message:', error)
      // Fallback auf localStorage
      if (isLocalStorageAvailable()) {
        const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
        if (stored) {
          try {
            const saved = JSON.parse(stored) as SavedMessage[]
            return saved.some(m => m.messageId === messageId)
          } catch {
            return false
          }
        }
      }
      return false
    }
  }
  
  // Fallback auf localStorage wenn kein User eingeloggt
  if (!isLocalStorageAvailable()) {
    return false
  }
  const stored = localStorage.getItem(SAVED_MESSAGES_STORAGE_KEY)
  if (stored) {
    try {
      const saved = JSON.parse(stored) as SavedMessage[]
      return saved.some(m => m.messageId === messageId)
    } catch {
      return false
    }
  }
  return false
}

