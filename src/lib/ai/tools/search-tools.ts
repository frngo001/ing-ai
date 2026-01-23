import { tool, generateObject } from 'ai'
import { z } from 'zod'
import { Buffer } from 'node:buffer'
import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { SourceFetcher } from '@/lib/sources/source-fetcher'
import type { NormalizedSource } from '@/lib/sources/types'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/types'
import * as citationLibrariesUtils from '@/lib/supabase/utils/citation-libraries'
import * as citationsUtils from '@/lib/supabase/utils/citations'
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils'
import {
  storeSearchResults,
  getSearchResults,
  getSearchMetadata,
  getSearchSummary,
  updateSearchResults,
  type CachedSource,
  type SearchCacheSummary,
} from './search-cache'

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
// Direct Source Saving Helper
// ============================================================================

interface ConvertedCitation {
  id: string
  title: string
  source: string
  year: number | undefined
  lastEdited: string
  href: string
  externalUrl: string | undefined
  doi: string | undefined
  authors: string[]
  abstract: string | undefined
  url: string | undefined
  pdfUrl: string | undefined
  pmid: string | undefined
  pmcid: string | undefined
  arxivId: string | undefined
  isbn: string | undefined
  issn: string | undefined
  volume: string | undefined
  issue: string | undefined
  pages: string | undefined
  publisher: string | undefined
  type: string | undefined
  keywords: string[] | undefined
  citationCount: number | undefined
  isOpenAccess: boolean | undefined
  sourceApi: string | undefined
  qualityScore: number | undefined
  relevanceScore: number | undefined
}

function convertNormalizedSourceToCitation(source: NormalizedSource & { qualityScore?: number; relevanceScore?: number }): ConvertedCitation {
  const authors = source.authors
    ? source.authors.map((a) =>
      typeof a === 'string' ? a : a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
    ).filter(Boolean)
    : []

  const externalUrl = getCitationLink({
    url: source.url,
    doi: source.doi,
    pdfUrl: source.pdfUrl,
  })
  const validDoi = getNormalizedDoi(source.doi)

  // Verwende existierende ID nur wenn sie eine gültige UUID ist
  const existingId = source.id
  const isValidUuid = existingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingId)
  const id = isValidUuid ? existingId : generateSourceId()

  return {
    id,
    title: source.title || 'Ohne Titel',
    source: source.journal || source.publisher || 'Quelle',
    year: source.publicationYear || undefined,
    lastEdited: new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
    href: externalUrl || '/editor',
    externalUrl,
    doi: validDoi || undefined,
    authors,
    abstract: source.abstract || undefined,
    url: source.url || undefined,
    pdfUrl: source.pdfUrl || undefined,
    pmid: source.pmid || undefined,
    pmcid: source.pmcid || undefined,
    arxivId: source.arxivId || undefined,
    isbn: source.isbn || undefined,
    issn: source.issn || undefined,
    volume: source.volume || undefined,
    issue: source.issue || undefined,
    pages: source.pages || undefined,
    publisher: source.publisher || undefined,
    type: source.type || undefined,
    keywords: source.keywords || undefined,
    citationCount: source.citationCount || undefined,
    isOpenAccess: source.isOpenAccess || undefined,
    sourceApi: source.sourceApi || undefined,
    qualityScore: source.qualityScore || undefined,
    relevanceScore: source.relevanceScore || undefined,
  }
}

async function saveSourcesDirectlyToLibrary(
  sources: (NormalizedSource & { qualityScore?: number; relevanceScore?: number })[],
  libraryId: string,
  userId: string
): Promise<{ added: number; failed: number; skippedDuplicates: number }> {
  const supabase = await createClient()

  const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, userId, supabase)
  if (!library) {
    throw new Error('Bibliothek nicht gefunden')
  }

  const newCitations = sources.map(s => convertNormalizedSourceToCitation(s))
  const existingCitations = await citationsUtils.getCitationsByLibrary(libraryId, userId, supabase)

  // Deduplizierung
  const existingIds = new Set(existingCitations.map((c) => c.id))
  const existingDois = new Set(existingCitations.map((c) => c.doi?.toLowerCase()).filter(Boolean))
  const existingTitles = new Set(existingCitations.map((c) => c.title?.toLowerCase().trim()).filter(Boolean))

  const uniqueCitations = newCitations.filter((c) => {
    if (existingIds.has(c.id)) return false
    if (c.doi && existingDois.has(c.doi.toLowerCase())) return false
    if (c.title && existingTitles.has(c.title.toLowerCase().trim())) return false
    return true
  })

  // Batch-Insert
  const BATCH_SIZE = 10
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < uniqueCitations.length; i += BATCH_SIZE) {
    const batch = uniqueCitations.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map((citation) => {
        const metadata: { [key: string]: Json | undefined } = {}
        if (citation.url) metadata.url = citation.url
        if (citation.pdfUrl) metadata.pdfUrl = citation.pdfUrl
        if (citation.pmid) metadata.pmid = citation.pmid
        if (citation.pmcid) metadata.pmcid = citation.pmcid
        if (citation.arxivId) metadata.arxivId = citation.arxivId
        if (citation.isbn) metadata.isbn = citation.isbn
        if (citation.issn) metadata.issn = citation.issn
        if (citation.volume) metadata.volume = citation.volume
        if (citation.issue) metadata.issue = citation.issue
        if (citation.pages) metadata.pages = citation.pages
        if (citation.publisher) metadata.publisher = citation.publisher
        if (citation.type) metadata.type = citation.type
        if (citation.keywords?.length) metadata.keywords = citation.keywords
        if (citation.citationCount) metadata.citationCount = citation.citationCount
        if (citation.isOpenAccess !== undefined) metadata.isOpenAccess = citation.isOpenAccess
        if (citation.sourceApi) metadata.sourceApi = citation.sourceApi
        if (citation.qualityScore) metadata.qualityScore = citation.qualityScore
        if (citation.relevanceScore) metadata.relevanceScore = citation.relevanceScore

        return citationsUtils.createCitation({
          id: citation.id,
          user_id: userId,
          library_id: libraryId,
          title: citation.title,
          source: citation.source,
          year: citation.year ?? null,
          last_edited: new Date().toISOString(),
          href: citation.href,
          external_url: citation.externalUrl ?? null,
          authors: citation.authors || null,
          abstract: citation.abstract || null,
          doi: citation.doi || null,
          citation_style: 'vancouver',
          in_text_citation: citation.title,
          full_citation: citation.title,
          metadata,
        }, supabase)
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') successCount++
      else failCount++
    }
  }

  return {
    added: successCount,
    failed: failCount,
    skippedDuplicates: newCitations.length - uniqueCitations.length,
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
// Search Sources Tool mit Cache (OPTIMIERT für Performance)
// ============================================================================

/**
 * Factory für das optimierte searchSources Tool mit Cache.
 *
 * PERFORMANCE-OPTIMIERUNG:
 * - Speichert Ergebnisse im Cache und gibt nur searchId + Summary zurück
 * - LLM muss keine vollständigen Quellen-Objekte mehr kopieren
 * - Token-Reduktion: ~8000 → ~200 Tokens pro Aufruf
 */
export function createSearchSourcesTool(userId: string) {
  return tool({
    description: `Suche nach wissenschaftlichen Quellen für die Literaturrecherche.

DATENBANKEN: OpenAlex, Semantic Scholar, CrossRef, PubMed, CORE, Europe PMC, DOAJ, BASE, PLOS, DataCite
(14+ Datenbanken werden parallel durchsucht)

QUALITÄTSBEWERTUNG:
- Peer-Review Status (30%): Journal > Conference > Preprint
- Journal-Qualität (25%): High-Impact > Low-Impact
- Zitationen (20%): Mehr = besser
- Aktualität (15%): Neuer = besser (außer Klassiker)
- Vollständigkeit (10%): Metadaten-Qualität

WICHTIG: Gibt searchId zurück - verwende diese für evaluateSources!
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
        const fetcher = new SourceFetcher({
          maxParallelRequests: 6,
          useCache: true,
          excludedApis: includePreprints
            ? ['opencitations', 'zenodo']
            : ['opencitations', 'zenodo', 'arxiv', 'biorxiv'],
        })

        const results = await fetcher.search({ query, type, limit })
        const validApis = results.apis?.filter((api): api is string => typeof api === 'string' && api.length > 0) || []

        if (results.sources.length === 0) {
          return {
            success: true,
            searchId: null,
            totalResults: 0,
            summary: null,
            apis: validApis,
            searchTime: results.searchTime,
            message: 'Keine Quellen gefunden. Versuche andere Suchbegriffe.',
          }
        }

        // Qualitätsbewertung und Ranking
        const analyzed = analyzeAndRankSources(results.sources, thema, keywords, preferHighCitations)

        // Filtern nach Qualität
        const filtered = analyzed.filter((s) => {
          if (s.qualityScore < minQualityScore) return false
          if (!includePreprints && s.qualityTier === 'low' && s.qualityMetrics.peerReviewScore < 10) {
            return false
          }
          return true
        })

        // Beste Quellen auswählen und IDs generieren
        const selected: CachedSource[] = filtered.slice(0, maxResults).map(s => ({
          ...s,
          id: s.id || generateSourceId(),
        }))

        // Im Cache speichern
        const searchId = storeSearchResults(userId, selected, {
          thema,
          query,
          filters: { minQualityScore, includePreprints, preferHighCitations },
        })

        // Summary für LLM generieren
        const summary = getSearchSummary(searchId)

        // Statistiken
        const highQualityCount = selected.filter(s => s.qualityTier === 'high').length
        const mediumQualityCount = selected.filter(s => s.qualityTier === 'medium').length

        const messageTemplate = translations[language as Language]?.askAi?.toolSearchSourcesFound || '{count} Quellen gefunden und analysiert.'
        const message = messageTemplate.replace('{count}', selected.length.toString())

        console.log(`[searchSources] Cached ${selected.length} sources with searchId: ${searchId}`)

        return {
          success: true,
          searchId,
          totalResults: results.totalResults,
          totalAnalyzed: analyzed.length,
          totalSelected: selected.length,
          qualityDistribution: {
            high: highQualityCount,
            medium: mediumQualityCount,
            low: selected.length - highQualityCount - mediumQualityCount,
          },
          // Kompaktes Summary statt vollständiger Quellen
          summary: summary ? {
            count: summary.count,
            topSources: summary.topSources,
            averageQualityScore: summary.averageQualityScore,
            expiresIn: summary.expiresIn,
          } : null,
          apis: validApis,
          searchTime: results.searchTime,
          message: `${message} (${highQualityCount} hochwertig, ${mediumQualityCount} mittel). Verwende searchId "${searchId}" für evaluateSources.`,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: {
              searchId,
              totalResults: results.totalResults,
              selectedCount: selected.length,
              highQuality: highQualityCount,
            },
          }),
        }
      } catch (error) {
        return {
          success: false,
          searchId: null,
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
      const analyzed = (sources as unknown as NormalizedSource[]).map((source) => {
        const evaluation = evaluations.find((e) => e.id === source.id || e.id === (source as any).doi)
        return {
          ...source,
          id: source.id || generateSourceId(),
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
// Evaluate Sources Tool (PARALLEL BATCH PROCESSING + DIRECT SAVE + CACHE)
// ============================================================================

/**
 * Factory für das optimierte evaluateSources Tool mit Cache-Support.
 *
 * PERFORMANCE-OPTIMIERUNG:
 * - Akzeptiert searchId statt vollständiger Quellen-Objekte
 * - Holt Quellen direkt aus dem Cache - kein LLM-Kopieren nötig!
 * - Token-Reduktion: ~8000 → ~50 Tokens für Input
 *
 * SPEICHERN:
 * - Wenn saveToLibraryId angegeben wird, werden relevante Quellen automatisch gespeichert
 */
export function createEvaluateSourcesTool(userId: string) {
  return tool({
    description: `Schnelle LLM-Bewertung der Relevanz von Quellen mit PARALLELER Batch-Verarbeitung.

PERFORMANCE-OPTIMIERT: Verwende searchId von searchSources - keine Quellen kopieren!

WICHTIG: Wenn saveToLibraryId angegeben wird, werden die relevanten Quellen
AUTOMATISCH in der Bibliothek gespeichert! Kein separater addSourcesToLibrary Aufruf nötig.

KAPAZITÄT: Bis zu 30 Quellen werden PARALLEL in 5 Batches analysiert!

WORKFLOW (SCHNELL - NUR 2 PARAMETER!):
1. searchSources → gibt searchId zurück
2. evaluateSources(searchId, saveToLibraryId) → Bewerten UND Speichern!`,
    inputSchema: z.object({
      // PRIMÄR: searchId aus dem Cache (EMPFOHLEN - viel schneller!)
      searchId: z.string().optional().describe('searchId von searchSources (EMPFOHLEN - holt Quellen aus Cache)'),
      // FALLBACK: Direkte Quellen (für Backwards-Kompatibilität)
      sources: z.array(z.object({}).passthrough()).max(30).optional().describe('FALLBACK: Vollständige Quellen wenn kein searchId vorhanden'),
      // Thema wird aus Cache geholt wenn searchId verwendet wird
      thema: z.string().optional().describe('Thema der Arbeit (optional wenn searchId verwendet wird)'),
      saveToLibraryId: z.string().optional().describe('Library-ID zum direkten Speichern der relevanten Quellen (von listAllLibraries)'),
      minRelevanceScore: z.number().min(0).max(100).optional().describe('Minimum Score zum Speichern (Standard: 60)'),
    }),
    execute: async ({ searchId, sources, thema, saveToLibraryId, minRelevanceScore = 60 }) => {
      const language = await queryLanguage()
      const startTime = Date.now()
      const stepId = generateToolStepId()
      const toolName = 'evaluateSources'

      try {
        const model = deepseek(DEEPSEEK_CHAT_MODEL)
        const noAbstractText = translations[language as Language]?.askAi?.toolNoAbstractAvailable || 'Kein Abstract verfügbar'

        // Quellen aus Cache ODER direkt aus Input holen
        let fullSources: CachedSource[]
        let effectiveThema: string

        if (searchId) {
          // OPTIMIERT: Quellen aus Cache holen
          const cachedSources = getSearchResults(searchId)
          const cachedMetadata = getSearchMetadata(searchId)

          if (!cachedSources) {
            return {
              success: false,
              error: `searchId "${searchId}" nicht gefunden oder abgelaufen. Bitte searchSources erneut aufrufen.`,
              _toolStep: createToolStepMarker('end', {
                id: stepId,
                toolName,
                status: 'error',
                error: 'searchId not found or expired',
              }),
            }
          }

          fullSources = cachedSources
          effectiveThema = thema || cachedMetadata?.thema || 'Unbekanntes Thema'

          console.log(`[evaluateSourcesTool] Loaded ${fullSources.length} sources from cache (searchId: ${searchId})`)
        } else if (sources && sources.length > 0) {
          // FALLBACK: Direkte Quellen (für Backwards-Kompatibilität)
          fullSources = sources as unknown as CachedSource[]
          effectiveThema = thema || 'Unbekanntes Thema'

          console.log(`[evaluateSourcesTool] Using ${fullSources.length} sources from direct input (legacy mode)`)
        } else {
          return {
            success: false,
            error: 'Entweder searchId oder sources muss angegeben werden.',
            _toolStep: createToolStepMarker('end', {
              id: stepId,
              toolName,
              status: 'error',
              error: 'No sources provided',
            }),
          }
        }

        console.log(`[evaluateSourcesTool] Starting parallel evaluation of ${fullSources.length} sources...`)

        // Batch-Verarbeitung: 6 Quellen pro Batch = max 5 parallele Anfragen für 30 Quellen
        const BATCH_SIZE = 6

        const { results: evaluations, successCount, failCount } = await processBatchesInParallel(
          fullSources,
          BATCH_SIZE,
          async (batch, batchIndex) => {
            console.log(`[evaluateSourcesTool] Processing batch ${batchIndex + 1} (${batch.length} sources)...`)

            const prompt = `Bewerte schnell die Relevanz dieser Quellen für: "${effectiveThema}"

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

        // Merge evaluation results with full source data
        const results = fullSources
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

        // Filter relevant sources
        const relevantSources = results.filter(s => s.relevanceScore >= minRelevanceScore && s.isRelevant)

        // Update cache with evaluation results (if searchId was used)
        if (searchId) {
          updateSearchResults(searchId, () => results)
          console.log(`[evaluateSourcesTool] Updated cache with evaluation results`)
        }

        // DIRECT SAVE if saveToLibraryId is provided
        let saveResult: { added: number; failed: number; skippedDuplicates: number } | null = null
        if (saveToLibraryId && relevantSources.length > 0) {
          console.log(`[evaluateSourcesTool] Saving ${relevantSources.length} relevant sources to library ${saveToLibraryId}...`)
          try {
            saveResult = await saveSourcesDirectlyToLibrary(relevantSources, saveToLibraryId, userId)
            console.log(`[evaluateSourcesTool] Saved ${saveResult.added} sources (${saveResult.skippedDuplicates} duplicates skipped)`)
          } catch (saveError) {
            console.error(`[evaluateSourcesTool] Failed to save sources:`, saveError)
          }
        }

        const baseMessage = `${fullSources.length} Quellen in ${Math.round(totalTime / 1000)}s bewertet. ${relevantSources.length} sind relevant (Score >= ${minRelevanceScore}).`
        const saveMessage = saveResult
          ? ` ${saveResult.added} Quellen wurden automatisch gespeichert${saveResult.skippedDuplicates > 0 ? ` (${saveResult.skippedDuplicates} Duplikate übersprungen)` : ''}.`
          : ''

        // OPTIMIERT: Nur Summary zurückgeben, nicht vollständige Quellen
        const relevantSummary = relevantSources.slice(0, 10).map(s => ({
          title: s.title,
          year: s.publicationYear,
          relevanceScore: s.relevanceScore,
          reason: s.evaluationReason,
          authors: s.authors?.slice(0, 2).map(a =>
            typeof a === 'string' ? a : a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
          ).join(', '),
        }))

        return {
          success: true,
          // Kompaktes Summary statt vollständiger Quellen (Performance!)
          relevantSourcesSummary: relevantSummary,
          relevantSourcesCount: relevantSources.length,
          totalEvaluated: fullSources.length,
          batchStats: { successCount, failCount },
          processingTimeMs: totalTime,
          // Cache-Info für weitere Tool-Aufrufe
          searchId: searchId || null,
          // Save information
          saved: saveResult ? {
            added: saveResult.added,
            failed: saveResult.failed,
            skippedDuplicates: saveResult.skippedDuplicates,
            libraryId: saveToLibraryId,
          } : null,
          message: baseMessage + saveMessage,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: {
              evaluated: fullSources.length,
              relevant: relevantSources.length,
              saved: saveResult?.added || 0,
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
    }
  })
}

// Legacy export for backwards compatibility (without save capability)
export const evaluateSourcesTool = tool({
  description: `Schnelle LLM-Bewertung der Relevanz von Quellen.
HINWEIS: Verwende createEvaluateSourcesTool(userId) für die Möglichkeit, direkt zu speichern!`,
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
    const model = deepseek(DEEPSEEK_CHAT_MODEL)
    const noAbstractText = translations[language as Language]?.askAi?.toolNoAbstractAvailable || 'Kein Abstract verfügbar'
    const BATCH_SIZE = 6

    const { results: evaluations, successCount, failCount } = await processBatchesInParallel(
      sources,
      BATCH_SIZE,
      async (batch) => {
        const prompt = `Bewerte schnell die Relevanz dieser Quellen für: "${thema}"
${JSON.stringify(batch.map(s => ({ id: s.id, title: s.title, abstract: s.abstract?.substring(0, 300) || noAbstractText })), null, 2)}
Gib für jede Quelle: relevanceScore (0-100), isRelevant (true wenn >= 60), reason (1 Satz)`

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
        return object.evaluations
      }
    )

    const results = sources
      .map(source => {
        const evaluation = evaluations.find(e => e.id === source.id)
        return { ...source, relevanceScore: evaluation?.relevanceScore || 0, isRelevant: evaluation?.isRelevant || false, evaluationReason: evaluation?.reason || 'Keine Bewertung' }
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)

    return {
      success: true,
      sources: results,
      totalEvaluated: sources.length,
      batchStats: { successCount, failCount },
      processingTimeMs: Date.now() - startTime,
      message: `${sources.length} Quellen in ${Math.round((Date.now() - startTime) / 1000)}s bewertet.`
    }
  }
})

// ============================================================================
// Find Or Search Sources Tool (INTELLIGENT - Library First!)
// ============================================================================

/**
 * Factory für das intelligente findOrSearchSources Tool.
 *
 * LÖST PROBLEM: Agent sucht immer neue Quellen obwohl Bibliothek Quellen hat.
 *
 * WORKFLOW:
 * 1. Lädt automatisch alle Quellen aus den Projekt-Bibliotheken
 * 2. Prüft Relevanz der vorhandenen Quellen zum Thema
 * 3. NUR wenn zu wenig relevante Quellen → startet externe Suche
 * 4. Speichert neue Quellen automatisch in der Bibliothek
 */
export function createFindOrSearchSourcesTool(userId: string, projectId: string) {
  return tool({
    description: `Intelligente Quellensuche: Prüft AUTOMATISCH erst vorhandene Bibliotheken!

WICHTIG: Dieses Tool prüft IMMER zuerst deine Bibliotheken bevor es extern sucht!

WORKFLOW:
1. Lädt alle Quellen aus deinen Projekt-Bibliotheken
2. Prüft welche Quellen für dein Thema relevant sind
3. NUR wenn zu wenig relevante Quellen → externe Suche (14+ Datenbanken)
4. Neue Quellen werden automatisch in der Bibliothek gespeichert

VORTEIL: Keine redundanten Suchen, nutzt vorhandene Arbeit, spart Zeit!

EMPFOHLEN: Immer dieses Tool statt searchSources verwenden!`,
    inputSchema: z.object({
      thema: z.string().describe('Thema/Fragestellung für die Quellensuche'),
      minExistingSources: z.number().min(1).max(20).optional().describe('Mindestanzahl relevanter Quellen aus Bibliothek bevor externe Suche startet (Standard: 5)'),
      searchQuery: z.string().optional().describe('Optionaler spezifischer Suchbegriff (Standard: thema wird verwendet)'),
      alwaysSearch: z.boolean().optional().describe('Immer externe Suche durchführen, auch wenn genug Quellen vorhanden (Standard: false)'),
    }),
    execute: async ({
      thema,
      minExistingSources = 5,
      searchQuery,
      alwaysSearch = false,
    }) => {
      const language = await queryLanguage()
      const stepId = generateToolStepId()
      const toolName = 'findOrSearchSources'
      const startTime = Date.now()

      try {
        const supabase = await createClient()

        // 1. Alle Bibliotheken des Projekts laden
        console.log(`[findOrSearchSources] Loading libraries for project ${projectId}...`)
        const libraries = await citationLibrariesUtils.getCitationLibraries(userId, supabase, projectId)

        if (libraries.length === 0) {
          console.log(`[findOrSearchSources] No libraries found, creating default and searching...`)
          // Keine Bibliothek vorhanden → direkt suchen und neue Bibliothek erstellen
          const newLibrary = await citationLibrariesUtils.createCitationLibrary(
            { name: 'Literatur', project_id: projectId, user_id: userId },
            supabase
          )

          // Externe Suche durchführen
          const fetcher = new SourceFetcher({ maxParallelRequests: 6, useCache: true })
          const results = await fetcher.search({ query: searchQuery || thema, type: 'keyword', limit: 40 })

          if (results.sources.length === 0) {
            return {
              success: true,
              action: 'no_sources_found',
              existingSources: [],
              newSources: [],
              libraryId: newLibrary.id,
              message: 'Keine Quellen gefunden. Versuche andere Suchbegriffe.',
            }
          }

          // Qualitätsbewertung
          const analyzed = analyzeAndRankSources(results.sources, thema, [], true)
          const selected = analyzed.filter(s => s.qualityScore >= 50).slice(0, 25)

          // Direkt speichern
          const saveResult = await saveSourcesDirectlyToLibrary(selected, newLibrary.id, userId)

          return {
            success: true,
            action: 'searched_and_saved',
            existingSources: [],
            newSourcesCount: saveResult.added,
            libraryId: newLibrary.id,
            message: `Neue Bibliothek erstellt. ${saveResult.added} Quellen gefunden und gespeichert.`,
            _toolStep: createToolStepMarker('end', {
              id: stepId,
              toolName,
              status: 'completed',
              output: { action: 'searched_and_saved', newSources: saveResult.added },
            }),
          }
        }

        // 2. Alle vorhandenen Quellen aus allen Bibliotheken sammeln
        console.log(`[findOrSearchSources] Loading sources from ${libraries.length} libraries...`)
        interface ExistingSource {
          id: string
          title: string | null
          year: number | null
          authors: string[] | null
          abstract: string | null
          doi: string | null
        }
        const existingSources: ExistingSource[] = []
        let primaryLibraryId = libraries[0].id

        for (const lib of libraries) {
          const sources = await citationsUtils.getCitationsByLibrary(lib.id, userId, supabase)
          existingSources.push(...sources.map(s => ({
            id: s.id,
            title: s.title,
            year: s.year,
            authors: s.authors,
            abstract: s.abstract,
            doi: s.doi,
          })))
          // Nutze größte Bibliothek als primäre
          if (sources.length > existingSources.length - sources.length) {
            primaryLibraryId = lib.id
          }
        }

        console.log(`[findOrSearchSources] Found ${existingSources.length} existing sources`)

        // 3. Schnelle Relevanz-Prüfung der vorhandenen Quellen
        let relevantExisting: Array<ExistingSource & { relevanceScore: number; relevanceReason: string }> = []

        if (existingSources.length > 0) {
          console.log(`[findOrSearchSources] Evaluating relevance of ${existingSources.length} existing sources...`)

          const model = deepseek(DEEPSEEK_CHAT_MODEL)
          const BATCH_SIZE = 10

          // Schnelle Batch-Evaluation
          const sourcesToEvaluate = existingSources.slice(0, 30) // Max 30 für Schnelligkeit
          const { results: evaluations } = await processBatchesInParallel(
            sourcesToEvaluate,
            BATCH_SIZE,
            async (batch) => {
              const prompt = `Bewerte schnell die Relevanz für: "${thema}"
${JSON.stringify(batch.map(s => ({ id: s.id, title: s.title, abstract: s.abstract?.substring(0, 200) || '' })), null, 2)}
Gib für jede: relevanceScore (0-100), isRelevant (boolean), reason (1 Satz)`

              const { object } = await generateObject({
                model,
                schema: z.object({
                  evaluations: z.array(z.object({
                    id: z.string(),
                    relevanceScore: z.number(),
                    isRelevant: z.boolean(),
                    reason: z.string(),
                  }))
                }),
                prompt,
              })
              return object.evaluations
            }
          )

          relevantExisting = sourcesToEvaluate
            .map(source => {
              const evaluation = evaluations.find(e => e.id === source.id)
              return {
                ...source,
                relevanceScore: evaluation?.relevanceScore || 0,
                relevanceReason: evaluation?.reason || 'Nicht bewertet',
              }
            })
            .filter(s => s.relevanceScore >= 60)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
        }

        console.log(`[findOrSearchSources] Found ${relevantExisting.length} relevant existing sources`)

        // 4. Entscheidung: Genug relevante Quellen vorhanden?
        if (relevantExisting.length >= minExistingSources && !alwaysSearch) {
          const totalTime = Date.now() - startTime

          // Summary für LLM
          const existingSummary = relevantExisting.slice(0, 10).map(s => ({
            title: s.title,
            year: s.year,
            relevanceScore: s.relevanceScore,
            reason: s.relevanceReason,
            authors: s.authors?.slice(0, 2).join(', ') || 'Unbekannt',
          }))

          return {
            success: true,
            action: 'used_existing',
            existingSourcesCount: relevantExisting.length,
            existingSourcesSummary: existingSummary,
            libraryId: primaryLibraryId,
            processingTimeMs: totalTime,
            message: `${relevantExisting.length} relevante Quellen in deinen Bibliotheken gefunden. Keine externe Suche nötig.`,
            hint: 'Falls du zusätzliche Quellen möchtest, rufe dieses Tool mit alwaysSearch: true auf.',
            _toolStep: createToolStepMarker('end', {
              id: stepId,
              toolName,
              status: 'completed',
              output: { action: 'used_existing', existingSources: relevantExisting.length },
            }),
          }
        }

        // 5. Externe Suche durchführen (zu wenig relevante Quellen)
        console.log(`[findOrSearchSources] Not enough relevant sources (${relevantExisting.length}/${minExistingSources}), searching externally...`)

        const fetcher = new SourceFetcher({ maxParallelRequests: 6, useCache: true })
        const results = await fetcher.search({
          query: searchQuery || thema,
          type: 'keyword',
          limit: 50,
        })

        if (results.sources.length === 0) {
          return {
            success: true,
            action: 'search_no_results',
            existingSourcesCount: relevantExisting.length,
            newSourcesCount: 0,
            libraryId: primaryLibraryId,
            message: `${relevantExisting.length} vorhandene relevante Quellen. Externe Suche fand keine zusätzlichen Quellen.`,
          }
        }

        // Qualitätsbewertung und Filterung
        const analyzed = analyzeAndRankSources(results.sources, thema, [], true)
        const filtered = analyzed.filter(s => s.qualityScore >= 50).slice(0, 25)

        // Direkt in Bibliothek speichern
        const saveResult = await saveSourcesDirectlyToLibrary(filtered, primaryLibraryId, userId)

        const totalTime = Date.now() - startTime

        // Summary für neue Quellen
        const newSourcesSummary = filtered.slice(0, 5).map(s => ({
          title: s.title,
          year: s.publicationYear,
          qualityScore: s.qualityScore,
          authors: s.authors?.slice(0, 2).map(a =>
            typeof a === 'string' ? a : a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
          ).join(', '),
        }))

        return {
          success: true,
          action: 'searched_and_saved',
          existingSourcesCount: relevantExisting.length,
          newSourcesCount: saveResult.added,
          newSourcesSummary,
          skippedDuplicates: saveResult.skippedDuplicates,
          libraryId: primaryLibraryId,
          processingTimeMs: totalTime,
          message: `${relevantExisting.length} vorhandene + ${saveResult.added} neue Quellen gefunden und gespeichert${saveResult.skippedDuplicates > 0 ? ` (${saveResult.skippedDuplicates} Duplikate übersprungen)` : ''}.`,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: {
              action: 'searched_and_saved',
              existingSources: relevantExisting.length,
              newSources: saveResult.added,
            },
          }),
        }
      } catch (error) {
        console.error(`[findOrSearchSources] Error:`, error)
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
