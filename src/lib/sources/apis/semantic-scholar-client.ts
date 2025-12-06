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

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            query: title,
            limit: limit.toString(),
            fields: 'title,authors,year,abstract,citationCount,referenceCount,fieldsOfStudy,publicationTypes,journal,doi,url,isOpenAccess,openAccessPdf',
        })

        const headers: HeadersInit = {}
        if (this.config.apiKey) {
            headers['x-api-key'] = this.config.apiKey
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/paper/search?${params}`, { headers })
        )
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        // Semantic Scholar doesn't have author-specific search in this endpoint
        // Fall back to title/keyword search
        return this.searchByKeyword(author, limit)
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
            fields: 'title,authors,year,abstract,citationCount,referenceCount,fieldsOfStudy,publicationTypes,journal,doi,url,isOpenAccess,openAccessPdf',
        })

        const headers: HeadersInit = {}
        if (this.config.apiKey) {
            headers['x-api-key'] = this.config.apiKey
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/paper/DOI:${cleanDoi}?${params}`, { headers })
        )
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.searchByTitle(keyword, limit)
    }

    /**
     * Get paper by Semantic Scholar ID
     */
    async getPaper(paperId: string): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            fields: 'title,authors,year,abstract,citationCount,referenceCount,fieldsOfStudy,publicationTypes,journal,doi,url,isOpenAccess,openAccessPdf',
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
    transformResponse(response: any): any[] {
        if (!response) return []

        const papers = response.data || [response]

        return papers.map((paper: any) => ({
            id: paper.paperId,
            doi: paper.doi,
            title: paper.title,
            authors: paper.authors?.map((a: any) => ({
                fullName: a.name,
                authorId: a.authorId,
            })),
            year: paper.year,
            type: this.inferType(paper.publicationTypes),
            journal: paper.journal?.name,
            volume: paper.journal?.volume,
            pages: paper.journal?.pages,
            abstract: paper.abstract,
            url: paper.url,
            pdfUrl: paper.openAccessPdf?.url,
            isOpenAccess: paper.isOpenAccess,
            citationCount: paper.citationCount,
            references: paper.references?.map((r: any) => r.paperId),
            keywords: paper.fieldsOfStudy,
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
