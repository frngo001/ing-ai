/**
 * Cookie Consent Utility Functions
 * 
 * Diese Funktionen verwalten die Cookie-Zustimmung gemäß DSGVO.
 * Die Zustimmung wird für 1 Jahr gespeichert und sollte regelmäßig erneuert werden.
 */

export const COOKIE_CONSENT_KEY = "cookie-consent"
export const COOKIE_CONSENT_EXPIRY_DAYS = 365 // 1 Jahr

export interface CookieConsentData {
  accepted: boolean
  timestamp: string
  expiry: string
}

/**
 * Prüft, ob eine gültige Cookie-Zustimmung vorhanden ist
 */
export function hasValidConsent(): boolean {
  if (typeof window === "undefined") return false

  try {
    const consentStr = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consentStr) return false

    const consent: CookieConsentData = JSON.parse(consentStr)

    // Prüfe, ob die Zustimmung abgelaufen ist
    if (consent.expiry) {
      const expiryDate = new Date(consent.expiry)
      if (expiryDate < new Date()) {
        // Zustimmung ist abgelaufen - entferne sie
        localStorage.removeItem(COOKIE_CONSENT_KEY)
        return false
      }
    }

    // Nur true zurückgeben, wenn explizit zugestimmt wurde
    return consent.accepted === true
  } catch {
    // Bei Fehler beim Parsen, entferne den Eintrag
    localStorage.removeItem(COOKIE_CONSENT_KEY)
    return false
  }
}

/**
 * Prüft, ob eine Zustimmung vorhanden ist (auch wenn abgelehnt)
 */
export function hasConsentRecord(): boolean {
  if (typeof window === "undefined") return false

  try {
    const consentStr = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consentStr) return false

    const consent: CookieConsentData = JSON.parse(consentStr)

    // Prüfe, ob die Zustimmung abgelaufen ist
    if (consent.expiry) {
      const expiryDate = new Date(consent.expiry)
      if (expiryDate < new Date()) {
        localStorage.removeItem(COOKIE_CONSENT_KEY)
        return false
      }
    }

    return true
  } catch {
    localStorage.removeItem(COOKIE_CONSENT_KEY)
    return false
  }
}

/**
 * Speichert die Cookie-Zustimmung
 */
export function saveConsent(accepted: boolean): void {
  if (typeof window === "undefined") return

  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + COOKIE_CONSENT_EXPIRY_DAYS)

  const consent: CookieConsentData = {
    accepted,
    timestamp: new Date().toISOString(),
    expiry: expiryDate.toISOString(),
  }

  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
}

/**
 * Entfernt die Cookie-Zustimmung
 */
export function removeConsent(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(COOKIE_CONSENT_KEY)
}

