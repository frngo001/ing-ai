"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { hasConsentRecord, saveConsent } from "@/lib/cookie-consent"

/**
 * Cookie Consent Banner
 * 
 * Zeigt ein Cookie-Banner an, wenn noch keine gültige Zustimmung vorhanden ist.
 * Gemäß DSGVO muss der Banner auf allen Seiten sichtbar sein.
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  useEffect(() => {
    // Warte bis Client-Side gerendert wird
    setMounted(true)
    
    // Erstelle einen separaten Container außerhalb des body, um das filter-Problem zu umgehen
    if (typeof window !== "undefined") {
      let container = document.getElementById('cookie-consent-portal')
      if (!container) {
        container = document.createElement('div')
        container.id = 'cookie-consent-portal'
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 0; height: 0; pointer-events: none; z-index: 2147483647;'
        document.documentElement.appendChild(container)
      }
      setPortalContainer(container)
    }
    
    // Prüfe, ob bereits eine gültige Zustimmung vorhanden ist
    const consentStatus = hasConsentRecord()
    setHasConsent(consentStatus)
    
    // Zeige Banner nur, wenn keine Zustimmung vorhanden ist
    if (!consentStatus) {
      setShowBanner(true)
    }

    return () => {
      // Cleanup: Entferne Container beim Unmount
      if (typeof window !== "undefined") {
        const container = document.getElementById('cookie-consent-portal')
        if (container && container.parentNode) {
          container.parentNode.removeChild(container)
        }
      }
    }
  }, [])

  const handleAccept = () => {
    saveConsent(true)
    setHasConsent(true)
    setShowBanner(false)
    // Dispatch ein Event, damit AnalyticsProvider reagieren kann
    window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: { accepted: true } }))
  }

  const handleDecline = () => {
    saveConsent(false)
    setHasConsent(false)
    setShowBanner(false)
  }

  const handleClose = () => {
    setShowBanner(false)
  }

  if (!mounted || !portalContainer) {
    return null
  }

  // Cookie-Banner Content
  const bannerContent = (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 2147483647,
        pointerEvents: showBanner ? 'auto' : 'none',
        margin: 0,
        padding: 0,
      }}
    >
      <AnimatePresence mode="wait">
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 200,
            }}
            style={{
              position: 'relative',
              width: '100%',
              backgroundColor: 'hsl(var(--background))',
              borderTop: '2px solid hsl(var(--border))',
              boxShadow: '0 -8px 24px -4px rgba(0, 0, 0, 0.12), 0 -2px 8px -2px rgba(0, 0, 0, 0.08)',
              margin: 0,
              padding: 0,
            }}
            className="backdrop-blur-md supports-[backdrop-filter]:bg-background/95"
          >
            <div className="container mx-auto max-w-7xl px-6 py-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-base font-semibold leading-tight tracking-tight">
                        Cookie-Einstellungen
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-3xl">
                        Wir verwenden Cookies, um dir die bestmögliche Erfahrung zu bieten. 
                        Einige Cookies sind für den Betrieb der Website erforderlich, während 
                        andere uns helfen, diese Website und die Nutzererfahrung zu verbessern. 
                        Durch Klicken auf "Alle akzeptieren" stimmst du der Verwendung aller Cookies zu. 
                        Du kannst deine Einstellungen jederzeit in der{" "}
                        <Link
                          href="/privacy"
                          className="font-medium underline underline-offset-4 hover:text-foreground transition-colors"
                        >
                          Datenschutzerklärung
                        </Link>{" "}
                        ändern.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={handleClose}
                      aria-label="Banner schließen"
                    >
                      Schließen
                    </Button>
                  </div>
                </div>
                <div className="flex shrink-0 gap-3 md:flex-col md:items-stretch md:w-40">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={handleDecline}
                    className="whitespace-nowrap font-medium transition-all hover:bg-accent/50"
                  >
                    Ablehnen
                  </Button>
                  <Button
                    size="default"
                    onClick={handleAccept}
                    className="whitespace-nowrap font-medium transition-all"
                  >
                    Alle akzeptieren
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // Cookie-Einstellungen-Button Content - nicht anzeigen, wenn bereits akzeptiert wurde
  const buttonContent = null

  // Rendere in einen Container außerhalb des body, um das filter-Problem zu umgehen
  return (
    <>
      {createPortal(bannerContent, portalContainer)}
      {createPortal(buttonContent, portalContainer)}
    </>
  )
}
