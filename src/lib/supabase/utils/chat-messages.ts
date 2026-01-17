import { createClient } from '../client'
import type { Database } from '../types'

type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update']

/**
 * Lädt alle Nachrichten einer Konversation, sortiert nach order_index
 */
export async function getChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Lädt eine einzelne Nachricht anhand ihrer ID
 */
export async function getChatMessageById(id: string): Promise<ChatMessage | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/**
 * Erstellt eine einzelne Nachricht
 */
export async function createChatMessage(message: ChatMessageInsert): Promise<ChatMessage> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(message)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Erstellt mehrere Nachrichten gleichzeitig
 */
export async function createChatMessages(messages: ChatMessageInsert[]): Promise<ChatMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messages)
    .select()

  if (error) throw error
  return data || []
}

/**
 * Aktualisiert eine Nachricht
 */
export async function updateChatMessage(
  id: string,
  updates: ChatMessageUpdate
): Promise<ChatMessage> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Löscht eine Nachricht
 */
export async function deleteChatMessage(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Löscht alle Nachrichten einer Konversation
 */
export async function deleteChatMessagesByConversation(conversationId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('conversation_id', conversationId)

  if (error) throw error
}

/**
 * Synchronisiert Nachrichten mit der Datenbank (atomares Upsert)
 * 
 * Diese Funktion vergleicht die lokalen Nachrichten mit den gespeicherten
 * und führt nur notwendige Änderungen durch:
 * - Neue Nachrichten werden erstellt
 * - Geänderte Nachrichten werden aktualisiert
 * - Gelöschte Nachrichten werden entfernt
 */
export async function syncChatMessages(
  conversationId: string,
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    reasoning?: string | null
    parts?: unknown[]
    toolInvocations?: unknown[]
    toolSteps?: unknown[]
    files?: unknown[]
    context?: unknown[]
    mentions?: unknown[]
  }>
): Promise<void> {
  const supabase = createClient()

  // 1. Hole existierende Nachrichten
  const existingMessages = await getChatMessages(conversationId)
  const existingMap = new Map(existingMessages.map(m => [m.id, m]))
  const newMessageIds = new Set(messages.map(m => m.id))

  // 2. Erstelle neue Nachrichten
  const toCreate: ChatMessageInsert[] = []
  messages.forEach((msg, index) => {
    if (!existingMap.has(msg.id)) {
      toCreate.push({
        id: msg.id,
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        reasoning: msg.reasoning || null,
        parts: (msg.parts || []) as any,
        tool_invocations: (msg.toolInvocations || []) as any,
        tool_steps: (msg.toolSteps || []) as any,
        files: (msg.files || []) as any,
        context: (msg.context || []) as any,
        mentions: (msg.mentions || []) as any,
        order_index: index,
      })
    }
  })

  if (toCreate.length > 0) {
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert(toCreate)

    if (insertError) {
      console.error('[CHAT-MESSAGES] Fehler beim Erstellen:', insertError)
      throw insertError
    }
  }

  // 3. Aktualisiere geänderte Nachrichten
  for (let index = 0; index < messages.length; index++) {
    const msg = messages[index]
    const existing = existingMap.get(msg.id)

    if (existing) {
      // Prüfe ob sich etwas geändert hat
      const hasContentChange = existing.content !== msg.content
      const hasReasoningChange = existing.reasoning !== (msg.reasoning || null)
      const hasPartsChange = JSON.stringify(existing.parts) !== JSON.stringify(msg.parts || [])
      const hasOrderChange = existing.order_index !== index

      if (hasContentChange || hasReasoningChange || hasPartsChange || hasOrderChange) {
        const { error: updateError } = await supabase
          .from('chat_messages')
          .update({
            content: msg.content,
            reasoning: msg.reasoning || null,
            parts: (msg.parts || []) as any,
            tool_invocations: (msg.toolInvocations || []) as any,
            tool_steps: (msg.toolSteps || []) as any,
            files: (msg.files || []) as any,
            context: (msg.context || []) as any,
            mentions: (msg.mentions || []) as any,
            order_index: index,
          })
          .eq('id', msg.id)

        if (updateError) {
          console.warn(`[CHAT-MESSAGES] Fehler beim Aktualisieren von ${msg.id}:`, updateError)
        }
      }
    }
  }

  // 4. Lösche entfernte Nachrichten
  for (const existing of existingMessages) {
    if (!newMessageIds.has(existing.id)) {
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        console.warn(`[CHAT-MESSAGES] Fehler beim Löschen von ${existing.id}:`, deleteError)
      }
    }
  }
}
