import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { devLog, devError } from '@/lib/utils/logger'
import { createAgent, runAgentStream } from '@/lib/ai/create-agent'
import { createAgentStreamHandler, createStreamResponse } from '@/lib/ai/agent-stream-handler'
import { WEBSEARCH_AGENT_PROMPT } from './prompts'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      devError('[WEBSEARCH AGENT] Nicht authentifiziert:', authError?.message)
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { messages, fileContents } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages erforderlich' }, { status: 400 })
    }

    // System Prompt vorbereiten
    let systemPrompt = WEBSEARCH_AGENT_PROMPT
      .replace('{{CURRENT_DATE}}', new Date().toLocaleDateString('de-DE', { dateStyle: 'full' }))

    // Datei-Inhalte hinzufügen
    if (fileContents && Array.isArray(fileContents) && fileContents.length > 0) {
      const fileSections = fileContents
        .filter((file: { content?: string }) => file.content && file.content.trim().length > 0)
        .map((file: { name: string; content: string }) => {
          const wordCount = file.content.split(/\s+/).filter((w: string) => w.length > 0).length
          return `### Datei: ${file.name}\n\nInhalt (${wordCount} Wörter):\n\n\`\`\`\n${file.content}\n\`\`\``
        })

      if (fileSections.length > 0) {
        systemPrompt += `\n\n## Hochgeladene Dateien\n\n${fileSections.join('\n\n---\n\n')}`
        devLog('[WEBSEARCH AGENT] Dateien hinzugefügt:', { count: fileContents.length })
      }
    }

    // Agent erstellen
    const agent = createAgent('websearch', {
      userId: user.id,
      systemPrompt,
      maxSteps: 5,
    })

    // Agent Stream starten
    const agentStream = await runAgentStream(agent, messages)

    // Stream Response erstellen
    const customStream = createAgentStreamHandler(agentStream, {
      onToolCall: (toolName) => {
        devLog(`[WEBSEARCH AGENT] Tool called: ${toolName}`)
      },
      onError: (error) => {
        devError('[WEBSEARCH AGENT] Error:', error.message)
      },
    })

    return createStreamResponse(customStream)
  } catch (error) {
    devError('[WEBSEARCH AGENT] Error:', error)
    return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 })
  }
}
