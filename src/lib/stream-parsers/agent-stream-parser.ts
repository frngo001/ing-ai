/**
 * Stream-Parser für Agent-Modi (Bachelorarbeit, General)
 * Einfaches Text-Stream-Parsing ohne Reasoning/Sources
 */

import { useCitationStore } from '@/lib/stores/citation-store'

export interface AgentStreamParserOptions {
  assistantId: string
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
  agentStore: {
    isActive: boolean
    [key: string]: any
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

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    const decoded = decoder.decode(value, { stream: true })
    buffer += decoded
    fullText += decoded

    // Editor-Stream Handling
    if (!isStreamingToEditor) {
      const startMarker = "[START_EDITOR_STREAM]"
      const startIdx = fullText.lastIndexOf(startMarker)
      if (startIdx !== -1 && startIdx >= streamStartIndex) {
        isStreamingToEditor = true
        streamStartIndex = startIdx + startMarker.length
        dispatchedStreamLength = 0
      }
    }

    if (isStreamingToEditor) {
      const endMarker = "[END_EDITOR_STREAM]"
      const endIdx = fullText.indexOf(endMarker, streamStartIndex)
      if (endIdx !== -1) {
        const currentStreamContent = fullText.substring(streamStartIndex, endIdx)
        const newContent = currentStreamContent.substring(dispatchedStreamLength)
        if (newContent.length > 0 && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('insert-text-in-editor', {
              detail: { markdown: newContent, position: 'end', focusOnHeadings: true },
            })
          )
          dispatchedStreamLength = currentStreamContent.length
        }
        isStreamingToEditor = false
      } else {
        const currentStreamContent = fullText.substring(streamStartIndex)
        const newContent = currentStreamContent.substring(dispatchedStreamLength)
        if (newContent.length > 0 && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('insert-text-in-editor', {
              detail: { markdown: newContent, position: 'end', focusOnHeadings: true },
            })
          )
          dispatchedStreamLength = currentStreamContent.length
        }
      }
    }

    // Tool-Result Handling
    if (agentStore.isActive && !toolResultProcessed) {
      const b64Match = buffer.match(/\[TOOL_RESULT_B64:([^\]]+)\]/)
      if (b64Match) {
        try {
          const binaryString = atob(b64Match[1])
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const decodedJson = new TextDecoder().decode(bytes)
          const toolResult = JSON.parse(decodedJson)

          if (toolResult.type === 'tool-result' && toolResult.toolName === 'insertTextInEditor' && toolResult.markdown) {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('insert-text-in-editor', {
                  detail: {
                    markdown: toolResult.markdown,
                    position: toolResult.position || 'end',
                    focusOnHeadings: toolResult.focusOnHeadings !== false,
                  },
                })
              )
              toolResultProcessed = true
            }
            buffer = buffer.replace(/\[TOOL_RESULT_B64:[^\]]+\]/, '')
          } else if (toolResult.type === 'tool-result' && toolResult.toolName === 'addCitation' && toolResult.sourceId) {
            // Suche Quelle in der Bibliothek
            const state = useCitationStore.getState()
            const citation = state.savedCitations.find(c => c.id === toolResult.sourceId)

            if (citation) {
              const citationData = {
                sourceId: citation.id,
                title: citation.title,
                year: typeof citation.year === 'string' ? parseInt(citation.year) : citation.year,
                authors: citation.authors?.map(a => ({ fullName: a })) || [],
                doi: citation.doi,
                url: citation.externalUrl || citation.href
              }

              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('insert-citation', {
                    detail: citationData
                  })
                )
                toolResultProcessed = true
              }
            } else {
              if (toolResult.citationText && typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('insert-text-in-editor', {
                    detail: {
                      markdown: ` ${toolResult.citationText} `,
                      position: 'current',
                      focusOnHeadings: false,
                    },
                  })
                )
                toolResultProcessed = true
              }
            }
            buffer = buffer.replace(/\[TOOL_RESULT_B64:[^\]]+\]/, '')
          }
        } catch (error) {
          console.error('Fehler beim Parsen von Base64 Tool-Result:', error)
        }
      }

      // Fallback: Suche nach altem Tool-Result Marker
      if (!toolResultProcessed) {
        const toolResultMatch = buffer.match(/\[TOOL_RESULT:([^\]]+)\]/)
        if (toolResultMatch) {
          try {
            const toolResult = JSON.parse(toolResultMatch[1])
            if (toolResult.type === 'tool-result' && toolResult.toolName === 'insertTextInEditor' && toolResult.markdown) {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(
                  new CustomEvent('insert-text-in-editor', {
                    detail: {
                      markdown: toolResult.markdown,
                      position: toolResult.position || 'end',
                      focusOnHeadings: toolResult.focusOnHeadings !== false,
                    },
                  })
                )
                toolResultProcessed = true
              }
              buffer = buffer.replace(/\[TOOL_RESULT:[^\]]+\]/, '')
            }
          } catch (error) {
            console.error('Fehler beim Parsen von Tool-Result:', error)
          }
        }
      }
    }

    // Entferne Marker aus dem angezeigten Text
    const cleanedText = fullText
      .replace(/\[TOOL_RESULT:[^\]]+\]/g, '')
      .replace(/\[TOOL_RESULT_B64:[^\]]+\]/g, '')
      .replace(/\[START_EDITOR_STREAM\][\s\S]*?(\[END_EDITOR_STREAM\]|$)/g, '*(Schreibe in Editor...)*')
      .trim()

    // Update message live
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? {
              ...m,
              content: cleanedText,
            }
          : m
      )
    )
  }

  // Finale Bereinigung am Ende
  const finalCleanedText = fullText
    .replace(/\[TOOL_RESULT:[^\]]+\]/g, '')
    .replace(/\[TOOL_RESULT_B64:[^\]]+\]/g, '')
    .replace(/\[START_EDITOR_STREAM\][\s\S]*?(\[END_EDITOR_STREAM\]|$)/g, '*(Schreibe in Editor...)*')
    .trim()

  setMessages((prev) =>
    prev.map((m) =>
      m.id === assistantId
        ? {
            ...m,
            content: finalCleanedText,
          }
        : m
    )
  )
}

