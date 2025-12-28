import { createClient } from '../client'
import type { Database } from '../types'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * Stellt sicher, dass ein Profile für den gegebenen User existiert.
 * Erstellt es, falls es nicht existiert.
 */
export async function ensureProfileExists(userId: string): Promise<Profile> {
  const supabase = createClient()
  
  // Prüfe, ob Profile existiert
  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (existingProfile) {
    return existingProfile
  }

  // Wenn nicht existiert, hole User-Daten von auth.users
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user || user.id !== userId) {
    throw new Error(`User ${userId} nicht gefunden oder nicht authentifiziert`)
  }

  // Erstelle Profile
  const newProfile: ProfileInsert = {
    id: userId,
    email: user.email || null,
    full_name: user.user_metadata?.full_name || user.email || null,
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

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
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
  updates: ProfileUpdate
): Promise<Profile> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

