import { createClient } from '../client'
import type { Database } from '../types'

type SavedMessage = Database['public']['Tables']['saved_messages']['Row']
type SavedMessageInsert = Database['public']['Tables']['saved_messages']['Insert']
type SavedMessageUpdate = Database['public']['Tables']['saved_messages']['Update']

export async function getSavedMessages(userId: string): Promise<SavedMessage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getSavedMessageById(id: string, userId: string): Promise<SavedMessage | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_messages')
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

export async function getSavedMessageByMessageId(messageId: string, userId: string): Promise<SavedMessage | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_messages')
    .select('*')
    .eq('message_id', messageId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createSavedMessage(message: SavedMessageInsert): Promise<SavedMessage> {
  const supabase = createClient()
  
  // Prüfe ob bereits gespeichert
  const existing = await getSavedMessageByMessageId(message.message_id, message.user_id)
  if (existing) {
    // Update statt Insert
    return updateSavedMessage(existing.id, message, message.user_id)
  }

  const { data, error } = await supabase
    .from('saved_messages')
    .insert(message)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSavedMessage(
  id: string,
  updates: SavedMessageUpdate,
  userId: string
): Promise<SavedMessage> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('saved_messages')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSavedMessage(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('saved_messages')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deleteSavedMessageByMessageId(messageId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('saved_messages')
    .delete()
    .eq('message_id', messageId)
    .eq('user_id', userId)

  if (error) throw error
}

