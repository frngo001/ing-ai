import { deepseek, DEEPSEEK_REASONER_MODEL } from '@/lib/ai/deepseek'
import { GENERAL_CHAT_PROMPT } from '@/lib/ai/prompts'
import { streamText, stepCountIs } from 'ai'
import { tavilyCrawl, tavilyMap, tavilySearch } from '@tavily/ai-sdk'
import { tavilyExtract } from '@tavily/ai-sdk'

export const runtime = 'nodejs'
export const maxDuration = 30

type ChatMessage = { role: "user" | "assistant"; content: string }

export async function POST(req: Request) {
    try {
        const { question, context, documentContent, messages = [], useWeb = false } = await req.json()

        if (!question) {
            return new Response('Question is required', { status: 400 })
        }

        const limitedHistory: ChatMessage[] = Array.isArray(messages) ? messages.slice(-20) : []

        const historyWithQuestion =
            limitedHistory.length && limitedHistory[limitedHistory.length - 1]?.role === "user"
                ? limitedHistory
                : [...limitedHistory, { role: "user", content: question }]

        const systemPrompt = [
            GENERAL_CHAT_PROMPT,
            useWeb ? "You have access to a web search tool. Use it when the user asks for current information or specific facts not in your knowledge base." : null,
            context ? `Additional context: ${context}` : null,
            documentContent
                ? `Current document excerpt:\n${String(documentContent).slice(0, 1000)}`
                : null,
        ]
            .filter(Boolean)
            .join("\n\n")

        const tools: any = {}
        if (useWeb) {
            tools.webSearch = tavilySearch()
            tools.webCrawl = tavilyCrawl()
            tools.webExtract = tavilyExtract()
            tools.webMap = tavilyMap()
        }

        const result = streamText({
            model: deepseek(DEEPSEEK_REASONER_MODEL),
            system: systemPrompt,
            messages: historyWithQuestion.map((m) => ({
                role: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
            })),
            tools: useWeb ? tools : undefined,
            toolChoice: 'auto',
            stopWhen: stepCountIs(10),
                maxOutputTokens: 8192, 
            })

        return result.toUIMessageStreamResponse()

    } catch (error) {
        console.error('AskJenni error:', error)
        return new Response('Error processing question', { status: 500 })
    }
}
