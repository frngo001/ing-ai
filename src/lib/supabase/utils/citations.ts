import { createClient } from '../client'
import type { Database } from '../types'

type Citation = Database['public']['Tables']['citations']['Row']
type CitationInsert = Database['public']['Tables']['citations']['Insert']
type CitationUpdate = Database['public']['Tables']['citations']['Update']

export async function getCitationsByLibrary(libraryId: string, userId: string): Promise<Citation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('citations')
    .select('*')
    .eq('library_id', libraryId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCitationsByDocument(documentId: string): Promise<Citation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('citations')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCitationById(id: string, userId: string): Promise<Citation | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('citations')
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

export async function createCitation(citation: CitationInsert): Promise<Citation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('citations')
    .insert(citation)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCitation(
  id: string,
  updates: CitationUpdate,
  userId: string
): Promise<Citation> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('citations')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCitation(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('citations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getAllUserCitations(userId: string): Promise<Citation[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('citations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

