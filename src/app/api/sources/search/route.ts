// API Route for source search

import { NextRequest, NextResponse } from 'next/server'
import { SourceFetcher } from '@/lib/sources/source-fetcher'
import { SearchQuery } from '@/lib/sources/types'
import { devError } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const { query, type = 'keyword', limit = 10, filters } = body

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            )
        }

        const searchQuery: SearchQuery = {
            query,
            type,
            limit,
            filters,
        }

        const fetcher = new SourceFetcher({
            maxParallelRequests: 5,
            useCache: true,
        })

        const results = await fetcher.search(searchQuery)

        return NextResponse.json(results)
    } catch (error) {
        devError('Source search error:', error)
        return NextResponse.json(
            { error: 'Failed to search sources' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const type = searchParams.get('type') || 'keyword'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
        return NextResponse.json(
            { error: 'Query parameter is required' },
            { status: 400 }
        )
    }

    try {
        const searchQuery: SearchQuery = {
            query,
            type: type as any,
            limit,
        }

        const fetcher = new SourceFetcher({
            maxParallelRequests: 5,
            useCache: true,
        })

        const results = await fetcher.search(searchQuery)

        return NextResponse.json(results)
    } catch (error) {
        devError('Source search error:', error)
        return NextResponse.json(
            { error: 'Failed to search sources' },
            { status: 500 }
        )
    }
}
