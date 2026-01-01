import { performWebSearch as search } from '@/lib/search/duckduckgo'
import { CacheService } from '@/lib/cache/cache-service'
import { NextResponse } from 'next/server'
import { requestDeduplicator } from '@/lib/cache/request-deduplicator'
import { devError } from '@/lib/utils/logger'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const { query } = await req.json()

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 })
        }

        const cache = CacheService.getInstance()
        const cacheKey = `search:${query}`
        const cachedResults = cache.get(cacheKey)

        if (cachedResults) {
            return NextResponse.json({ results: cachedResults, cached: true })
        }

        // Deduplicate concurrent identical requests
        const results = await requestDeduplicator.deduplicate(
            cacheKey,
            () => search(query)
        )

        cache.set(cacheKey, results, 1000 * 60 * 30) // Cache for 30 minutes

        return NextResponse.json({ results })
    } catch (error) {
        devError('Search API error:', error)
        return new Response('Error performing search', { status: 500 })
    }
}
