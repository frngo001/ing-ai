import { tool } from 'ai'
import { z } from 'zod'
import { Buffer } from 'node:buffer'
import * as citationLibrariesUtils from '@/lib/supabase/utils/citation-libraries'
import * as citationsUtils from '@/lib/supabase/utils/citations'
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils'
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
}

// Helper: Generiere konsistente Source-ID
function generateSourceId(): string {
  return `src-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// Helper: Konvertiere Source zu Citation
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

  const externalUrl = getCitationLink({
    url: source.url as string | undefined,
    doi: source.doi as string | undefined,
    pdfUrl: source.pdfUrl as string | undefined,
  })
  const validDoi = getNormalizedDoi(source.doi as string | undefined)

  // Verwende existierende ID wenn sie dem erwarteten Format entspricht, sonst generiere neue
  const existingId = source.id as string | undefined
  const isValidIdFormat = existingId && (
    existingId.startsWith('src-') ||
    existingId.startsWith('cite_') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingId)
  )
  const id = isValidIdFormat ? existingId : generateSourceId()

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
        const newLibrary = await citationLibrariesUtils.createCitationLibrary({
          user_id: userId,
          name: name.trim(),
          is_default: false,
          project_id: projectId || null,
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

export function createAddSourcesToLibraryTool(userId: string) {
  return tool({
    description: 'Fügt Quellen zu einer Bibliothek hinzu.',
    inputSchema: z.object({
      libraryId: z.string(),
      sources: z.array(z.object({}).passthrough())
    }),
    execute: async ({ libraryId, sources }) => {
      const language = await queryLanguage()
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

        const newCitations = sources.map(s => convertSourceToCitation(s as Record<string, unknown>))
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
            metadata: {},
          })
        }

        const messageTemplate = translations[language as Language]?.askAi?.toolAddSourcesToLibraryMessage || 'hinzugefügt'
        const message = `${uniqueCitations.length} Quelle(n) zur Bibliothek "${library.name}" ${messageTemplate}`

        return {
          success: true,
          added: uniqueCitations.length,
          message,
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
        const libraries = await citationLibrariesUtils.getCitationLibraries(userId, undefined, projectId)

        const librariesWithCounts = await Promise.all(
          libraries.map(async (lib) => {
            const citations = await citationsUtils.getCitationsByLibrary(lib.id, userId)
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
        const library = await citationLibrariesUtils.getCitationLibraryById(libraryId, userId)
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
