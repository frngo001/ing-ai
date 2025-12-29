// Main Source Fetcher - Orchestrates all API clients

import { CrossRefClient } from './apis/crossref-client'
import { PubMedClient } from './apis/pubmed-client'
import { ArxivClient } from './apis/arxiv-client'
import { SemanticScholarClient } from './apis/semantic-scholar-client'
import { OpenAlexClient } from './apis/openalex-client'
import { CoreClient } from './apis/core-client'
import { EuropePmcClient } from './apis/europepmc-client'
import { DoajClient } from './apis/doaj-client'
import { BiorxivClient } from './apis/biorxiv-client'
import { DataCiteClient } from './apis/datacite-client'
import { ZenodoClient } from './apis/zenodo-client'
import { BaseClient } from './apis/base-client'
import { PlosClient } from './apis/plos-client'
import { OpenCitationsClient } from './apis/opencitations-client'
import { SourceNormalizer } from './normalizer'
import { NormalizedSource, SearchQuery, SearchResult, SourceFetcherOptions } from './types'

export class SourceFetcher {
    private clients: Map<string, any>
    private options: SourceFetcherOptions

    constructor(options: SourceFetcherOptions = {}) {
        this.options = {
            maxParallelRequests: 5,
            timeout: 15000,
            useCache: true,
            cacheTtl: 86400, // 24 hours
            ...options,
        }

        // Initialize all API clients (without API keys as requested)
        this.clients = new Map([
            ['crossref', new CrossRefClient()],
            ['pubmed', new PubMedClient()],
            ['arxiv', new ArxivClient()],
            ['semanticscholar', new SemanticScholarClient()],
            ['openalex', new OpenAlexClient()],
            ['core', new CoreClient()],
            ['europepmc', new EuropePmcClient()],
            ['doaj', new DoajClient()],
            ['biorxiv', new BiorxivClient()],
            ['datacite', new DataCiteClient()],
            ['zenodo', new ZenodoClient()],
            ['base', new BaseClient()],
            ['plos', new PlosClient()],
            ['opencitations', new OpenCitationsClient()],
        ])

        // Remove excluded APIs
        if (options.excludedApis) {
            options.excludedApis.forEach(api => this.clients.delete(api))
        }
    }

    /**
     * Search for sources across all APIs
     */
    async search(query: SearchQuery): Promise<SearchResult> {
        const startTime = Date.now()
        const selectedClients = this.selectClients(query)

        if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 Searching ${selectedClients.length} APIs for: "${query.query}"`)
        }

        // Execute searches in parallel with limit
        const results = await this.executeParallelSearches(selectedClients, query)

        // Normalize and deduplicate results
        const normalizedSources = this.normalizeResults(results)
        const deduplicated = SourceNormalizer.deduplicate(normalizedSources)

        // Sort by completeness and relevance
        const sorted = this.sortResults(deduplicated, query)

        // Apply limit
        const limited = query.limit ? sorted.slice(0, query.limit) : sorted

        const searchTime = Date.now() - startTime

        if (process.env.NODE_ENV === 'development') {
            console.log(`✅ Found ${limited.length} unique sources in ${searchTime}ms`)
        }

        return {
            sources: limited,
            totalResults: deduplicated.length,
            query,
            apis: selectedClients.map(c => c.name),
            searchTime,
        }
    }

    /**
     * Select which APIs to use based on query type and preferences
     */
    private selectClients(query: SearchQuery): any[] {
        let clients = Array.from(this.clients.values())

        // Filter by preferred APIs
        if (this.options.preferredApis && this.options.preferredApis.length > 0) {
            const preferred = clients.filter(c =>
                this.options.preferredApis!.includes(c.config.name.toLowerCase())
            )
            if (preferred.length > 0) {
                clients = preferred
            }
        }

        // Prioritize APIs based on query type
        const priorities = this.getApiPriorities(query.type)
        clients.sort((a, b) => {
            const aPriority = priorities.get(a.config.name.toLowerCase()) || 999
            const bPriority = priorities.get(b.config.name.toLowerCase()) || 999
            return aPriority - bPriority
        })

        return clients
    }

    /**
     * Get API priority rankings for different query types
     */
    private getApiPriorities(queryType: string): Map<string, number> {
        const priorities = new Map<string, number>()

        switch (queryType) {
            case 'doi':
                priorities.set('crossref', 1)
                priorities.set('datacite', 2)
                priorities.set('openalex', 3)
                priorities.set('semanticscholar', 4)
                priorities.set('unpaywall', 5)
                break

            case 'title':
                priorities.set('semanticscholar', 1)
                priorities.set('openalex', 2)
                priorities.set('crossref', 3)
                priorities.set('base', 4)
                priorities.set('core', 5)
                break

            case 'author':
                priorities.set('semanticscholar', 1)
                priorities.set('openalex', 2)
                priorities.set('pubmed', 3)
                priorities.set('crossref', 4)
                break

            case 'keyword':
                priorities.set('semanticscholar', 1)
                priorities.set('openalex', 2)
                priorities.set('base', 3)
                priorities.set('core', 4)
                priorities.set('crossref', 5)
                break

            default:
                // Default priority
                priorities.set('semanticscholar', 1)
                priorities.set('openalex', 2)
                priorities.set('crossref', 3)
        }

        return priorities
    }

    /**
     * Execute searches in parallel with concurrency limit
     */
    private async executeParallelSearches(clients: any[], query: SearchQuery): Promise<any[]> {
        const limit = this.options.maxParallelRequests || 5
        const results: any[] = []

        for (let i = 0; i < clients.length; i += limit) {
            const batch = clients.slice(i, i + limit)
            const batchPromises = batch.map(client => this.executeSearch(client, query))
            const batchResults = await Promise.allSettled(batchPromises)

            batchResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push(result.value)
                }
            })
        }

        return results
    }

    /**
     * Execute search on a single API client
     */
    private async executeSearch(client: any, query: SearchQuery): Promise<any> {
        try {
            let response

            switch (query.type) {
                case 'doi':
                case 'identifier':
                    response = await client.searchByDoi(query.query)
                    break
                case 'title':
                    response = await client.searchByTitle(query.query, query.limit)
                    break
                case 'author':
                    response = await client.searchByAuthor(query.query, query.limit)
                    break
                case 'keyword':
                default:
                    response = await client.searchByKeyword(query.query, query.limit)
                    break
            }

            if (!response.success) {
                if (process.env.NODE_ENV === 'development') {
                    console.log(`⚠️  ${client.config.name}: ${response.error}`)
                }
                return null
            }

            // Transform response if client has transform method
            const data = client.transformResponse
                ? client.transformResponse(response.data)
                : response.data

            return {
                apiName: client.config.name,
                data,
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error(`❌ Error with ${client.config.name}:`, error)
            }
            return null
        }
    }

    /**
     * Normalize results from different APIs
     */
    private normalizeResults(results: any[]): NormalizedSource[] {
        const normalized: NormalizedSource[] = []

        for (const result of results) {
            if (!result || !result.data) continue

            const sources = Array.isArray(result.data) ? result.data : [result.data]

            for (const source of sources) {
                try {
                    const normalizedSource = SourceNormalizer.normalize(source, result.apiName)
                    if (normalizedSource.title) { // Only add if has title
                        normalized.push(normalizedSource)
                    }
                } catch (error) {
                    if (process.env.NODE_ENV === 'development') {
                        console.error(`Error normalizing source from ${result.apiName}:`, error)
                    }
                }
            }
        }

        return normalized
    }

    /**
     * Sort results by completeness and relevance
     */
    private sortResults(sources: NormalizedSource[], query: SearchQuery): NormalizedSource[] {
        return sources.sort((a, b) => {
            // First, prioritize by completeness
            const completenessDiff = b.completeness - a.completeness

            if (Math.abs(completenessDiff) > 0.1) {
                return completenessDiff
            }

            // Then by citation count if available
            if (a.citationCount && b.citationCount) {
                return b.citationCount - a.citationCount
            }

            // Then by recency
            if (a.publicationYear && b.publicationYear) {
                return b.publicationYear - a.publicationYear
            }

            return 0
        })
    }

    /**
     * Get metrics for all API clients
     */
    getMetrics(): Record<string, any> {
        const metrics: Record<string, any> = {}

        this.clients.forEach((client, name) => {
            metrics[name] = client.getMetrics()
        })

        return metrics
    }

    /**
     * Get list of available APIs
     */
    getAvailableApis(): string[] {
        return Array.from(this.clients.keys())
    }
}
