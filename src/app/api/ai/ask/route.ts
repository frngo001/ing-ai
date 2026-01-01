import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { GENERAL_CHAT_PROMPT } from '@/lib/ai/prompts'
import { streamText, stepCountIs } from 'ai'
import { devWarn, devError } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const maxDuration = 30

type ChatMessage = { role: "user" | "assistant"; content: string }

export async function POST(req: Request) {
    try {
        const { question, context, editorContent, documentContextEnabled, messages = [], useWeb = false, fileContents } = await req.json()

        if (!question) {
            return new Response('Question is required', { status: 400 })
        }

        const limitedHistory: ChatMessage[] = Array.isArray(messages) ? messages.slice(-20) : []

        const historyWithQuestion =
            limitedHistory.length && limitedHistory[limitedHistory.length - 1]?.role === "user"
                ? limitedHistory
                : [...limitedHistory, { role: "user", content: question }]

        // Baue Editor-Kontext-Sektion, wenn aktiviert
        let editorContextSection = null
        if (documentContextEnabled && editorContent && editorContent.trim().length > 0) {
            const wordCount = editorContent.split(/\s+/).filter((w: string) => w.length > 0).length
            // Begrenze auf 8000 Zeichen
            const truncatedContent = editorContent.length > 8000 
                ? editorContent.substring(0, 8000) + '\n\n[... Text gekürzt ...]'
                : editorContent
            
            editorContextSection = `## Aktueller Editor-Inhalt (Kontext aktiviert)

Der Nutzer hat den Dokumentkontext aktiviert. Hier ist der aktuelle Inhalt des Editors (${wordCount} Wörter):

\`\`\`
${truncatedContent}
\`\`\`

Beziehe dich auf diesen Text, wenn der Nutzer danach fragt oder wenn es relevant ist.`
        }

        // Baue Datei-Content-Sektion, wenn Dateien hochgeladen wurden
        let fileContentSection = null
        if (fileContents && Array.isArray(fileContents) && fileContents.length > 0) {
            const fileSections = fileContents
                .filter((file: any) => file.content && file.content.trim().length > 0)
                .map((file: any) => {
                    const wordCount = file.content.split(/\s+/).filter((w: string) => w.length > 0).length
                    const charCount = file.content.length
                    return `### Datei: ${file.name} (${file.type})

Inhalt (${wordCount} Wörter, ${charCount} Zeichen):

\`\`\`
${file.content}
\`\`\``
                })
            
            if (fileSections.length > 0) {
                fileContentSection = `## Hochgeladene Dateien (Dokument-Text)

**WICHTIG:** Der Nutzer hat folgende Dateien hochgeladen. Der untenstehende Text ist der **vollständige extrahierte Textinhalt** dieser Dokumente. 

Beziehe dich auf diesen Dokument-Text, wenn der Nutzer Fragen dazu stellt oder wenn der Inhalt für die Antwort relevant ist. Du kannst direkt auf spezifische Passagen, Daten oder Informationen aus diesen Dokumenten verweisen.

${fileSections.join('\n\n---\n\n')}`
              
            } else {
                devWarn(`[ASK] Warnung: ${fileContents.length} Datei(en) erhalten, aber keine mit gültigem Inhalt`)
            }
        } else {
        }

        const systemPrompt = [
            GENERAL_CHAT_PROMPT,
            useWeb 
                ? "**WEBSUCHE AKTIVIERT:** Du hast Zugriff auf Websuche-Tools (webSearch, webExtract). Verwende sie für aktuelle Informationen, Fakten und real-time Daten, die nicht in deinem Wissensstand enthalten sind."
                : "**WEBSUCHE DEAKTIVIERT:** Du hast KEINEN Zugriff auf Websuche-Tools. Antworte basierend auf deinem vorhandenen Wissen. Verwende KEINE Websuche-Tools und erwähne sie nicht.",
            context ? `Additional context: ${context}` : null,
            editorContextSection,
            fileContentSection,
        ]
            .filter(Boolean)
            .join("\n\n")

        const result = streamText({
            model: deepseek(DEEPSEEK_CHAT_MODEL),
            system: systemPrompt,
            messages: historyWithQuestion.map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
            })),
            tools: undefined,
            toolChoice: 'auto',
            stopWhen: stepCountIs(10),
            })

        return result.toUIMessageStreamResponse()

    } catch (error) {
        devError('AskJenni error:', error)
        return new Response('Error processing question', { status: 500 })
    }
}
