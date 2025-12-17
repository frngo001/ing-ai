// Type definitions for source fetching

export type SourceType = 'journal' | 'book' | 'conference' | 'preprint' | 'thesis' | 'website' | 'dataset' | 'other'

export interface Author {
    firstName?: string
    lastName?: string
    fullName?: string
    orcid?: string
    affiliation?: string
}

export interface NormalizedSource {
    // Identifiers
    id: string
    doi?: string
    pmid?: string
    pmcid?: string
    arxivId?: string
    isbn?: string
    issn?: string

    // Basic metadata
    title: string
    authors: Author[]
    publicationYear?: number
    publicationDate?: string

    // Publication details
    type: SourceType
    journal?: string
    volume?: string
    issue?: string
    pages?: string
    publisher?: string

    // Access
    url?: string
    pdfUrl?: string
    isOpenAccess?: boolean

    // Additional metadata
    abstract?: string
    keywords?: string[]
    citationCount?: number
    impactFactor?: number
    references?: string[]

    // Quality indicators
    completeness: number // 0-1 score
    sourceApi: string
    fetchedAt: Date
}

export interface SearchQuery {
    query: string
    type: 'title' | 'author' | 'doi' | 'keyword' | 'identifier'
    limit?: number
    offset?: number
    filters?: {
        yearFrom?: number
        yearTo?: number
        sourceType?: SourceType[]
        openAccessOnly?: boolean
    }
}

export interface SearchResult {
    sources: NormalizedSource[]
    totalResults: number
    query: SearchQuery
    apis: string[]
    searchTime: number
}

export interface ApiResponse<T = any> {
    success: boolean
    data?: T
    error?: string
    apiName: string
    timestamp: Date
}

export interface RateLimitInfo {
    limit: number
    remaining: number
    resetAt: Date
}

export interface ApiConfig {
    name: string
    baseUrl: string
    apiKey?: string
    rateLimit: {
        requestsPerSecond?: number
        requestsPerMinute?: number
        requestsPerDay?: number
    }
    timeout: number
    retries: number
}

export interface SourceFetcherOptions {
    maxParallelRequests?: number
    timeout?: number
    preferredApis?: string[]
    excludedApis?: string[]
    useCache?: boolean
    cacheTtl?: number
}

export type ApiPriority = 'high' | 'medium' | 'low'

export interface ApiMetrics {
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    averageResponseTime: number
    lastError?: string
    lastErrorAt?: Date
}
