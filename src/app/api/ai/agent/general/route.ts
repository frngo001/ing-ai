import type { NextRequest } from 'next/server'
import { Buffer } from 'node:buffer'
import { Experimental_Agent as Agent, stepCountIs, tool, generateObject } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { SourceFetcher } from '@/lib/sources/source-fetcher'
import type { NormalizedSource } from '@/lib/sources/types'
import { GENERAL_AGENT_PROMPT } from './prompts'

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
            if (themaWords.some((word) => titleLower.includes(word))) {
                relevanceScore += 30
            }
            keywordsLower.forEach((keyword) => {
                if (titleLower.includes(keyword.toLowerCase())) {
                    relevanceScore += 20
                }
            })
            const keywordMatches = keywordsLower.filter((k) => titleLower.includes(k.toLowerCase())).length
            if (keywordMatches > 1) {
                relevanceScore += 10 * (keywordMatches - 1)
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
                relevanceScore -= 50
            }

            const impactScore = source.impactFactor ? source.impactFactor * 2 : 0
            const citationScore = source.citationCount
                ? Math.min(source.citationCount / 10, 20)
                : 0
            const openAccessBonus = source.isOpenAccess ? 5 : 0
            const completenessBonus = source.completeness * 5

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

// Tool: Quellen suchen und automatisch analysieren
const searchSourcesTool = tool({
    description:
        'Suche nach wissenschaftlichen Quellen für die Literaturrecherche. Durchsucht 14+ Datenbanken parallel und analysiert automatisch die besten Quellen. GIB IMMER das Thema mit an für die automatische Analyse!',
    inputSchema: z.object({
        query: z.string().describe('Suchbegriff oder Thema'),
        thema: z.string().describe('Thema der Arbeit (für Relevanz-Bewertung bei autoAnalyze)'),
        type: z.enum(['keyword', 'title', 'author', 'doi']).optional().describe('Suchtyp (Standard: keyword)'),
        limit: z.number().min(10).max(100).optional().describe('Anzahl der Suchergebnisse (Standard: 50)'),
        keywords: z.array(z.string()).optional().describe('Zusätzliche Keywords für bessere Relevanz'),
        autoAnalyze: z.boolean().optional().describe('Automatisch die besten Quellen analysieren und auswählen (Standard: true)'),
        maxResults: z.number().min(10).max(50).optional().describe('Maximale Anzahl analysierter und ausgewählter Quellen (Standard: 30)'),
        preferHighImpact: z.boolean().optional().describe('Bevorzuge Quellen mit hohem Impact-Faktor (Standard: true)'),
        preferHighCitations: z.boolean().optional().describe('Bevorzuge Quellen mit vielen Zitaten (Standard: true)'),
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
        try {
            const fetcher = new SourceFetcher({
                maxParallelRequests: 5,
                useCache: true,
                excludedApis: ['semanticscholar', 'biorxiv', 'arxiv', 'opencitations', 'zenodo', 'pubmed'],
            })

            const startTime = Date.now()
            const results = await fetcher.search({ query, type, limit })
            const searchTime = Date.now() - startTime
            const validApis = results.apis?.filter((api): api is string => typeof api === 'string' && api.length > 0) || []

            if (autoAnalyze && thema) {
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

                const maxSelected = Math.min(maxResults, 15)
                const selected = filtered.slice(0, maxSelected)

                const selectedWithReason = selected.map((source) => {
                    const authorsString = source.authors
                        ?.map((a) => a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim())
                        .filter(Boolean)
                        .join(', ') || 'Unbekannt'

                    const authorsShort = authorsString.length > 200 ? authorsString.substring(0, 197) + '...' : authorsString
                    const titleShort = (source.title || 'Ohne Titel').length > 200 ? (source.title || 'Ohne Titel').substring(0, 197) + '...' : (source.title || 'Ohne Titel')
                    const reasonShort = generateSourceReason(source, thema)
                    const reason = reasonShort.length > 150 ? reasonShort.substring(0, 147) + '...' : reasonShort

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
                        rankingScore: Math.round(source.rankingScore * 100) / 100,
                        reason: reason,
                    }
                })

                return {
                    success: true,
                    totalResults: results.totalResults,
                    sourcesFound: results.sources.length,
                    selected: selectedWithReason,
                    totalSelected: selectedWithReason.length,
                    message: `Ich habe ${selectedWithReason.length} relevante Quellen für dein Thema gefunden und analysiert.`,
                    apis: validApis,
                    searchTime: results.searchTime,
                }
            }

            return {
                success: true,
                totalResults: results.totalResults,
                sources: results.sources.slice(0, limit),
                apis: validApis,
                searchTime: results.searchTime,
            }
        } catch (error) {
            console.error('Source search error:', error)
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    },
})

// Tool: Quellen analysieren
const analyzeSourcesTool = tool({
    description: 'Analysiere gefundene Quellen nach Relevanz, Impact-Faktor und Zitaten. Wählt die besten Quellen aus.',
    inputSchema: z.object({
        sources: z.array(z.object({}).passthrough()),
        thema: z.string(),
        keywords: z.array(z.string()).optional(),
        minRelevanceScore: z.number().optional(),
        preferHighImpact: z.boolean().optional(),
        preferHighCitations: z.boolean().optional(),
        maxResults: z.number().min(10).max(50).optional(),
    }),
    execute: async ({ sources, thema, keywords = [], minRelevanceScore = 30, preferHighImpact = false, preferHighCitations = true, maxResults = 30 }) => {
        try {
            const analyzed = analyzeAndRankSources(sources as unknown as NormalizedSource[], thema, keywords)
            let filtered = analyzed.filter((s) => s.relevanceScore >= minRelevanceScore)

            if (preferHighImpact) {
                filtered = filtered.sort((a, b) => (b.impactFactor || 0) - (a.impactFactor || 0))
            }
            if (preferHighCitations) {
                filtered = filtered.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
            }

            const selected = filtered.slice(0, maxResults)

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

            return {
                success: true,
                selected: selectedWithReason,
                totalAnalyzed: analyzed.length,
                totalSelected: selectedWithReason.length,
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
        Kriterien: 1. Themenpassung, 2. Aktualität, 3. Wissenschaftlichkeit.
        Quellen: ${JSON.stringify(sources.map(s => ({ id: s.id, title: s.title, abstract: s.abstract?.substring(0, 300) })), null, 2)}
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

// Tool: Library Tools
const createLibraryTool = tool({
    description: 'Erstellt eine neue Bibliothek.',
    inputSchema: z.object({ name: z.string() }),
    execute: async ({ name }) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const response = await fetch(`${baseUrl}/api/library`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'createLibrary', libraryName: name }),
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            return { success: true, libraryId: result.library.id, libraryName: result.library.name }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    },
})

const addSourcesToLibraryTool = tool({
    description: 'Fügt Quellen zu einer Bibliothek hinzu.',
    inputSchema: z.object({ libraryId: z.string(), sources: z.array(z.object({}).passthrough()) }),
    execute: async ({ libraryId, sources }) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const response = await fetch(`${baseUrl}/api/library`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'addSources', libraryId, sources }),
            })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            return { success: true, added: result.added, message: result.message }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    },
})

const getLibrarySourcesTool = tool({
    description: 'Ruft Quellen aus einer Bibliothek ab.',
    inputSchema: z.object({ libraryId: z.string() }),
    execute: async ({ libraryId }) => {
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
            const response = await fetch(`${baseUrl}/api/library?id=${libraryId}`)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            return { success: true, sources: result.library.citations, count: result.library.citations.length }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
        }
    },
})

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

const getCurrentStepTool = tool({
    description: 'Ruft den aktuellen Schritt ab',
    inputSchema: z.object({ _placeholder: z.string().optional() }),
    execute: async () => ({ message: 'Verwende den Agent State Store' }),
})

export async function POST(req: NextRequest) {
    try {
        const { messages, agentState } = await req.json()

        if (!agentState || !agentState.thema) {
            return NextResponse.json({ error: 'Agent State mit Thema erforderlich' }, { status: 400 })
        }

        const model = deepseek(DEEPSEEK_CHAT_MODEL)
        const systemPrompt = GENERAL_AGENT_PROMPT.replace(
            '{{THEMA}}',
            agentState.thema || ''
        ).replace('{{CURRENT_DATE}}', new Date().toLocaleDateString('de-DE', { dateStyle: 'full' }))

        const agent = new Agent({
            model,
            system: systemPrompt,
            tools: {
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

        const stream = agent.stream({
            messages: messages.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
            })),
        })

        return stream.toTextStreamResponse()
    } catch (error) {
        console.error('Agent error:', error)
        return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 })
    }
}
