import { createClient } from '../client'
import type { Database } from '../types'
import { ensureProfileExists } from './profiles'

type CitationLibrary = Database['public']['Tables']['citation_libraries']['Row']
type CitationLibraryInsert = Database['public']['Tables']['citation_libraries']['Insert']
type CitationLibraryUpdate = Database['public']['Tables']['citation_libraries']['Update']

export async function getCitationLibraries(userId: string): Promise<CitationLibrary[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('citation_libraries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCitationLibraryById(id: string, userId: string): Promise<CitationLibrary | null> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('citation_libraries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      // Wenn 406 Not Acceptable, versuche Fallback ohne .single()
      if (error.status === 406 || error.message?.includes('406')) {
        console.warn('[CITATION_LIBRARIES] 406 Fehler bei getCitationLibraryById, versuche Fallback')
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('citation_libraries')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .limit(1)
        
        if (fallbackError) {
          if (fallbackError.code === 'PGRST116') return null
          throw fallbackError
        }
        return fallbackData?.[0] || null
      }
      
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  } catch (error: any) {
    // Fallback: Lade alle Bibliotheken und filtere manuell
    if (error.status === 406 || error.message?.includes('406')) {
      console.warn('[CITATION_LIBRARIES] Fallback: Lade alle Bibliotheken und filtere manuell')
      const allLibraries = await getCitationLibraries(userId)
      return allLibraries.find((lib) => lib.id === id) || null
    }
    throw error
  }
}

export async function createCitationLibrary(
  library: CitationLibraryInsert
): Promise<CitationLibrary> {
  const supabase = createClient()
  
  // Stelle sicher, dass ein Profile existiert, bevor wir versuchen, eine Bibliothek zu erstellen
  if (library.user_id) {
    try {
      await ensureProfileExists(library.user_id)
    } catch (error: any) {
      // Wenn Profile nicht erstellt werden kann, ist das ein kritisches Problem
      console.error('[CITATION_LIBRARIES] Fehler beim Erstellen des Profiles:', error)
      throw new Error(`Profile für User ${library.user_id} konnte nicht erstellt werden: ${error.message}`)
    }
  }
  
  try {
    // Verwende direkt .limit(1) statt .single() um 406-Fehler zu vermeiden
    const { data, error } = await supabase
      .from('citation_libraries')
      .insert(library)
      .select()
      .limit(1)

    if (error) {
      // 23503 = Foreign Key Constraint Violation (Profile existiert nicht)
      if (error.code === '23503') {
        // Versuche Profile zu erstellen und dann nochmal
        if (library.user_id) {
          await ensureProfileExists(library.user_id)
          // Retry nach Profile-Erstellung
          const { data: retryData, error: retryError } = await supabase
            .from('citation_libraries')
            .insert(library)
            .select()
            .limit(1)
          
          if (retryError) {
            // Wenn immer noch Fehler, prüfe auf 409
            if (retryError.code === '23505' || retryError.status === 409) {
              if (library.is_default && library.user_id) {
                const defaultLib = await getDefaultCitationLibrary(library.user_id)
                if (defaultLib) return defaultLib
              }
            }
            throw retryError
          }
          
          if (retryData && retryData.length > 0) {
            return retryData[0]
          }
        }
        throw new Error(`Foreign Key Constraint: Profile für User ${library.user_id} existiert nicht`)
      }
      
      // 409 Conflict bedeutet, dass die Bibliothek bereits existiert (durch Unique Constraint)
      if (error.code === '23505' || error.status === 409) {
        // Versuche die existierende Bibliothek zu finden
        if (library.is_default && library.user_id) {
          const defaultLib = await getDefaultCitationLibrary(library.user_id)
          if (defaultLib) return defaultLib
        }
        
        // Ansonsten suche nach Name
        if (library.name && library.user_id) {
          const existing = await getCitationLibraries(library.user_id)
          const found = existing.find((lib) => lib.name === library.name)
          if (found) return found
        }
        
        // Falls nicht gefunden, lade alle und suche nach is_default
        if (library.user_id) {
          const allLibs = await getCitationLibraries(library.user_id)
          if (library.is_default) {
            const found = allLibs.find((lib) => lib.is_default === true)
            if (found) return found
          }
        }
        
        throw new Error(`Bibliothek existiert bereits: ${library.name || 'Unbekannt'}`)
      }
      throw error
    }
    
    if (!data || data.length === 0) {
      throw new Error('Bibliothek konnte nicht erstellt werden')
    }
    
    return data[0]
  } catch (error: any) {
    // Bei 409-Fehler, versuche nochmal die Bibliothek zu laden
    if (error.code === '23505' || error.status === 409) {
      if (library.is_default && library.user_id) {
        const defaultLib = await getDefaultCitationLibrary(library.user_id)
        if (defaultLib) return defaultLib
        
        // Letzter Versuch: Lade alle Bibliotheken
        const allLibs = await getCitationLibraries(library.user_id)
        const found = allLibs.find((lib) => lib.is_default === true)
        if (found) return found
      }
    }
    throw error
  }
}

export async function updateCitationLibrary(
  id: string,
  updates: CitationLibraryUpdate,
  userId: string
): Promise<CitationLibrary> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('citation_libraries')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCitationLibrary(id: string, userId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('citation_libraries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export async function getDefaultCitationLibrary(userId: string): Promise<CitationLibrary | null> {
  const supabase = createClient()
  
  // Verwende direkt .limit(1) statt .single() um 406-Fehler zu vermeiden
  // Dies ist effizienter als erst .single() zu versuchen und dann zu fallbacken
  try {
    const { data, error } = await supabase
      .from('citation_libraries')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .limit(1)

    if (error) {
      // Wenn keine Daten gefunden, ist das OK
      if (error.code === 'PGRST116') return null
      throw error
    }
    
    return data?.[0] || null
  } catch (error: any) {
    // Fallback: Lade alle Bibliotheken und filtere manuell
    if (error.status === 406 || error.message?.includes('406') || error.code === 'PGRST116') {
      const allLibraries = await getCitationLibraries(userId)
      return allLibraries.find((lib) => lib.is_default === true) || null
    }
    throw error
  }
}

