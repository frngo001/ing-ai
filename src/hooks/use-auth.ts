"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Hook zum Prüfen des Authentifizierungsstatus
 * @returns {boolean} true wenn der User eingeloggt ist, false wenn nicht
 */
export function useIsAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setIsAuthenticated(!!user)
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
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return isAuthenticated
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

