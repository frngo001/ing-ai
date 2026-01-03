import { NextRequest, NextResponse } from 'next/server'
import { devWarn, devError } from '@/lib/utils/logger'
import { getCountryFromIP, getClientIPFromHeaders, countryToLanguageMap } from '@/lib/geolocation/language'

/**
 * Ermittelt die IP-Adresse aus dem Request.
 * Berücksichtigt Proxy-Header (X-Forwarded-For, X-Real-IP).
 */
function getClientIP(request: NextRequest): string {
    return getClientIPFromHeaders(request.headers)
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
        const language = (countryToLanguageMap[countryCode] || 'en') as string

        return NextResponse.json({ 
            country: countryCode,
            language,
            source: 'geolocation'
        })
    } catch (error) {
        devError('[GEOLOCATION] Unerwarteter Fehler:', error)
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

