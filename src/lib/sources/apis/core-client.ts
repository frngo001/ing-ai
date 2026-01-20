// CORE API Client - 270M+ Open Access Papers

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'

export class CoreClient extends BaseApiClient {
    constructor(apiKey?: string) {
        const config: ApiConfig = {
            name: 'CORE',
            baseUrl: 'https://api.core.ac.uk/v3',
            apiKey,
            rateLimit: {
                requestsPerSecond: apiKey ? 10 : 0.5,
            },
            timeout: 15000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(title, limit, offset)
    }

    async searchByAuthor(author: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(`authors:"${author}"`, limit, offset)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        return this.search(`doi:"${doi}"`, 1)
    }

    async searchByKeyword(keyword: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(keyword, limit, offset)
    }

    private async search(query: string, limit: number, offset = 0): Promise<ApiResponse<any>> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        }

        if (this.config.apiKey) {
            headers['Authorization'] = `Bearer ${this.config.apiKey}`
        }

        const body = JSON.stringify({
            q: query,
            limit,
            offset,
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/search/works`, {
                method: 'POST',
                headers,
                body,
            })
        )
    }

    transformResponse(response: any): any[] {
        if (!response?.results) return []

        return response.results.map((work: any) => ({
            id: work.id,
            doi: work.doi,
            title: work.title,
            authors: work.authors?.map((a: any) => ({
                fullName: typeof a === 'string' ? a : (a.name || a.fullName)
            })),
            year: work.yearPublished,
            publicationDate: work.publishedDate,
            type: work.documentType || 'journal',
            journal: work.journals?.[0],
            publisher: work.publisher,
            url: work.downloadUrl
                || work.sourceFulltextUrls?.[0]
                || (work.doi ? `https://doi.org/${work.doi}` : undefined)
                || (work.oai ? `https://core.ac.uk/display/${work.id}` : undefined),
            pdfUrl: work.downloadUrl,
            isOpenAccess: true,
            abstract: work.abstract,
            citationCount: work.citationCount,
        }))
    }
}
