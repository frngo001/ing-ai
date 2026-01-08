import { useMemo } from "react"
import type { Mentionable, StoredConversation } from './types'

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

export const useMentionables = (citations: CitationForMention[]): Mentionable[] => {
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

    return [
      {
        id: "doc",
        label: "Aktuelles Dokument",
        value: "current-document",
        hint: "Nutze den aktuellen Editor-Kontext",
        type: "document",
        content: "Der Nutzer möchte auf den aktuellen Editor-Inhalt Bezug nehmen.",
      },
      ...citationItems,
    ]
  }, [citations])
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

