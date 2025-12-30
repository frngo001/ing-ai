import type { NextRequest } from 'next/server'
import { Buffer } from 'node:buffer'
import { Experimental_Agent as Agent, stepCountIs, tool } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'

import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { WEBSEARCH_AGENT_PROMPT } from './prompts'
import { createClient } from '@/lib/supabase/server'
import { tavilySearch, tavilyCrawl, tavilyExtract } from '@tavily/ai-sdk'

export const runtime = 'nodejs'
export const maxDuration = 30

function createToolStepMarker(
  type: 'start' | 'end',
  data: {
    id: string
    toolName: string
    input?: Record<string, any>
    output?: Record<string, any>
    status?: 'completed' | 'error'
    error?: string
  }
): string {
  const payload = JSON.stringify(data)
  const base64 = Buffer.from(payload).toString('base64')
  return type === 'start' 
    ? `[TOOL_STEP_START:${base64}]`
    : `[TOOL_STEP_END:${base64}]`
}

function generateToolStepId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[WEBSEARCH AGENT] Nicht authentifiziert:', authError?.message)
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { messages, fileContents } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages erforderlich' }, { status: 400 })
    }

    const model = deepseek(DEEPSEEK_CHAT_MODEL)
    let systemPrompt = WEBSEARCH_AGENT_PROMPT.replace(
      '{{CURRENT_DATE}}',
      new Date().toLocaleDateString('de-DE', { dateStyle: 'full' })
    )
    
    if (fileContents && Array.isArray(fileContents) && fileContents.length > 0) {
      const fileSections = fileContents
        .filter((file: any) => file.content && file.content.trim().length > 0)
        .map((file: any) => {
          const wordCount = file.content.split(/\s+/).filter((w: string) => w.length > 0).length
          return `### Datei: ${file.name}

Inhalt (${wordCount} Wörter):

\`\`\`
${file.content}
\`\`\``
        })
      
      if (fileSections.length > 0) {
        const fileContentSection = `\n\n## Hochgeladene Dateien

Der Nutzer hat folgende Dateien hochgeladen. Beziehe dich auf deren Inhalt, wenn der Nutzer danach fragt oder wenn es relevant ist:

${fileSections.join('\n\n---\n\n')}`
        systemPrompt += fileContentSection
        console.log('[WEBSEARCH AGENT] Datei-Content aktiviert:', { fileCount: fileContents.length })
      }
    }

    const agent = new Agent({
      model,
      system: systemPrompt,
      tools: {
        webSearch: tavilySearch(),
        webCrawl: tavilyCrawl(),
        webExtract: tavilyExtract(),
      },
      toolChoice: 'auto',
      stopWhen: stepCountIs(5),
      maxOutputTokens: 4096,
    })

    const agentStream = agent.stream({
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const encoder = new TextEncoder()
    const toolStepTimestamps: Record<string, number> = {}
    const toolStepIds: Record<string, string> = {}
    let stepCount = 0

    const customStream = new ReadableStream({
      async start(controller) {
        try {          
          for await (const event of agentStream.fullStream) {
            if (event.type === 'reasoning-start') {
              continue
            }
            
            if (event.type === 'reasoning-delta' || event.type === 'reasoning-end') {
              const reasoningText = 'textDelta' in event ? (event as { textDelta: string }).textDelta : ''
              if (reasoningText && reasoningText.length > 0) {
                const reasoningMarker = `[REASONING_DELTA:${Buffer.from(reasoningText).toString('base64')}]`
                controller.enqueue(encoder.encode(reasoningMarker))
              }
              if (event.type === 'reasoning-end') {
              }
              continue
            }
            
            if (event.type === 'start') {
              stepCount++
              continue
            }
            
            if (event.type === 'tool-call') {
              const stepId = `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
              toolStepTimestamps[event.toolCallId] = Date.now()
              toolStepIds[event.toolCallId] = stepId
              
              const toolInput = 'input' in event ? (event.input as Record<string, any>) : {}
              
              const startMarker = createToolStepMarker('start', {
                id: stepId,
                toolName: event.toolName,
                input: toolInput,
              })
              controller.enqueue(encoder.encode(startMarker))
              
              await new Promise(resolve => setTimeout(resolve, 10))
            } else if (event.type === 'tool-result') {
              const stepId = toolStepIds[event.toolCallId] || `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
              const startTime = toolStepTimestamps[event.toolCallId] || Date.now()
              
              const toolOutput = 'output' in event ? event.output : null
              
              const output: Record<string, any> = {}
              if (typeof toolOutput === 'object' && toolOutput !== null) {
                const result = toolOutput as Record<string, any>
                if (result.totalResults !== undefined) output.totalResults = result.totalResults
                if (result.success !== undefined) output.success = result.success
                if (result.error !== undefined) output.error = result.error
                if (result.message !== undefined) output.message = result.message
                
                if (event.toolName === 'webSearch' && result.results) {
                  output.results = result.results
                }
                if ((event.toolName === 'webCrawl' || event.toolName === 'webExtract') && result.url) {
                  output.url = result.url
                  output.title = result.title || result.name || ''
                }
              }
              
              const endMarker = createToolStepMarker('end', {
                id: stepId,
                toolName: event.toolName,
                status: (toolOutput as any)?.success === false ? 'error' : 'completed',
                output,
                error: (toolOutput as any)?.error,
              })
              controller.enqueue(encoder.encode(endMarker))
              
              await new Promise(resolve => setTimeout(resolve, 10))
            } else if (event.type === 'text-delta') {
              const textContent = 'text' in event ? event.text : ''
              if (textContent) {
                controller.enqueue(encoder.encode(textContent))
              }
            } else if (event.type === 'finish') {
            } else if (event.type === 'error') {
              const errorMessage = 'error' in event ? String(event.error) : 'Unbekannter Fehler'
              console.error(`❌ [WEBSEARCH STREAM] Agent-Fehler: ${errorMessage}`)
              
              const errorMarker = `\n\n**Fehler:** Es ist ein Problem aufgetreten. Bitte versuche es erneut.\n`
              controller.enqueue(encoder.encode(errorMarker))
            }
          }
          
          controller.close()
        } catch (error) {
          console.error('❌ [WEBSEARCH STREAM] Stream error:', error)
          
          try {
            const errorMarker = `\n\n**Fehler:** Die Verarbeitung wurde unterbrochen. Bitte versuche es erneut.\n`
            controller.enqueue(encoder.encode(errorMarker))
          } catch (e) {
          }
          
          controller.error(error)
        }
      }
    })

    return new Response(customStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('[WEBSEARCH AGENT] Error:', error)
    return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 })
  }
}

