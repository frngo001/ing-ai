/**
 * Stream-Parser für Agent-Modi (Bachelorarbeit, General)
 * Mit Tool-Step-Visualisierung und Reasoning-Tracking
 */

import { useCitationStore } from '@/lib/stores/citation-store'
import type { ToolStep, MessagePart, ChatMessage } from '@/lib/ask-ai-pane/types'

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
  let isStreamingToEditor = false
  let streamStartIndex = -1
  let dispatchedStreamLength = 0
  
  // Parts Tracking (für Inline-Darstellung)
  let parts: MessagePart[] = []
  const toolIdToPartIndex: Map<string, number> = new Map()

  const updateMessage = () => {
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

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    const decoded = decoder.decode(value, { stream: true })
    buffer += decoded
    fullText += decoded

    // Wir verarbeiten den Buffer Stück für Schritt und extrahieren entweder Text oder Marker
    while (buffer.length > 0) {
      // Suche nach allen möglichen Marker-Typen
      // Marker mit Payload (haben ":") und Marker ohne Payload
      const markerWithPayloadRegex = /\[(TOOL_STEP_START|TOOL_STEP_END|TOOL_RESULT|TOOL_RESULT_B64|REASONING_DELTA):/
      const editorStreamStartRegex = /\[START_EDITOR_STREAM\]/
      const editorStreamEndRegex = /\[END_EDITOR_STREAM\]/
      
      const matchWithPayload = buffer.match(markerWithPayloadRegex)
      const matchEditorStart = buffer.match(editorStreamStartRegex)
      const matchEditorEnd = buffer.match(editorStreamEndRegex)
      
      // Finde den frühesten Marker
      let earliestMatch: { index: number; type: 'payload' | 'editor-start' | 'editor-end' } | null = null
      
      if (matchWithPayload) {
        earliestMatch = { index: matchWithPayload.index!, type: 'payload' }
      }
      if (matchEditorStart && (!earliestMatch || matchEditorStart.index! < earliestMatch.index)) {
        earliestMatch = { index: matchEditorStart.index!, type: 'editor-start' }
      }
      if (matchEditorEnd && (!earliestMatch || matchEditorEnd.index! < earliestMatch.index)) {
        earliestMatch = { index: matchEditorEnd.index!, type: 'editor-end' }
      }

      if (earliestMatch) {
        const markerStartIndex = earliestMatch.index
        
        // Wenn Text vor dem Marker ist, füge ihn als Text-Part hinzu
        if (markerStartIndex > 0) {
          const textBefore = buffer.substring(0, markerStartIndex)
          if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
            (parts[parts.length - 1] as { type: 'text', text: string }).text += textBefore
          } else {
            parts.push({ type: 'text', text: textBefore })
          }
          buffer = buffer.substring(markerStartIndex)
          updateMessage()
          // Weitermachen mit dem Marker am Anfang des Buffers
          continue
        }

        // Marker ist am Anfang des Buffers
        // Für Editor-Stream-Tags: Sie sind komplett ohne Payload
        if (earliestMatch.type === 'editor-start') {
          const tag = '[START_EDITOR_STREAM]'
          if (buffer.startsWith(tag)) {
            isStreamingToEditor = true
            streamStartIndex = fullText.indexOf(tag) + tag.length
            dispatchedStreamLength = 0
            buffer = buffer.substring(tag.length)
            console.log('📝 [AGENT PARSER] Editor-Stream gestartet')
            continue
          }
        }
        
        if (earliestMatch.type === 'editor-end') {
          const tag = '[END_EDITOR_STREAM]'
          if (buffer.startsWith(tag)) {
            isStreamingToEditor = false
            buffer = buffer.substring(tag.length)
            console.log('📝 [AGENT PARSER] Editor-Stream beendet')
            
            // Sende end-event für Finalisierung
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('end-editor-stream'))
            }
            continue
          }
        }
        
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
                // Tavily gibt results zurück
                const results = stepData.output.results || stepData.output.result?.results || []
                if (Array.isArray(results)) {
                  results.forEach((result: any) => {
                    if (result.url) {
                      // Prüfe ob Quelle bereits vorhanden
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
                // Für webCrawl/webExtract: URL aus Input oder Output extrahieren
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
              }
              
              updateMessage()
            }
          }
        } else if (fullMarker.startsWith('[TOOL_RESULT_B64:')) {
          const base64 = fullMarker.match(/\[TOOL_RESULT_B64:([^\]]+)\]/)?.[1]
          if (base64 && agentStore.isActive) {
            try {
              const binaryString = atob(base64)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              const decodedJson = new TextDecoder().decode(bytes)
              const toolResult = JSON.parse(decodedJson)
              
              // Event-Handling (Editor, Citations, etc.)
              handleToolResult(toolResult)
            } catch (e) { console.error(e) }
          }
        } else if (fullMarker.startsWith('[REASONING_DELTA:')) {
          // Reasoning-Delta verarbeiten und als Part hinzufügen
          const base64 = fullMarker.match(/\[REASONING_DELTA:([^\]]+)\]/)?.[1]
          if (base64) {
            try {
              const binaryString = atob(base64)
              const bytes = new Uint8Array(binaryString.length)
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i)
              }
              const reasoningText = new TextDecoder().decode(bytes)
              
              // Füge Reasoning zu Parts hinzu oder aktualisiere vorhandenes
              const existingReasoningIndex = parts.findIndex(p => p.type === 'reasoning')
              if (existingReasoningIndex >= 0) {
                const existingPart = parts[existingReasoningIndex] as { type: 'reasoning', reasoning: string }
                existingPart.reasoning += reasoningText
              } else {
                // Neues Reasoning-Part am Anfang einfügen
                parts.unshift({ type: 'reasoning', reasoning: reasoningText })
              }
              updateMessage()
            } catch (e) {
              console.error('Fehler beim Dekodieren von REASONING_DELTA:', e)
            }
          }
        }
        // Editor-Stream-Tags werden oben bereits behandelt

        // Marker aus Buffer entfernen
        buffer = buffer.substring(markerEndIndex + 1)
      } else {
        // Kein Marker im aktuellen Buffer - alles ist Text
        // Aber Achtung: Wenn der Buffer mit '[' endet, könnte ein Marker starten
        const lastOpenBracket = buffer.lastIndexOf('[')
        if (lastOpenBracket !== -1 && lastOpenBracket > buffer.length - 20) {
          // Möglicher Marker-Start am Ende - verarbeite Text davor
          const textBefore = buffer.substring(0, lastOpenBracket)
          if (textBefore.length > 0) {
            if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
              (parts[parts.length - 1] as { type: 'text', text: string }).text += textBefore
            } else {
              parts.push({ type: 'text', text: textBefore })
            }
            buffer = buffer.substring(lastOpenBracket)
            updateMessage()
          }
          // Rest im Buffer lassen für nächsten Chunk
          break
        } else {
          // Gar kein Marker-Indiz - alles Text
          if (parts.length > 0 && parts[parts.length - 1].type === 'text') {
            (parts[parts.length - 1] as { type: 'text', text: string }).text += buffer
          } else {
            parts.push({ type: 'text', text: buffer })
          }
          buffer = ""
          updateMessage()
        }
      }
    }

    // Editor Live-Update (Chunk-basiertes Streaming für Live-Gefühl)
    if (isStreamingToEditor) {
      const currentStreamContent = fullText.substring(streamStartIndex)
      // Entferne den END-Marker aus dem Content, falls vorhanden
      const cleanContent = currentStreamContent.replace(/\[END_EDITOR_STREAM\].*$/s, '')
      const newContent = cleanContent.substring(dispatchedStreamLength)
      
      if (newContent.length > 0 && typeof window !== 'undefined') {
        // Sende init-event beim ersten Chunk
        if (dispatchedStreamLength === 0) {
          window.dispatchEvent(new CustomEvent('init-editor-stream'))
        }
        
        // Sende den neuen Chunk für Live-Streaming
        window.dispatchEvent(new CustomEvent('stream-editor-chunk', {
          detail: { chunk: newContent },
        }))
        dispatchedStreamLength = cleanContent.length
      }
    }
  }

  updateMessage()
}

function handleToolResult(toolResult: any) {
  if (typeof window === 'undefined') return

  if (toolResult.type === 'tool-result' && toolResult.toolName === 'insertTextInEditor' && toolResult.markdown) {
    window.dispatchEvent(new CustomEvent('insert-text-in-editor', {
      detail: {
        markdown: toolResult.markdown,
        position: toolResult.position || 'end',
        focusOnHeadings: toolResult.focusOnHeadings !== false,
      },
    }))
  } else if (toolResult.type === 'tool-result' && toolResult.toolName === 'addCitation' && toolResult.sourceId) {
    const state = useCitationStore.getState()
    const citation = state.savedCitations.find(c => c.id === toolResult.sourceId)
    if (citation) {
      window.dispatchEvent(new CustomEvent('insert-citation', {
        detail: {
          sourceId: citation.id,
          title: citation.title,
          year: typeof citation.year === 'string' ? parseInt(citation.year) : citation.year,
          authors: citation.authors?.map(a => ({ fullName: a })) || [],
          doi: citation.doi,
          url: citation.externalUrl || citation.href
        }
      }))
    }
  } else if (toolResult.type === 'tool-result' && toolResult.toolName === 'addThema' && toolResult.thema) {
    window.dispatchEvent(new CustomEvent('set-agent-thema', { detail: { thema: toolResult.thema } }))
  }
}
