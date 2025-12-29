import { createClient } from '../client'
import { Database } from '../types'

type UserPreferences = Database['public']['Tables']['user_preferences']['Row']
type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert']
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update']

/**
 * Ruft die User-Präferenzen für einen bestimmten User ab.
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/**
 * Stellt sicher, dass User-Präferenzen für den gegebenen User existieren.
 * Erstellt sie mit Standardwerten, falls sie nicht existieren.
 */
export async function ensureUserPreferencesExist(
  userId: string,
  defaultLanguage: string = 'en'
): Promise<UserPreferences> {
  const supabase = createClient()

  const { data: existingPrefs, error: selectError } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (existingPrefs) {
    return existingPrefs
  }

  const newPrefs: UserPreferencesInsert = {
    user_id: userId,
    language: defaultLanguage,
    default_citation_style: 'apa',
    default_document_type: 'essay',
    theme: 'light',
    ai_autocomplete_enabled: true,
  }

  const { data: prefs, error: insertError } = await supabase
    .from('user_preferences')
    .insert(newPrefs)
    .select()
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      const { data: retryPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (retryPrefs) {
        return retryPrefs
      }
    }
    throw insertError
  }

  if (!prefs) {
    throw new Error('User-Präferenzen konnten nicht erstellt werden')
  }

  return prefs
}

/**
 * Aktualisiert die User-Präferenzen.
 */
export async function updateUserPreferences(
  userId: string,
  updates: UserPreferencesUpdate
): Promise<UserPreferences> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Aktualisiert nur die Spracheinstellung des Users.
 */
export async function updateUserLanguage(
  userId: string,
  language: string
): Promise<UserPreferences> {
  return updateUserPreferences(userId, { language })
}

/**
 * Ruft die Spracheinstellung eines Users ab.
 */
export async function getUserLanguage(userId: string): Promise<string | null> {
  const prefs = await getUserPreferences(userId)
  return prefs?.language ?? null
}

