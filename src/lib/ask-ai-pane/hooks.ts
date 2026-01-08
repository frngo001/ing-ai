import { useMemo, useEffect, useState } from "react"
import type { Mentionable, StoredConversation } from './types'
import { getChatFilesForUser, type ChatFileUploadResult } from '@/lib/supabase/utils/chat-files'
import { getCurrentUserId } from '@/lib/supabase/utils/auth'

// Extended citation type that includes content/abstract
export type CitationForMention = {
  id: string
  title: string
  source?: string
  year?: number | string
  authors?: string[]
  abstract?: string
  doi?: string
}

// File type for mentions
export type FileForMention = {
  id: string
  name: string
  type: string
  size: number
  url: string
  extractedContent?: string
}

export const useMentionables = (citations: CitationForMention[], files?: FileForMention[]): Mentionable[] => {
  return useMemo<Mentionable[]>(() => {
    const citationItems: Mentionable[] =
      citations?.map((c) => {
        // Build a content string that includes all relevant citation info
        const contentParts: string[] = []
        contentParts.push(`Titel: ${c.title}`)
        if (c.authors && c.authors.length > 0) {
          contentParts.push(`Autoren: ${c.authors.join(', ')}`)
        }
        if (c.year) {
          contentParts.push(`Jahr: ${c.year}`)
        }
        if (c.source) {
          contentParts.push(`Quelle: ${c.source}`)
        }
        if (c.doi) {
          contentParts.push(`DOI: ${c.doi}`)
        }
        if (c.abstract) {
          contentParts.push(`Abstract: ${c.abstract}`)
        }

        return {
          id: c.id,
          label: c.title,
          value: c.title, // Just the title, no @ prefix
          hint: c.source || "Library",
          type: "citation" as const,
          content: contentParts.join('\n'),
          metadata: {
            authors: c.authors,
            year: c.year,
            source: c.source,
            doi: c.doi,
            abstract: c.abstract,
          },
        }
      }) || []

    // Dateien als Mentionables
    const fileItems: Mentionable[] =
      files?.map((f) => {
        const fileSizeKB = (f.size / 1024).toFixed(1)
        return {
          id: `file-${f.id}`,
          label: f.name,
          value: f.name,
          hint: `${fileSizeKB} KB`,
          type: "file" as const,
          content: f.extractedContent || `Datei: ${f.name} (${f.type})`,
          metadata: {
            fileId: f.id,
            fileUrl: f.url,
            fileType: f.type,
            fileSize: f.size,
          },
        }
      }) || []

    return [
      {
        id: "doc",
        label: "Aktuelles Dokument",
        value: "current-document",
        hint: "Nutze den aktuellen Editor-Kontext",
        type: "document",
        content: "Der Nutzer möchte auf den aktuellen Editor-Inhalt Bezug nehmen.",
      },
      ...fileItems,
      ...citationItems,
    ]
  }, [citations, files])
}

/**
 * Hook zum Laden der Chat-Dateien eines Benutzers für Mentions
 */
export const useChatFiles = (): FileForMention[] => {
  const [files, setFiles] = useState<FileForMention[]>([])

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const userId = await getCurrentUserId()
        if (!userId) return

        const chatFiles = await getChatFilesForUser(userId, 30)
        setFiles(chatFiles.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          url: f.url,
          extractedContent: f.extractedContent,
        })))
      } catch (error) {
        console.error('Fehler beim Laden der Chat-Dateien:', error)
      }
    }

    loadFiles()
  }, [])

  return files
}

export const useMentionQuery = (input: string): string | null => {
  return useMemo(() => {
    const match = input.match(/@([^\s@]*)$/)
    return match ? match[1] : null
  }, [input])
}

export const useSlashQuery = (input: string): string | null => {
  return useMemo(() => {
    const match = input.match(/\/([^\s/]*)$/)
    return match ? match[1] : null
  }, [input])
}

export const useFilteredHistory = (history: StoredConversation[], historyQuery: string): StoredConversation[] => {
  return useMemo(() => {
    const query = historyQuery.trim().toLowerCase()
    if (!query) return history
    return history.filter((item) => {
      const haystack =
        `${item.title} ${item.messages.map((m) => m.content).join(" ")}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [history, historyQuery])
}

