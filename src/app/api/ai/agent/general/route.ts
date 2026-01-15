import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { devLog, devError } from '@/lib/utils/logger'
import { translations, type Language } from '@/lib/i18n/translations'
import { getLanguageForServer } from '@/lib/i18n/server-language'
import { createAgent, runAgentStream } from '@/lib/ai/create-agent'
import { createAgentStreamHandler, createStreamResponse } from '@/lib/ai/agent-stream-handler'
import { GENERAL_AGENT_PROMPT } from './prompts'

export const runtime = 'nodejs'

const queryLanguage = async () => {
  try {
    return await getLanguageForServer()
  } catch {
    return 'de'
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      devError('[GENERAL AGENT] Nicht authentifiziert:', authError?.message)
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { messages, agentState, editorContent, documentContextEnabled, fileContents, projectId } = await req.json()

    if (!agentState) {
      return NextResponse.json({ error: 'Agent State erforderlich' }, { status: 400 })
    }

    const language = await queryLanguage()
    const currentEditorContent: string = editorContent || ''
    const currentProjectId: string | undefined = projectId

    // Thema aus agentState oder Messages extrahieren
    let thema = agentState.thema
    if (!thema && messages && messages.length > 0) {
      const firstUserMessage = messages.find((m: { role: string }) => m.role === 'user')
      if (firstUserMessage?.content) {
        thema = firstUserMessage.content.substring(0, 200)
      }
    }
    thema = thema || 'Allgemeine Schreibarbeit'

    // System Prompt vorbereiten
    let systemPrompt = GENERAL_AGENT_PROMPT
      .replace('{{THEMA}}', thema)
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
        devLog('[GENERAL AGENT] Dateien hinzugefügt:', { count: fileContents.length })
      }
    }

    // Editor-Kontext hinzufügen
    if (documentContextEnabled && currentEditorContent.trim().length > 0) {
      const wordCount = currentEditorContent.split(/\s+/).filter((w: string) => w.length > 0).length
      const headings = currentEditorContent.match(/^#{1,6}\s.+$/gm) || []
      const truncatedContent = currentEditorContent.length > 8000
        ? currentEditorContent.substring(0, 8000) + '\n\n' + (translations[language as Language]?.askAi?.toolTextTruncated || '[... Text gekürzt ...]')
        : currentEditorContent

      systemPrompt += `\n\n## Aktueller Editor-Inhalt (Kontext aktiviert)\n\n**Statistiken:** ${wordCount} Wörter, ${headings.length} Überschriften\n\n\`\`\`\n${truncatedContent}\n\`\`\`\n\n**WICHTIG**: Beziehe dich auf diesen vorhandenen Text, wenn relevant.`
      devLog('[GENERAL AGENT] Editor-Kontext hinzugefügt:', { wordCount })
    }

    // Agent erstellen
    const agent = createAgent('general', {
      userId: user.id,
      projectId: currentProjectId,
      editorContent: currentEditorContent,
      systemPrompt,
      maxSteps: 30,
      maxOutputTokens: 16384,
    })

    // Agent Stream starten
    const agentStream = await runAgentStream(agent, messages)

    // Stream Response erstellen
    const customStream = createAgentStreamHandler(agentStream, {
      onToolCall: (toolName) => {
        devLog(`[GENERAL AGENT] Tool called: ${toolName}`)
      },
      onError: (error) => {
        devError('[GENERAL AGENT] Error:', error.message)
      },
    })

    return createStreamResponse(customStream)
  } catch (error) {
    devError('[GENERAL AGENT] Error:', error)
    return NextResponse.json({ error: 'Failed to process agent request' }, { status: 500 })
  }
}
