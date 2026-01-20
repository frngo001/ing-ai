// Semantic Scholar API Client - 200M+ papers with AI features

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'
import { SourceNormalizer } from '../normalizer'

export class SemanticScholarClient extends BaseApiClient {
    constructor(apiKey?: string) {
        const config: ApiConfig = {
            name: 'SemanticScholar',
            baseUrl: 'https://api.semanticscholar.org/graph/v1',
            apiKey,
            rateLimit: {
                requestsPerSecond: apiKey ? 10 : 1,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            query: title,
            limit: limit.toString(),
            offset: offset.toString(),
            fields: 'title,authors,year,abstract,citationCount,referenceCount,s2FieldsOfStudy,publicationTypes,publicationVenue,journal,externalIds,url,isOpenAccess,openAccessPdf',
        })

        const headers: HeadersInit = {}
        if (this.config.apiKey) {
            headers['x-api-key'] = this.config.apiKey
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/paper/search?${params}`, { headers })
        )
    }

    async searchByAuthor(author: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        // Semantic Scholar doesn't have author-specific search in this endpoint
        // Fall back to title/keyword search
        return this.searchByKeyword(author, limit, offset)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        const cleanDoi = SourceNormalizer.extractDoi(doi)
        if (!cleanDoi) {
            return {
                success: false,
                error: 'Invalid DOI format',
                apiName: this.config.name,
                timestamp: new Date(),
            }
        }

        const params = new URLSearchParams({
            fields: 'title,authors,year,abstract,citationCount,referenceCount,s2FieldsOfStudy,publicationTypes,publicationVenue,journal,externalIds,url,isOpenAccess,openAccessPdf',
        })

        const headers: HeadersInit = {}
        if (this.config.apiKey) {
            headers['x-api-key'] = this.config.apiKey
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/paper/DOI:${cleanDoi}?${params}`, { headers })
        )
    }

    async searchByKeyword(keyword: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.searchByTitle(keyword, limit, offset)
    }

    /**
     * Get paper by Semantic Scholar ID
     */
    async getPaper(paperId: string): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            fields: 'title,authors,year,abstract,citationCount,referenceCount,s2FieldsOfStudy,publicationTypes,publicationVenue,journal,externalIds,url,isOpenAccess,openAccessPdf',
        })

        const headers: HeadersInit = {}
        if (this.config.apiKey) {
            headers['x-api-key'] = this.config.apiKey
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/paper/${paperId}?${params}`, { headers })
        )
    }

    /**
     * Transform Semantic Scholar response to normalized format
     */
    transformResponse(response: unknown): any[] {
        if (!response || typeof response !== 'object') return []

        const data = response as Record<string, any>
        const papers = data.data || [data]

        if (!Array.isArray(papers)) return []

        return papers.map((paper: any) => ({
            id: paper.paperId,
            doi: paper.externalIds?.DOI || paper.doi,
            title: paper.title,
            authors: paper.authors?.map((a: any) => ({
                fullName: typeof a === 'string' ? a : (a.name || a.fullName)
            })),
            year: paper.year,
            type: this.inferType(paper.publicationTypes),
            journal: paper.journal?.name || paper.publicationVenue?.name,
            volume: paper.journal?.volume,
            pages: paper.journal?.pages,
            abstract: paper.abstract,
            url: paper.url
                || (paper.externalIds?.DOI ? `https://doi.org/${paper.externalIds.DOI}` : undefined)
                || (paper.paperId ? `https://www.semanticscholar.org/paper/${paper.paperId}` : undefined),
            pdfUrl: paper.openAccessPdf?.url,
            isOpenAccess: paper.isOpenAccess,
            citationCount: paper.citationCount,
            references: paper.references?.map((r: any) => r.paperId),
            keywords: paper.s2FieldsOfStudy?.map((f: any) => f.category),
        }))
    }

    private inferType(publicationTypes: string[] | undefined): string {
        if (!publicationTypes || publicationTypes.length === 0) return 'other'

        const type = publicationTypes[0].toLowerCase()
        if (type.includes('journal')) return 'journal'
        if (type.includes('conference')) return 'conference'
        if (type.includes('book')) return 'book'

        return 'journal'
    }
}
