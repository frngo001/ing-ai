import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '../client'
import type { Database } from '../types'
import { devLog, devError } from '@/lib/utils/logger'

type Citation = Database['public']['Tables']['citations']['Row']
type CitationInsert = Database['public']['Tables']['citations']['Insert']
type CitationUpdate = Database['public']['Tables']['citations']['Update']
type SupabaseClientType = SupabaseClient<Database>

export async function getCitationsByLibrary(
  libraryId: string,
  userId?: string,
  supabaseClient?: SupabaseClientType
): Promise<Citation[]> {
  const supabase = supabaseClient || createClient()
  let query = supabase
    .from('citations')
    .select('*')
    .eq('library_id', libraryId)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function getCitationsByDocument(
  documentId: string,
  supabaseClient?: SupabaseClientType
): Promise<Citation[]> {
  const supabase = supabaseClient || createClient()
  const { data, error } = await supabase
    .from('citations')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCitationById(
  id: string,
  userId: string,
  supabaseClient?: SupabaseClientType
): Promise<Citation | null> {
  const supabase = supabaseClient || createClient()
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

export async function createCitation(
  citation: CitationInsert,
  supabaseClient?: SupabaseClientType
): Promise<Citation> {
  const supabase = supabaseClient || createClient()

  // Prüfe zuerst, ob die Zitation bereits existiert (mit user_id für RLS)
  if (citation.id && citation.user_id) {
    const { data: existing } = await supabase
      .from('citations')
      .select('*')
      .eq('id', citation.id)
      .eq('user_id', citation.user_id)
      .maybeSingle()

    if (existing) {
      // Zitation existiert bereits - gib sie zurück ohne Update
      // (vermeidet Fehler bei wiederholtem Import)
      return existing
    }
  }

  // Neue Zitation einfügen
  const { data, error } = await supabase
    .from('citations')
    .insert(citation)
    .select()
    .single()

  if (error) {
    // Bei Duplikat-Fehler (Race Condition) hole existierende Zitation
    if (error.code === '23505' && citation.id && citation.user_id) {
      const { data: existingData } = await supabase
        .from('citations')
        .select('*')
        .eq('id', citation.id)
        .eq('user_id', citation.user_id)
        .maybeSingle()

      if (existingData) {
        return existingData
      }
    }
    throw error
  }
  return data
}

export async function updateCitation(
  id: string,
  updates: CitationUpdate,
  userId: string,
  supabaseClient?: SupabaseClientType
): Promise<Citation> {
  const supabase = supabaseClient || createClient()
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

export async function deleteCitation(
  id: string,
  userId: string,
  supabaseClient?: SupabaseClientType
): Promise<void> {
  const supabase = supabaseClient || createClient()
  const { error } = await supabase
    .from('citations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getAllUserCitations(
  userId: string,
  supabaseClient?: SupabaseClientType
): Promise<Citation[]> {
  const supabase = supabaseClient || createClient()
  const { data, error } = await supabase
    .from('citations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Bulk-Import von Zitationen - schnell und effizient
 * Fügt alle Zitationen ein und ignoriert Duplikat-Fehler
 */
export async function bulkCreateCitations(
  citations: CitationInsert[],
  supabaseClient?: SupabaseClientType
): Promise<{ inserted: number; skipped: number }> {
  if (citations.length === 0) {
    return { inserted: 0, skipped: 0 }
  }

  const supabase = supabaseClient || createClient()
  const userId = citations[0].user_id
  const libraryId = citations[0].library_id

  if (!userId) {
    devError('[BULK CREATE] No user_id provided')
    return { inserted: 0, skipped: citations.length }
  }

  // Versuche Batch-Insert - bei Duplikat-Fehlern einzeln einfügen
  const { data, error } = await supabase
    .from('citations')
    .insert(citations)
    .select('id')

  if (!error && data) {
    devLog(`[BULK CREATE] Successfully inserted ${data.length} citations`)
    return { inserted: data.length, skipped: 0 }
  }

  // Bei Fehler (z.B. Duplikate) einzeln einfügen
  devLog('[BULK CREATE] Batch insert failed, trying individual inserts:', error?.message)

  let insertedCount = 0
  let skippedCount = 0

  for (const citation of citations) {
    const { data: singleData, error: singleError } = await supabase
      .from('citations')
      .insert(citation)
      .select('id')
      .maybeSingle()

    if (!singleError && singleData) {
      insertedCount++
    } else if (singleError?.code === '23505') {
      // Duplikat - ignorieren
      skippedCount++
    } else if (singleError) {
      devError('[BULK CREATE] Insert error:', singleError.message)
      skippedCount++
    }
  }

  return { inserted: insertedCount, skipped: skippedCount }
}

