import { NextRequest, NextResponse } from 'next/server'

/**
 * Mapping von Ländercodes (ISO 3166-1 alpha-2) zu unterstützten Sprachen.
 * Fallback auf 'en' wenn kein Mapping vorhanden ist.
 */
const countryToLanguageMap: Record<string, string> = {
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
 * Ermittelt das Land basierend auf der IP-Adresse des Requests.
 * Verwendet eine kostenlose IP-Geolocation API.
 */
async function getCountryFromIP(ip: string): Promise<string | null> {
    try {
        // Verwende ipapi.co (kostenlos, 1000 Requests/Tag)
        const response = await fetch(`https://ipapi.co/${ip}/country/`, {
            headers: {
                'User-Agent': 'IngAI/1.0',
            },
        })

        if (!response.ok) {
            console.warn('[GEOLOCATION] Fehler beim Abrufen des Landes:', response.status)
            return null
        }

        const countryCode = (await response.text()).trim()
        
        // Validiere, dass es ein 2-stelliger Ländercode ist
        if (countryCode && countryCode.length === 2) {
            return countryCode.toUpperCase()
        }

        return null
    } catch (error) {
        console.warn('[GEOLOCATION] Fehler bei IP-Geolocation:', error)
        return null
    }
}

/**
 * Ermittelt die IP-Adresse aus dem Request.
 * Berücksichtigt Proxy-Header (X-Forwarded-For, X-Real-IP).
 */
function getClientIP(request: NextRequest): string {
    // Prüfe X-Forwarded-For Header (wird von Proxies/Load Balancern gesetzt)
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        // X-Forwarded-For kann mehrere IPs enthalten (Client, Proxy1, Proxy2)
        const ips = forwardedFor.split(',').map(ip => ip.trim())
        return ips[0] || 'unknown'
    }

    // Fallback auf X-Real-IP
    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }

    // Keine IP gefunden
    return 'unknown'
}

/**
 * API-Route zur Ermittlung des Landes basierend auf der IP-Adresse.
 * Gibt den Ländercode (ISO 3166-1 alpha-2) zurück.
 */
export async function GET(request: NextRequest) {
    try {
        const clientIP = getClientIP(request)
        
        // In Entwicklungsumgebung: Verwende Test-IP oder localhost
        if (process.env.NODE_ENV === 'development' && (clientIP === 'unknown' || clientIP === '::1' || clientIP.startsWith('127.'))) {
            // Für lokale Entwicklung: Standard auf Deutschland setzen
            return NextResponse.json({ 
                country: 'DE',
                language: 'de',
                source: 'development-default'
            })
        }

        const countryCode = await getCountryFromIP(clientIP)
        
        if (!countryCode) {
            // Fallback auf Standardsprache
            return NextResponse.json({ 
                country: null,
                language: 'en',
                source: 'fallback'
            })
        }

        // Mappe Land zu Sprache
        const language = countryToLanguageMap[countryCode] || 'en'

        return NextResponse.json({ 
            country: countryCode,
            language,
            source: 'geolocation'
        })
    } catch (error) {
        console.error('[GEOLOCATION] Unerwarteter Fehler:', error)
        return NextResponse.json(
            { 
                country: null,
                language: 'en',
                source: 'error-fallback',
                error: 'Fehler bei der Geolocation'
            },
            { status: 500 }
        )
    }
}

