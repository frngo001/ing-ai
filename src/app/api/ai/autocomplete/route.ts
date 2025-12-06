import { deepseek, DEEPSEEK_CHAT_MODEL, DEFAULT_TEMPERATURE } from '@/lib/ai/deepseek'
import { AUTOCOMPLETE_SYSTEM_PROMPT } from '@/lib/ai/prompts'
import { streamText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { context, currentText, documentType } = await req.json()

        const prompt = `Document Type: ${documentType || 'general'}

Context from document:
${context}

Current sentence/paragraph:
${currentText}

Continue writing naturally from where the user left off. Provide 1-2 sentences that flow seamlessly.`

        const result = streamText({
            model: deepseek(DEEPSEEK_CHAT_MODEL),
            system: AUTOCOMPLETE_SYSTEM_PROMPT,
            prompt,
            temperature: DEFAULT_TEMPERATURE,
        })

        return result.toTextStreamResponse()
    } catch (error) {
        console.error('Autocomplete error:', error)
        return new Response('Error generating autocomplete', { status: 500 })
    }
}
