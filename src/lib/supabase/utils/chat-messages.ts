import { createClient } from '../client'
import type { Database } from '../types'

type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update']

export async function getChatMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

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

export async function createChatMessages(messages: ChatMessageInsert[]): Promise<ChatMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(messages)
    .select()

  if (error) throw error
  return data || []
}

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

export async function deleteChatMessage(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function deleteChatMessagesByConversation(conversationId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('chat_messages')
    .delete()
    .eq('conversation_id', conversationId)

  if (error) throw error
}

