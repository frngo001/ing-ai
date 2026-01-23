import { tool } from 'ai'
import { z } from 'zod'
import { Buffer } from 'node:buffer'
import { createClient } from '@/lib/supabase/server'
import * as citationLibrariesUtils from '@/lib/supabase/utils/citation-libraries'
import * as citationsUtils from '@/lib/supabase/utils/citations'
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'

const queryLanguage = async () => {
  try {
    return await getLanguageForServer()
  } catch {
    return 'en'
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
  // Erweiterte Metadaten (NEU - niemals verlieren!)
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

// Helper: Generiere konsistente Source-ID (muss UUID sein für DB)
function generateSourceId(): string {
  return crypto.randomUUID()
}

// Helper: Konvertiere Source zu Citation - ALLE Metadaten erfassen!
function convertSourceToCitation(source: Record<string, unknown>): ConvertedCitation {
  const authors = source.authors
    ? (typeof source.authors === 'string'
      ? (source.authors as string).split(',').map((a: string) => a.trim())
      : Array.isArray(source.authors)
        ? (source.authors as Array<string | { fullName?: string; firstName?: string; lastName?: string }>).map((a) =>
          typeof a === 'string' ? a : a.fullName || `${a.firstName || ''} ${a.lastName || ''}`.trim()
        )
        : [])
    : []

  // URLs extrahieren - KRITISCH: Alle URL-Varianten erfassen!
  const rawUrl = source.url as string | undefined
  const rawPdfUrl = source.pdfUrl as string | undefined
  const rawDoi = source.doi as string | undefined

  const externalUrl = getCitationLink({
    url: rawUrl,
    doi: rawDoi,
    pdfUrl: rawPdfUrl,
  })
  const validDoi = getNormalizedDoi(rawDoi)

  // Verwende existierende ID nur wenn sie eine gültige UUID ist, sonst generiere neue
  const existingId = source.id as string | undefined
  const isValidUuid = existingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingId)
  const id = isValidUuid ? existingId : generateSourceId()

  // Keywords extrahieren
  const keywords = source.keywords
    ? (Array.isArray(source.keywords) ? source.keywords as string[] : undefined)
    : undefined

  return {
    id,
    title: (source.title as string) || 'Ohne Titel',
    source: (source.journal as string) || (source.publisher as string) || (source.venue as string) || 'Quelle',
    year: (source.publicationYear as number) || (source.year as number) || undefined,
    lastEdited: new Date().toLocaleDateString('de-DE', { dateStyle: 'short' }),
    href: externalUrl || '/editor',
    externalUrl,
    doi: validDoi || undefined,
    authors: (authors as string[]).filter(Boolean),
    abstract: (source.abstract as string) || undefined,
    // NEUE FELDER - Alle Metadaten erfassen!
    url: rawUrl || undefined,
    pdfUrl: rawPdfUrl || undefined,
    pmid: (source.pmid as string) || undefined,
    pmcid: (source.pmcid as string) || undefined,
    arxivId: (source.arxivId as string) || undefined,
    isbn: (source.isbn as string) || undefined,
    issn: (source.issn as string) || undefined,
    volume: (source.volume as string) || undefined,
    issue: (source.issue as string) || undefined,
    pages: (source.pages as string) || undefined,
    publisher: (source.publisher as string) || undefined,
    type: (source.type as string) || undefined,
    keywords,
    citationCount: (source.citationCount as number) || undefined,
    isOpenAccess: (source.isOpenAccess as boolean) || undefined,
    sourceApi: (source.sourceApi as string) || undefined,
    qualityScore: (source.qualityScore as number) || undefined,
    relevanceScore: (source.relevanceScore as number) || undefined,
  }
}

export function createLibraryTool(userId: string, projectId?: string) {
  return tool({
    description: 'Erstellt eine neue Bibliothek für das aktuelle Projekt. ACHTUNG: NUR verwenden wenn listAllLibraries keine passende Bibliothek zurückgibt! Bevorzuge immer existierende Bibliotheken.',
    inputSchema: z.object({ name: z.string() }),
    execute: async ({ name }) => {
      const stepId = generateToolStepId()
      const toolName = 'createLibrary'

      try {
        // Erstelle Server-Client für authentifizierten Zugriff
        const supabase = await createClient()

        const newLibrary = await citationLibrariesUtils.createCitationLibrary({
          user_id: userId,
          name: name.trim(),
          is_default: false,
          project_id: projectId || null,
        }, supabase)
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

// Explizites Schema für Quellen-Metadaten - damit der Agent weiß welche Felder er senden MUSS
const sourceMetadataSchema = z.object({
  // Identifiers (KRITISCH - niemals verlieren!)
  id: z.string().optional().describe('Interne ID (UUID) - wird generiert falls nicht vorhanden'),
  doi: z.string().optional().describe('Digital Object Identifier - WICHTIG für Zitationen'),
  pmid: z.string().optional().describe('PubMed ID'),
  pmcid: z.string().optional().describe('PubMed Central ID'),
  arxivId: z.string().optional().describe('arXiv ID'),
  isbn: z.string().optional().describe('ISBN für Bücher'),
  issn: z.string().optional().describe('ISSN für Zeitschriften'),

  // Basic metadata (PFLICHT)
  title: z.string().describe('Titel der Quelle - PFLICHTFELD'),
  authors: z.union([
    z.array(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      fullName: z.string().optional(),
      orcid: z.string().optional(),
      affiliation: z.string().optional(),
    })),
    z.array(z.string()),
    z.string(),
  ]).optional().describe('Autoren als Array oder String'),
  publicationYear: z.number().optional().describe('Publikationsjahr'),
  year: z.number().optional().describe('Alias für publicationYear'),
  publicationDate: z.string().optional().describe('Vollständiges Publikationsdatum'),

  // Publication details
  type: z.string().optional().describe('Art der Quelle: journal, book, conference, preprint, thesis, website, dataset, other'),
  journal: z.string().optional().describe('Name der Zeitschrift'),
  venue: z.string().optional().describe('Alias für journal'),
  volume: z.string().optional().describe('Band/Volume'),
  issue: z.string().optional().describe('Ausgabe/Issue'),
  pages: z.string().optional().describe('Seitenzahlen'),
  publisher: z.string().optional().describe('Verlag'),

  // Access URLs (KRITISCH - niemals verlieren!)
  url: z.string().optional().describe('Haupt-URL zur Quelle - WICHTIG'),
  pdfUrl: z.string().optional().describe('Direkte PDF-URL - WICHTIG'),
  isOpenAccess: z.boolean().optional().describe('Open Access verfügbar?'),

  // Additional metadata
  abstract: z.string().optional().describe('Zusammenfassung/Abstract'),
  keywords: z.array(z.string()).optional().describe('Schlagwörter'),
  citationCount: z.number().optional().describe('Anzahl der Zitierungen'),
  impactFactor: z.number().optional().describe('Impact Factor der Zeitschrift'),

  // Quality indicators
  completeness: z.number().optional().describe('Vollständigkeits-Score 0-1'),
  sourceApi: z.string().optional().describe('Quell-API (OpenAlex, Semantic Scholar, etc.)'),
  qualityScore: z.number().optional().describe('Qualitäts-Score 0-100'),
  relevanceScore: z.number().optional().describe('Relevanz-Score 0-100'),
}).passthrough() // Erlaube zusätzliche Felder für Rückwärtskompatibilität

export function createAddSourcesToLibraryTool(userId: string) {
  return tool({
    description: `Fügt Quellen zu einer Bibliothek hinzu.

WICHTIG - ALLE Metadaten übergeben:
- PFLICHT: title, authors, year/publicationYear
- KRITISCH: doi, url, pdfUrl (URLs niemals vergessen!)
- EMPFOHLEN: abstract, journal, volume, issue, pages, publisher
- OPTIONAL: pmid, arxivId, isbn, keywords, citationCount

Übergib die Quellen EXAKT so wie sie von searchSources zurückgegeben wurden!
Entferne KEINE Felder - alle Metadaten werden gespeichert.`,
    inputSchema: z.object({
      libraryId: z.string().describe('ID der Bibliothek (von listAllLibraries)'),
      sources: z.array(sourceMetadataSchema).describe('Array von Quellen mit ALLEN Metadaten von searchSources'),
    }),
    execute: async ({ libraryId, sources }) => {
      const language = await queryLanguage()
      const stepId = generateToolStepId()
      const toolName = 'addSourcesToLibrary'

      try {
        // Erstelle Server-Client für authentifizierten Zugriff
        const supabase = await createClient()

        const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, userId, supabase)
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

        const newCitations = sources.map(s => convertSourceToCitation(s as Record<string, unknown>))
        const existingCitations = await citationsUtils.getCitationsByLibrary(libraryId, userId, supabase)

        // Enhanced deduplication: check by ID, DOI, and normalized title
        const existingIds = new Set(existingCitations.map((c) => c.id))
        const existingDois = new Set(existingCitations.map((c) => c.doi?.toLowerCase()).filter(Boolean))
        const existingTitles = new Set(existingCitations.map((c) => c.title?.toLowerCase().trim()).filter(Boolean))

        const uniqueCitations = newCitations.filter((c) => {
          // Check if already exists by ID
          if (existingIds.has(c.id)) return false
          // Check if already exists by DOI
          if (c.doi && existingDois.has(c.doi.toLowerCase())) return false
          // Check if already exists by exact title match
          if (c.title && existingTitles.has(c.title.toLowerCase().trim())) return false
          return true
        })

        // Parallel batch inserts for better performance (batches of 10)
        const BATCH_SIZE = 10
        const batches: ConvertedCitation[][] = []
        for (let i = 0; i < uniqueCitations.length; i += BATCH_SIZE) {
          batches.push(uniqueCitations.slice(i, i + BATCH_SIZE))
        }

        let successCount = 0
        let failCount = 0

        for (const batch of batches) {
          const results = await Promise.allSettled(
            batch.map((citation) => {
              // Alle zusätzlichen Metadaten in JSONB speichern - NICHTS verlieren!
              const metadata: { [key: string]: string | number | boolean | string[] | undefined } = {}

              // URLs (KRITISCH!)
              if (citation.url) metadata.url = citation.url
              if (citation.pdfUrl) metadata.pdfUrl = citation.pdfUrl

              // Identifiers
              if (citation.pmid) metadata.pmid = citation.pmid
              if (citation.pmcid) metadata.pmcid = citation.pmcid
              if (citation.arxivId) metadata.arxivId = citation.arxivId
              if (citation.isbn) metadata.isbn = citation.isbn
              if (citation.issn) metadata.issn = citation.issn

              // Publication details
              if (citation.volume) metadata.volume = citation.volume
              if (citation.issue) metadata.issue = citation.issue
              if (citation.pages) metadata.pages = citation.pages
              if (citation.publisher) metadata.publisher = citation.publisher
              if (citation.type) metadata.type = citation.type

              // Additional metadata
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
                metadata, // Alle zusätzlichen Metadaten!
              }, supabase)
            })
          )

          for (const result of results) {
            if (result.status === 'fulfilled') {
              successCount++
            } else {
              failCount++
              console.error('[addSourcesToLibrary] Failed to insert citation:', result.reason)
            }
          }
        }

        const messageTemplate = translations[language as Language]?.askAi?.toolAddSourcesToLibraryMessage || 'added'
        const failedInfo = failCount > 0 ? ` (${failCount} failed)` : ''
        const message = `${successCount} source(s) ${messageTemplate} to library "${library.name}"${failedInfo}`

        return {
          success: true,
          added: successCount,
          failed: failCount,
          attempted: uniqueCitations.length,
          skippedDuplicates: newCitations.length - uniqueCitations.length,
          message,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: { added: successCount, failed: failCount, libraryName: library.name },
          }),
        }
      } catch (error) {
        // Besseres Error-Logging
        console.error('[addSourcesToLibrary] Error:', error)

        let errorMessage = 'Unknown error'
        if (error instanceof Error) {
          errorMessage = error.message
        } else if (typeof error === 'object' && error !== null) {
          errorMessage = JSON.stringify(error)
        } else if (typeof error === 'string') {
          errorMessage = error
        }

        return {
          success: false,
          error: errorMessage,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'error',
            error: errorMessage,
          }),
        }
      }
    },
  })
}

export function createListAllLibrariesTool(userId: string, projectId?: string) {
  return tool({
    description: 'Listet alle verfügbaren Bibliotheken des aktuellen Projekts auf. WICHTIG: Immer ZUERST aufrufen bevor neue Bibliotheken erstellt werden! Nutze existierende Bibliotheken wenn möglich.',
    inputSchema: z.object({
      _placeholder: z.string().optional().describe('Placeholder parameter'),
    }),
    execute: async () => {
      const language = await queryLanguage()
      const stepId = generateToolStepId()
      const toolName = 'listAllLibraries'

      try {
        // Erstelle Server-Client für authentifizierten Zugriff
        const supabase = await createClient()

        const libraries = await citationLibrariesUtils.getCitationLibraries(userId, supabase, projectId)

        const librariesWithCounts = await Promise.all(
          libraries.map(async (lib) => {
            const citations = await citationsUtils.getCitationsByLibrary(lib.id, userId, supabase)
            return {
              id: lib.id,
              name: lib.name,
              citationCount: citations.length,
              isDefault: lib.is_default || false,
              createdAt: lib.created_at ? new Date(lib.created_at).toLocaleDateString('de-DE', { dateStyle: 'short' }) : undefined,
            }
          })
        )

        const message = librariesWithCounts.length === 0
          ? (translations[language as Language]?.askAi?.toolListAllLibrariesNoLibraries || 'Keine Bibliotheken gefunden.')
          : (translations[language as Language]?.askAi?.toolListAllLibrariesFound || '{count} Bibliothek(en) gefunden.').replace('{count}', librariesWithCounts.length.toString())

        return {
          success: true,
          libraries: librariesWithCounts,
          count: librariesWithCounts.length,
          message,
          _toolStep: createToolStepMarker('end', {
            id: stepId,
            toolName,
            status: 'completed',
            output: { count: librariesWithCounts.length },
          }),
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          libraries: [],
          count: 0,
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

export function createGetLibrarySourcesTool(userId: string) {
  return tool({
    description: 'Ruft Quellen aus einer Bibliothek ab. WICHTIG: Muss VOR addCitation aufgerufen werden! Die zurückgegebenen source-IDs sind die einzigen gültigen IDs für addCitation.',
    inputSchema: z.object({
      libraryId: z.string().describe('ID der Bibliothek (von listAllLibraries)')
    }),
    execute: async ({ libraryId }) => {
      const language = await queryLanguage()
      const stepId = generateToolStepId()
      const toolName = 'getLibrarySources'
      const libraryNotFoundText = translations[language as Language]?.askAi?.toolGetLibrarySourcesNotFound || 'Bibliothek nicht gefunden'

      try {
        // Erstelle Server-Client für authentifizierten Zugriff
        const supabase = await createClient()

        const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, userId, supabase)
        if (!library) {
          return {
            success: false,
            error: libraryNotFoundText,
            _toolStep: createToolStepMarker('end', {
              id: stepId,
              toolName,
              status: 'error',
              error: libraryNotFoundText,
            }),
          }
        }

        const citations = await citationsUtils.getCitationsByLibrary(libraryId, userId, supabase)
        const savedCitations = citations.map((c) => {
          // Metadaten aus JSONB extrahieren
          const metadata = (c.metadata && typeof c.metadata === 'object' && !Array.isArray(c.metadata))
            ? c.metadata as Record<string, unknown>
            : {}

          return {
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
            // Zusätzliche Metadaten aus JSONB (URLs, Identifiers, etc.)
            url: metadata.url as string | undefined,
            pdfUrl: metadata.pdfUrl as string | undefined,
            pmid: metadata.pmid as string | undefined,
            pmcid: metadata.pmcid as string | undefined,
            arxivId: metadata.arxivId as string | undefined,
            isbn: metadata.isbn as string | undefined,
            issn: metadata.issn as string | undefined,
            volume: metadata.volume as string | undefined,
            issue: metadata.issue as string | undefined,
            pages: metadata.pages as string | undefined,
            publisher: metadata.publisher as string | undefined,
            type: metadata.type as string | undefined,
            keywords: metadata.keywords as string[] | undefined,
            citationCount: metadata.citationCount as number | undefined,
            isOpenAccess: metadata.isOpenAccess as boolean | undefined,
            sourceApi: metadata.sourceApi as string | undefined,
          }
        })

        const messageTemplate = translations[language as Language]?.askAi?.toolGetLibrarySourcesContains || 'Bibliothek "{name}" enthält {count} Quelle(n)'
        const message = messageTemplate.replace('{name}', library.name).replace('{count}', savedCitations.length.toString())

        return {
          success: true,
          libraryId: library.id,
          libraryName: library.name,
          sources: savedCitations,
          count: savedCitations.length,
          message,
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
