import type { NextRequest } from 'next/server'
import { Buffer } from 'node:buffer'
import { Experimental_Agent as Agent, stepCountIs, tool, generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { SourceFetcher } from '@/lib/sources/source-fetcher'
import type { NormalizedSource } from '@/lib/sources/types'
import { BACHELORARBEIT_AGENT_PROMPT } from './prompts'

// Edge Runtime hat Probleme mit Tool-Ergebnis-Serialisierung
// Wechsel zu Node.js Runtime für bessere Tool-Call-Verarbeitung
export const runtime = 'nodejs'

// Helper: Quellen nach Relevanz, Impact-Faktor und Zitaten sortieren
function analyzeAndRankSources(
  sources: NormalizedSource[],
  thema: string,
  keywords: string[]
): Array<NormalizedSource & { relevanceScore: number; rankingScore: number }> {
  const themaLower = thema.toLowerCase()
  const keywordsLower = keywords.map((k) => k.toLowerCase())

  // Extrahiere wichtige Begriffe aus dem Thema
  const themaWords = themaLower
    .split(/\s+/)
    .filter((w) => w.length > 3) // Nur Wörter länger als 3 Zeichen
    .filter((w) => !['von', 'aus', 'der', 'die', 'das', 'und', 'oder'].includes(w))

  console.log('🔍 [AGENT DEBUG] Relevanz-Analyse:', {
    thema,
    themaWords,
    keywords,
    sourcesCount: sources.length,
  })

  return sources
    .map((source) => {
      let relevanceScore = 0
      const titleLower = source.title?.toLowerCase() || ''
      const abstractLower = source.abstract?.toLowerCase() || ''

      // Titel-Relevanz (höchste Gewichtung)
      // Prüfe auf exakte Thema-Matches
      if (themaWords.some((word) => titleLower.includes(word))) {
        relevanceScore += 30
      }
      // Prüfe auf Keyword-Matches
      keywordsLower.forEach((keyword) => {
        if (titleLower.includes(keyword.toLowerCase())) {
          relevanceScore += 20 // Erhöht von 15 auf 20
        }
      })
      // Bonus für mehrere Keyword-Matches
      const keywordMatches = keywordsLower.filter((k) => titleLower.includes(k.toLowerCase())).length
      if (keywordMatches > 1) {
        relevanceScore += 10 * (keywordMatches - 1) // Bonus für mehrere Matches
      }

      // Abstract-Relevanz
      if (themaWords.some((word) => abstractLower.includes(word))) {
        relevanceScore += 20
      }
      keywordsLower.forEach((keyword) => {
        if (abstractLower.includes(keyword.toLowerCase())) {
          relevanceScore += 10
        }
      })

      // Keywords-Relevanz
      source.keywords?.forEach((keyword) => {
        const kwLower = keyword.toLowerCase()
        if (keywordsLower.some((k) => kwLower.includes(k.toLowerCase()) || k.toLowerCase().includes(kwLower))) {
          relevanceScore += 10
        }
      })

      // Penalty für offensichtlich irrelevante Quellen
      const irrelevantTerms = ['solar', 'energy', 'renewable', 'photovoltaic']
      if (irrelevantTerms.some((term) => titleLower.includes(term) && !keywordsLower.some((k) => k.includes(term)))) {
        relevanceScore -= 50 // Starker Penalty
      }

      // Impact-Faktor (wenn verfügbar)
      const impactScore = source.impactFactor ? source.impactFactor * 2 : 0

      // Zitationsanzahl (normalisiert)
      const citationScore = source.citationCount
        ? Math.min(source.citationCount / 10, 20) // Max 20 Punkte
        : 0

      // Open Access Bonus
      const openAccessBonus = source.isOpenAccess ? 5 : 0

      // Vollständigkeit der Metadaten
      const completenessBonus = source.completeness * 5

      // Gesamt-Ranking-Score
      const rankingScore =
        relevanceScore + impactScore + citationScore + openAccessBonus + completenessBonus

      return {
        ...source,
        relevanceScore,
        rankingScore,
      }
    })
    .sort((a, b) => b.rankingScore - a.rankingScore)
}

// Tool: Quellen suchen und automatisch analysieren
const searchSourcesTool = tool({
  description:
    'Suche nach wissenschaftlichen Quellen für die Literaturrecherche. Durchsucht 14+ Datenbanken parallel und analysiert automatisch die besten Quellen. GIB IMMER das Thema mit an für die automatische Analyse!',
  inputSchema: z.object({
    query: z.string().describe('Suchbegriff oder Thema'),
    thema: z.string().describe('Thema der Arbeit (für Relevanz-Bewertung bei autoAnalyze)'),
    type: z
      .enum(['keyword', 'title', 'author', 'doi'])
      .optional()
      .describe('Suchtyp (Standard: keyword)'),
    limit: z.number().min(10).max(100).optional().describe('Anzahl der Suchergebnisse (Standard: 50)'),
    keywords: z
      .array(z.string())
      .optional()
      .describe('Zusätzliche Keywords für bessere Relevanz'),
    autoAnalyze: z
      .boolean()
      .optional()
      .describe('Automatisch die besten Quellen analysieren und auswählen (Standard: true)'),
    maxResults: z
      .number()
      .min(10)
      .max(50)
      .optional()
      .describe('Maximale Anzahl analysierter und ausgewählter Quellen (Standard: 30)'),
    preferHighImpact: z
      .boolean()
      .optional()
      .describe('Bevorzuge Quellen mit hohem Impact-Faktor (Standard: true)'),
    preferHighCitations: z
      .boolean()
      .optional()
      .describe('Bevorzuge Quellen mit vielen Zitaten (Standard: true)'),
  }),
  execute: async ({
    query,
    thema,
    type = 'keyword',
    limit = 50,
    keywords = [],
    autoAnalyze = true,
    maxResults = 30,
    preferHighImpact = true,
    preferHighCitations = true,
  }) => {
    console.log('🔍 [AGENT DEBUG] searchSources Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Parameter:', {
      query,
      thema,
      type,
      limit,
      keywords,
      autoAnalyze,
      maxResults,
      preferHighImpact,
      preferHighCitations,
    })

    try {
      const fetcher = new SourceFetcher({
        maxParallelRequests: 5,
        useCache: true,
        excludedApis: [
          'semanticscholar', // HTTP 400 Fehler
          'biorxiv', // Unterstützt keine Keyword-Suche
          'arxiv', // XML-Parsing-Fehler
          'opencitations', // Nur DOI-basierte Suche
          'zenodo', // HTTP 400 Fehler
          'pubmed', // XML-Parsing-Fehler (xmlText.match is not a function)
        ],
      })

      console.log('🔎 [AGENT DEBUG] Starte Quellensuche...')
      console.log('🔍 [AGENT DEBUG] Suchparameter:', {
        query,
        type,
        limit,
        keywordsCount: keywords.length,
        keywords: keywords.slice(0, 5), // Erste 5 Keywords
      })
      const startTime = Date.now()

      const results = await fetcher.search({
        query,
        type,
        limit,
      })

      const searchTime = Date.now() - startTime
      console.log('✅ [AGENT DEBUG] Quellensuche abgeschlossen')
      // Filter undefined APIs
      const validApis = results.apis?.filter((api): api is string => typeof api === 'string' && api.length > 0) || []

      console.log('📊 [AGENT DEBUG] Suchergebnisse:', {
        totalResults: results.totalResults,
        sourcesFound: results.sources.length,
        apis: validApis,
        apisCount: validApis.length,
        searchTime: `${searchTime}ms`,
      })

      // Automatische Analyse durchführen, wenn aktiviert
      if (autoAnalyze && thema) {
        console.log('🔬 [AGENT DEBUG] Starte automatische Quellenanalyse...')
        const analysisStartTime = Date.now()

        // Quellen analysieren und ranken
        const analyzed = analyzeAndRankSources(results.sources as NormalizedSource[], thema, keywords)

        console.log('📈 [AGENT DEBUG] Analyse-Ergebnisse:', {
          totalAnalyzed: analyzed.length,
          topRelevanceScore: analyzed[0]?.relevanceScore || 0,
          topRankingScore: analyzed[0]?.rankingScore || 0,
        })

        // Filter anwenden (minRelevanceScore: 20 statt 30 für mehr Ergebnisse)
        let filtered = analyzed.filter((s) => s.relevanceScore >= 20)
        console.log(`🔍 [AGENT DEBUG] Nach Relevanz-Filter (>=20): ${filtered.length} Quellen`)

        // Zusätzliche Filter basierend auf Präferenzen
        if (preferHighImpact) {
          filtered = filtered.sort((a, b) => {
            const impactA = a.impactFactor || 0
            const impactB = b.impactFactor || 0
            if (impactB !== impactA) return impactB - impactA
            return b.rankingScore - a.rankingScore
          })
        }

        if (preferHighCitations) {
          filtered = filtered.sort((a, b) => {
            const citationsA = a.citationCount || 0
            const citationsB = b.citationCount || 0
            if (citationsB !== citationsA) return citationsB - citationsA
            return b.rankingScore - a.rankingScore
          })
        }

        // Top Ergebnisse auswählen - REDUZIERT auf 15 für bessere Serialisierung
        const maxSelected = Math.min(maxResults, 15)
        const selected = filtered.slice(0, maxSelected)
        console.log(`🎯 [AGENT DEBUG] Top ${selected.length} Quellen ausgewählt (reduziert von ${filtered.length})`)

        // Begründung für jede Quelle generieren
        // WICHTIG: Vereinfache die Datenstruktur für bessere Serialisierung
        const selectedWithReason = selected.map((source) => {
          // Vereinfache Autoren-Array zu String (max 200 Zeichen)
          const authorsString = source.authors
            ?.map((a) => a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim())
            .filter(Boolean)
            .join(', ') || 'Unbekannt'

          // Kürze Autoren-String falls zu lang
          const authorsShort = authorsString.length > 200
            ? authorsString.substring(0, 197) + '...'
            : authorsString

          // Kürze Titel falls zu lang
          const titleShort = (source.title || 'Ohne Titel').length > 200
            ? (source.title || 'Ohne Titel').substring(0, 197) + '...'
            : (source.title || 'Ohne Titel')

          // Vereinfachte Begründung (max 150 Zeichen)
          const reasonShort = generateSourceReason(source, thema)
          const reason = reasonShort.length > 150
            ? reasonShort.substring(0, 147) + '...'
            : reasonShort

          return {
            id: source.id || `src-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: titleShort,
            authors: authorsShort,
            year: source.publicationYear || null,
            doi: source.doi || null,
            url: source.url || null,
            citationCount: source.citationCount || 0,
            impactFactor: source.impactFactor || null,
            relevanceScore: source.relevanceScore || 0,
            rankingScore: Math.round(source.rankingScore * 100) / 100, // Runde auf 2 Dezimalstellen
            reason: reason,
          }
        })

        const analysisTime = Date.now() - analysisStartTime
        console.log('✅ [AGENT DEBUG] Automatische Analyse abgeschlossen in', analysisTime + 'ms')
        console.log('📊 [AGENT DEBUG] Analyse-Statistiken:', {
          totalAnalyzed: analyzed.length,
          totalSelected: selectedWithReason.length,
          avgRelevanceScore: selected.reduce((sum, s) => sum + s.relevanceScore, 0) / selected.length,
          top3Sources: selectedWithReason.slice(0, 3).map(s => ({
            title: s.title?.substring(0, 60) + '...',
            relevance: s.relevanceScore,
            impact: s.impactFactor,
            citations: s.citationCount,
          })),
        })

        // WICHTIG: Vereinfache das Response-Objekt für bessere Serialisierung
        // Entferne komplexe verschachtelte Objekte, die Probleme verursachen könnten
        const response = {
          success: true,
          totalResults: results.totalResults,
          sourcesFound: results.sources.length,
          selected: selectedWithReason, // Array mit vereinfachten Quellen-Objekten
          totalSelected: selectedWithReason.length,
          message: `Ich habe ${selectedWithReason.length} relevante Quellen für dein Thema gefunden und analysiert. Bitte präsentiere diese Quellen dem Studenten in einer übersichtlichen Liste mit Titel, Autoren, Jahr, Zitationsanzahl und Begründung.`,
          apis: validApis,
          searchTime: results.searchTime,
          analysisTime: `${analysisTime}ms`,
          // Vereinfachte Statistiken (nur Zahlen, keine komplexen Berechnungen)
          statistics: {
            avgRelevanceScore: selected.length > 0
              ? Math.round((selected.reduce((sum, s) => sum + s.relevanceScore, 0) / selected.length) * 100) / 100
              : 0,
            avgCitationCount: selected.length > 0
              ? Math.round((selected.reduce((sum, s) => sum + (s.citationCount || 0), 0) / selected.length) * 100) / 100
              : 0,
            highImpactCount: selected.filter((s) => (s.impactFactor || 0) > 5).length,
            highCitationCount: selected.filter((s) => (s.citationCount || 0) > 50).length,
          },
        }

        console.log('📤 [AGENT DEBUG] searchSources Response (mit Analyse):', {
          success: response.success,
          totalResults: response.totalResults,
          sourcesFound: response.sourcesFound,
          totalSelected: response.totalSelected,
          topSourceTitle: response.selected[0]?.title?.substring(0, 60) + '...',
          responseKeys: Object.keys(response),
          selectedIsArray: Array.isArray(response.selected),
        })

        // KRITISCH: Prüfe ob das Response-Objekt korrekt ist BEVOR wir es zurückgeben
        try {
          // Teste ob das Response-Objekt korrekt serialisiert werden kann
          const testReturn = JSON.parse(JSON.stringify(response))

          // Prüfe ob alle wichtigen Felder vorhanden sind
          if (!testReturn.selected || !Array.isArray(testReturn.selected)) {
            console.error('❌ [AGENT DEBUG] FEHLER: selected ist kein Array!')
            throw new Error('selected muss ein Array sein')
          }

          if (testReturn.selected.length === 0) {
            console.warn('⚠️  [AGENT DEBUG] WARNUNG: selected Array ist leer!')
          }

          console.log('✅ [AGENT DEBUG] Response-Objekt ist gültig und wird zurückgegeben')
          return testReturn
        } catch (returnError) {
          console.error('❌ [AGENT DEBUG] KRITISCHER FEHLER beim Return des Response-Objekts:', returnError)
          // Fallback: Gebe ein vereinfachtes Response-Objekt zurück
          const fallbackResponse = {
            success: true,
            totalResults: results.totalResults,
            sourcesFound: results.sources.length,
            selected: selectedWithReason.slice(0, 10), // Nur erste 10 Quellen als Fallback
            totalSelected: Math.min(selectedWithReason.length, 10),
            message: `Ich habe ${selectedWithReason.length} relevante Quellen gefunden. Bitte präsentiere diese Quellen.`,
          }
          console.log('🔄 [AGENT DEBUG] Verwende Fallback-Response:', {
            selectedCount: fallbackResponse.selected.length,
          })
          return fallbackResponse
        }
      }

      // Ohne automatische Analyse
      const response = {
        success: true,
        totalResults: results.totalResults,
        sources: results.sources.slice(0, limit),
        apis: validApis,
        searchTime: results.searchTime,
      }

      console.log('📤 [AGENT DEBUG] searchSources Response (ohne Analyse):', {
        success: response.success,
        totalResults: response.totalResults,
        sourcesCount: response.sources.length,
      })

      return response
    } catch (error) {
      console.error('❌ [AGENT DEBUG] Source search error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

// Tool: Quellen analysieren und die besten auswählen
const analyzeSourcesTool = tool({
  description:
    'Analysiere gefundene Quellen nach Relevanz, Impact-Faktor und Zitaten. Wählt die besten Quellen aus.',
  inputSchema: z.object({
    sources: z
      .array(z.object({}).passthrough())
      .describe('Array von Quellen-Objekten (von searchSources)'),
    thema: z.string().describe('Thema der Arbeit für Relevanz-Bewertung'),
    keywords: z
      .array(z.string())
      .optional()
      .describe('Keywords für Relevanz-Bewertung'),
    minRelevanceScore: z
      .number()
      .optional()
      .describe('Minimale Relevanz-Score für Auswahl (Standard: 30)'),
    preferHighImpact: z
      .boolean()
      .optional()
      .describe('Bevorzuge Quellen mit hohem Impact-Faktor (Standard: false)'),
    preferHighCitations: z
      .boolean()
      .optional()
      .describe('Bevorzuge Quellen mit vielen Zitaten (Standard: true)'),
    maxResults: z.number().min(10).max(50).optional().describe('Maximale Anzahl ausgewählter Quellen (Standard: 30)'),
  }),
  execute: async ({
    sources,
    thema,
    keywords = [],
    minRelevanceScore = 30,
    preferHighImpact = false,
    preferHighCitations = true,
    maxResults = 30,
  }) => {
    console.log('🔬 [AGENT DEBUG] analyzeSources Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Parameter:', {
      sourcesCount: sources?.length || 0,
      thema,
      keywords,
      minRelevanceScore,
      preferHighImpact,
      preferHighCitations,
      maxResults,
    })

    try {
      console.log('🧮 [AGENT DEBUG] Starte Quellenanalyse...')
      const startTime = Date.now()

      // Quellen analysieren und ranken
      const analyzed = analyzeAndRankSources(sources as unknown as NormalizedSource[], thema, keywords)

      console.log('📈 [AGENT DEBUG] Analyse-Ergebnisse:', {
        totalAnalyzed: analyzed.length,
        topRelevanceScore: analyzed[0]?.relevanceScore || 0,
        topRankingScore: analyzed[0]?.rankingScore || 0,
        sourcesWithHighImpact: analyzed.filter((s) => (s.impactFactor || 0) > 5).length,
        sourcesWithHighCitations: analyzed.filter((s) => (s.citationCount || 0) > 50).length,
      })

      // Filter anwenden
      let filtered = analyzed.filter((s) => s.relevanceScore >= minRelevanceScore)
      console.log(`🔍 [AGENT DEBUG] Nach Relevanz-Filter (>=${minRelevanceScore}): ${filtered.length} Quellen`)

      // Zusätzliche Filter basierend auf Präferenzen
      if (preferHighImpact) {
        console.log('⭐ [AGENT DEBUG] Sortiere nach Impact-Faktor...')
        filtered = filtered.sort((a, b) => {
          const impactA = a.impactFactor || 0
          const impactB = b.impactFactor || 0
          if (impactB !== impactA) return impactB - impactA
          return b.rankingScore - a.rankingScore
        })
        console.log('⭐ [AGENT DEBUG] Impact-Sortierung:', {
          topImpact: filtered[0]?.impactFactor || 0,
          sourcesWithImpact: filtered.filter((s) => s.impactFactor).length,
        })
      }

      if (preferHighCitations) {
        console.log('📚 [AGENT DEBUG] Sortiere nach Zitationsanzahl...')
        filtered = filtered.sort((a, b) => {
          const citationsA = a.citationCount || 0
          const citationsB = b.citationCount || 0
          if (citationsB !== citationsA) return citationsB - citationsA
          return b.rankingScore - a.rankingScore
        })
        console.log('📚 [AGENT DEBUG] Citation-Sortierung:', {
          topCitations: filtered[0]?.citationCount || 0,
          sourcesWithCitations: filtered.filter((s) => s.citationCount).length,
        })
      }

      // Top Ergebnisse auswählen
      const selected = filtered.slice(0, maxResults)
      console.log(`🎯 [AGENT DEBUG] Top ${selected.length} Quellen ausgewählt`)
      console.log('🎯 [AGENT DEBUG] Top 3 Quellen:', selected.slice(0, 3).map((s, idx) => ({
        rank: idx + 1,
        title: s.title?.substring(0, 60) + '...',
        relevanceScore: s.relevanceScore,
        rankingScore: s.rankingScore,
        impactFactor: s.impactFactor,
        citations: s.citationCount,
      })))

      // Begründung für jede Quelle generieren
      const selectedWithReason = selected.map((source) => ({
        id: source.id,
        title: source.title,
        authors: source.authors?.map((a) => a.fullName || `${a.firstName} ${a.lastName}`).filter(Boolean),
        year: source.publicationYear,
        doi: source.doi,
        url: source.url,
        citationCount: source.citationCount,
        impactFactor: source.impactFactor,
        relevanceScore: source.relevanceScore,
        rankingScore: source.rankingScore,
        reason: generateSourceReason(source, thema),
      }))

      const analysisTime = Date.now() - startTime
      const statistics = {
        avgRelevanceScore: selected.reduce((sum, s) => sum + s.relevanceScore, 0) / selected.length,
        avgCitationCount: selected.reduce((sum, s) => sum + (s.citationCount || 0), 0) / selected.length,
        avgImpactFactor: selected
          .filter((s) => s.impactFactor)
          .reduce((sum, s) => sum + (s.impactFactor || 0), 0) / selected.filter((s) => s.impactFactor).length,
        highImpactCount: selected.filter((s) => (s.impactFactor || 0) > 5).length,
        highCitationCount: selected.filter((s) => (s.citationCount || 0) > 50).length,
      }

      console.log('✅ [AGENT DEBUG] Quellenanalyse abgeschlossen')
      console.log('📊 [AGENT DEBUG] Finale Statistiken:', {
        ...statistics,
        analysisTime: `${analysisTime}ms`,
        topSources: selectedWithReason.slice(0, 3).map((s) => ({
          title: s.title?.substring(0, 50) + '...',
          relevanceScore: s.relevanceScore,
          impactFactor: s.impactFactor,
          citations: s.citationCount,
          reason: s.reason,
        })),
      })

      const response = {
        success: true,
        selected: selectedWithReason,
        totalAnalyzed: analyzed.length,
        totalSelected: selectedWithReason.length,
        statistics,
      }

      console.log('📤 [AGENT DEBUG] analyzeSources Response:', {
        success: response.success,
        totalAnalyzed: response.totalAnalyzed,
        totalSelected: response.totalSelected,
      })

      return response
    } catch (error) {
      console.error('Source analysis error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

// Helper: Begründung für Quelle generieren
function generateSourceReason(source: NormalizedSource & { relevanceScore: number }, thema: string): string {
  const reasons: string[] = []

  if (source.relevanceScore > 50) {
    reasons.push('Sehr hohe Relevanz zum Thema')
  } else if (source.relevanceScore > 30) {
    reasons.push('Gute Relevanz zum Thema')
  }

  if (source.impactFactor && source.impactFactor > 5) {
    reasons.push(`Hoher Impact-Faktor (${source.impactFactor.toFixed(1)})`)
  }

  if (source.citationCount && source.citationCount > 50) {
    reasons.push(`Viele Zitate (${source.citationCount})`)
  } else if (source.citationCount && source.citationCount > 20) {
    reasons.push(`Moderate Zitate (${source.citationCount})`)
  }

  if (source.isOpenAccess) {
    reasons.push('Open Access verfügbar')
  }

  if (source.completeness > 0.8) {
    reasons.push('Vollständige Metadaten')
  }

  return reasons.length > 0 ? reasons.join(', ') : 'Relevante Quelle zum Thema'
}

// Tool: Thema setzen
const addThemaTool = tool({
  description: 'Setzt das Thema der Bachelorarbeit oder Masterarbeit. Nutze dies, wenn der Nutzer das Thema angibt oder wenn du es aus der Konversation ableiten kannst.',
  inputSchema: z.object({
    thema: z.string().describe('Das Thema der Bachelorarbeit oder Masterarbeit (z.B. "Künstliche Intelligenz in der Medizin")'),
  }),
  execute: async ({ thema }) => {
    console.log('📝 [AGENT DEBUG] addThema Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Thema:', thema)
    
    // Erstelle Base64-kodiertes Tool-Result für Client-Verarbeitung
    const toolResult = {
      type: 'tool-result',
      toolName: 'addThema',
      thema,
    }
    const jsonString = JSON.stringify(toolResult)
    const base64Payload = Buffer.from(jsonString).toString('base64')
    
    const response = {
      success: true,
      message: `Thema "${thema}" wurde gesetzt`,
      thema,
      // Base64-kodiertes Result für Client-Verarbeitung
      encodedResult: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
    console.log('📤 [AGENT DEBUG] addThema Response:', response)
    return response
  },
})

// Tool: Aktuellen Schritt abrufen
const getCurrentStepTool = tool({
  description: 'Ruft den aktuellen Schritt im Bachelor- oder Masterarbeit-Prozess ab',
  inputSchema: z.object({
    _placeholder: z.string().optional().describe('Placeholder parameter'),
  }),
  execute: async () => {
    console.log('📍 [AGENT DEBUG] getCurrentStep Tool aufgerufen')
    // Wird vom Client-State verwaltet
    const response = {
      message: 'Verwende den Agent State Store um den aktuellen Schritt zu ermitteln',
    }
    console.log('📤 [AGENT DEBUG] getCurrentStep Response:', response)
    return response
  },
})

// Tool: Bibliothek erstellen
const createLibraryTool = tool({
  description:
    'Erstellt eine neue Bibliothek für die gespeicherten Quellen. Der Name sollte thematisch zur Arbeit passen (z.B. "[Thema]").',
  inputSchema: z.object({
    name: z.string().describe('Name der Bibliothek (z.B. "Künstlicher Intelligenz")'),
  }),
  execute: async ({ name }) => {
    console.log('📚 [AGENT DEBUG] createLibrary Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Parameter:', { name })

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createLibrary',
          libraryName: name,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ [AGENT DEBUG] Bibliothek erstellt:', result)

      return {
        success: true,
        libraryId: result.library.id,
        libraryName: result.library.name,
        message: result.message || `Bibliothek "${result.library.name}" erfolgreich erstellt`,
      }
    } catch (error) {
      console.error('❌ [AGENT DEBUG] createLibrary error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

// Tool: Quellen zu Bibliothek hinzufügen
const addSourcesToLibraryTool = tool({
  description:
    'Fügt ausgewählte Quellen zu einer Bibliothek hinzu. Die Quellen werden im Frontend sichtbar und können vom Agent zum Zitieren verwendet werden.',
  inputSchema: z.object({
    libraryId: z.string().describe('ID der Bibliothek (von createLibrary)'),
    sources: z
      .array(z.object({}).passthrough())
      .describe('Array von Quellen-Objekten (aus searchSources.selected)'),
  }),
  execute: async ({ libraryId, sources }) => {
    console.log('📚 [AGENT DEBUG] addSourcesToLibrary Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Parameter:', {
      libraryId,
      sourcesCount: sources?.length || 0,
    })

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return {
        success: false,
        error: 'Keine Quellen zum Hinzufügen',
      }
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addSources',
          libraryId,
          sources,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ [AGENT DEBUG] Quellen hinzugefügt:', result)

      return {
        success: true,
        libraryId: result.library.id,
        libraryName: result.library.name,
        added: result.added,
        total: result.total,
        message: result.message || `${result.added} Quelle(n) hinzugefügt`,
      }
    } catch (error) {
      console.error('❌ [AGENT DEBUG] addSourcesToLibrary error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

// Tool: Quellen aus Bibliothek abrufen
const getLibrarySourcesTool = tool({
  description:
    'Ruft alle Quellen aus einer Bibliothek ab. Kann verwendet werden, um bereits gespeicherte Quellen zu zitieren.',
  inputSchema: z.object({
    libraryId: z.string().describe('ID der Bibliothek'),
  }),
  execute: async ({ libraryId }) => {
    console.log('📚 [AGENT DEBUG] getLibrarySources Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Parameter:', { libraryId })

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/library?id=${libraryId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ [AGENT DEBUG] Bibliothek abgerufen:', {
        libraryId: result.library.id,
        libraryName: result.library.name,
        sourcesCount: result.library.citations.length,
      })

      return {
        success: true,
        libraryId: result.library.id,
        libraryName: result.library.name,
        sources: result.library.citations,
        count: result.library.citations.length,
        message: `Bibliothek "${result.library.name}" enthält ${result.library.citations.length} Quelle(n)`,
      }
    } catch (error) {
      console.error('❌ [AGENT DEBUG] getLibrarySources error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  },
})

// Tool: Schritt-Daten speichern
const saveStepDataTool = tool({
  description: 'Speichert Daten für den aktuellen Schritt',
  inputSchema: z.object({
    step: z.number().describe('Schritt-Nummer (4, 5, oder 6)'),
    data: z.object({}).passthrough().describe('Daten die gespeichert werden sollen (als Objekt)'),
  }),
  execute: async ({ step, data }) => {
    console.log('💾 [AGENT DEBUG] saveStepData Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Parameter:', {
      step,
      dataKeys: Object.keys(data || {}),
      dataSize: JSON.stringify(data || {}).length,
    })
    // Wird vom Client-State verwaltet
    const response = {
      success: true,
      message: 'Daten sollten im Client-State gespeichert werden',
      step,
    }
    console.log('📤 [AGENT DEBUG] saveStepData Response:', response)
    return response
  },
})

// Tool: Text im Editor hinzufügen
const insertTextInEditorTool = tool({
  description:
    'Fügt Markdown-Text direkt im Editor hinzu. KRITISCH: Du MUSST den VOLLSTÄNDIGEN Text im "markdown" Parameter übergeben, nicht nur eine Beschreibung! Der Text wird am Ende des Dokuments eingefügt. Verwende strukturierte Headings (H1, H2, H3) für bessere Übersicht.',
  inputSchema: z.object({
    markdown: z
      .string()
      .min(100)
      .describe(
        'VOLLSTÄNDIGER Markdown-Text der eingefügt werden soll (MINDESTENS 100 Zeichen). NICHT nur eine Beschreibung, sondern der KOMPLETTE Text mit allen Inhalten! Verwende strukturierte Headings: # für H1, ## für H2, ### für H3, etc. Der Text muss vollständig und lesbar sein, nicht nur eine Zusammenfassung!'
      ),
    position: z
      .enum(['start', 'end', 'current'])
      .optional()
      .describe('Position im Editor (Standard: end = am Ende des Dokuments)'),
    focusOnHeadings: z
      .boolean()
      .optional()
      .describe(
        'Fokus auf Headings legen - strukturiert den Text mit klarer Heading-Hierarchie (Standard: true)'
      ),
  }),
  execute: async ({ markdown, position = 'end', focusOnHeadings = true }) => {
    console.log('📝 [AGENT DEBUG] insertTextInEditor Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Parameter:', {
      markdownLength: markdown.length,
      position,
      focusOnHeadings,
      headingCount: (markdown.match(/^#+\s/gm) || []).length,
    })

    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'insertTextInEditor',
      markdown,
      position,
      focusOnHeadings,
    })

    // Base64 Encoding für robustes Parsing im Frontend
    const base64Payload = Buffer.from(payload).toString('base64')

    // WICHTIG: Sende Markdown-Daten direkt im Tool-Response zurück
    // Das Frontend erkennt diese während des Streams und fügt sie ein
    return {
      success: true,
      markdownLength: markdown.length,
      headingCount: (markdown.match(/^#+\s/gm) || []).length,
      position,
      markdown: markdown, // WICHTIG: Markdown im Response für Frontend
      message: 'Text bereit für Einfügung im Editor',
      eventType: 'insert-text-in-editor',
      // Spezielles Format für Frontend-Erkennung
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

// Tool: Zitat hinzufügen
const addCitationTool = tool({
  description:
    'Fügt ein formales Zitat an der aktuellen Cursor-Position im Editor ein. Nutze dies, um Aussagen direkt mit einer Quelle zu belegen.',
  inputSchema: z.object({
    sourceId: z.string().describe('ID der Quelle aus der Bibliothek'),
    citationText: z.string().describe('Der Text des Zitats, z.B. "(Müller, 2023)" oder Fußnote'),
  }),
  execute: async ({ sourceId, citationText }) => {
    console.log('📝 [AGENT DEBUG] addCitation Tool aufgerufen')
    console.log('📥 [AGENT DEBUG] Parameter:', { sourceId, citationText })

    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'addCitation',
      sourceId,
      citationText,
    })

    const base64Payload = Buffer.from(payload).toString('base64')

    return {
      success: true,
      message: 'Zitat bereit für Einfügung',
      eventType: 'insert-citation',
      _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
    }
  },
})

export async function POST(req: NextRequest) {
  const requestStartTime = Date.now()
  console.log('🚀 [AGENT DEBUG] ========== Agent Request gestartet ==========')

  try {
    const { messages, agentState } = await req.json()

    console.log('📋 [AGENT DEBUG] Request-Daten:', {
      messagesCount: messages?.length || 0,
      agentState: {
        isActive: agentState?.isActive,
        arbeitType: agentState?.arbeitType,
        thema: agentState?.thema,
        currentStep: agentState?.currentStep,
      },
      lastMessage: messages?.[messages.length - 1]?.content?.substring(0, 100) + '...',
    })

    if (!agentState) {
      console.error('❌ [AGENT DEBUG] Fehler: Agent State erforderlich')
      return NextResponse.json(
        { error: 'Agent State erforderlich' },
        { status: 400 }
      )
    }

    // Thema ist optional - kann vom Agent bestimmt werden
    const arbeitType = agentState.arbeitType || 'bachelor'
    const arbeitTypeText = arbeitType === 'master' ? 'Masterarbeit' : 'Bachelorarbeit'
    
    // Wenn kein Thema vorhanden ist, versuche es aus der ersten Nachricht zu extrahieren
    let thema = agentState.thema
    if (!thema && messages && messages.length > 0) {
      const firstUserMessage = messages.find((m: any) => m.role === 'user')
      if (firstUserMessage?.content) {
        // Extrahiere das Thema aus der ersten Nachricht (max. 200 Zeichen)
        thema = firstUserMessage.content.substring(0, 200).trim()
        // Entferne häufige Begriffe, die nicht zum Thema gehören
        thema = thema.replace(/^(Hallo|Hi|Hey|Ich möchte|Ich will|Ich schreibe|Ich arbeite|Meine (Bachelor|Master)arbeit|Meine Arbeit)/i, '').trim()
        if (thema.length < 10) {
          thema = null // Zu kurz, nicht sinnvoll
        }
      }
    }
    
    // Wenn immer noch kein Thema vorhanden ist, verwende einen generischen Platzhalter
    if (!thema) {
      thema = 'Thema wird bestimmt'
    }

    const model = deepseek(DEEPSEEK_CHAT_MODEL)
    let systemPrompt = BACHELORARBEIT_AGENT_PROMPT.replace(
      '{{THEMA}}',
      thema
    ).replace('{{CURRENT_DATE}}', new Date().toLocaleDateString('de-DE', { dateStyle: 'full' }))
    
    // Ersetze Platzhalter für Arbeitstyp
    systemPrompt = systemPrompt.replace(/{{ARBEIT_TYPE}}/g, arbeitTypeText)
    systemPrompt = systemPrompt.replace(/{{ARBEIT_TYPE_LOWER}}/g, arbeitTypeText.toLowerCase())

    console.log('🤖 [AGENT DEBUG] Model:', DEEPSEEK_CHAT_MODEL)
    console.log('📝 [AGENT DEBUG] System Prompt Länge:', systemPrompt.length)
    console.log('📋 [AGENT DEBUG] Arbeitstyp:', arbeitTypeText)
    console.log('📋 [AGENT DEBUG] Thema:', thema)
    console.log('🔧 [AGENT DEBUG] Tools verfügbar:', Object.keys({
      addThema: addThemaTool,
      searchSources: searchSourcesTool,
      analyzeSources: analyzeSourcesTool,
      createLibrary: createLibraryTool,
      addSourcesToLibrary: addSourcesToLibraryTool,
      getLibrarySources: getLibrarySourcesTool,
      insertTextInEditor: insertTextInEditorTool,
      addCitation: addCitationTool,
      getCurrentStep: getCurrentStepTool,
      saveStepData: saveStepDataTool,
    }))


    // Tool: Quellen mit LLM bewerten
    const evaluateSourcesTool = tool({
      description: 'Bewertet die Relevanz von Quellen basierend auf Titel und Abstract mithilfe eines LLMs. Nutze dies, um die Auswahl semantisch zu prüfen.',
      inputSchema: z.object({
        sources: z.array(z.object({
          id: z.string(),
          title: z.string(),
          abstract: z.string().optional(),
          year: z.number().optional().or(z.string().optional()),
          authors: z.array(z.string()).optional()
        })).describe('Liste der zu bewertenden Quellen'),
        thema: z.string().describe('Das Thema der Arbeit'),
      }),
      execute: async ({ sources, thema }) => {
        try {
          const model = deepseek(DEEPSEEK_CHAT_MODEL)

          const prompt = `
        Bewerte die folgenden wissenschaftlichen Quellen hinsichtlich ihrer Relevanz für das Thema: "${thema}".
        
        WICHTIG: Du musst JEDE Quelle gründlich analysieren, indem du:
        1. Den TITEL Wort für Wort analysierst und prüfst, ob er semantisch zum Thema passt
        2. Den ABSTRACT vollständig durchliest und die Hauptaussagen mit dem Thema abgleichst
        3. Beide Felder (Titel + Abstract) gemeinsam betrachtest, um die tatsächliche Relevanz zu bestimmen
        
        Bewertungskriterien (in dieser Reihenfolge):
        1. **Themenpassung (höchste Priorität)**: 
           - Analysiere den Titel: Enthält er Schlüsselbegriffe, die zum Thema passen? Behandelt er denselben Forschungsgegenstand?
           - Analysiere den Abstract: Beschreibt er Inhalte, Methoden oder Ergebnisse, die direkt zum Thema gehören?
           - Prüfe, ob Titel und Abstract zusammen eine klare Verbindung zum Thema zeigen
           - Quellen, die nur entfernt verwandt sind oder ein anderes Teilgebiet behandeln, sollten niedrig bewertet werden
        
        2. **Aktualität**: Ist die Quelle aktuell genug? (Bevorzuge Publikationen der letzten 5-10 Jahre, außer es sind klassische Grundlagenwerke)
        
        3. **Wissenschaftlichkeit**: Scheint es eine seriöse, wissenschaftlich fundierte Quelle zu sein?

        Quellen (mit vollständigem Abstract):
        ${JSON.stringify(sources.map(s => ({ 
          id: s.id, 
          title: s.title, 
          abstract: s.abstract || 'Kein Abstract verfügbar',
          year: s.year
        })), null, 2)}
        
        Für jede Quelle: Gib eine detaillierte Begründung, die spezifisch auf Titel und Abstract eingeht und erklärt, warum die Quelle relevant oder nicht relevant ist.
      `

          const { object } = await generateObject({
            model,
            schema: z.object({
              evaluations: z.array(z.object({
                id: z.string(),
                relevanceScore: z.number().min(0).max(100).describe('Relevanz Score 0-100'),
                isRelevant: z.boolean().describe('Ist die Quelle relevant genug für die Arbeit?'),
                reason: z.string().describe('Kurze Begründung für die Bewertung (auf Deutsch)')
              }))
            }),
            prompt,
          })

          console.log('✅ [AGENT DEBUG] LLM Bewertung abgeschlossen', object.evaluations.length)

          // Merge results with original sources
          const results = sources.map(source => {
            const evaluation = object.evaluations.find(e => e.id === source.id)
            return {
              ...source,
              relevanceScore: evaluation?.relevanceScore || 0,
              isRelevant: evaluation?.isRelevant || false,
              evaluationReason: evaluation?.reason || 'Keine Bewertung verfügbar'
            }
          })

          // Sortiere nach neuem Relevance Score
          return results.sort((a, b) => b.relevanceScore - a.relevanceScore)

        } catch (error) {
          console.error('❌ [AGENT DEBUG] Fehler bei evaluateSources:', error)
          return sources.map(s => ({ ...s, evaluationError: true }))
        }
      }
    })

    // Erstelle Agent mit Agent-Klasse
    const agent = new Agent({
      model,
      system: systemPrompt,
      tools: {
        addThema: addThemaTool,
        searchSources: searchSourcesTool,
        analyzeSources: analyzeSourcesTool,
        evaluateSources: evaluateSourcesTool,
        createLibrary: createLibraryTool,
        addSourcesToLibrary: addSourcesToLibraryTool,
        getLibrarySources: getLibrarySourcesTool,
        insertTextInEditor: insertTextInEditorTool,
        addCitation: addCitationTool,
        getCurrentStep: getCurrentStepTool,
        saveStepData: saveStepDataTool,
      },
      toolChoice: 'auto',
      stopWhen: stepCountIs(20),
      maxOutputTokens: 8192, 
    })

    console.log('✅ [AGENT DEBUG] Agent erstellt mit stopWhen: stepCountIs(20)')

    // Verwende agent.stream() für Streaming (laut AI SDK Dokumentation)
    // agent.stream() gibt einen Stream zurück mit textStream Property
    const stream = agent.stream({
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const requestTime = Date.now() - requestStartTime
    console.log(`⏱️  [AGENT DEBUG] Request-Verarbeitung: ${requestTime}ms`)
    console.log('📤 [AGENT DEBUG] Sende Stream-Response...')
    console.log('✅ [AGENT DEBUG] ========== Agent Request abgeschlossen ==========')

    // Verwende den Standard-Stream
    // Tool-Results werden im Tool-Response zurückgegeben und vom Frontend erkannt
    return stream.toTextStreamResponse()
  } catch (error) {
    const requestTime = Date.now() - requestStartTime
    console.error('❌ [AGENT DEBUG] Agent error nach', requestTime + 'ms:', error)
    console.error('❌ [AGENT DEBUG] Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Failed to process agent request' },
      { status: 500 }
    )
  }
}

