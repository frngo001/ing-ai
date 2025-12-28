"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { invalidateUserIdCache } from "@/lib/supabase/utils/auth"

/**
 * Hook zum Prüfen des Authentifizierungsstatus
 * Nutzt getSession() statt getUser() um API-Calls zu vermeiden
 * @returns {boolean} true wenn der User eingeloggt ist, false wenn nicht
 */
export function useIsAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Nutze getSession() statt getUser() - kein API-Call
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setIsAuthenticated(!!session?.user)
      } catch (error) {
        console.error("Auth check error:", error)
        setIsAuthenticated(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
      // Cache invalidieren bei Auth-Änderungen
      invalidateUserIdCache()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return isAuthenticated
}

/**
 * Hook der die User-ID cached zurückgibt
 * Nutzt getSession() statt getUser() um API-Calls zu vermeiden
 * @returns {string | null} User-ID oder null wenn nicht eingeloggt
 */
export function useCurrentUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadUserId = async () => {
      try {
        // Nutze getSession() statt getUser() - kein API-Call
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUserId(session?.user?.id || null)
      } catch (error) {
        console.error("Error loading user ID:", error)
        setUserId(null)
      }
    }

    loadUserId()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null)
      // Cache invalidieren bei Auth-Änderungen
      invalidateUserIdCache()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return userId
}

/**
 * Hook der die richtige CTA-URL basierend auf dem Auth-Status zurückgibt
 * @returns {string} "/editor" wenn eingeloggt, "/auth/login" wenn nicht
 */
export function useCTAHref() {
  const isAuthenticated = useIsAuthenticated()
  
  // Während des Ladens, default zu login (konservativer Ansatz)
  if (isAuthenticated === null) {
    return "/auth/login"
  }
  
  return isAuthenticated ? "/editor" : "/auth/login"
}

