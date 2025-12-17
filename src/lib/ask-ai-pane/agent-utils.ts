import type { SelectedSource } from "@/lib/stores/bachelorarbeit-agent-store"

export const detectArbeitType = (text: string): 'bachelor' | 'master' | null => {
  const lower = text.toLowerCase()
  if (lower.includes('bachelorarbeit') || lower.includes('bachelorarbeit')) return 'bachelor'
  if (lower.includes('masterarbeit') || lower.includes('masterarbeit')) return 'master'
  return null
}

export const extractThema = (text: string): string | null => {
  // Einfache Heuristik: Suche nach "Thema:", "über", etc.
  const themaMatch = text.match(/(?:thema|über|zu|für):\s*(.+?)(?:\.|$)/i)
  if (themaMatch) return themaMatch[1].trim()

  // Falls kein explizites Thema, verwende den ganzen Text als Hinweis
  if (text.length > 20) return text.slice(0, 200)
  return null
}

export const addSourcesToLibrary = (
  sources: SelectedSource[],
  addCitation: (citation: any) => void,
  toast: { success: (message: string) => void }
) => {
  sources.forEach((source) => {
    addCitation({
      id: source.id,
      title: source.title,
      source: source.authors?.join(', ') || 'Quelle',
      year: source.year,
      lastEdited: `hinzugefügt am ${new Date().toLocaleDateString('de-DE', { dateStyle: 'short' })}`,
      href: '/editor',
      externalUrl: source.url,
      doi: source.doi,
      authors: source.authors,
    })
  })
  toast.success(`${sources.length} Quellen zur Bibliothek hinzugefügt`)
}

