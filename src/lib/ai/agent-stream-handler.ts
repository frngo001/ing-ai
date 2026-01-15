import { Buffer } from 'node:buffer'
import { devLog, devWarn, devError } from '@/lib/utils/logger'

export interface StreamHandlerOptions {
  onToolCall?: (toolName: string, input: Record<string, unknown>) => void
  onToolResult?: (toolName: string, output: unknown) => void
  onText?: (text: string) => void
  onError?: (error: Error) => void
  onFinish?: () => void
}

function createToolStepMarker(
  type: 'start' | 'end',
  data: {
    id: string
    toolName: string
    input?: Record<string, unknown>
    output?: Record<string, unknown>
    status?: 'completed' | 'error'
    error?: string
  }
): string {
  const payload = JSON.stringify(data)
  const base64 = Buffer.from(payload).toString('base64')
  return type === 'start' ? `[TOOL_STEP_START:${base64}]` : `[TOOL_STEP_END:${base64}]`
}

export function createAgentStreamHandler(
  agentStream: { fullStream: AsyncIterable<unknown> },
  options: StreamHandlerOptions = {}
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const toolStepTimestamps: Record<string, number> = {}
  const toolStepIds: Record<string, string> = {}

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of agentStream.fullStream) {
          const eventType = (event as { type: string }).type

          // Handle reasoning events (for models that support it)
          if (eventType === 'reasoning-start') {
            continue
          }

          if (eventType === 'reasoning-delta' || eventType === 'reasoning-end') {
            const reasoningText = 'textDelta' in (event as Record<string, unknown>)
              ? ((event as { textDelta: string }).textDelta)
              : ''
            if (reasoningText && reasoningText.length > 0) {
              const reasoningMarker = `[REASONING_DELTA:${Buffer.from(reasoningText).toString('base64')}]`
              controller.enqueue(encoder.encode(reasoningMarker))
            }
            continue
          }

          if (eventType === 'start') {
            continue
          }

          if (eventType === 'tool-call') {
            const toolEvent = event as { toolCallId: string; toolName: string; input?: Record<string, unknown> }
            const stepId = `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
            toolStepTimestamps[toolEvent.toolCallId] = Date.now()
            toolStepIds[toolEvent.toolCallId] = stepId

            const toolInput = toolEvent.input || {}
            options.onToolCall?.(toolEvent.toolName, toolInput)

            const startMarker = createToolStepMarker('start', {
              id: stepId,
              toolName: toolEvent.toolName,
              input: toolInput,
            })
            controller.enqueue(encoder.encode(startMarker))
            await new Promise(resolve => setTimeout(resolve, 10))
          } else if (eventType === 'tool-result') {
            const toolEvent = event as { toolCallId: string; toolName: string; output?: unknown }
            const stepId = toolStepIds[toolEvent.toolCallId] || `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

            const toolOutput = toolEvent.output
            options.onToolResult?.(toolEvent.toolName, toolOutput)

            const output: Record<string, unknown> = {}
            if (typeof toolOutput === 'object' && toolOutput !== null) {
              const result = toolOutput as Record<string, unknown>

              // Copy relevant output fields
              const outputFields = [
                'totalResults', 'totalSelected', 'sourcesFound', 'added',
                'libraryId', 'libraryName', 'count', 'success', 'error', 'message',
                'finished', 'summary', 'nextSteps'
              ]
              outputFields.forEach(field => {
                if (result[field] !== undefined) output[field] = result[field]
              })

              // Handle _streamMarker for editor tools
              if (result._streamMarker && typeof result._streamMarker === 'string') {
                devLog('📝 [STREAM] Writing _streamMarker:', {
                  toolName: toolEvent.toolName,
                  markerLength: result._streamMarker.length,
                })
                controller.enqueue(encoder.encode(result._streamMarker))
                await new Promise(resolve => setTimeout(resolve, 10))
              }

              // Handle webSearch results
              if (toolEvent.toolName === 'webSearch' && result.results) {
                output.results = result.results
              }
              if ((toolEvent.toolName === 'webCrawl' || toolEvent.toolName === 'webExtract') && result.url) {
                output.url = result.url
                output.title = result.title || result.name || ''
              }
            }

            const endMarker = createToolStepMarker('end', {
              id: stepId,
              toolName: toolEvent.toolName,
              status: (toolOutput as Record<string, unknown>)?.success === false ? 'error' : 'completed',
              output,
              error: (toolOutput as Record<string, unknown>)?.error as string | undefined,
            })
            controller.enqueue(encoder.encode(endMarker))
            await new Promise(resolve => setTimeout(resolve, 10))
          } else if (eventType === 'text-delta') {
            const textEvent = event as { text?: string }
            const textContent = textEvent.text || ''
            if (textContent) {
              options.onText?.(textContent)
              controller.enqueue(encoder.encode(textContent))
            }
          } else if (eventType === 'finish') {
            options.onFinish?.()
          } else if (eventType === 'error') {
            const errorEvent = event as { error?: unknown }
            const errorMessage = errorEvent.error ? String(errorEvent.error) : 'Unbekannter Fehler'
            devError('❌ [STREAM] Agent error:', errorMessage)
            options.onError?.(new Error(errorMessage))

            const errorMarker = `\n\n**Fehler:** Es ist ein Problem aufgetreten. Bitte versuche es erneut.\n`
            controller.enqueue(encoder.encode(errorMarker))
          }
        }
        controller.close()
      } catch (error) {
        devError('❌ [STREAM] Stream error:', error)
        options.onError?.(error instanceof Error ? error : new Error(String(error)))

        try {
          const errorMarker = `\n\n**Fehler:** Die Verarbeitung wurde unterbrochen. Bitte versuche es erneut.\n`
          controller.enqueue(encoder.encode(errorMarker))
        } catch {
          // Controller might be closed
        }

        controller.error(error)
      }
    }
  })
}

export function createStreamResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
