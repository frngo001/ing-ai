"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

const COOKIE_CONSENT_KEY = "cookie-consent"
const COOKIE_CONSENT_EXPIRY_DAYS = 365

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + COOKIE_CONSENT_EXPIRY_DAYS)
    
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        accepted: true,
        timestamp: new Date().toISOString(),
        expiry: expiryDate.toISOString(),
      })
    )
    setShowBanner(false)
  }

  const handleDecline = () => {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + COOKIE_CONSENT_EXPIRY_DAYS)
    
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        accepted: false,
        timestamp: new Date().toISOString(),
        expiry: expiryDate.toISOString(),
      })
    )
    setShowBanner(false)
  }

  if (!mounted) {
    return null
  }

  return (
    <AnimatePresence>
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
          className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
        >
          <div className="container mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">Cookie-Einstellungen</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Wir verwenden Cookies, um dir die bestmögliche Erfahrung zu bieten. 
                      Einige Cookies sind für den Betrieb der Website erforderlich, während 
                      andere uns helfen, diese Website und die Nutzererfahrung zu verbessern. 
                      Durch Klicken auf "Alle akzeptieren" stimmst du der Verwendung aller Cookies zu. 
                      Du kannst deine Einstellungen jederzeit in der{" "}
                      <Link
                        href="/privacy"
                        className="underline underline-offset-4 hover:text-foreground"
                      >
                        Datenschutzerklärung
                      </Link>{" "}
                      ändern.
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={handleDecline}
                    aria-label="Banner schließen"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex shrink-0 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  className="whitespace-nowrap"
                >
                  Ablehnen
                </Button>
                <Button
                  size="sm"
                  onClick={handleAccept}
                  className="whitespace-nowrap"
                >
                  Alle akzeptieren
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

