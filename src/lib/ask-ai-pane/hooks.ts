import { useMemo } from "react"
import type { Mentionable, StoredConversation } from './types'

export const useMentionables = (citations: Array<{ id: string; title: string; source?: string }>): Mentionable[] => {
  return useMemo<Mentionable[]>(() => {
    const citationItems =
      citations?.map((c) => ({
        id: c.id,
        label: c.title,
        value: `@${c.title}`,
        hint: c.source || "Library",
        type: "citation" as const,
      })) || []

    return [
      {
        id: "doc",
        label: "Current document",
        value: "@current-document",
        hint: "Nutze den aktuellen Editor-Kontext",
        type: "document",
      },
      ...citationItems,
      {
        id: "prompt",
        label: "Prompt: outline",
        value: "@prompt/outline",
        hint: "Gespeicherter Prompt",
        type: "prompt",
      },
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

