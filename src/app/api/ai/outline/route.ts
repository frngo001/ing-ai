import { deepseek, DEEPSEEK_CHAT_MODEL } from '@/lib/ai/deepseek'
import { OUTLINE_GENERATOR_PROMPT } from '@/lib/ai/prompts'
import { generateText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { topic, documentType, additionalInfo } = await req.json()

        if (!topic) {
            return new Response('Topic is required', { status: 400 })
        }

        const prompt = `Create a structured outline for the following:

Topic: ${topic}
Document Type: ${documentType || 'essay'}
${additionalInfo ? `Additional Information: ${additionalInfo}` : ''}

Generate clear, hierarchical section headings that provide a logical structure for this document.`

        const { text } = await generateText({
            model: deepseek(DEEPSEEK_CHAT_MODEL),
            system: OUTLINE_GENERATOR_PROMPT,
            prompt,
            temperature: 0.7,
        })

        return Response.json({ outline: text })
    } catch (error) {
        console.error('Outline generation error:', error)
        return new Response('Error generating outline', { status: 500 })
    }
}
