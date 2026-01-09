import { createClient } from '../client'
import type { Database } from '../types'

type ChatConversation = Database['public']['Tables']['chat_conversations']['Row']
type ChatConversationInsert = Database['public']['Tables']['chat_conversations']['Insert']
type ChatConversationUpdate = Database['public']['Tables']['chat_conversations']['Update']

export async function getChatConversations(userId: string, projectId?: string): Promise<ChatConversation[]> {
  const supabase = createClient()
  let query = supabase
    .from('chat_conversations')
    .select('*')
    .eq('user_id', userId)

  // Filter by project if projectId is provided
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query.order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getChatConversationById(id: string, userId: string): Promise<ChatConversation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createChatConversation(
  conversation: ChatConversationInsert
): Promise<ChatConversation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_conversations')
    .insert(conversation)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateChatConversation(
  id: string,
  updates: ChatConversationUpdate,
  userId: string
): Promise<ChatConversation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chat_conversations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteChatConversation(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('chat_conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

