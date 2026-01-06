/**
 * Stream-Parser für Standard-Chat-Modus
 * Komplexes Parsing mit Reasoning, Sources und Tool-Invocations
 */

import type { MessagePart } from '@/components/ask-ai-pane'

export type { MessagePart }

export interface ParsedAgentResult {
  answer?: string
  reasoning: string[]
  citations: Array<{ title?: string; url: string; snippet?: string }>
}

// Extrahiert Reasoning und Quellen aus Agent-Responses (Fallback, wenn sendSources nicht greift)
export function parseAgentResult(result: any): ParsedAgentResult | null {
  if (!result || typeof result !== 'object') return null

  const reasoning: string[] = []
  const citations: Array<{ title?: string; url: string; snippet?: string }> = []

  for (const step of result.steps ?? []) {
    if (typeof step?.text === 'string') reasoning.push(step.text)

    const res = step?.toolResult?.results
    if (Array.isArray(res)) {
      for (const r of res) {
        if (r?.url) {
          citations.push({ title: r.title, url: r.url, snippet: r.snippet })
        }
      }
    }
  }

  const deduped = Object.values(
    citations.reduce((acc: Record<string, { title?: string; url: string; snippet?: string }>, c) => {
      if (!c.url) return acc
      acc[c.url] = acc[c.url] || c
      return acc
    }, {})
  )

  return {
    answer: result.text,
    reasoning,
    citations: deduped,
  }
}

export interface StandardStreamParserOptions {
  assistantId: string
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
}

export async function parseStandardStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  options: StandardStreamParserOptions
): Promise<void> {
  const { assistantId, setMessages } = options
  const decoder = new TextDecoder()
  let fullText = ""
  let buffer = ""
  let toolResultProcessed = false
  let toolInvocations: any[] = []
  let reasoning: string | undefined = undefined
  let parts: MessagePart[] = []
  let currentReasoning = ""
  let currentText = ""
  let sseBuffer = ""
  let hasSeenToolCall = false
  let pendingToolResults = new Set<string>()
  let allToolResultsReceived = false

  // Helper für konsistente Quellen-Extraktion
  const appendSources = (items: any) => {
    if (!Array.isArray(items)) return
    const existingUrls = new Set(parts.filter((p) => p.type === 'source').map((p) => p.source.url))
    items.forEach((c) => {
      const url = c?.url || c?.href
      if (!url || existingUrls.has(url)) return
      existingUrls.add(url)
      parts.push({
        type: 'source',
        source: {
          url,
          title: c?.title || c?.snippet || c?.content?.substring?.(0, 80) || undefined,
          id: url,
        },
      })
    })
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    const decoded = decoder.decode(value, { stream: true })
    buffer += decoded
    sseBuffer += decoded

    // Parse SSE Format: "data: {...}\n"
    const lines = sseBuffer.split('\n')
    sseBuffer = lines.pop() || ""

    for (const line of lines) {
      if (!line.trim() || line === '[DONE]') continue

      // SSE Format: "data: {...}"
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6))

          // Direktes reasoning/reasoningText aus streamText (ohne Parsing)
          if (event.reasoning !== undefined && typeof event.reasoning === 'string') {
            currentReasoning = event.reasoning
            reasoning = currentReasoning
          }
          if (event.reasoningText !== undefined && typeof event.reasoningText === 'string') {
            currentReasoning = event.reasoningText
            reasoning = currentReasoning
          }

          // Parse Quellen/Reasoning (Fallback für alte Implementierung)
          const parsedAgent = parseAgentResult(event?.response ?? event?.result ?? event)
          if (parsedAgent) {
            if (parsedAgent.reasoning.length > 0 && !currentReasoning) {
              currentReasoning = parsedAgent.reasoning.join('\n\n')
              reasoning = currentReasoning
            }
            appendSources(parsedAgent.citations)
          }

          // Direkte Quellen an mehreren möglichen Stellen abgreifen
          appendSources(event?.sources)
          appendSources(event?.citations)
          appendSources(event?.references)
          appendSources(event?.output?.results)
          appendSources(event?.output?.sources)

          if (Array.isArray(event?.toolInvocations)) {
            event.toolInvocations.forEach((inv: any) => {
              appendSources(inv?.result?.results)
              appendSources(inv?.result?.sources)
            })
          }

          switch (event.type) {
            case 'reasoning-delta':
              // Direktes reasoning-delta aus streamText
              if (event.delta) {
                currentReasoning += event.delta
                reasoning = currentReasoning

                // Update message live
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          reasoning: currentReasoning || undefined,
                          parts: [
                            ...(currentReasoning ? [{ type: 'reasoning' as const, reasoning: currentReasoning }] : []),
                            ...(currentText ? [{ type: 'text' as const, text: currentText }] : []),
                            ...parts.filter(p => p.type !== 'text' && p.type !== 'reasoning')
                          ]
                        }
                      : m
                  )
                )
              }
              break

            case 'text-delta':
              if (event.delta) {
                fullText += event.delta
                if (currentReasoning) {
                  currentText += event.delta
                } else if (hasSeenToolCall && !allToolResultsReceived) {
                  currentReasoning += event.delta
                  reasoning = currentReasoning
                } else {
                  currentText += event.delta
                }

                // Update message live
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? {
                          ...m,
                          content: currentText || fullText,
                          reasoning: currentReasoning || undefined,
                          parts: [
                            ...(currentReasoning ? [{ type: 'reasoning' as const, reasoning: currentReasoning }] : []),
                            ...(currentText ? [{ type: 'text' as const, text: currentText }] : []),
                            ...parts.filter(p => p.type !== 'text' && p.type !== 'reasoning')
                          ]
                        }
                      : m
                  )
                )
              }
              break

            case 'tool-input-start':
            case 'tool-input-available':
              hasSeenToolCall = true

              if (event.type === 'tool-input-available' && event.toolName && event.toolCallId) {
                pendingToolResults.add(event.toolCallId)
                allToolResultsReceived = false

                parts.push({
                  type: 'tool-invocation',
                  toolInvocation: {
                    toolName: event.toolName,
                    toolCallId: event.toolCallId
                  }
                })

                if (event.toolName === 'webSearch') {
                  const existingIndex = toolInvocations.findIndex(t => t.toolCallId === event.toolCallId)
                  if (existingIndex >= 0) {
                    toolInvocations[existingIndex] = { ...toolInvocations[existingIndex], ...event, state: 'call' }
                  } else {
                    toolInvocations.push({ ...event, state: 'call' })
                  }
                }
              }
              break

            case 'tool-output-available':
              if (event.toolCallId) {
                pendingToolResults.delete(event.toolCallId)
                if (pendingToolResults.size === 0) {
                  allToolResultsReceived = true
                }
              }

              // Tool-Result erkannt - Quellen extrahieren
              if (event.toolName === 'webSearch' && event.output?.results) {
                for (const result of event.output.results) {
                  if (result.url) {
                    parts.push({
                      type: 'source',
                      source: {
                        url: result.url,
                        title: result.title || result.content?.substring(0, 100) || 'Untitled',
                        id: result.url
                      }
                    })
                  }
                }

                const existingIndex = toolInvocations.findIndex(t => t.toolCallId === event.toolCallId)
                if (existingIndex >= 0) {
                  toolInvocations[existingIndex] = {
                    ...toolInvocations[existingIndex],
                    state: 'result',
                    result: event.output
                  }
                } else {
                  toolInvocations.push({
                    toolCallId: event.toolCallId,
                    toolName: event.toolName,
                    state: 'result',
                    result: event.output
                  })
                }
              }
              break

            case 'text-end':
              if (pendingToolResults.size === 0 && hasSeenToolCall) {
                allToolResultsReceived = true
              }
              break

            case 'finish':
            case 'finish-step':
              // Prüfe auf reasoning/reasoningText im finish Event (von streamText)
              if (event.reasoning !== undefined && typeof event.reasoning === 'string') {
                currentReasoning = event.reasoning
                reasoning = currentReasoning
              }
              if (event.reasoningText !== undefined && typeof event.reasoningText === 'string') {
                currentReasoning = event.reasoningText
                reasoning = currentReasoning
              }
              pendingToolResults.clear()
              allToolResultsReceived = true
              break
          }
        } catch (e) {
          console.warn('Fehler beim Parsen von SSE-Event:', e, line)
        }
      }
    }
  }

  // Editor-Streaming wurde entfernt - wird nicht mehr verwendet
  // Der Agent verwendet jetzt nur noch das insertTextInEditor Tool

  // Parse REASONING Marker
  const reasoningMatch = buffer.match(/\[REASONING:([^\]]+)\]/)
  if (reasoningMatch) {
    try {
      const binaryString = atob(reasoningMatch[1])
      const decoded = JSON.parse(binaryString)
      if (decoded.type === 'reasoning' && decoded.content) {
        reasoning = decoded.content
      }
      buffer = buffer.replace(/\[REASONING:[^\]]+\]/, '')
    } catch (e) {
      console.warn('Fehler beim Parsen von REASONING:', e)
    }
  }

  // Parse WEB_SEARCH_SOURCES Marker
  const webSearchMatch = buffer.match(/\[WEB_SEARCH_SOURCES:([^\]]+)\]/)
  if (webSearchMatch) {
    try {
      const binaryString = atob(webSearchMatch[1])
      const decoded = JSON.parse(binaryString)
      if (decoded.sources && Array.isArray(decoded.sources)) {
        const webSearchInvocation = {
          toolCallId: `web-search-${Date.now()}`,
          toolName: 'webSearch',
          state: 'result',
          result: { results: decoded.sources }
        }
        const existingIndex = toolInvocations.findIndex(t => t.toolName === 'webSearch')
        if (existingIndex >= 0) {
          toolInvocations[existingIndex] = webSearchInvocation
        } else {
          toolInvocations.push(webSearchInvocation)
        }
      }
      buffer = buffer.replace(/\[WEB_SEARCH_SOURCES:[^\]]+\]/, '')
    } catch (e) {
      console.warn('Fehler beim Parsen von WEB_SEARCH_SOURCES:', e)
    }
  }

  // Parse TOOL_INVOCATIONS Marker
  const toolInvocationsMatch = buffer.match(/\[TOOL_INVOCATIONS:([^\]]+)\]/)
  if (toolInvocationsMatch) {
    try {
      const binaryString = atob(toolInvocationsMatch[1])
      const decoded = JSON.parse(binaryString)
      if (decoded.toolInvocations && Array.isArray(decoded.toolInvocations)) {
        decoded.toolInvocations.forEach((inv: any) => {
          const existingIndex = toolInvocations.findIndex(t => t.toolCallId === inv.toolCallId)
          if (existingIndex >= 0) {
            toolInvocations[existingIndex] = { ...toolInvocations[existingIndex], ...inv }
          } else {
            toolInvocations.push(inv)
          }
        })
      }
      buffer = buffer.replace(/\[TOOL_INVOCATIONS:[^\]]+\]/, '')
    } catch (e) {
      console.warn('Fehler beim Parsen von TOOL_INVOCATIONS:', e)
    }
  }

  // Remove all markers from the displayed text
  const cleanedChunk = fullText
    .replace(/\[TOOL_RESULT:[^\]]+\]/g, '')
    .replace(/\[TOOL_RESULT_B64:[^\]]+\]/g, '')
    .replace(/\[REASONING:[^\]]+\]/g, '')
    .replace(/\[WEB_SEARCH_SOURCES:[^\]]+\]/g, '')
    .replace(/\[TOOL_INVOCATIONS:[^\]]+\]/g, '')
    .trim()

  // Update parts: füge text und reasoning hinzu
  const updatedParts: MessagePart[] = []
  if (currentReasoning) {
    updatedParts.push({ type: 'reasoning', reasoning: currentReasoning })
  }
  if (currentText) {
    updatedParts.push({ type: 'text', text: currentText })
  }
  updatedParts.push(...parts.filter(p => p.type !== 'text' && p.type !== 'reasoning'))

  setMessages((prev) =>
    prev.map((m) => (m.id === assistantId ? {
      ...m,
      content: currentText || cleanedChunk,
      reasoning,
      parts: updatedParts.length > 0 ? updatedParts : undefined,
      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined
    } : m))
  )

  // Am Ende des Streams: Prüfe auf Marker
  const finalReasoningMatch = fullText.match(/\[REASONING:([^\]]+)\]/)
  if (finalReasoningMatch) {
    try {
      const binaryString = atob(finalReasoningMatch[1])
      const decoded = JSON.parse(binaryString)
      if (decoded.type === 'reasoning' && decoded.content) {
        reasoning = decoded.content
      }
    } catch (e) {
      console.warn('Fehler beim Parsen von REASONING am Ende:', e)
    }
  }

  const finalWebSearchMatch = fullText.match(/\[WEB_SEARCH_SOURCES:([^\]]+)\]/)
  if (finalWebSearchMatch) {
    try {
      const binaryString = atob(finalWebSearchMatch[1])
      const decoded = JSON.parse(binaryString)
      if (decoded.sources && Array.isArray(decoded.sources)) {
        const webSearchInvocation = {
          toolCallId: `web-search-${Date.now()}`,
          toolName: 'webSearch',
          state: 'result',
          result: { results: decoded.sources }
        }
        const existingIndex = toolInvocations.findIndex(t => t.toolName === 'webSearch')
        if (existingIndex >= 0) {
          toolInvocations[existingIndex] = webSearchInvocation
        } else {
          toolInvocations.push(webSearchInvocation)
        }
      }
    } catch (e) {
      console.warn('Fehler beim Parsen von WEB_SEARCH_SOURCES am Ende:', e)
    }
  }

  const finalToolInvocationsMatch = fullText.match(/\[TOOL_INVOCATIONS:([^\]]+)\]/)
  if (finalToolInvocationsMatch) {
    try {
      const binaryString = atob(finalToolInvocationsMatch[1])
      const decoded = JSON.parse(binaryString)
      if (decoded.toolInvocations && Array.isArray(decoded.toolInvocations)) {
        decoded.toolInvocations.forEach((inv: any) => {
          const existingIndex = toolInvocations.findIndex(t => t.toolCallId === inv.toolCallId)
          if (existingIndex >= 0) {
            toolInvocations[existingIndex] = { ...toolInvocations[existingIndex], ...inv }
          } else {
            toolInvocations.push(inv)
          }
        })
      }
    } catch (e) {
      console.warn('Fehler beim Parsen von TOOL_INVOCATIONS am Ende:', e)
    }
  }

  // Finale Message-Update
  const finalCleanedChunk = fullText
    .replace(/\[TOOL_RESULT:[^\]]+\]/g, '')
    .replace(/\[TOOL_RESULT_B64:[^\]]+\]/g, '')
    .replace(/\[REASONING:[^\]]+\]/g, '')
    .replace(/\[WEB_SEARCH_SOURCES:[^\]]+\]/g, '')
    .replace(/\[TOOL_INVOCATIONS:[^\]]+\]/g, '')
    .trim()

  const finalUpdatedParts: MessagePart[] = []
  if (currentReasoning) {
    finalUpdatedParts.push({ type: 'reasoning', reasoning: currentReasoning })
  }
  if (currentText) {
    finalUpdatedParts.push({ type: 'text', text: currentText })
  }
  finalUpdatedParts.push(...parts.filter(p => p.type !== 'text' && p.type !== 'reasoning'))

  setMessages((prev) =>
    prev.map((m) => (m.id === assistantId ? {
      ...m,
      content: currentText || finalCleanedChunk,
      reasoning,
      parts: finalUpdatedParts.length > 0 ? finalUpdatedParts : undefined,
      toolInvocations: toolInvocations.length > 0 ? toolInvocations : undefined
    } : m))
  )
}

