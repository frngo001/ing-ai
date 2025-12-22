"use client"

import { useEffect, useState } from "react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
import { hasValidConsent } from "@/lib/cookie-consent"

/**
 * Analytics Provider - lädt Analytics nur, wenn der Nutzer zugestimmt hat
 * 
 * Gemäß DSGVO dürfen Tracking-Cookies nur nach ausdrücklicher Zustimmung geladen werden.
 */
export function AnalyticsProvider() {
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    // Prüfe, ob der Nutzer zugestimmt hat
    if (hasValidConsent()) {
      setShouldLoad(true)
    }

    // Höre auf Cookie-Consent-Updates
    const handleConsentUpdate = (event: CustomEvent) => {
      if (event.detail.accepted) {
        setShouldLoad(true)
      }
    }

    window.addEventListener('cookie-consent-updated', handleConsentUpdate as EventListener)

    return () => {
      window.removeEventListener('cookie-consent-updated', handleConsentUpdate as EventListener)
    }
  }, [])

  // Lade Analytics nur, wenn zugestimmt wurde
  if (!shouldLoad) {
    return null
  }

  return (
    <>
      <SpeedInsights />
      <Analytics />
    </>
  )
}

