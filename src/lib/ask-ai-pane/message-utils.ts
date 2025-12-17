import type { ChatMessage } from './types'

export const deriveConversationTitle = (msgs: ChatMessage[]) => {
  const firstUser = msgs.find((m) => m.role === "user")
  if (!firstUser?.content) return "Neuer Chat"
  const firstNonEmptyLine =
    firstUser.content
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? firstUser.content
  const title = firstNonEmptyLine.trim() || "Neuer Chat"
  return title.length > 80 ? `${title.slice(0, 77)}...` : title
}

export const getWebSources = (message: ChatMessage): Array<{ url: string; title: string }> => {
  const sources: Array<{ url: string; title: string }> = []
  
  // Quellen aus toolInvocations extrahieren
  if (message.toolInvocations) {
    message.toolInvocations.forEach((toolInvocation) => {
      if (toolInvocation.toolName === 'webSearch' && toolInvocation.state === 'result' && toolInvocation.result?.results) {
        toolInvocation.result.results.forEach((source) => {
          if (source.url && source.title) {
            sources.push({ url: source.url, title: source.title })
          }
        })
      }
    })
  }
  
  // Quellen aus message.parts extrahieren
  if (message.parts) {
    message.parts.forEach((part) => {
      if (part.type === 'source' && part.source?.url) {
        const title = part.source.title || (() => {
          try { return new URL(part.source.url).hostname } catch { return part.source.url }
        })()
        sources.push({ url: part.source.url, title })
      }
    })
  }
  
  // Deduplizieren nach URL
  const uniqueSources = sources.reduce((acc, source) => {
    if (!acc.find(s => s.url === source.url)) {
      acc.push(source)
    }
    return acc
  }, [] as Array<{ url: string; title: string }>)
  
  return uniqueSources
}

