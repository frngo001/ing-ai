// Streaming API Route for source search with Server-Sent Events

import { NextRequest } from 'next/server'
import { CrossRefClient } from '@/lib/sources/apis/crossref-client'
import { PubMedClient } from '@/lib/sources/apis/pubmed-client'
import { ArxivClient } from '@/lib/sources/apis/arxiv-client'
import { SemanticScholarClient } from '@/lib/sources/apis/semantic-scholar-client'
import { OpenAlexClient } from '@/lib/sources/apis/openalex-client'
import { CoreClient } from '@/lib/sources/apis/core-client'
import { EuropePmcClient } from '@/lib/sources/apis/europepmc-client'
import { DoajClient } from '@/lib/sources/apis/doaj-client'
import { BiorxivClient } from '@/lib/sources/apis/biorxiv-client'
import { DataCiteClient } from '@/lib/sources/apis/datacite-client'
import { SourceNormalizer } from '@/lib/sources/normalizer'
import { devError } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LIMIT_PER_API = 25

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const type = searchParams.get('type') || 'keyword'

    if (!query) {
        return new Response('Query parameter is required', { status: 400 })
    }

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
        async start(controller) {
            const clients = [
                { name: 'SemanticScholar', client: new SemanticScholarClient() },
                { name: 'OpenAlex', client: new OpenAlexClient() },
                { name: 'CrossRef', client: new CrossRefClient() },
                { name: 'PubMed', client: new PubMedClient() },
                { name: 'EuropePMC', client: new EuropePmcClient() },
                { name: 'arXiv', client: new ArxivClient() },
                { name: 'DOAJ', client: new DoajClient() },
                { name: 'bioRxiv', client: new BiorxivClient() },
                { name: 'DataCite', client: new DataCiteClient() },
                { name: 'CORE', client: new CoreClient() },
            ]

            const seenDois = new Set<string>()
            const seenTitles = new Set<string>()

            // Send initial event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', totalApis: clients.length })}\n\n`))

            // Process each API
            for (let i = 0; i < clients.length; i++) {
                const { name, client } = clients[i]

                try {
                    // Send progress
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'progress',
                        api: name,
                        current: i + 1,
                        total: clients.length
                    })}\n\n`))

                    let response
                    switch (type) {
                        case 'doi':
                            response = await client.searchByDoi(query)
                            break
                        case 'title':
                            response = await client.searchByTitle(query, LIMIT_PER_API)
                            break
                        case 'author':
                            response = await client.searchByAuthor(query, LIMIT_PER_API)
                            break
                        case 'keyword':
                        default:
                            response = await client.searchByKeyword(query, LIMIT_PER_API)
                            break
                    }

                    if (response.success && response.data) {
                        const data = client.transformResponse
                            ? client.transformResponse(response.data)
                            : Array.isArray(response.data) ? response.data : [response.data]

                        const newSources = []

                        for (const source of data) {
                            try {
                                const normalized = SourceNormalizer.normalize(source, name)

                                // Deduplicate
                                if (normalized.doi && seenDois.has(normalized.doi)) continue
                                const titleKey = normalized.title.toLowerCase().replace(/[^\w\s]/g, '').trim()
                                if (seenTitles.has(titleKey)) continue

                                if (normalized.doi) seenDois.add(normalized.doi)
                                seenTitles.add(titleKey)

                                if (normalized.title) {
                                    newSources.push(normalized)
                                }
                            } catch (err) {
                                // Skip invalid sources
                            }
                        }

                        if (newSources.length > 0) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                type: 'results',
                                api: name,
                                sources: newSources
                            })}\n\n`))
                        }
                    }
                } catch (error) {
                    devError(`Error with ${name}:`, error)
                    // Continue with next API
                }
            }

            // Send completion event
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
            controller.close()
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}
