import { NextRequest, NextResponse } from 'next/server'
import { pdfCache } from '@/lib/cache/pdf-cache'
import { devError } from '@/lib/utils/logger'
// import { createClient } from '@/lib/supabase/server' // Uncomment when ready to save to DB

export const runtime = 'edge'

// Mock PDF processing for now since we can't easily run pdf-parse in edge runtime without more setup
// In a real app, you'd use a dedicated service or a more robust nodejs setup
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const fileId = formData.get('fileId') as string
        const file = formData.get('file') as File

        if (!file || !fileId) {
            return NextResponse.json({ error: 'Missing file or fileId' }, { status: 400 })
        }

        // Check cache first
        const cached = await pdfCache.get(fileId)
        if (cached) {
            return NextResponse.json({
                id: fileId,
                text: cached.text,
                cached: true,
            })
        }

        // Mock processing - in reality, we would extract text here
        // For the demo, we'll return a placeholder text
        const mockText = `Extracted content from ${file.name}. This is a mock implementation.
In production, use pdf-parse or similar library for actual text extraction.`

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        const result = {
            id: fileId,
            text: mockText,
            metadata: {
                pages: 10,
                size: file.size,
                processedAt: Date.now(),
            },
        }

        // Cache the result
        await pdfCache.set(fileId, result)

        return NextResponse.json({
            id: fileId,
            text: mockText,
        })
    } catch (error) {
        devError('PDF upload error:', error)
        return NextResponse.json(
            { error: 'Failed to process PDF' },
            { status: 500 }
        )
    }
}
