// API Route for DOI/Identifier resolution

import { NextRequest, NextResponse } from 'next/server'
import { SourceFetcher } from '@/lib/sources/source-fetcher'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { identifier, type = 'doi' } = body

        if (!identifier) {
            return NextResponse.json(
                { error: 'Identifier parameter is required' },
                { status: 400 }
            )
        }

        const fetcher = new SourceFetcher({
            maxParallelRequests: 3,
            useCache: true,
        })

        const results = await fetcher.search({
            query: identifier,
            type: 'doi',
            limit: 1,
        })

        if (results.sources.length === 0) {
            return NextResponse.json(
                { error: 'Source not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(results.sources[0])
    } catch (error) {
        console.error('Source resolution error:', error)
        return NextResponse.json(
            { error: 'Failed to resolve identifier' },
            { status: 500 }
        )
    }
}
