import { type Language } from '@/lib/i18n/translations'

/**
 * Mapping von Ländercodes (ISO 3166-1 alpha-2) zu unterstützten Sprachen.
 * Fallback auf 'en' wenn kein Mapping vorhanden ist.
 */
export const countryToLanguageMap: Record<string, string> = {
    // Deutschsprachige Länder
    DE: 'de', // Deutschland
    AT: 'de', // Österreich
    CH: 'de', // Schweiz (Hauptsprache Deutsch, auch Französisch/Italienisch)
    LI: 'de', // Liechtenstein
    LU: 'de', // Luxemburg (Hauptsprache Deutsch, auch Französisch)
    
    // Spanischsprachige Länder
    ES: 'es', // Spanien
    MX: 'es', // Mexiko
    AR: 'es', // Argentinien
    CO: 'es', // Kolumbien
    CL: 'es', // Chile
    PE: 'es', // Peru
    VE: 'es', // Venezuela
    EC: 'es', // Ecuador
    GT: 'es', // Guatemala
    CU: 'es', // Kuba
    BO: 'es', // Bolivien
    DO: 'es', // Dominikanische Republik
    HN: 'es', // Honduras
    PY: 'es', // Paraguay
    SV: 'es', // El Salvador
    NI: 'es', // Nicaragua
    CR: 'es', // Costa Rica
    PA: 'es', // Panama
    UY: 'es', // Uruguay
    
    // Französischsprachige Länder
    FR: 'fr', // Frankreich
    BE: 'fr', // Belgien (Hauptsprache Französisch, auch Niederländisch/Deutsch)
    CA: 'fr', // Kanada (Québec - Französisch, auch Englisch)
    MC: 'fr', // Monaco
    SN: 'fr', // Senegal
    CI: 'fr', // Elfenbeinküste
    CM: 'fr', // Kamerun
    MG: 'fr', // Madagaskar
    ML: 'fr', // Mali
    BF: 'fr', // Burkina Faso
    NE: 'fr', // Niger
    TD: 'fr', // Tschad
    GN: 'fr', // Guinea
    RW: 'fr', // Ruanda
    BI: 'fr', // Burundi
    BJ: 'fr', // Benin
    TG: 'fr', // Togo
    CF: 'fr', // Zentralafrikanische Republik
    CG: 'fr', // Republik Kongo
    GA: 'fr', // Gabun
    GQ: 'fr', // Äquatorialguinea
    DJ: 'fr', // Dschibuti
    KM: 'fr', // Komoren
    MR: 'fr', // Mauretanien
    HT: 'fr', // Haiti
    VU: 'fr', // Vanuatu
    NC: 'fr', // Neukaledonien
    PF: 'fr', // Französisch-Polynesien
    PM: 'fr', // Saint-Pierre und Miquelon
    WF: 'fr', // Wallis und Futuna
    YT: 'fr', // Mayotte
    RE: 'fr', // Réunion
    GP: 'fr', // Guadeloupe
    MQ: 'fr', // Martinique
    GF: 'fr', // Französisch-Guayana
    BL: 'fr', // Saint-Barthélemy
    MF: 'fr', // Saint-Martin
    
    // Englischsprachige Länder (Fallback)
    US: 'en', // USA
    GB: 'en', // Großbritannien
    IE: 'en', // Irland
    AU: 'en', // Australien
    NZ: 'en', // Neuseeland
    ZA: 'en', // Südafrika
    // ... weitere englischsprachige Länder verwenden 'en' als Fallback
}

/**
 * Standard-Fallback-Sprache, wenn Geolocation fehlschlägt.
 */
const DEFAULT_FALLBACK_LANGUAGE: Language = 'en'

/**
 * Ermittelt das Land basierend auf der IP-Adresse des Requests.
 * Verwendet eine kostenlose IP-Geolocation API.
 */
export async function getCountryFromIP(ip: string): Promise<string | null> {
    try {
        // Verwende ipapi.co (kostenlos, 1000 Requests/Tag)
        const response = await fetch(`https://ipapi.co/${ip}/country/`, {
            headers: {
                'User-Agent': 'IngAI/1.0',
            },
        })

        if (!response.ok) {
            return null
        }

        const countryCode = (await response.text()).trim()
        
        // Validiere, dass es ein 2-stelliger Ländercode ist
        if (countryCode && countryCode.length === 2) {
            return countryCode.toUpperCase()
        }

        return null
    } catch {
        return null
    }
}

/**
 * Ermittelt die IP-Adresse aus Headers.
 * Berücksichtigt Proxy-Header (X-Forwarded-For, X-Real-IP).
 */
export function getClientIPFromHeaders(headers: Headers): string {
    // Prüfe X-Forwarded-For Header (wird von Proxies/Load Balancern gesetzt)
    const forwardedFor = headers.get('x-forwarded-for')
    if (forwardedFor) {
        // X-Forwarded-For kann mehrere IPs enthalten (Client, Proxy1, Proxy2)
        const ips = forwardedFor.split(',').map(ip => ip.trim())
        return ips[0] || 'unknown'
    }

    // Fallback auf X-Real-IP
    const realIP = headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }

    // Keine IP gefunden
    return 'unknown'
}

/**
 * Ermittelt die Sprache basierend auf Geolocation.
 * Verwendet die IP-Adresse aus Headers, um das Land zu ermitteln.
 */
export async function getLanguageFromGeolocation(headers: Headers): Promise<Language> {
    const clientIP = getClientIPFromHeaders(headers)
    
    // In Entwicklungsumgebung: Verwende Test-IP oder localhost
    if (process.env.NODE_ENV === 'development' && (clientIP === 'unknown' || clientIP === '::1' || clientIP.startsWith('127.'))) {
        // For local development: use English as default (language detection happens in agents)
        return DEFAULT_FALLBACK_LANGUAGE
    }

    const countryCode = await getCountryFromIP(clientIP)
    
    if (!countryCode) {
        return DEFAULT_FALLBACK_LANGUAGE
    }

    // Mappe Land zu Sprache
    const language = countryToLanguageMap[countryCode] || DEFAULT_FALLBACK_LANGUAGE
    return language as Language
}

