import { tool, generateObject } from 'ai'
import { z } from 'zod'
import { Buffer } from 'node:buffer'
import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { SourceFetcher } from '@/lib/sources/source-fetcher'
import type { NormalizedSource } from '@/lib/sources/types'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'

const queryLanguage = async () => {
  try {
    return await getLanguageForServer()
  } catch {
    return 'de'
  }
}

function createToolStepMarker(
  type: 'start' | 'end',
  data: {
    id: string
    toolName: string
    input?: Record<string, unknown>
    output?: Record<string, unknown>
    status?: 'completed' | 'error'
    error?: string
  }
): string {
  const payload = JSON.stringify(data)
  const base64 = Buffer.from(payload).toString('base64')
  return type === 'start' ? `[TOOL_STEP_START:${base64}]` : `[TOOL_STEP_END:${base64}]`
}

function generateToolStepId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

// Helper: Generiere konsistente Source-ID (gleiche Format wie in library-tools)
function generateSourceId(): string {
  return `src-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// Helper: Quellen nach Relevanz sortieren
function analyzeAndRankSources(
  sources: NormalizedSource[],
  thema: string,
  keywords: string[]
): Array<NormalizedSource & { relevanceScore: number; rankingScore: number }> {
  const themaLower = thema.toLowerCase()
  const keywordsLower = keywords.map((k) => k.toLowerCase())
  const themaWords = themaLower
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !['von', 'aus', 'der', 'die', 'das', 'und', 'oder'].includes(w))

  return sources
    .map((source) => {
      let relevanceScore = 0
      const titleLower = source.title?.toLowerCase() || ''
      const abstractLower = source.abstract?.toLowerCase() || ''

      if (themaWords.some((word) => titleLower.includes(word))) relevanceScore += 30
      keywordsLower.forEach((keyword) => {
        if (titleLower.includes(keyword.toLowerCase())) relevanceScore += 20
      })
      const keywordMatches = keywordsLower.filter((k) => titleLower.includes(k.toLowerCase())).length
      if (keywordMatches > 1) relevanceScore += 10 * (keywordMatches - 1)
      if (themaWords.some((word) => abstractLower.includes(word))) relevanceScore += 20
      keywordsLower.forEach((keyword) => {
        if (abstractLower.includes(keyword.toLowerCase())) relevanceScore += 10
      })
      source.keywords?.forEach((keyword) => {
        const kwLower = keyword.toLowerCase()
        if (keywordsLower.some((k) => kwLower.includes(k.toLowerCase()) || k.toLowerCase().includes(kwLower))) {
          relevanceScore += 10
        }
      })

      const impactScore = source.impactFactor ? source.impactFactor * 2 : 0
      const citationScore = source.citationCount ? Math.min(source.citationCount / 10, 20) : 0
      const openAccessBonus = source.isOpenAccess ? 5 : 0
      const completenessBonus = source.completeness * 5
      const rankingScore = relevanceScore + impactScore + citationScore + openAccessBonus + completenessBonus

      return { ...source, relevanceScore, rankingScore }
    })
    .sort((a, b) => b.rankingScore - a.rankingScore)
}

export const searchSourcesTool = tool({
  description: 'Suche nach wissenschaftlichen Quellen für die Literaturrecherche. Durchsucht 14+ Datenbanken parallel.',
  inputSchema: z.object({
    query: z.string().describe('Suchbegriff oder Thema'),
    thema: z.string().describe('Thema der Arbeit (für Relevanz-Bewertung)'),
    type: z.enum(['keyword', 'title', 'author', 'doi']).optional().describe('Suchtyp (Standard: keyword)'),
    limit: z.number().min(10).max(100).optional().describe('Anzahl der Suchergebnisse (Standard: 50)'),
    keywords: z.array(z.string()).optional().describe('Zusätzliche Keywords'),
    autoAnalyze: z.boolean().optional().describe('Automatisch analysieren (Standard: true)'),
    maxResults: z.number().min(10).max(50).optional().describe('Max. ausgewählte Quellen (Standard: 30)'),
  }),
  execute: async ({
    query,
    thema,
    type = 'keyword',
    limit = 50,
    keywords = [],
    autoAnalyze = true,
    maxResults = 30,
  }) => {
    const language = await queryLanguage()
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

      if (autoAnalyze && results.sources.length > 0) {
        const analyzed = analyzeAndRankSources(results.sources, thema, keywords)
        const filtered = analyzed.filter((s) => s.relevanceScore >= 30)
        const selected = filtered.slice(0, maxResults)

        const messageTemplate = translations[language as Language]?.askAi?.toolSearchSourcesFound || '{count} Quellen gefunden und analysiert.'
        const message = messageTemplate.replace('{count}', selected.length.toString())

        return {
          success: true,
          totalResults: results.totalResults,
          sources: selected,
          apis: validApis,
          searchTime: results.searchTime,
          analyzed: true,
          message,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: { totalResults: results.totalResults, selectedCount: selected.length },
          }),
        }
      }

      const messageTemplate = translations[language as Language]?.askAi?.toolSearchSourcesFound || '{count} Quellen gefunden.'
      const message = messageTemplate.replace('{count}', results.sources.length.toString())

      return {
        success: true,
        totalResults: results.totalResults,
        sources: results.sources.slice(0, limit),
        apis: validApis,
        searchTime: results.searchTime,
        analyzed: false,
        message,
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

export const analyzeSourcesTool = tool({
  description: 'Analysiere gefundene Quellen nach Relevanz, Impact-Faktor und Zitaten mit LLM.',
  inputSchema: z.object({
    sources: z.array(z.object({}).passthrough()),
    thema: z.string(),
    keywords: z.array(z.string()).optional(),
    minRelevanceScore: z.number().optional(),
    maxResults: z.number().min(10).max(50).optional(),
  }),
  execute: async ({ sources, thema, keywords = [], minRelevanceScore = 50, maxResults = 30 }) => {
    const language = await queryLanguage()
    try {
      const model = deepseek(DEEPSEEK_CHAT_MODEL)
      const noAbstractText = translations[language as Language]?.askAi?.toolNoAbstractAvailable || 'Kein Abstract verfügbar'

      const sourcesForEvaluation = (sources as unknown as NormalizedSource[]).map((source) => ({
        id: source.id || generateSourceId(),
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

      const prompt = `Bewerte die folgenden wissenschaftlichen Quellen hinsichtlich ihrer Relevanz für das Thema: "${thema}".
${keywords.length > 0 ? `Keywords: ${keywords.join(', ')}` : ''}

Quellen:
${JSON.stringify(sourcesForEvaluation.map(s => ({
        id: s.id,
        title: s.title,
        abstract: s.abstract || noAbstractText,
        year: s.year,
      })), null, 2)}

Bewerte jede Quelle mit einem relevanceScore (0-100) und isRelevant (boolean).`

      const { object } = await generateObject({
        model,
        schema: z.object({
          evaluations: z.array(z.object({
            id: z.string(),
            relevanceScore: z.number().min(0).max(100),
            isRelevant: z.boolean(),
            reason: z.string(),
          }))
        }),
        prompt,
      })

      const analyzed = sourcesForEvaluation.map((source) => {
        const evaluation = object.evaluations.find((e) => e.id === source.id)
        return {
          ...source,
          relevanceScore: evaluation?.relevanceScore || 0,
          isRelevant: evaluation?.isRelevant || false,
          reason: evaluation?.reason || 'Keine Bewertung',
        }
      })

      const filtered = analyzed.filter((s) => s.relevanceScore >= minRelevanceScore && s.isRelevant)
      const selected = filtered.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, maxResults)

      return {
        success: true,
        selected,
        totalAnalyzed: analyzed.length,
        totalSelected: selected.length,
        message: `${selected.length} von ${analyzed.length} Quellen ausgewählt.`,
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
})

export const evaluateSourcesTool = tool({
  description: 'Bewertet die Relevanz von Quellen basierend auf Titel und Abstract mit LLM.',
  inputSchema: z.object({
    sources: z.array(z.object({
      id: z.string(),
      title: z.string(),
      abstract: z.string().optional(),
      year: z.number().optional().or(z.string().optional()),
    })),
    thema: z.string(),
  }),
  execute: async ({ sources, thema }) => {
    const language = await queryLanguage()
    try {
      const model = deepseek(DEEPSEEK_CHAT_MODEL)
      const noAbstractText = translations[language as Language]?.askAi?.toolNoAbstractAvailable || 'Kein Abstract verfügbar'

      const prompt = `Bewerte die folgenden wissenschaftlichen Quellen für das Thema: "${thema}".

Quellen:
${JSON.stringify(sources.map(s => ({
        id: s.id,
        title: s.title,
        abstract: s.abstract || noAbstractText,
        year: s.year
      })), null, 2)}`

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

      return sources.map(source => {
        const evaluation = object.evaluations.find(e => e.id === source.id)
        return {
          ...source,
          relevanceScore: evaluation?.relevanceScore || 0,
          isRelevant: evaluation?.isRelevant || false,
          evaluationReason: evaluation?.reason || 'Keine Bewertung'
        }
      }).sort((a, b) => b.relevanceScore - a.relevanceScore)
    } catch (error) {
      return sources.map(s => ({ ...s, evaluationError: true }))
    }
  }
})
