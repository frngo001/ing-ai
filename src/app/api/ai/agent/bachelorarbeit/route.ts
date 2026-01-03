import type { NextRequest } from 'next/server'
import { Buffer } from 'node:buffer'
import { Experimental_Agent as Agent, stepCountIs, tool, generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { SourceFetcher } from '@/lib/sources/source-fetcher'
import type { NormalizedSource } from '@/lib/sources/types'
import { BACHELORARBEIT_AGENT_PROMPT } from './prompts'
import { createClient } from '@/lib/supabase/server'
import * as citationLibrariesUtils from '@/lib/supabase/utils/citation-libraries'
import * as citationsUtils from '@/lib/supabase/utils/citations'
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils'
import { devWarn, devError } from '@/lib/utils/logger'


export const runtime = 'nodejs'

function createToolStepMarker(
  type: 'start' | 'end',
  data: {
    id: string
    toolName: string
    input?: Record<string, any>
    output?: Record<string, any>
    status?: 'completed' | 'error'
    error?: string
  }
): string {
  const payload = JSON.stringify(data)
  const base64 = Buffer.from(payload).toString('base64')
  return type === 'start' 
    ? `[TOOL_STEP_START:${base64}]`
    : `[TOOL_STEP_END:${base64}]`
}

// Helper: Generiere eindeutige Tool-Step-ID
function generateToolStepId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

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
    const stepId = generateToolStepId()
    const toolName = 'searchSources'

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
          'pubmed', // XML-Parsing-Fehler (xmlText.match is not a function) TODO: Fix this
        ],
      })
      const startTime = Date.now()

      const results = await fetcher.search({
        query,
        type,
        limit,
      })

      const searchTime = Date.now() - startTime
      const validApis = results.apis?.filter((api): api is string => typeof api === 'string' && api.length > 0) || []

      if (autoAnalyze && thema) {
        const analysisStartTime = Date.now()

        const analyzed = analyzeAndRankSources(results.sources as NormalizedSource[], thema, keywords)

        let filtered = analyzed.filter((s) => s.relevanceScore >= 20)
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
        const selectedWithReason = selected.map((source) => {
          const authorsString = source.authors
            ?.map((a) => a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim())
            .filter(Boolean)
            .join(', ') || 'Unbekannt'

          const authorsShort = authorsString.length > 200
            ? authorsString.substring(0, 197) + '...'
            : authorsString

          const titleShort = (source.title || 'Ohne Titel').length > 200
            ? (source.title || 'Ohne Titel').substring(0, 197) + '...'
            : (source.title || 'Ohne Titel')

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

        const response = {
          success: true,
          totalResults: results.totalResults,
          sourcesFound: results.sources.length,
          selected: selectedWithReason, // Array mit vereinfachten Quellen-Objekten
          totalSelected: selectedWithReason.length,
          message: `Ich habe ${selectedWithReason.length} relevante Quellen für dein Thema gefunden und analysiert. Bitte präsentiere diese Quellen dem Studenten in einer TABELLE (Markdown-Format) mit den Spalten: Titel, Autoren, Jahr, Relevanz-Score, Begründung. Sortiere nach Relevanz-Score (höchste zuerst).`,
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

        try {
          const testReturn = JSON.parse(JSON.stringify(response))

          // Prüfe ob alle wichtigen Felder vorhanden sind
          if (!testReturn.selected || !Array.isArray(testReturn.selected)) {
            devError('❌ [AGENT DEBUG] FEHLER: selected ist kein Array!')
            throw new Error('selected muss ein Array sein')
          }

          if (testReturn.selected.length === 0) {
            devWarn('⚠️  [AGENT DEBUG] WARNUNG: selected Array ist leer!')
          }

          return {
            ...testReturn,
            _toolStep: createToolStepMarker('end', {
              id: stepId,
              toolName,
              status: 'completed',
              output: { totalSelected: testReturn.totalSelected, message: testReturn.message },
            }),
          }
        } catch (returnError) {
          devError('❌ [AGENT DEBUG] KRITISCHER FEHLER beim Return des Response-Objekts:', returnError)
          // Fallback: Gebe ein vereinfachtes Response-Objekt zurück
          const fallbackResponse = {
            success: true,
            totalResults: results.totalResults,
            sourcesFound: results.sources.length,
            selected: selectedWithReason.slice(0, 10), // Nur erste 10 Quellen als Fallback
            totalSelected: Math.min(selectedWithReason.length, 10),
            message: `Ich habe ${selectedWithReason.length} relevante Quellen gefunden. Bitte präsentiere diese Quellen in einer TABELLE (Markdown-Format) mit den Spalten: Titel, Autoren, Jahr, Relevanz-Score, Begründung. Sortiere nach Relevanz-Score (höchste zuerst).`,
            _toolStep: createToolStepMarker('end', {
              id: stepId,
              toolName,
              status: 'completed',
              output: { totalSelected: Math.min(selectedWithReason.length, 10) },
            }),
          }
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
        _toolStep: createToolStepMarker('end', {
          id: stepId,
          toolName,
          status: 'completed',
          output: { totalResults: results.totalResults, sourcesCount: results.sources.length },
        }),
      }

      return response
    } catch (error) {
      devError('❌ [AGENT DEBUG] Source search error:', error)
      return {
        _toolStep: createToolStepMarker('end', {
          id: stepId,
          toolName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
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
    const stepId = generateToolStepId()
    const toolName = 'analyzeSources'


    try {
      const startTime = Date.now()

      // Quellen analysieren und ranken
      const analyzed = analyzeAndRankSources(sources as unknown as NormalizedSource[], thema, keywords)

      // Filter anwenden
      let filtered = analyzed.filter((s) => s.relevanceScore >= minRelevanceScore)
  


      // Top Ergebnisse auswählen
      const selected = filtered.slice(0, maxResults)

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

      const response = {
        success: true,
        selected: selectedWithReason,
        totalAnalyzed: analyzed.length,
        totalSelected: selectedWithReason.length,
        statistics,
        _toolStep: createToolStepMarker('end', {
          id: stepId,
          toolName,
          status: 'completed',
          output: { totalAnalyzed: analyzed.length, totalSelected: selectedWithReason.length },
        }),
      }

      return response
    } catch (error) {
      devError('Source analysis error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        _toolStep: createToolStepMarker('end', {
          id: stepId,
          toolName,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
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
    const response = {
      message: 'Verwende den Agent State Store um den aktuellen Schritt zu ermitteln',
    }
    return response
  },
})

// Helper: Konvertiere Source zu Citation (für direkte DB-Operationen)
function convertSourceToCitation(source: any) {
  const authors = source.authors
    ? (typeof source.authors === 'string' 
        ? source.authors.split(',').map((a: string) => a.trim())
        : Array.isArray(source.authors)
        ? source.authors.map((a: any) => 
            typeof a === 'string' ? a : a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
          )
        : [])
    : []

  const externalUrl = getCitationLink({
    url: source.url,
    doi: source.doi,
    pdfUrl: source.pdfUrl,
  });
  const validDoi = getNormalizedDoi(source.doi);

  return {
    id: crypto.randomUUID(),
    title: source.title || 'Ohne Titel',
    source: source.journal || source.publisher || source.venue || 'Quelle',
    year: source.publicationYear || source.year || undefined,
    lastEdited: new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
    href: externalUrl || '/editor',
    externalUrl,
    doi: validDoi || undefined,
    authors: authors.filter(Boolean),
    abstract: source.abstract || undefined,
  }
}

function createLibraryToolWithUser(userId: string, supabaseClient: Awaited<ReturnType<typeof createClient>>) {
  return tool({
    description:
      'Erstellt eine neue Bibliothek für die gespeicherten Quellen. Der Name sollte thematisch zur Arbeit passen (z.B. "[Thema]").',
    inputSchema: z.object({
      name: z.string().describe('Name der Bibliothek (z.B. "Künstlicher Intelligenz")'),
    }),
    execute: async ({ name }) => {
      const stepId = generateToolStepId()
      const toolName = 'createLibrary'
      
      try {
        const newLibrary = await citationLibrariesUtils.createCitationLibrary({
          user_id: userId,
          name: name.trim(),
          is_default: false,
        }, supabaseClient)

        return {
          success: true,
          libraryId: newLibrary.id,
          libraryName: newLibrary.name,
          message: `Bibliothek "${newLibrary.name}" erfolgreich erstellt`,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: { libraryId: newLibrary.id, libraryName: newLibrary.name },
          }),
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        }
      }
    },
  })
}

function addSourcesToLibraryToolWithUser(userId: string, supabaseClient: Awaited<ReturnType<typeof createClient>>) {
  return tool({
    description:
      'Fügt ausgewählte Quellen zu einer Bibliothek hinzu. Die Quellen werden im Frontend sichtbar und können vom Agent zum Zitieren verwendet werden.',
    inputSchema: z.object({
      libraryId: z.string().describe('ID der Bibliothek (von createLibrary)'),
      sources: z
        .array(z.object({}).passthrough())
        .describe('Array von Quellen-Objekten (aus searchSources.selected)'),
    }),
    execute: async ({ libraryId, sources }) => {
      const stepId = generateToolStepId()
      const toolName = 'addSourcesToLibrary'
      
      if (!sources || !Array.isArray(sources) || sources.length === 0) {
        return {
          success: false,
          error: 'Keine Quellen zum Hinzufügen',
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'error',
            error: 'Keine Quellen zum Hinzufügen',
          }),
        }
      }

      try {
        const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, userId, supabaseClient)
        if (!library) {
          return {
            success: false,
            error: 'Bibliothek nicht gefunden',
            _toolStep: createToolStepMarker('end', {
              id: stepId,
              toolName,
              status: 'error',
              error: 'Bibliothek nicht gefunden',
            }),
          }
        }

        // Konvertiere Quellen zu Citations
        const newCitations = sources.map(convertSourceToCitation)
        
        // Lade bestehende Citations
        const existingCitations = await citationsUtils.getCitationsByLibrary(libraryId, userId, supabaseClient)
        const existingIds = new Set(existingCitations.map((c) => c.id))
        const uniqueCitations = newCitations.filter((c) => !existingIds.has(c.id))

        // Erstelle neue Citations in Supabase
        for (const citation of uniqueCitations) {
          await citationsUtils.createCitation({
            id: citation.id,
            user_id: userId,
            library_id: libraryId,
            title: citation.title,
            source: citation.source,
            year: typeof citation.year === 'number' ? citation.year : citation.year ? parseInt(citation.year.toString()) : null,
            last_edited: new Date().toISOString(),
            href: citation.href,
            external_url: citation.externalUrl || null,
            authors: citation.authors || null,
            abstract: citation.abstract || null,
            doi: citation.doi || null,
            citation_style: 'vancouver',
            in_text_citation: citation.title,
            full_citation: citation.title,
            metadata: {},
          }, supabaseClient)
        }


        return {
          success: true,
          libraryId: library.id,
          libraryName: library.name,
          added: uniqueCitations.length,
          total: existingCitations.length + uniqueCitations.length,
          message: `${uniqueCitations.length} Quelle(n) zur Bibliothek "${library.name}" hinzugefügt`,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: { added: uniqueCitations.length, libraryName: library.name },
          }),
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        }
      }
    },
  })
}

// Factory-Funktion für getLibrarySourcesTool mit User-ID
function getLibrarySourcesToolWithUser(userId: string, supabaseClient: Awaited<ReturnType<typeof createClient>>) {
  return tool({
    description:
      'Ruft alle Quellen aus einer Bibliothek ab. Kann verwendet werden, um bereits gespeicherte Quellen zu zitieren.',
    inputSchema: z.object({
      libraryId: z.string().describe('ID der Bibliothek'),
    }),
    execute: async ({ libraryId }) => {
      const stepId = generateToolStepId()
      const toolName = 'getLibrarySources'

      try {
        const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, userId, supabaseClient)
        if (!library) {
          return {
            success: false,
            error: 'Bibliothek nicht gefunden',
            _toolStep: createToolStepMarker('end', {
              id: stepId,
              toolName,
              status: 'error',
              error: 'Bibliothek nicht gefunden',
            }),
          }
        }

        const citations = await citationsUtils.getCitationsByLibrary(libraryId, userId, supabaseClient)
        const savedCitations = citations.map((c) => ({
          id: c.id,
          title: c.title || '',
          source: c.source || '',
          year: c.year || undefined,
          lastEdited: c.last_edited ? new Date(c.last_edited).toLocaleDateString('de-DE', { dateStyle: 'short' }) : new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
          href: c.href || '/editor',
          externalUrl: c.external_url || undefined,
          doi: c.doi || undefined,
          authors: c.authors || undefined,
          abstract: c.abstract || undefined,
        }))

        return {
          success: true,
          libraryId: library.id,
          libraryName: library.name,
          sources: savedCitations,
          count: savedCitations.length,
          message: `Bibliothek "${library.name}" enthält ${savedCitations.length} Quelle(n)`,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: { count: savedCitations.length, libraryName: library.name },
          }),
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }),
        }
      }
    },
  })
}

// Tool: Schritt-Daten speichern
const saveStepDataTool = tool({
  description: 'Speichert Daten für den aktuellen Schritt',
  inputSchema: z.object({
    step: z.number().describe('Schritt-Nummer (4, 5, oder 6)'),
    data: z.object({}).passthrough().describe('Daten die gespeichert werden sollen (als Objekt)'),
  }),
  execute: async ({ step, data }) => {
    const response = {
      success: true,
      message: 'Daten sollten im Client-State gespeichert werden',
      step,
    }
    return response
  },
})

// Tool: Editor-Inhalt abrufen (Factory-Funktion mit editorContent)
function createGetEditorContentTool(editorContent: string) {
  return tool({
    description: 'Ruft den aktuellen Inhalt des Editors ab. Nutze dieses Tool, um zu sehen, was der Student bereits geschrieben hat oder um den aktuellen Stand der Arbeit zu analysieren.',
    inputSchema: z.object({
      includeFullText: z.boolean().optional().describe('Ob der vollständige Text zurückgegeben werden soll (Standard: true). Bei false wird nur eine Zusammenfassung zurückgegeben.'),
      maxLength: z.number().optional().describe('Maximale Länge des zurückgegebenen Textes in Zeichen (Standard: unbegrenzt)'),
    }),
    execute: async ({ includeFullText = true, maxLength }) => {
      const stepId = generateToolStepId()
      const toolName = 'getEditorContent'
      
      if (!editorContent || editorContent.trim().length === 0) {
        return {
          success: true,
          isEmpty: true,
          content: '',
          message: 'Der Editor ist leer. Es wurde noch kein Text geschrieben.',
          characterCount: 0,
          wordCount: 0,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: { isEmpty: true, characterCount: 0, wordCount: 0 },
          }),
        }
      }
      
      let content = editorContent.trim()
      
      if (maxLength && content.length > maxLength) {
        content = content.substring(0, maxLength) + '...'
      }
      
      const characterCount = editorContent.length
      const wordCount = editorContent.split(/\s+/).filter(w => w.length > 0).length
      const paragraphCount = editorContent.split(/\n\n+/).filter(p => p.trim().length > 0).length
      
      const headings = editorContent.match(/^#{1,6}\s.+$/gm) || []
      
      const response = {
        success: true,
        isEmpty: false,
        content: includeFullText ? content : undefined,
        summary: !includeFullText ? `${wordCount} Wörter, ${paragraphCount} Absätze, ${headings.length} Überschriften` : undefined,
        message: `Editor-Inhalt abgerufen: ${wordCount} Wörter, ${characterCount} Zeichen.`,
        characterCount,
        wordCount,
        paragraphCount,
        headingCount: headings.length,
        headings: headings.slice(0, 10),
        _toolStep: createToolStepMarker('end', {
          id: stepId,
          toolName,
          status: 'completed',
          output: { 
            wordCount, 
            characterCount,
            paragraphCount,
            headingCount: headings.length,
          },
        }),
      }
      
      return response
    },
  })
}

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
    const payload = JSON.stringify({
      type: 'tool-result',
      toolName: 'insertTextInEditor',
      markdown,
      position,
      focusOnHeadings,
    })

    const base64Payload = Buffer.from(payload).toString('base64')

    return {
      success: true,
      markdownLength: markdown.length,
      headingCount: (markdown.match(/^#+\s/gm) || []).length,
      position,
      markdown: markdown,
      message: 'Text bereit für Einfügung im Editor',
      eventType: 'insert-text-in-editor',
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
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { messages, agentState, editorContent, documentContextEnabled, fileContents } = await req.json()

    
    const currentEditorContent: string = editorContent || ''
    if (!agentState) {
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

    if (documentContextEnabled && currentEditorContent.trim().length > 0) {
      const wordCount = currentEditorContent.split(/\s+/).filter(w => w.length > 0).length
      const headings = currentEditorContent.match(/^#{1,6}\s.+$/gm) || []
      
      const truncatedContent = currentEditorContent.length > 8000 
        ? currentEditorContent.substring(0, 8000) + '\n\n[... Text gekürzt ...]'
        : currentEditorContent
      
      const editorContextSection = `

## Aktueller Editor-Inhalt (Kontext aktiviert)

Der Student hat den Dokumentkontext aktiviert. Hier ist der aktuelle Inhalt des Editors:

**Statistiken:** ${wordCount} Wörter, ${headings.length} Überschriften

**Aktueller Text:**
\`\`\`
${truncatedContent}
\`\`\`

**WICHTIG**: Beziehe dich auf diesen vorhandenen Text, wenn der Student danach fragt oder wenn es relevant ist. Du kannst den Text analysieren, Verbesserungen vorschlagen oder darauf aufbauen.
`
      systemPrompt += editorContextSection
    }

    if (fileContents && Array.isArray(fileContents) && fileContents.length > 0) {
      const fileSections = fileContents
        .filter((file: any) => file.content && file.content.trim().length > 0)
        .map((file: any) => {
          const wordCount = file.content.split(/\s+/).filter((w: string) => w.length > 0).length
          return `### Datei: ${file.name}

Inhalt (${wordCount} Wörter):

\`\`\`
${file.content}
\`\`\``
        })
      
      if (fileSections.length > 0) {
        const fileContentSection = `

## Hochgeladene Dateien

Der Student hat folgende Dateien hochgeladen. Beziehe dich auf deren Inhalt, wenn der Student danach fragt oder wenn es relevant ist:

${fileSections.join('\n\n---\n\n')}

**WICHTIG**: Analysiere den Inhalt der hochgeladenen Dateien und nutze sie als Kontext für die Arbeit. Du kannst auf den Inhalt verweisen, Zitate vorschlagen oder den Inhalt in die Arbeit integrieren.
`
        systemPrompt += fileContentSection
      }
    }


    const createLibraryTool = createLibraryToolWithUser(user.id, supabase)
    const addSourcesToLibraryTool = addSourcesToLibraryToolWithUser(user.id, supabase)
    const getLibrarySourcesTool = getLibrarySourcesToolWithUser(user.id, supabase)
    const getEditorContentTool = createGetEditorContentTool(currentEditorContent)

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

          const results = sources.map(source => {
            const evaluation = object.evaluations.find(e => e.id === source.id)
            return {
              ...source,
              relevanceScore: evaluation?.relevanceScore || 0,
              isRelevant: evaluation?.isRelevant || false,
              evaluationReason: evaluation?.reason || 'Keine Bewertung verfügbar'
            }
          })

          return results.sort((a, b) => b.relevanceScore - a.relevanceScore)

        } catch (error) {
          devError('❌ [AGENT DEBUG] Fehler bei evaluateSources:', error)
          return sources.map(s => ({ ...s, evaluationError: true }))
        }
      }
    })

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
        getEditorContent: getEditorContentTool,
        insertTextInEditor: insertTextInEditorTool,
        addCitation: addCitationTool,
        getCurrentStep: getCurrentStepTool,
        saveStepData: saveStepDataTool,
      },
      toolChoice: 'auto',
      stopWhen: stepCountIs(20),
      maxOutputTokens: 8192, 
    })


    const agentStream = agent.stream({
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    })


    const encoder = new TextEncoder()
    const toolStepTimestamps: Record<string, number> = {}
    const toolStepIds: Record<string, string> = {}
    
    const customStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of agentStream.fullStream) {
            if (event.type === 'tool-call') {
              // Tool wurde aufgerufen - sende START Marker
              const stepId = `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
              toolStepTimestamps[event.toolCallId] = Date.now()
              toolStepIds[event.toolCallId] = stepId
              
              // 'input' ist die korrekte Property fuer tool-call Events
              const toolInput = 'input' in event ? (event.input as Record<string, any>) : {}
              
              const startMarker = createToolStepMarker('start', {
                id: stepId,
                toolName: event.toolName,
                input: toolInput,
              })
              controller.enqueue(encoder.encode(startMarker))
                    
              await new Promise(resolve => setTimeout(resolve, 10))
            } else if (event.type === 'tool-result') {
              const stepId = toolStepIds[event.toolCallId] || `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
              const startTime = toolStepTimestamps[event.toolCallId] || Date.now()
              
              const toolOutput = 'output' in event ? event.output : null
              
              const output: Record<string, any> = {}
              if (typeof toolOutput === 'object' && toolOutput !== null) {
                const result = toolOutput as Record<string, any>
                if (result.totalResults !== undefined) output.totalResults = result.totalResults
                if (result.totalSelected !== undefined) output.totalSelected = result.totalSelected
                if (result.sourcesFound !== undefined) output.sourcesFound = result.sourcesFound
                if (result.added !== undefined) output.added = result.added
                if (result.libraryId !== undefined) output.libraryId = result.libraryId
                if (result.libraryName !== undefined) output.libraryName = result.libraryName
                if (result.count !== undefined) output.count = result.count
                if (result.success !== undefined) output.success = result.success
                if (result.error !== undefined) output.error = result.error
                if (result.message !== undefined) output.message = result.message
              }
              
              const endMarker = createToolStepMarker('end', {
                id: stepId,
                toolName: event.toolName,
                status: (toolOutput as any)?.success === false ? 'error' : 'completed',
                output,
                error: (toolOutput as any)?.error,
              })
              controller.enqueue(encoder.encode(endMarker))

              await new Promise(resolve => setTimeout(resolve, 10))
            } else if (event.type === 'text-delta') {
              const textContent = 'text' in event ? event.text : ''
              controller.enqueue(encoder.encode(textContent))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    const requestTime = Date.now() - requestStartTime
    devError('❌ [AGENT DEBUG] Agent error nach', requestTime + 'ms:', error)
    devError('❌ [AGENT DEBUG] Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Failed to process agent request' },
      { status: 500 }
    )
  }
}

