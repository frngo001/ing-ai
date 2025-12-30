import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '../client'
import type { Database } from '../types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type SupabaseClientType = SupabaseClient<Database>

/**
 * Stellt sicher, dass ein Profile für den gegebenen User existiert.
 * Erstellt es, falls es nicht existiert.
 * 
 * @param userId - Die User-ID
 * @param supabaseClient - Optionaler Supabase-Client. Wenn nicht übergeben, wird der Browser-Client verwendet.
 *                         In API-Routes sollte der Server-Client übergeben werden für korrekten Auth-Kontext.
 */
export async function ensureProfileExists(
  userId: string,
  supabaseClient?: SupabaseClientType
): Promise<Profile> {
  const supabase = supabaseClient || createClient()
  
  // Prüfe, ob Profile existiert
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existingProfile) {
    return existingProfile
  }

  // Versuche User-Daten von auth.getUser() zu holen (funktioniert im Client-Kontext)
  let email: string | null = null
  let fullName: string | null = null
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && user.id === userId) {
      email = user.email || null
      fullName = user.user_metadata?.full_name || user.email || null
    }
  } catch {
    // Auth nicht verfügbar (z.B. in API-Route ohne Cookie-Kontext)
    // Wir erstellen das Profile trotzdem mit minimalen Daten
  }

  // Erstelle Profile mit verfügbaren Daten
  const newProfile: ProfileInsert = {
    id: userId,
    email,
    full_name: fullName,
  }

  const { data: profile, error: insertError } = await supabase
    .from('profiles')
    .insert(newProfile)
    .select()
    .single()

  if (insertError) {
    // Wenn 23505 (Unique Constraint), wurde es zwischenzeitlich erstellt
    if (insertError.code === '23505') {
      const { data: retryProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (retryProfile) {
        return retryProfile
      }
    }
    throw insertError
  }

  if (!profile) {
    throw new Error('Profile konnte nicht erstellt werden')
  }

  return profile
}

export async function getProfile(
  userId: string,
  supabaseClient?: SupabaseClientType
): Promise<Profile | null> {
  const supabase = supabaseClient || createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function updateProfile(
  userId: string,
  updates: ProfileUpdate,
  supabaseClient?: SupabaseClientType
): Promise<Profile> {
  const supabase = supabaseClient || createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

