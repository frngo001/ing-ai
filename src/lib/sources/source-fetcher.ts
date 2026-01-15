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
     * 
     * Priority is based on:
     * - Coverage: OpenAlex (260M+), Semantic Scholar (200M+), CrossRef (130M+)
     * - Reliability: APIs with better uptime and response quality
     * - Link availability: APIs that consistently provide URLs
     * - Metadata quality: APIs that provide complete metadata
     */
    private getApiPriorities(queryType: string): Map<string, number> {
        const priorities = new Map<string, number>()

        switch (queryType) {
            case 'doi':
                // DOI lookup - CrossRef is the primary DOI registry
                priorities.set('crossref', 1)      // Primary DOI registry, best for DOI resolution
                priorities.set('openalex', 2)      // 260M+ works, excellent metadata + links
                priorities.set('datacite', 3)      // Good for research data DOIs
                priorities.set('semanticscholar', 4) // AI-enhanced, good metadata
                priorities.set('europepmc', 5)     // Good for biomedical DOIs
                break

            case 'title':
                // Title search - prioritize coverage and AI-enhanced search
                priorities.set('openalex', 1)      // 260M+ works, best coverage overall
                priorities.set('semanticscholar', 2) // 200M+ papers, AI-powered relevance
                priorities.set('crossref', 3)      // 130M+ DOI records, reliable links
                priorities.set('pubmed', 4)        // Essential for biomedical
                priorities.set('arxiv', 5)         // Essential for physics/math/CS preprints
                priorities.set('core', 6)          // 200M+ papers, good OA coverage
                priorities.set('base', 7)          // 350M+ documents, academic search
                priorities.set('europepmc', 8)     // Life sciences coverage
                break

            case 'author':
                // Author search - prioritize APIs with good author metadata
                priorities.set('openalex', 1)      // Best author data with ORCID integration
                priorities.set('semanticscholar', 2) // Good author profiles with metrics
                priorities.set('crossref', 3)      // Reliable author metadata
                priorities.set('pubmed', 4)        // Good for biomedical authors
                priorities.set('arxiv', 5)         // Physics/Math/CS authors
                priorities.set('europepmc', 6)     // Life sciences authors
                break

            case 'keyword':
                // Keyword/topic search - prioritize semantic search capabilities
                priorities.set('openalex', 1)      // Excellent concept/topic tagging
                priorities.set('semanticscholar', 2) // AI-powered semantic search
                priorities.set('pubmed', 3)        // MeSH terms for biomedical
                priorities.set('arxiv', 4)         // Good category-based search
                priorities.set('crossref', 5)      // Subject filtering
                priorities.set('core', 6)          // Full-text search
                priorities.set('base', 7)          // Academic content search
                priorities.set('doaj', 8)          // Open access journals
                break

            default:
                // General search - balanced approach with best overall APIs
                priorities.set('openalex', 1)      // Best coverage, always provides URLs
                priorities.set('semanticscholar', 2) // AI-enhanced, good relevance
                priorities.set('crossref', 3)      // Reliable metadata + DOI links
                priorities.set('pubmed', 4)        // Biomedical essential
                priorities.set('arxiv', 5)         // Preprints, always has URLs
                priorities.set('core', 6)          // Good OA coverage
                priorities.set('europepmc', 7)     // Life sciences
                priorities.set('base', 8)          // Academic documents
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
                    // Only add if has title AND a valid URL link (not DOI)
                    if (normalizedSource.title && normalizedSource.url) {
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
