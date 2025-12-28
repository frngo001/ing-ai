import { createClient } from '../client'

// Cache für User-ID, um mehrfache API-Calls zu vermeiden
let cachedUserId: string | null | undefined = undefined
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 Minuten

/**
 * Ruft die User-ID ab, nutzt zuerst getSession() (kein API-Call) 
 * und cached das Ergebnis für 5 Minuten
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient()
    
    // Prüfe Cache zuerst
    const now = Date.now()
    if (cachedUserId !== undefined && (now - cacheTimestamp) < CACHE_DURATION) {
      return cachedUserId
    }
    
    // Nutze getSession() statt getUser() - liest aus lokalem Storage, kein API-Call
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.warn('⚠️ [AUTH] Fehler beim Abrufen der Session:', {
        message: sessionError.message,
        error: sessionError,
      })
      cachedUserId = null
      cacheTimestamp = now
      return null
    }
    
    const userId = session?.user?.id || null
    
    // Cache aktualisieren
    cachedUserId = userId
    cacheTimestamp = now
    
    return userId
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'object' && error !== null
      ? JSON.stringify(error, Object.getOwnPropertyNames(error))
      : String(error)
    console.warn('⚠️ [AUTH] Unerwarteter Fehler beim Abrufen des Users:', {
      message: errorMessage,
      error,
    })
    cachedUserId = null
    cacheTimestamp = Date.now()
    return null
  }
}

/**
 * Invalidiert den User-ID Cache (z.B. nach Logout)
 */
export function invalidateUserIdCache(): void {
  cachedUserId = undefined
  cacheTimestamp = 0
}

