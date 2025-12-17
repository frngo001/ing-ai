import type { ContextSelection, Mentionable } from './types'

export const buildContextSummary = (
  question: string,
  attachments: File[] | null,
  context: ContextSelection,
  selectedMentions: Mentionable[]
): string => {
  const tags = []
  if (context.document) tags.push("Current document enabled")
  if (context.web) tags.push("Web search allowed")
  if (context.agentMode !== 'standard') tags.push(`Agent Mode: ${context.agentMode}`)
  if (selectedMentions.length) {
    tags.push(`Mentions: ${selectedMentions.map((m) => m.label).join(", ")}`)
  }
  if (attachments?.length) {
    tags.push(`Attachments: ${attachments.map((file) => file.name).join(", ")}`)
  }
  const mentions = (question.match(/@\S+/g) || []).join(", ")
  const mentionPart = mentions && !selectedMentions.length ? `Mentions: ${mentions}` : ""
  return [...tags, mentionPart].filter(Boolean).join(" | ")
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

