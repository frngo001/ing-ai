import { deepseek, DEEPSEEK_CHAT_MODEL, DEFAULT_TEMPERATURE } from '@/lib/ai/deepseek'
import { RESEARCH_ASSISTANT_PROMPT } from '@/lib/ai/prompts'
import { streamText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { question, context, documentContent } = await req.json()

        if (!question) {
            return new Response('Question is required', { status: 400 })
        }

        const prompt = `User question: ${question}

${context ? `Additional context: ${context}` : ''}

${documentContent ? `Current document excerpt:\n${documentContent.slice(0, 1000)}` : ''}

Provide a helpful, accurate answer to assist the user with their research and writing.`

        const result = streamText({
            model: deepseek(DEEPSEEK_CHAT_MODEL),
            system: RESEARCH_ASSISTANT_PROMPT,
            prompt,
            temperature: DEFAULT_TEMPERATURE,
        })

        return result.toTextStreamResponse()
    } catch (error) {
        console.error('AskJenni error:', error)
        return new Response('Error processing question', { status: 500 })
    }
}
