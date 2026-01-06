import type { NextRequest } from 'next/server'
import { Buffer } from 'node:buffer'
import { Experimental_Agent as Agent, stepCountIs, tool, generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { SourceFetcher } from '@/lib/sources/source-fetcher'
import type { NormalizedSource } from '@/lib/sources/types'
import { GENERAL_AGENT_PROMPT } from './prompts'
import { createClient } from '@/lib/supabase/server'
import * as citationLibrariesUtils from '@/lib/supabase/utils/citation-libraries'
import * as citationsUtils from '@/lib/supabase/utils/citations'
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils'
import { devLog, devError } from '@/lib/utils/logger'

// Edge Runtime hat Probleme mit Tool-Ergebnis-Serialisierung
// Wechsel zu Node.js Runtime für bessere Tool-Call-Verarbeitung
export const runtime = 'nodejs'

// Helper: Generiere Tool-Step-Marker fuer die Stream-Visualisierung
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

// Tool: Quellen suchen
const searchSourcesTool = tool({
    description:
        'Suche nach wissenschaftlichen Quellen für die Literaturrecherche. Durchsucht 14+ Datenbanken parallel. WICHTIG: Nach der Suche MUSST du das Tool "analyzeSources" verwenden, um die Quellen zu analysieren und die besten auszuwählen!',
    inputSchema: z.object({
        query: z.string().describe('Suchbegriff oder Thema'),
        type: z.enum(['keyword', 'title', 'author', 'doi']).optional().describe('Suchtyp (Standard: keyword)'),
        limit: z.number().min(10).max(100).optional().describe('Anzahl der Suchergebnisse (Standard: 50)'),
    }),
    execute: async ({
        query,
        type = 'keyword',
        limit = 50,
    }) => {
        const stepId = generateToolStepId()
        const toolName = 'searchSources'
        
        try {
            const fetcher = new SourceFetcher({
                maxParallelRequests: 5,
                useCache: true,
                excludedApis: ['semanticscholar', 'biorxiv', 'arxiv', 'opencitations', 'zenodo', 'pubmed'],
            })

            const results = await fetcher.search({ query, type, limit })
            const validApis = results.apis?.filter((api): api is string => typeof api === 'string' && api.length > 0) || []

            return {
                success: true,
                totalResults: results.totalResults,
                sources: results.sources.slice(0, limit),
                apis: validApis,
                searchTime: results.searchTime,
                message: `Ich habe ${results.sources.length} Quellen gefunden. Verwende jetzt das Tool "analyzeSources" um die besten Quellen auszuwählen.`,
                _toolStep: createToolStepMarker('end', {
                    id: stepId,
                    toolName,
                    status: 'completed',
                    output: { totalResults: results.totalResults, sourcesCount: results.sources.length },
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

// Tool: Quellen analysieren
const analyzeSourcesTool = tool({
    description: 'Analysiere gefundene Quellen nach Relevanz, Impact-Faktor und Zitaten. Wählt die besten Quellen aus. WICHTIG: Dieses Tool MUSS IMMER nach "searchSources" verwendet werden! Das Tool verwendet ein LLM zur semantischen Bewertung der Quellen.',
    inputSchema: z.object({
        sources: z.array(z.object({}).passthrough()),
        thema: z.string(),
        keywords: z.array(z.string()).optional(),
        minRelevanceScore: z.number().optional(),
        preferHighImpact: z.boolean().optional(),
        preferHighCitations: z.boolean().optional(),
        maxResults: z.number().min(10).max(50).optional(),
    }),
    execute: async ({ sources, thema, keywords = [], minRelevanceScore = 50, preferHighImpact = false, preferHighCitations = true, maxResults = 30 }) => {
        try {
            const model = deepseek(DEEPSEEK_CHAT_MODEL)
            
            // Bereite Quellen für LLM-Bewertung vor
            const sourcesForEvaluation = (sources as unknown as NormalizedSource[]).map((source) => ({
                id: source.id || `src-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                title: source.title || 'Ohne Titel',
                abstract: source.abstract?.substring(0, 500) || '',
                authors: source.authors?.map((a) => a.fullName || `${a.firstName || ''} ${a.lastName || ''}`).filter(Boolean).join(', ') || 'Unbekannt',
                year: source.publicationYear || null,
                keywords: source.keywords?.join(', ') || '',
                citationCount: source.citationCount || 0,
                impactFactor: source.impactFactor || null,
                isOpenAccess: source.isOpenAccess || false,
                doi: source.doi || null,
                url: source.url || null,
            }))

            // LLM-basierte Bewertung der Quellen
            const prompt = `Bewerte die folgenden wissenschaftlichen Quellen hinsichtlich ihrer Relevanz für das Thema: "${thema}".
${keywords.length > 0 ? `Zusätzliche Keywords: ${keywords.join(', ')}` : ''}

WICHTIG: Du musst JEDE Quelle gründlich analysieren, indem du:
1. Den TITEL Wort für Wort analysierst und prüfst, ob er semantisch zum Thema passt
2. Den ABSTRACT vollständig durchliest und die Hauptaussagen, Methoden und Ergebnisse mit dem Thema abgleichst
3. Beide Felder (Titel + Abstract) gemeinsam betrachtest, um die tatsächliche Relevanz zu bestimmen
4. Prüfst, ob die Quelle wirklich das gleiche oder ein sehr ähnliches Forschungsgebiet behandelt

Bewertungskriterien (in dieser Reihenfolge):
1. **Themenpassung** (0-100, höchste Priorität): 
   - Analysiere den Titel: Enthält er Schlüsselbegriffe, die zum Thema passen? Behandelt er denselben Forschungsgegenstand?
   - Analysiere den Abstract: Beschreibt er Inhalte, Methoden oder Ergebnisse, die direkt zum Thema gehören?
   - Prüfe, ob Titel und Abstract zusammen eine klare Verbindung zum Thema zeigen
   - Quellen, die nur entfernt verwandt sind oder ein anderes Teilgebiet behandeln, sollten niedrig bewertet werden (unter 50)
   - Berücksichtige auch die Keywords der Quelle, falls vorhanden

2. **Aktualität** (0-100): Wie aktuell ist die Quelle? Bevorzuge neuere Publikationen (letzte 5-10 Jahre), außer es handelt sich um klassische Grundlagenwerke.

3. **Wissenschaftlichkeit** (0-100): Wie wissenschaftlich fundiert ist die Quelle? Berücksichtige Impact-Faktor, Zitationsanzahl und Publikationsart.

4. **Gesamtrelevanz** (0-100): Gesamtbewertung basierend auf allen Kriterien, wobei Themenpassung das wichtigste Kriterium ist.

Quellen:
${JSON.stringify(sourcesForEvaluation.map(s => ({
    id: s.id,
    title: s.title,
    abstract: s.abstract || 'Kein Abstract verfügbar',
    authors: s.authors,
    year: s.year,
    keywords: s.keywords,
    citationCount: s.citationCount,
    impactFactor: s.impactFactor,
    isOpenAccess: s.isOpenAccess
})), null, 2)}

Für jede Quelle: Gib eine detaillierte Begründung, die spezifisch auf Titel und Abstract eingeht und erklärt, warum die Quelle relevant oder nicht relevant ist.`

            const { object } = await generateObject({
                model,
                schema: z.object({
                    evaluations: z.array(z.object({
                        id: z.string(),
                        relevanceScore: z.number().min(0).max(100).describe('Gesamtrelevanz-Score (0-100)'),
                        themeMatch: z.number().min(0).max(100).describe('Themenpassung (0-100)'),
                        currency: z.number().min(0).max(100).describe('Aktualität (0-100)'),
                        scientificQuality: z.number().min(0).max(100).describe('Wissenschaftlichkeit (0-100)'),
                        isRelevant: z.boolean().describe('Ist die Quelle relevant für das Thema?'),
                        reason: z.string().describe('Begründung für die Bewertung'),
                    }))
                }),
                prompt,
            })

            // Kombiniere LLM-Bewertung mit Metadaten
            const analyzed = sourcesForEvaluation.map((source) => {
                const evaluation = object.evaluations.find((e) => e.id === source.id)
                
                if (!evaluation) {
                    return {
                        ...source,
                        relevanceScore: 0,
                        rankingScore: 0,
                        isRelevant: false,
                        reason: 'Keine Bewertung verfügbar',
                    }
                }

                // Berechne Ranking-Score: LLM-Bewertung + Metadaten-Bonus
                const llmScore = evaluation.relevanceScore
                
                // Metadaten-Bonus (max. 30 Punkte)
                const impactBonus = source.impactFactor ? Math.min(source.impactFactor * 2, 10) : 0
                const citationBonus = source.citationCount ? Math.min(source.citationCount / 10, 10) : 0
                const openAccessBonus = source.isOpenAccess ? 5 : 0
                const completenessBonus = (source.title && source.abstract) ? 5 : 0
                
                const metadataBonus = impactBonus + citationBonus + openAccessBonus + completenessBonus
                const rankingScore = llmScore + metadataBonus

                return {
                    ...source,
                    relevanceScore: evaluation.relevanceScore,
                    themeMatch: evaluation.themeMatch,
                    currency: evaluation.currency,
                    scientificQuality: evaluation.scientificQuality,
                    isRelevant: evaluation.isRelevant,
                    rankingScore: Math.round(rankingScore * 100) / 100,
                    reason: evaluation.reason,
                }
            })

            // Filtere nach minRelevanceScore
            let filtered = analyzed.filter((s) => s.relevanceScore >= minRelevanceScore && s.isRelevant)

            // Sortiere nach Präferenzen
            if (preferHighImpact) {
                filtered = filtered.sort((a, b) => {
                    const impactA = a.impactFactor || 0
                    const impactB = b.impactFactor || 0
                    if (impactB !== impactA) return impactB - impactA
                    return b.rankingScore - a.rankingScore
                })
            } else if (preferHighCitations) {
                filtered = filtered.sort((a, b) => {
                    const citationsA = a.citationCount || 0
                    const citationsB = b.citationCount || 0
                    if (citationsB !== citationsA) return citationsB - citationsA
                    return b.rankingScore - a.rankingScore
                })
            } else {
                // Standard: Sortiere nach Ranking-Score
                filtered = filtered.sort((a, b) => b.rankingScore - a.rankingScore)
            }

            const selected = filtered.slice(0, maxResults)

            // Formatiere Ergebnisse
            const selectedWithReason = selected.map((source) => ({
                id: source.id,
                title: source.title,
                authors: source.authors,
                year: source.year,
                doi: source.doi,
                url: source.url,
                citationCount: source.citationCount,
                impactFactor: source.impactFactor,
                relevanceScore: source.relevanceScore,
                rankingScore: source.rankingScore,
                reason: source.reason,
            }))

            return {
                success: true,
                selected: selectedWithReason,
                totalAnalyzed: analyzed.length,
                totalSelected: selectedWithReason.length,
                message: `Ich habe ${selectedWithReason.length} relevante Quellen aus ${analyzed.length} gefundenen Quellen ausgewählt (bewertet mit LLM).`,
            }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    },
})

// Tool: evaluateSources (LLM based)
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
                        relevanceScore: z.number().min(0).max(100),
                        isRelevant: z.boolean(),
                        reason: z.string()
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
            return sources.map(s => ({ ...s, evaluationError: true }))
        }
    }
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
        id: source.id || `cite_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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

// Factory-Funktionen für Tools mit User-ID
function createLibraryToolWithUser(userId: string) {
    return tool({
        description: 'Erstellt eine neue Bibliothek.',
        inputSchema: z.object({ name: z.string() }),
        execute: async ({ name }) => {
            const stepId = generateToolStepId()
            const toolName = 'createLibrary'
            
            try {
                const newLibrary = await citationLibrariesUtils.createCitationLibrary({
                    user_id: userId,
                    name: name.trim(),
                    is_default: false,
                })
                return {
                    success: true,
                    libraryId: newLibrary.id,
                    libraryName: newLibrary.name,
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

function addSourcesToLibraryToolWithUser(userId: string) {
    return tool({
        description: 'Fügt Quellen zu einer Bibliothek hinzu.',
        inputSchema: z.object({ libraryId: z.string(), sources: z.array(z.object({}).passthrough()) }),
        execute: async ({ libraryId, sources }) => {
            const stepId = generateToolStepId()
            const toolName = 'addSourcesToLibrary'
            
            try {
                const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, userId)
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

                const newCitations = sources.map(convertSourceToCitation)
                const existingCitations = await citationsUtils.getCitationsByLibrary(libraryId, userId)
                const existingIds = new Set(existingCitations.map((c) => c.id))
                const uniqueCitations = newCitations.filter((c) => !existingIds.has(c.id))

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
                    })
                }

                return {
                    success: true,
                    added: uniqueCitations.length,
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

function getLibrarySourcesToolWithUser(userId: string) {
    return tool({
        description: 'Ruft Quellen aus einer Bibliothek ab.',
        inputSchema: z.object({ libraryId: z.string() }),
        execute: async ({ libraryId }) => {
            const stepId = generateToolStepId()
            const toolName = 'getLibrarySources'
            
            try {
                const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, userId)
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

                const citations = await citationsUtils.getCitationsByLibrary(libraryId, userId)
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
                    sources: savedCitations,
                    count: savedCitations.length,
                    _toolStep: createToolStepMarker('end', {
                        id: stepId,
                        toolName,
                        status: 'completed',
                        output: { count: savedCitations.length },
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

const insertTextInEditorTool = tool({
    description: 'Fügt Markdown-Text direkt im Editor hinzu.',
    inputSchema: z.object({
        markdown: z.string().min(100),
        position: z.enum(['start', 'end', 'current']).optional(),
        focusOnHeadings: z.boolean().optional(),
    }),
    execute: async ({ markdown, position = 'end', focusOnHeadings = true }) => {
        const payload = JSON.stringify({ type: 'tool-result', toolName: 'insertTextInEditor', markdown, position, focusOnHeadings })
        const base64Payload = Buffer.from(payload).toString('base64')
        return {
            success: true,
            markdownLength: markdown.length,
            position,
            markdown,
            eventType: 'insert-text-in-editor',
            _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
        }
    },
})

const addCitationTool = tool({
    description: 'Fügt ein formales Zitat an der aktuellen Cursor-Position im Editor ein.',
    inputSchema: z.object({
        sourceId: z.string(),
        citationText: z.string(),
    }),
    execute: async ({ sourceId, citationText }) => {
        const payload = JSON.stringify({ type: 'tool-result', toolName: 'addCitation', sourceId, citationText })
        const base64Payload = Buffer.from(payload).toString('base64')
        return {
            success: true,
            eventType: 'insert-citation',
            _streamMarker: `[TOOL_RESULT_B64:${base64Payload}]`,
        }
    },
})

const saveStepDataTool = tool({
    description: 'Speichert Daten für den aktuellen Schritt',
    inputSchema: z.object({ step: z.number(), data: z.object({}).passthrough() }),
    execute: async ({ step }) => {
        return { success: true, message: 'Daten sollten im Client-State gespeichert werden', step }
    },
})

// Tool: Thema setzen
const addThemaTool = tool({
    description: 'Setzt das Thema der Arbeit. Nutze dies, wenn der Nutzer das Thema angibt oder wenn du es aus der Konversation ableiten kannst.',
    inputSchema: z.object({
        thema: z.string().describe('Das Thema der Arbeit (z.B. "Künstliche Intelligenz im Gesundheitswesen")'),
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

const getCurrentStepTool = tool({
    description: 'Ruft den aktuellen Schritt ab',
    inputSchema: z.object({ _placeholder: z.string().optional() }),
    execute: async () => ({ message: 'Verwende den Agent State Store' }),
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
      
      devLog('📄 [GENERAL AGENT] getEditorContent Tool aufgerufen')
      devLog('📥 [GENERAL AGENT] Parameter:', {
        includeFullText,
        maxLength,
        editorContentLength: editorContent?.length || 0,
      })
      
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
      
      // Kürze auf maxLength wenn angegeben
      if (maxLength && content.length > maxLength) {
        content = content.substring(0, maxLength) + '...'
      }
      
      // Berechne Statistiken
      const characterCount = editorContent.length
      const wordCount = editorContent.split(/\s+/).filter(w => w.length > 0).length
      const paragraphCount = editorContent.split(/\n\n+/).filter(p => p.trim().length > 0).length
      
      // Extrahiere Überschriften
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
        headings: headings.slice(0, 10), // Erste 10 Überschriften
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
      
      devLog('📤 [GENERAL AGENT] getEditorContent Response:', {
        wordCount,
        characterCount,
        paragraphCount,
        headingCount: headings.length,
      })
      
      return response
    },
  })
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            devError('[GENERAL AGENT] Nicht authentifiziert:', authError?.message)
            return NextResponse.json(
                { error: 'Nicht authentifiziert' },
                { status: 401 }
            )
        }

        const { messages, agentState, editorContent, documentContextEnabled, fileContents } = await req.json()

        if (!agentState) {
            return NextResponse.json({ error: 'Agent State erforderlich' }, { status: 400 })
        }
        
        const currentEditorContent: string = editorContent || ''

        let thema = agentState.thema
        if (!thema && messages && messages.length > 0) {
            const firstUserMessage = messages.find((m: any) => m.role === 'user')
            if (firstUserMessage?.content) {
                thema = firstUserMessage.content.substring(0, 200) || 'Allgemeine Schreibarbeit'
            } else {
                thema = 'Allgemeine Schreibarbeit'
            }
        } else if (!thema) {
            thema = 'Allgemeine Schreibarbeit'
        }

        const createLibraryTool = createLibraryToolWithUser(user.id)
        const addSourcesToLibraryTool = addSourcesToLibraryToolWithUser(user.id)
        const getLibrarySourcesTool = getLibrarySourcesToolWithUser(user.id)
        const getEditorContentTool = createGetEditorContentTool(currentEditorContent)

        const model = deepseek(DEEPSEEK_CHAT_MODEL)
        let systemPrompt = GENERAL_AGENT_PROMPT.replace(
            '{{THEMA}}',
            thema
        ).replace('{{CURRENT_DATE}}', new Date().toLocaleDateString('de-DE', { dateStyle: 'full' }))

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
                const fileContentSection = `\n\n## Hochgeladene Dateien

Der Nutzer hat folgende Dateien hochgeladen. Beziehe dich auf deren Inhalt, wenn der Nutzer danach fragt oder wenn es relevant ist:

${fileSections.join('\n\n---\n\n')}`
                systemPrompt += fileContentSection
                devLog('[GENERAL AGENT] Datei-Content aktiviert:', { fileCount: fileContents.length })
            }
        }

        if (documentContextEnabled && currentEditorContent.trim().length > 0) {
          const wordCount = currentEditorContent.split(/\s+/).filter(w => w.length > 0).length
          const headings = currentEditorContent.match(/^#{1,6}\s.+$/gm) || []
          
          const truncatedContent = currentEditorContent.length > 8000 
            ? currentEditorContent.substring(0, 8000) + '\n\n[... Text gekürzt ...]'
            : currentEditorContent
          
          const editorContextSection = `

## Aktueller Editor-Inhalt (Kontext aktiviert)

Der Nutzer hat den Dokumentkontext aktiviert. Hier ist der aktuelle Inhalt des Editors:

**Statistiken:** ${wordCount} Wörter, ${headings.length} Überschriften

**Aktueller Text:**
\`\`\`
${truncatedContent}
\`\`\`

**WICHTIG**: Beziehe dich auf diesen vorhandenen Text, wenn der Nutzer danach fragt oder wenn es relevant ist. Du kannst den Text analysieren, Verbesserungen vorschlagen oder darauf aufbauen.
`
          systemPrompt += editorContextSection
          devLog('[GENERAL AGENT] Editor-Kontext hinzugefügt:', { wordCount, headingsCount: headings.length })
        }

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
            stopWhen: stepCountIs(30),
            maxOutputTokens: 16384,
            onStepFinish: (result) => {
                if (result.text) {
                    devLog(`   Text-Länge: ${result.text.length} Zeichen`)
                }
                if (result.toolCalls && result.toolCalls.length > 0) {
                    devLog(`   Tool-Calls: ${result.toolCalls.map((tc: { toolName: string }) => tc.toolName).join(', ')}`)
                }
                if (result.toolResults && result.toolResults.length > 0) {
                    devLog(`   Tool-Results: ${result.toolResults.length}`)
                }
            },
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
        let stepCount = 0
        let lastEventTime = Date.now()
        let isReasoningPhase = false
        
        const customStream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of agentStream.fullStream) {
                        const now = Date.now()
                        const timeSinceLastEvent = now - lastEventTime
                        lastEventTime = now
                        
                        if (event.type !== 'text-delta') {
                        }
                        
                        if (event.type === 'reasoning-start') {
                            isReasoningPhase = true
                            continue
                        }
                        
                        if (event.type === 'reasoning-delta' || event.type === 'reasoning-end') {
                            isReasoningPhase = event.type === 'reasoning-delta'
                            const reasoningText = 'textDelta' in event ? (event as { textDelta: string }).textDelta : ''
                            if (reasoningText && reasoningText.length > 0) {
                                const reasoningMarker = `[REASONING_DELTA:${Buffer.from(reasoningText).toString('base64')}]`
                                controller.enqueue(encoder.encode(reasoningMarker))
                            }
                            if (event.type === 'reasoning-end') {
                            }
                            continue
                        }
                        
                        if (event.type === 'start') {
                            stepCount++
                            isReasoningPhase = false
                            continue
                        }
                        
                        if (event.type === 'tool-call') {
                            isReasoningPhase = false
                            const stepId = `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
                            toolStepTimestamps[event.toolCallId] = Date.now()
                            toolStepIds[event.toolCallId] = stepId
                            
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
                            isReasoningPhase = false
                            const textContent = 'text' in event ? event.text : ''
                            if (textContent) {
                                controller.enqueue(encoder.encode(textContent))
                            }
                        } else if (event.type === 'finish') {
                        } else if (event.type === 'error') {
                            const errorMessage = 'error' in event ? String(event.error) : 'Unbekannter Fehler'
                            
                            const errorMarker = `\n\n**Fehler:** Es ist ein Problem aufgetreten. Bitte versuche es erneut.\n`
                            controller.enqueue(encoder.encode(errorMarker))
                        }
                    }
                    controller.close()
                } catch (error) {
                    
                    try {
                        const errorMarker = `\n\n**Fehler:** Die Verarbeitung wurde unterbrochen. Bitte versuche es erneut.\n`
                        controller.enqueue(encoder.encode(errorMarker))
                    } catch (e) {
                    }
                    
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
        return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 })
    }
}
