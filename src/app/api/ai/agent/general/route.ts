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
            }
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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

        if (!agentState) {
            return NextResponse.json({ error: 'Agent State erforderlich' }, { status: 400 })
        }

        // Für general-Modus: Wenn kein Thema vorhanden ist, extrahiere es aus der ersten Nachricht
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

        const model = deepseek(DEEPSEEK_CHAT_MODEL)
        const systemPrompt = GENERAL_AGENT_PROMPT.replace(
            '{{THEMA}}',
            thema
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
        return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 })
    }
}
