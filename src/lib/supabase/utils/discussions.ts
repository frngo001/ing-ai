import { createClient } from '../client'
import type { Database } from '../types'

type Discussion = Database['public']['Tables']['discussions']['Row']
type DiscussionInsert = Database['public']['Tables']['discussions']['Insert']
type DiscussionUpdate = Database['public']['Tables']['discussions']['Update']

export async function getDiscussionsByDocument(documentId: string): Promise<Discussion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Prüft, ob eine ID eine gültige UUID ist (nicht Mock-Daten)
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function getDiscussionById(id: string): Promise<Discussion | null> {
  // Überspringe API-Aufruf für Mock-IDs
  if (!isValidUUID(id)) {
    console.warn(`[DISCUSSIONS] Überspringe API-Aufruf für Mock-ID: ${id}`)
    return null
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createDiscussion(discussion: DiscussionInsert): Promise<Discussion> {
  // Überspringe API-Aufruf für Mock-IDs
  if (discussion.id && !isValidUUID(discussion.id)) {
    console.warn(`[DISCUSSIONS] Überspringe Erstellung für Mock-ID: ${discussion.id}`)
    throw new Error(`Ungültige Discussion-ID: ${discussion.id}`)
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .insert(discussion)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDiscussion(
  id: string,
  updates: DiscussionUpdate,
  userId: string
): Promise<Discussion> {
  // Überspringe API-Aufruf für Mock-IDs
  if (!isValidUUID(id)) {
    console.warn(`[DISCUSSIONS] Überspringe Update für Mock-ID: ${id}`)
    throw new Error(`Ungültige Discussion-ID: ${id}`)
  }

  const supabase = createClient()
  const { data, error } = await supabase
    .from('discussions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDiscussion(id: string, userId: string): Promise<void> {
  // Überspringe API-Aufruf für Mock-IDs
  if (!isValidUUID(id)) {
    console.warn(`[DISCUSSIONS] Überspringe Löschen für Mock-ID: ${id}`)
    return
  }

  const supabase = createClient()
  const { error } = await supabase
    .from('discussions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function deleteDiscussionsByDocument(documentId: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('discussions')
    .delete()
    .eq('document_id', documentId)
    .eq('user_id', userId)

  if (error) throw error
}

