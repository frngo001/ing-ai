/**
 * Stream-Parser für Agent-Modi (Bachelorarbeit, General)
 * Mit Tool-Step-Visualisierung und Reasoning-Tracking
 */

import { useCitationStore, type SavedCitation } from '@/lib/stores/citation-store'
import type { ToolStep, MessagePart, ChatMessage } from '@/lib/ask-ai-pane/types'
import { devLog, devWarn, devError } from '@/lib/utils/logger'

export interface AgentStreamParserOptions {
  assistantId: string
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  agentStore: {
    isActive: boolean
    [key: string]: any
  }
}

// Helper: Dekodiere Base64 Tool-Step Marker
function decodeToolStepMarker(base64: string): {
  id: string
  toolName: string
  input?: Record<string, any>
  output?: Record<string, any>
  status?: 'completed' | 'error'
  error?: string
} | null {
  try {
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const decodedJson = new TextDecoder().decode(bytes)
    return JSON.parse(decodedJson)
  } catch (error) {
    console.error('Fehler beim Dekodieren von Tool-Step Marker:', error)
    return null
  }
}

export async function parseAgentStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  options: AgentStreamParserOptions
): Promise<void> {
  const { assistantId, setMessages, agentStore } = options
  const decoder = new TextDecoder()
  let fullText = ""
  let buffer = ""
  let toolResultProcessed = false

  // Parts Tracking (für Inline-Darstellung)
  let parts: MessagePart[] = []
  const toolIdToPartIndex: Map<string, number> = new Map()

  // Batch-Update für React-Performance
  let updateTimeout: NodeJS.Timeout | null = null
  const updateMessage = (immediate = false) => {
    const performUpdate = () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
              ...m,
              parts: [...parts],
              content: parts
                .filter(p => p.type === 'text')
                .map(p => (p as { type: 'text', text: string }).text)
                .join('\n\n'),
              toolSteps: parts
                .filter(p => p.type === 'tool-step')
                .map(p => (p as { type: 'tool-step', toolStep: ToolStep }).toolStep)
            }
            : m
        )
      )
    }

    if (immediate) {
      if (updateTimeout) clearTimeout(updateTimeout)
      performUpdate()
    } else if (!updateTimeout) {
      updateTimeout = setTimeout(() => {
        performUpdate()
        updateTimeout = null
      }, 50) // 50ms Debounce für flüssiges Streaming ohne React-Overload
    }
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    const decoded = decoder.decode(value, { stream: true })
    buffer += decoded
    fullText += decoded

    // Wir verarbeiten den Buffer Stück für Schritt und extrahieren entweder Text oder Marker
    while (buffer.length > 0) {
      // Suche nach allen möglichen Marker-Typen
      // Marker mit Payload (haben ":")
      const markerWithPayloadRegex = /\[(TOOL_STEP_START|TOOL_STEP_END|TOOL_RESULT|TOOL_RESULT_B64|REASONING_DELTA):/

      const matchWithPayload = buffer.match(markerWithPayloadRegex)

      // Finde den frühesten Marker
      let earliestMatch: { index: number; type: 'payload' } | null = null

      if (matchWithPayload) {
        earliestMatch = { index: matchWithPayload.index!, type: 'payload' }
      }

      if (earliestMatch) {
        const markerStartIndex = earliestMatch.index

        // Wenn Text vor dem Marker ist, füge ihn als Text-Part hinzu
        if (markerStartIndex > 0) {
          const textBefore = buffer.substring(0, markerStartIndex)
          if (textBefore.length > 0) {
            if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
              (parts[parts.length - 1] as { type: 'text', text: string }).text += textBefore
            } else {
              parts.push({ type: 'text', text: textBefore })
            }
            updateMessage()
          }
          buffer = buffer.substring(markerStartIndex)
          // Weitermachen mit dem Marker am Anfang des Buffers
          continue
        }

        // Marker ist am Anfang des Buffers
        // Für Marker mit Payload: Suche das Ende ']'
        const markerEndIndex = buffer.indexOf(']')
        if (markerEndIndex === -1) {
          // Marker ist noch unvollständig im Stream, warte auf nächsten Chunk
          break
        }

        const fullMarker = buffer.substring(0, markerEndIndex + 1)

        // Verarbeite den spezifischen Marker
        if (fullMarker.startsWith('[TOOL_STEP_START:')) {
          const base64 = fullMarker.match(/\[TOOL_STEP_START:([^\]]+)\]/)?.[1]
          const stepData = base64 ? decodeToolStepMarker(base64) : null
          if (stepData) {
            const newStep: ToolStep = {
              id: stepData.id,
              toolName: stepData.toolName,
              status: 'running',
              startedAt: Date.now(),
              input: stepData.input,
            }
            parts.push({ type: 'tool-step', toolStep: newStep })
            toolIdToPartIndex.set(stepData.id, parts.length - 1)
            updateMessage()
          }
        } else if (fullMarker.startsWith('[TOOL_STEP_END:')) {
          const base64 = fullMarker.match(/\[TOOL_STEP_END:([^\]]+)\]/)?.[1]
          const stepData = base64 ? decodeToolStepMarker(base64) : null
          if (stepData) {
            const partIndex = toolIdToPartIndex.get(stepData.id)
            if (partIndex !== undefined && parts[partIndex].type === 'tool-step') {
              const existingStep = (parts[partIndex] as { type: 'tool-step', toolStep: ToolStep }).toolStep
              const updatedStep: ToolStep = {
                ...existingStep,
                status: stepData.status || 'completed',
                completedAt: Date.now(),
                output: stepData.output,
                error: stepData.error,
              }
              parts[partIndex] = { type: 'tool-step', toolStep: updatedStep }

              // Extrahiere Quellen aus WebSearch-Tool-Ergebnissen
              if (stepData.toolName === 'webSearch' && stepData.output) {
                const results = stepData.output.results || stepData.output.result?.results || []
                if (Array.isArray(results)) {
                  results.forEach((result: any) => {
                    if (result.url) {
                      const existingSourceIndex = parts.findIndex(
                        p => p.type === 'source' && (p as { type: 'source', source: { url: string } }).source.url === result.url
                      )
                      if (existingSourceIndex === -1) {
                        parts.push({
                          type: 'source',
                          source: {
                            url: result.url,
                            title: result.title || result.name || '',
                            id: result.url,
                          }
                        })
                      }
                    }
                  })
                }
              } else if ((stepData.toolName === 'webCrawl' || stepData.toolName === 'webExtract') && stepData.output) {
                const url = stepData.output.url || existingStep.input?.url
                if (url) {
                  const existingSourceIndex = parts.findIndex(
                    p => p.type === 'source' && (p as { type: 'source', source: { url: string } }).source.url === url
                  )
                  if (existingSourceIndex === -1) {
                    parts.push({
                      type: 'source',
                      source: {
                        url: url,
                        title: stepData.output.title || stepData.output.name || '',
                        id: url,
                      }
                    })
                  }
                }
              } else if (stepData.toolName === 'addSourcesToLibrary' && stepData.status === 'completed') {
                devLog('📚 [AGENT PARSER] addSourcesToLibrary abgeschlossen, aktualisiere Store...')
                const state = useCitationStore.getState()

                // Falls Citations direkt im Output sind, füge sie sofort zum Store hinzu (für Schnelligkeit)
                if (stepData.output?.libraryId && stepData.output.citations) {
                  devLog('📚 [AGENT PARSER] Füge Citations direkt zum Store hinzu:', stepData.output.citations.length)
                  state.addCitationsToLibrary(stepData.output.libraryId, stepData.output.citations)
                }

                // Trotzdem im Hintergrund neu laden um sicher zu gehen
                if (typeof state.loadLibrariesFromSupabase === 'function') {
                  state.loadLibrariesFromSupabase(state.currentProjectId)
                }
              }
              updateMessage()
            }
          }
        } else if (fullMarker.startsWith('[TOOL_RESULT_B64:')) {
          const base64 = fullMarker.match(/\[TOOL_RESULT_B64:([^\]]+)\]/)?.[1]
          if (base64) {
            try {
              const binaryString = atob(base64)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              const decodedJson = new TextDecoder().decode(bytes)
              const toolResult = JSON.parse(decodedJson)
              console.log('📝 [AGENT PARSER] Tool-Result dekodiert:', {
                type: toolResult.type,
                toolName: toolResult.toolName,
              })
              handleToolResult(toolResult)
            } catch (e) {
              console.error('❌ [AGENT PARSER] Fehler beim Dekodieren von TOOL_RESULT_B64:', e)
            }
          }
        } else if (fullMarker.startsWith('[REASONING_DELTA:')) {
          const base64 = fullMarker.match(/\[REASONING_DELTA:([^\]]+)\]/)?.[1]
          if (base64) {
            try {
              const binaryString = atob(base64)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              const reasoningText = new TextDecoder().decode(bytes)
              const existingReasoningIndex = parts.findIndex(p => p.type === 'reasoning')
              if (existingReasoningIndex >= 0) {
                const existingPart = parts[existingReasoningIndex] as { type: 'reasoning', reasoning: string }
                existingPart.reasoning += reasoningText
              } else {
                parts.unshift({ type: 'reasoning', reasoning: reasoningText })
              }
              updateMessage()
            } catch (e) {
              console.error('Fehler beim Dekodieren von REASONING_DELTA:', e)
            }
          }
        }

        // Marker aus Buffer entfernen
        buffer = buffer.substring(markerEndIndex + 1)
      } else {
        // Kein Marker im aktuellen Buffer - alles ist Text
        const lastOpenBracket = buffer.lastIndexOf('[')
        if (lastOpenBracket !== -1 && lastOpenBracket > buffer.length - 20) {
          const textBefore = buffer.substring(0, lastOpenBracket)
          if (textBefore.length > 0) {
            if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
              (parts[parts.length - 1] as { type: 'text', text: string }).text += textBefore
            } else {
              parts.push({ type: 'text', text: textBefore })
            }
            updateMessage()
          }
          buffer = buffer.substring(lastOpenBracket)
          break
        } else {
          if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
            (parts[parts.length - 1] as { type: 'text', text: string }).text += buffer
          } else {
            parts.push({ type: 'text', text: buffer })
          }
          updateMessage()
          buffer = ""
        }
      }
    }
  }

  updateMessage(true)
}

function handleToolResult(toolResult: any) {
  if (typeof window === 'undefined') {
    devWarn('⚠️ [AGENT PARSER] handleToolResult aufgerufen, aber window ist undefined')
    return
  }

  devLog('📝 [AGENT PARSER] handleToolResult aufgerufen:', {
    type: toolResult.type,
    toolName: toolResult.toolName,
    hasMarkdown: !!toolResult.markdown,
    markdownLength: toolResult.markdown?.length,
    hasSourceId: !!toolResult.sourceId,
    hasThema: !!toolResult.thema,
  })

  if (toolResult.type === 'tool-result' && toolResult.toolName === 'insertTextInEditor' && toolResult.markdown) {
    // Validiere den Markdown-Inhalt
    const markdown = toolResult.markdown
    if (typeof markdown !== 'string' || markdown.length === 0) {
      devError('❌ [AGENT PARSER] insertTextInEditor: Markdown ist ungültig oder leer')
      return
    }

    devLog('✅ [AGENT PARSER] Dispatching insert-text-in-editor Event:', {
      markdownLength: markdown.length,
      markdownPreview: markdown.substring(0, 300),
      markdownEnd: markdown.substring(Math.max(0, markdown.length - 100)),
      position: toolResult.position || 'end',
      targetText: toolResult.targetText,
      targetHeading: toolResult.targetHeading,
    })
    window.dispatchEvent(new CustomEvent('insert-text-in-editor', {
      detail: {
        markdown: markdown,
        position: toolResult.position || 'end',
        targetText: toolResult.targetText,
        targetHeading: toolResult.targetHeading,
        focusOnHeadings: toolResult.focusOnHeadings !== false,
      },
    }))
  } else if (toolResult.type === 'tool-result' && toolResult.toolName === 'deleteTextFromEditor') {
    devLog('🗑️ [AGENT PARSER] Dispatching delete-text-from-editor Event:', {
      targetText: toolResult.targetText,
      targetHeading: toolResult.targetHeading,
      mode: toolResult.mode || 'block',
      startText: toolResult.startText,
      endText: toolResult.endText,
    })
    window.dispatchEvent(new CustomEvent('delete-text-from-editor', {
      detail: {
        targetText: toolResult.targetText,
        targetHeading: toolResult.targetHeading,
        mode: toolResult.mode || 'block',
        startText: toolResult.startText,
        endText: toolResult.endText,
      },
    }))
  } else if (toolResult.type === 'tool-result' && toolResult.toolName === 'addCitation' && toolResult.sourceId) {
    devLog('📝 [AGENT PARSER] addCitation Tool-Result verarbeitet:', {
      sourceId: toolResult.sourceId,
      targetText: toolResult.targetText,
    })

    const state = useCitationStore.getState()
    devLog('📝 [AGENT PARSER] Citation Store State:', {
      savedCitationsCount: state.savedCitations.length,
      savedCitationIds: state.savedCitations.map(c => c.id),
      librariesCount: state.libraries.length,
      allCitationsCount: state.libraries.reduce((sum, lib) => sum + lib.citations.length, 0),
    })

    // Suche in ALLEN Bibliotheken, nicht nur in savedCitations (aktive Bibliothek)
    let citation: SavedCitation | undefined = undefined
    for (const library of state.libraries) {
      citation = library.citations.find(c => c.id === toolResult.sourceId)
      if (citation) {
        devLog('✅ [AGENT PARSER] Citation gefunden in Bibliothek:', {
          libraryId: library.id,
          libraryName: library.name,
        })
        break
      }
    }

    // Fallback: Suche auch in savedCitations (für Kompatibilität)
    if (!citation) {
      citation = state.savedCitations.find(c => c.id === toolResult.sourceId)
    }

    let citationData: {
      sourceId: string
      title: string
      year?: number
      authors: Array<{ fullName?: string; firstName?: string; lastName?: string }>
      doi?: string
      url?: string
      sourceType?: string
      journal?: string
      containerTitle?: string
      publisher?: string
      volume?: string
      issue?: string
      pages?: string
      isbn?: string
      issn?: string
      note?: string
      accessedAt?: string
      targetText?: string
    }

    if (citation) {
      devLog('✅ [AGENT PARSER] Citation gefunden im Store:', {
        sourceId: citation.id,
        title: citation.title,
        year: citation.year,
        authors: citation.authors,
        source: citation.source,
        doi: citation.doi,
        externalUrl: citation.externalUrl,
        abstract: citation.abstract,
      })

      // Konvertiere Jahr
      const year = typeof citation.year === 'string' ? parseInt(citation.year) : citation.year

      // Konvertiere Autoren (kann String oder Array sein)
      const authors = citation.authors?.map((a: string) => {
        if (typeof a === 'string') {
          // Versuche, Vor- und Nachname zu extrahieren
          const parts = a.trim().split(/\s+/)
          if (parts.length >= 2) {
            return {
              fullName: a,
              firstName: parts[0],
              lastName: parts.slice(1).join(' ')
            }
          }
          return { fullName: a }
        }
        return { fullName: a }
      }) || []

      // Konvertiere lastEdited zu accessedAt (ISO-Format)
      let accessedAt: string | undefined
      if (citation.lastEdited) {
        try {
          // Versuche, das Datum zu parsen
          const date = new Date(citation.lastEdited)
          if (!isNaN(date.getTime())) {
            accessedAt = date.toISOString()
          }
        } catch (e) {
          // Ignoriere Parsing-Fehler
        }
      }

      // Extrahiere source-Informationen (könnte Journal, Publisher, etc. sein)
      const source = citation.source || ''

      citationData = {
        sourceId: citation.id,
        title: citation.title || '',
        year,
        authors,
        doi: citation.doi,
        url: citation.externalUrl || citation.href,
        // Verwende source für verschiedene Felder, je nach Kontext
        journal: source || undefined,
        containerTitle: source || undefined,
        publisher: source || undefined,
        sourceType: source ? 'article' : undefined,
        note: citation.abstract || undefined,
        accessedAt,
        targetText: toolResult.targetText,
      }
    } else {
      devError('❌ [AGENT PARSER] Citation nicht im Store gefunden! Die Quelle muss zuerst in einer Bibliothek gespeichert sein:', {
        requestedSourceId: toolResult.sourceId,
        availableIds: state.savedCitations.map(c => c.id),
        availableLibraries: state.libraries.map(l => ({ id: l.id, name: l.name, count: l.citations.length })),
      })

      // Fallback: Erstelle eine minimale Citation mit nur der sourceId
      // Die Citation sollte eigentlich in der Bibliothek sein - dies ist nur ein Notfall-Fallback
      citationData = {
        sourceId: toolResult.sourceId,
        title: `Quelle ${toolResult.sourceId}`,
        year: undefined,
        authors: [],
        url: undefined,
        doi: undefined,
        targetText: toolResult.targetText,
      }

      devWarn('⚠️ [AGENT PARSER] Fallback Citation erstellt (Citation sollte in Bibliothek sein!):', citationData)
    }

    window.dispatchEvent(new CustomEvent('insert-citation', {
      detail: citationData
    }))

    devLog('✅ [AGENT PARSER] insert-citation Event dispatched mit Daten:', citationData)
  } else if (toolResult.type === 'tool-result' && toolResult.toolName === 'addThema' && toolResult.thema) {
    window.dispatchEvent(new CustomEvent('set-agent-thema', { detail: { thema: toolResult.thema } }))
  }
}
