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

// Helper: Generiere konsistente Source-ID (UUID für DB)
function generateSourceId(): string {
  return crypto.randomUUID()
}

// ============================================================================
// Parallel Batch Processing Helpers
// ============================================================================

/**
 * Split array into chunks of specified size
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Process batches in parallel with Promise.allSettled
 * Returns all successful results, ignoring failed batches
 */
async function processBatchesInParallel<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[], batchIndex: number) => Promise<R[]>
): Promise<{ results: R[]; successCount: number; failCount: number }> {
  const batches = chunkArray(items, batchSize)
  const startTime = Date.now()

  console.log(`[ParallelBatch] Processing ${items.length} items in ${batches.length} batches...`)

  const results = await Promise.allSettled(
    batches.map((batch, index) => processor(batch, index))
  )

  const successfulResults = results
    .filter((r): r is PromiseFulfilledResult<R[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)

  const failCount = results.filter(r => r.status === 'rejected').length

  console.log(`[ParallelBatch] Completed in ${Date.now() - startTime}ms (${batches.length - failCount}/${batches.length} batches succeeded)`)

  return {
    results: successfulResults,
    successCount: batches.length - failCount,
    failCount
  }
}

// ============================================================================
// Qualitätsbewertung für wissenschaftliche Quellen
// ============================================================================

interface QualityMetrics {
  peerReviewScore: number      // 0-30: Peer-reviewed > Preprint > Unknown
  journalQualityScore: number  // 0-25: High-impact > Low-impact
  citationScore: number        // 0-20: Basierend auf Zitationen
  recencyScore: number         // 0-15: Aktueller = besser (außer Klassiker)
  completenessScore: number    // 0-10: Vollständigkeit der Metadaten
  totalScore: number           // 0-100
}

// Hochwertige Journals (Impact Factor > 5)
const HIGH_IMPACT_JOURNALS = [
  'nature', 'science', 'cell', 'lancet', 'nejm', 'jama', 'bmj',
  'proceedings of the national academy', 'pnas', 'plos one', 'plos biology',
  'journal of the american', 'annual review', 'frontiers in',
  'springer', 'wiley', 'elsevier', 'oxford', 'cambridge',
  'ieee', 'acm', 'computer', 'artificial intelligence',
]

// Bekannte Verlage für wissenschaftliche Literatur
const REPUTABLE_PUBLISHERS = [
  'springer', 'wiley', 'elsevier', 'oxford university press', 'cambridge university press',
  'nature publishing', 'taylor & francis', 'sage', 'ieee', 'acm',
  'american chemical society', 'royal society', 'american physical society',
]

// Preprint-Server (niedrigere Qualität, nicht peer-reviewed)
const PREPRINT_SOURCES = ['arxiv', 'biorxiv', 'medrxiv', 'ssrn', 'preprint', 'osf']

// Helper: Sicher zu String konvertieren
function safeToLowerCase(value: unknown): string {
  if (typeof value === 'string') return value.toLowerCase()
  if (value && typeof value === 'object' && 'name' in value) {
    return String((value as { name: string }).name).toLowerCase()
  }
  return String(value || '').toLowerCase()
}

function calculateQualityMetrics(source: NormalizedSource, thema: string, keywords: string[]): QualityMetrics {
  const currentYear = new Date().getFullYear()
  const titleLower = safeToLowerCase(source.title)
  const abstractLower = safeToLowerCase(source.abstract)
  const journalLower = safeToLowerCase(source.journal)
  const publisherLower = safeToLowerCase(source.publisher)
  const sourceApiLower = safeToLowerCase(source.sourceApi)

  // 1. Peer-Review Score (0-30)
  let peerReviewScore = 15 // Default: Unknown

  // Preprints bekommen niedrigeren Score
  if (source.type === 'preprint' ||
    PREPRINT_SOURCES.some(p => sourceApiLower.includes(p) || journalLower.includes(p))) {
    peerReviewScore = 5
  }
  // Journal Articles bekommen höheren Score
  else if (source.type === 'journal' || source.doi) {
    peerReviewScore = 25
    // Bonus für bekannte Verlage
    if (REPUTABLE_PUBLISHERS.some(pub => publisherLower.includes(pub))) {
      peerReviewScore = 30
    }
  }
  // Conference Papers
  else if (source.type === 'conference') {
    peerReviewScore = 22
  }

  // 2. Journal Quality Score (0-25)
  let journalQualityScore = 10 // Default

  if (HIGH_IMPACT_JOURNALS.some(j => journalLower.includes(j))) {
    journalQualityScore = 25
  } else if (source.impactFactor) {
    if (source.impactFactor >= 10) journalQualityScore = 25
    else if (source.impactFactor >= 5) journalQualityScore = 20
    else if (source.impactFactor >= 2) journalQualityScore = 15
    else journalQualityScore = 10
  } else if (REPUTABLE_PUBLISHERS.some(pub => publisherLower.includes(pub))) {
    journalQualityScore = 18
  }

  // 3. Citation Score (0-20)
  let citationScore = 0
  if (source.citationCount) {
    if (source.citationCount >= 500) citationScore = 20
    else if (source.citationCount >= 100) citationScore = 17
    else if (source.citationCount >= 50) citationScore = 14
    else if (source.citationCount >= 20) citationScore = 10
    else if (source.citationCount >= 5) citationScore = 6
    else citationScore = 2
  }

  // 4. Recency Score (0-15)
  let recencyScore = 5 // Default
  if (source.publicationYear) {
    const age = currentYear - source.publicationYear
    if (age <= 2) recencyScore = 15        // Sehr aktuell
    else if (age <= 5) recencyScore = 12   // Aktuell
    else if (age <= 10) recencyScore = 9   // Noch relevant
    else if (age <= 20) recencyScore = 6   // Älter
    else recencyScore = 3                   // Sehr alt

    // Bonus für viel zitierte ältere Werke (Klassiker)
    if (age > 10 && source.citationCount && source.citationCount >= 500) {
      recencyScore = Math.min(recencyScore + 5, 15)
    }
  }

  // 5. Completeness Score (0-10)
  let completenessScore = source.completeness * 10

  // 6. Relevanz-Bonus basierend auf Thema-Match
  const themaWords = thema.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const keywordsLower = keywords.map(k => k.toLowerCase())

  let relevanceBonus = 0

  // Titel-Match ist am wichtigsten
  themaWords.forEach(word => {
    if (titleLower.includes(word)) relevanceBonus += 3
  })
  keywordsLower.forEach(keyword => {
    if (titleLower.includes(keyword)) relevanceBonus += 4
  })

  // Abstract-Match
  themaWords.forEach(word => {
    if (abstractLower.includes(word)) relevanceBonus += 1
  })
  keywordsLower.forEach(keyword => {
    if (abstractLower.includes(keyword)) relevanceBonus += 2
  })

  // Total Score berechnen
  const baseScore = peerReviewScore + journalQualityScore + citationScore + recencyScore + completenessScore
  const totalScore = Math.min(100, baseScore + relevanceBonus)

  return {
    peerReviewScore,
    journalQualityScore,
    citationScore,
    recencyScore,
    completenessScore,
    totalScore,
  }
}

// ============================================================================
// Verbesserte Quellenanalyse und Ranking
// ============================================================================

interface RankedSource extends NormalizedSource {
  qualityMetrics: QualityMetrics
  qualityScore: number
  relevanceScore: number
  overallScore: number
  qualityTier: 'high' | 'medium' | 'low'
}

function analyzeAndRankSources(
  sources: NormalizedSource[],
  thema: string,
  keywords: string[],
  preferHighCitations: boolean = true
): RankedSource[] {
  const rankedSources = sources.map((source): RankedSource => {
    const metrics = calculateQualityMetrics(source, thema, keywords)

    // Bestimme Quality Tier
    let qualityTier: 'high' | 'medium' | 'low' = 'low'
    if (metrics.totalScore >= 70) qualityTier = 'high'
    else if (metrics.totalScore >= 45) qualityTier = 'medium'

    return {
      ...source,
      qualityMetrics: metrics,
      qualityScore: metrics.totalScore,
      relevanceScore: metrics.totalScore, // Für Kompatibilität
      overallScore: metrics.totalScore,
      qualityTier,
    }
  })

  // Sortieren: Zuerst nach Qualität, dann nach Zitationen wenn gewünscht
  return rankedSources.sort((a, b) => {
    // Primär: Overall Score
    const scoreDiff = b.overallScore - a.overallScore
    if (Math.abs(scoreDiff) > 5) return scoreDiff

    // Sekundär: Zitationen (wenn preferHighCitations)
    if (preferHighCitations) {
      const citationDiff = (b.citationCount || 0) - (a.citationCount || 0)
      if (citationDiff !== 0) return citationDiff
    }

    // Tertiär: Aktualität
    const yearDiff = (b.publicationYear || 0) - (a.publicationYear || 0)
    return yearDiff
  })
}

// ============================================================================
// Search Sources Tool (VERBESSERT)
// ============================================================================

export const searchSourcesTool = tool({
  description: `Suche nach wissenschaftlichen Quellen für die Literaturrecherche.

DATENBANKEN: OpenAlex, Semantic Scholar, CrossRef, PubMed, CORE, Europe PMC, DOAJ, BASE, PLOS, DataCite
(14+ Datenbanken werden parallel durchsucht)

QUALITÄTSBEWERTUNG:
- Peer-Review Status (30%): Journal > Conference > Preprint
- Journal-Qualität (25%): High-Impact > Low-Impact
- Zitationen (20%): Mehr = besser
- Aktualität (15%): Neuer = besser (außer Klassiker)
- Vollständigkeit (10%): Metadaten-Qualität

NUR QUELLEN MIT QUALITY-SCORE >= 50 WERDEN ZURÜCKGEGEBEN!`,
  inputSchema: z.object({
    query: z.string().describe('Suchbegriff oder Thema'),
    thema: z.string().describe('Thema der Arbeit (für Relevanz-Bewertung)'),
    type: z.enum(['keyword', 'title', 'author', 'doi']).optional().describe('Suchtyp (Standard: keyword)'),
    limit: z.number().min(10).max(100).optional().describe('Anzahl der Suchergebnisse pro API (Standard: 40)'),
    keywords: z.array(z.string()).optional().describe('Zusätzliche Keywords für bessere Relevanz-Bewertung'),
    preferHighCitations: z.boolean().optional().describe('Bevorzuge viel zitierte Quellen (Standard: true)'),
    maxResults: z.number().min(5).max(50).optional().describe('Max. zurückgegebene Quellen (Standard: 25)'),
    minQualityScore: z.number().min(0).max(100).optional().describe('Minimum Quality Score (Standard: 50)'),
    includePreprints: z.boolean().optional().describe('Preprints einschließen (Standard: false)'),
  }),
  execute: async ({
    query,
    thema,
    type = 'keyword',
    limit = 40,
    keywords = [],
    preferHighCitations = true,
    maxResults = 25,
    minQualityScore = 50,
    includePreprints = false,
  }) => {
    const language = await queryLanguage()
    const stepId = generateToolStepId()
    const toolName = 'searchSources'

    try {
      // WICHTIG: Beste APIs verwenden!
      // OpenAlex und Semantic Scholar sind die wichtigsten
      const fetcher = new SourceFetcher({
        maxParallelRequests: 6,
        useCache: true,
        // Nur APIs ausschließen, die problematisch sind
        excludedApis: includePreprints
          ? ['opencitations', 'zenodo'] // Behalte arxiv, biorxiv wenn Preprints erlaubt
          : ['opencitations', 'zenodo', 'arxiv', 'biorxiv'], // Keine Preprints
      })

      const results = await fetcher.search({ query, type, limit })
      const validApis = results.apis?.filter((api): api is string => typeof api === 'string' && api.length > 0) || []

      if (results.sources.length === 0) {
        return {
          success: true,
          totalResults: 0,
          sources: [],
          apis: validApis,
          searchTime: results.searchTime,
          message: 'Keine Quellen gefunden. Versuche andere Suchbegriffe.',
        }
      }

      // Qualitätsbewertung und Ranking
      const analyzed = analyzeAndRankSources(results.sources, thema, keywords, preferHighCitations)

      // Filtern nach Qualität
      const filtered = analyzed.filter((s) => {
        // Minimum Quality Score
        if (s.qualityScore < minQualityScore) return false

        // Preprints filtern wenn nicht erlaubt
        if (!includePreprints && s.qualityTier === 'low' && s.qualityMetrics.peerReviewScore < 10) {
          return false
        }

        return true
      })

      // Beste Quellen auswählen
      const selected = filtered.slice(0, maxResults)

      // Statistiken für die Antwort
      const highQualityCount = selected.filter(s => s.qualityTier === 'high').length
      const mediumQualityCount = selected.filter(s => s.qualityTier === 'medium').length

      const messageTemplate = translations[language as Language]?.askAi?.toolSearchSourcesFound || '{count} Quellen gefunden und analysiert.'
      const message = messageTemplate.replace('{count}', selected.length.toString())

      return {
        success: true,
        totalResults: results.totalResults,
        totalAnalyzed: analyzed.length,
        totalSelected: selected.length,
        qualityDistribution: {
          high: highQualityCount,
          medium: mediumQualityCount,
          low: selected.length - highQualityCount - mediumQualityCount,
        },
        sources: selected.map(s => ({
          ...s,
          // Stelle sicher, dass ID generiert wird
          id: s.id || generateSourceId(),
        })),
        apis: validApis,
        searchTime: results.searchTime,
        analyzed: true,
        message: `${message} (${highQualityCount} hochwertig, ${mediumQualityCount} mittel)`,
        _toolStep: createToolStepMarker('end', {
          id: stepId,
          toolName,
          status: 'completed',
          output: {
            totalResults: results.totalResults,
            selectedCount: selected.length,
            highQuality: highQualityCount,
          },
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

// ============================================================================
// Analyze Sources Tool (PARALLEL BATCH PROCESSING)
// ============================================================================

export const analyzeSourcesTool = tool({
  description: `Analysiere gefundene Quellen mit LLM für semantische Relevanz-Bewertung.

Nutze dieses Tool NACH searchSources um die Relevanz der Quellen zum spezifischen Thema zu bewerten.
Das LLM bewertet den inhaltlichen Zusammenhang zwischen Quelle und Thema.

KAPAZITÄT: Bis zu 30 Quellen werden PARALLEL in 5 Batches analysiert!`,
  inputSchema: z.object({
    sources: z.array(z.object({}).passthrough()).describe('Quellen von searchSources (max. 30)'),
    thema: z.string().describe('Thema der Arbeit'),
    keywords: z.array(z.string()).optional().describe('Wichtige Keywords'),
    minRelevanceScore: z.number().optional().describe('Minimum Relevanz-Score (Standard: 60)'),
    maxResults: z.number().min(5).max(30).optional().describe('Max. Quellen (Standard: 25)'),
  }),
  execute: async ({ sources, thema, keywords = [], minRelevanceScore = 60, maxResults = 25 }) => {
    const language = await queryLanguage()
    const startTime = Date.now()

    try {
      const model = deepseek(DEEPSEEK_CHAT_MODEL)
      const noAbstractText = translations[language as Language]?.askAi?.toolNoAbstractAvailable || 'Kein Abstract verfügbar'

      // Quellen für LLM vorbereiten (Max 30)
      const sourcesForEvaluation = (sources as unknown as NormalizedSource[])
        .slice(0, 30)
        .map((source) => ({
          id: source.id || generateSourceId(),
          title: source.title || 'Ohne Titel',
          abstract: source.abstract?.substring(0, 400) || '',
          authors: source.authors?.map((a) => a.fullName || `${a.firstName || ''} ${a.lastName || ''}`).filter(Boolean).join(', ') || 'Unbekannt',
          year: source.publicationYear || null,
          citationCount: source.citationCount || 0,
          journal: source.journal || null,
        }))

      console.log(`[analyzeSourcesTool] Starting parallel analysis of ${sourcesForEvaluation.length} sources...`)

      // Batch-Verarbeitung: 6 Quellen pro Batch = max 5 parallele Anfragen für 30 Quellen
      const BATCH_SIZE = 6

      const { results: evaluations, successCount, failCount } = await processBatchesInParallel(
        sourcesForEvaluation,
        BATCH_SIZE,
        async (batch, batchIndex) => {
          console.log(`[analyzeSourcesTool] Processing batch ${batchIndex + 1} (${batch.length} sources)...`)

          const prompt = `Du bist ein Experte für wissenschaftliche Literaturrecherche.

THEMA DER ARBEIT: "${thema}"
${keywords.length > 0 ? `WICHTIGE KEYWORDS: ${keywords.join(', ')}` : ''}

AUFGABE: Bewerte die folgenden wissenschaftlichen Quellen nach ihrer RELEVANZ für das Thema.

BEWERTUNGSKRITERIEN:
1. Inhaltliche Übereinstimmung mit dem Thema (0-40 Punkte)
2. Methodische Relevanz (0-25 Punkte)
3. Theoretischer Beitrag (0-20 Punkte)
4. Aktualität und Zitationen (0-15 Punkte)

QUELLEN ZU BEWERTEN:
${JSON.stringify(batch.map(s => ({
            id: s.id,
            title: s.title,
            abstract: s.abstract || noAbstractText,
            year: s.year,
            citations: s.citationCount,
          })), null, 2)}

Bewerte JEDE Quelle mit:
- relevanceScore (0-100): Gesamtrelevanz
- isRelevant (boolean): Ist die Quelle relevant für das Thema?
- reason (string): Kurze Begründung (max. 50 Wörter)`

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

          console.log(`[analyzeSourcesTool] Batch ${batchIndex + 1} completed with ${object.evaluations.length} evaluations`)
          return object.evaluations
        }
      )

      // Ergebnisse zusammenführen
      const analyzed = sourcesForEvaluation.map((source) => {
        const evaluation = evaluations.find((e) => e.id === source.id)
        return {
          ...source,
          relevanceScore: evaluation?.relevanceScore || 0,
          isRelevant: evaluation?.isRelevant || false,
          reason: evaluation?.reason || 'Keine Bewertung',
        }
      })

      // Filtern und sortieren
      const filtered = analyzed
        .filter((s) => s.relevanceScore >= minRelevanceScore && s.isRelevant)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults)

      const totalTime = Date.now() - startTime
      console.log(`[analyzeSourcesTool] Analysis complete: ${filtered.length}/${analyzed.length} relevant sources in ${totalTime}ms`)

      return {
        success: true,
        selected: filtered,
        totalAnalyzed: analyzed.length,
        totalSelected: filtered.length,
        batchStats: { successCount, failCount },
        processingTimeMs: totalTime,
        averageRelevance: Math.round(filtered.reduce((sum, s) => sum + s.relevanceScore, 0) / (filtered.length || 1)),
        message: `${filtered.length} von ${analyzed.length} Quellen sind hochrelevant (${successCount} Batches erfolgreich in ${Math.round(totalTime / 1000)}s).`,
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  },
})

// ============================================================================
// Evaluate Sources Tool (PARALLEL BATCH PROCESSING)
// ============================================================================

export const evaluateSourcesTool = tool({
  description: `Schnelle LLM-Bewertung der Relevanz von Quellen mit PARALLELER Batch-Verarbeitung.

Nutze dieses Tool für eine schnelle semantische Bewertung von bis zu 30 Quellen.
KAPAZITÄT: Bis zu 30 Quellen werden PARALLEL in 5 Batches analysiert!`,
  inputSchema: z.object({
    sources: z.array(z.object({
      id: z.string(),
      title: z.string(),
      abstract: z.string().optional(),
      year: z.number().optional().or(z.string().optional()),
    })).max(30).describe('Quellen (max. 30)'),
    thema: z.string().describe('Thema der Arbeit'),
  }),
  execute: async ({ sources, thema }) => {
    const language = await queryLanguage()
    const startTime = Date.now()

    try {
      const model = deepseek(DEEPSEEK_CHAT_MODEL)
      const noAbstractText = translations[language as Language]?.askAi?.toolNoAbstractAvailable || 'Kein Abstract verfügbar'

      console.log(`[evaluateSourcesTool] Starting parallel evaluation of ${sources.length} sources...`)

      // Batch-Verarbeitung: 6 Quellen pro Batch = max 5 parallele Anfragen für 30 Quellen
      const BATCH_SIZE = 6

      const { results: evaluations, successCount, failCount } = await processBatchesInParallel(
        sources,
        BATCH_SIZE,
        async (batch, batchIndex) => {
          console.log(`[evaluateSourcesTool] Processing batch ${batchIndex + 1} (${batch.length} sources)...`)

          const prompt = `Bewerte schnell die Relevanz dieser Quellen für: "${thema}"

${JSON.stringify(batch.map(s => ({
            id: s.id,
            title: s.title,
            abstract: s.abstract?.substring(0, 300) || noAbstractText,
          })), null, 2)}

Gib für jede Quelle:
- relevanceScore (0-100)
- isRelevant (true wenn Score >= 60)
- reason (1 Satz Begründung)`

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

          console.log(`[evaluateSourcesTool] Batch ${batchIndex + 1} completed with ${object.evaluations.length} evaluations`)
          return object.evaluations
        }
      )

      const totalTime = Date.now() - startTime
      console.log(`[evaluateSourcesTool] Evaluation complete: ${evaluations.length} sources in ${totalTime}ms`)

      const results = sources
        .map(source => {
          const evaluation = evaluations.find(e => e.id === source.id)
          return {
            ...source,
            relevanceScore: evaluation?.relevanceScore || 0,
            isRelevant: evaluation?.isRelevant || false,
            evaluationReason: evaluation?.reason || 'Keine Bewertung'
          }
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)

      return {
        success: true,
        sources: results,
        totalEvaluated: sources.length,
        batchStats: { successCount, failCount },
        processingTimeMs: totalTime,
        message: `${sources.length} Quellen in ${Math.round(totalTime / 1000)}s bewertet (${successCount} Batches erfolgreich).`
      }
    } catch (error) {
      return {
        success: false,
        sources: sources.map(s => ({ ...s, evaluationError: true, relevanceScore: 0 })),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
})
