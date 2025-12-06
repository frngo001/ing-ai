// PLOS Search API Client - Public Library of Science

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'

export class PlosClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'PLOS',
            baseUrl: 'https://api.plos.org/search',
            rateLimit: {
                requestsPerSecond: 2,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`title:"${title}"`, limit)
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`author:"${author}"`, limit)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        return this.search(`doi:"${doi}"`, 1)
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`everything:"${keyword}"`, limit)
    }

    private async search(query: string, limit: number): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            q: query,
            rows: limit.toString(),
            wt: 'json',
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}?${params}`)
        )
    }

    transformResponse(response: any): any[] {
        if (!response?.response?.docs) return []

        return response.response.docs.map((doc: any) => ({
            id: doc.id,
            doi: doc.id,
            title: doc.title_display || doc.title,
            authors: doc.author_display?.map((name: string) => ({ fullName: name })),
            year: doc.publication_date ? parseInt(doc.publication_date.split('-')[0]) : undefined,
            publicationDate: doc.publication_date,
            type: 'journal',
            journal: doc.journal,
            abstract: doc.abstract?.[0],
            url: `https://journals.plos.org/plosone/article?id=${doc.id}`,
            isOpenAccess: true,
            keywords: doc.subject,
        }))
    }
}
