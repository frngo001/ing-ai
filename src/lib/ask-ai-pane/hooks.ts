import { useMemo, useEffect, useState } from "react"
import { FileText, MessageSquareQuote, PenLine, BookOpen } from "lucide-react"
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
          type: "citation" as const,
          icon: BookOpen,
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
        return {
          id: `file-${f.id}`,
          label: f.name,
          value: f.name,
          type: "file" as const,
          icon: FileText,
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
        label: "Aktueller Editor",
        value: "current-document",
        type: "document",
        icon: PenLine,
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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Listener für neue Datei-Uploads
  useEffect(() => {
    const handleFileUploaded = () => {
      console.log('[useChatFiles] File upload event received, refreshing...')
      setRefreshTrigger(prev => prev + 1)
    }

    window.addEventListener('chat-file-uploaded', handleFileUploaded)
    return () => {
      window.removeEventListener('chat-file-uploaded', handleFileUploaded)
    }
  }, [])

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const userId = await getCurrentUserId()
        console.log('[useChatFiles] Loading files for user:', userId)
        if (!userId) {
          console.log('[useChatFiles] No userId, skipping load')
          return
        }

        const chatFiles = await getChatFilesForUser(userId, 30)
        console.log('[useChatFiles] Loaded chat files:', chatFiles.length, chatFiles)
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
  }, [refreshTrigger])

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
