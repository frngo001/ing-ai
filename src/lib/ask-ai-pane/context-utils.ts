import type { ContextSelection, Mentionable } from './types'

export const buildContextSummary = (
  question: string,
  attachments: File[] | null,
  context: ContextSelection,
  selectedMentions: Mentionable[]
): string => {
  const parts: string[] = []

  // Add context flags
  const flags: string[] = []
  if (context.document) flags.push("Dokument-Kontext aktiviert")
  if (context.web) flags.push("Websuche aktiviert")
  if (context.agentMode !== 'standard') flags.push(`Agent-Modus: ${context.agentMode}`)
  if (attachments?.length) {
    flags.push(`Anhänge: ${attachments.map((file) => file.name).join(", ")}`)
  }

  if (flags.length > 0) {
    parts.push(flags.join(" | "))
  }

  // Add actual mention content as context
  if (selectedMentions.length > 0) {
    const mentionContents = selectedMentions
      .filter((m) => m.content || m.type === 'citation' || m.type === 'file')
      .map((m) => {
        if (m.type === 'citation') {
          // Format citation context
          let citationContext = `\n--- Referenziertes Zitat: "${m.label}" ---\n`
          if (m.content) {
            citationContext += m.content
          } else {
            citationContext += `Titel: ${m.label}`
            if (m.hint) citationContext += `\nQuelle: ${m.hint}`
          }
          return citationContext
        } else if (m.type === 'document') {
          return `\n--- Aktuelles Dokument wird als Kontext verwendet ---`
        } else if (m.type === 'file') {
          // Datei-Inhalt als Kontext (extrahierter Text aus hochgeladenem Dokument)
          let fileContext = `\n--- Referenziertes Dokument: "${m.label}" ---\n`
          if (m.content) {
            fileContext += `\n${m.content}`
          } else {
            fileContext += `Dateiname: ${m.label}`
            if (m.metadata?.fileType) fileContext += `\nTyp: ${m.metadata.fileType}`
          }
          return fileContext
        } else {
          return m.content ? `\n--- ${m.label} ---\n${m.content}` : ''
        }
      })
      .filter(Boolean)

    if (mentionContents.length > 0) {
      parts.push(mentionContents.join('\n'))
    }
  }

  return parts.join('\n\n')
}

export const filterMentionables = (
  mentionables: Mentionable[],
  mentionQuery: string | null
): Mentionable[] => {
  if (mentionQuery === null) return []
  const query = mentionQuery.toLowerCase()
  if (!query) return mentionables
  return mentionables.filter(
    (m) =>
      m.label.toLowerCase().includes(query) ||
      m.value.toLowerCase().includes(query) ||
      m.hint?.toLowerCase().includes(query)
  )
}

