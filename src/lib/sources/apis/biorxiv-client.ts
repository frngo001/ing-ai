// bioRxiv/medRxiv API Client - Life Sciences Preprints

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'

export class BiorxivClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'bioRxiv',
            baseUrl: 'https://api.biorxiv.org',
            rateLimit: {
                requestsPerSecond: 1,
            },
            timeout: 15000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        // bioRxiv API doesn't support title search directly
        // Would need to fetch recent papers and filter
        return {
            success: false,
            error: 'bioRxiv API does not support title search',
            apiName: this.config.name,
            timestamp: new Date(),
        }
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        const today = new Date().toISOString().split('T')[0]
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/details/biorxiv/${thirtyDaysAgo}/${today}/0`)
        )
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/details/biorxiv/${doi}`)
        )
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return {
            success: false,
            error: 'bioRxiv API does not support keyword search',
            apiName: this.config.name,
            timestamp: new Date(),
        }
    }

    transformResponse(response: any): any[] {
        if (!response?.collection) return []

        return response.collection.map((preprint: any) => ({
            doi: preprint.doi,
            title: preprint.title,
            authors: preprint.authors?.split('; ').map((a: string) => ({ fullName: a.trim() })),
            year: preprint.date ? parseInt(preprint.date.split('-')[0]) : undefined,
            publicationDate: preprint.date,
            type: 'preprint',
            journal: preprint.server || 'bioRxiv',
            abstract: preprint.abstract,
            url: `https://www.biorxiv.org/content/${preprint.doi}`,
            pdfUrl: `https://www.biorxiv.org/content/${preprint.doi}.full.pdf`,
            isOpenAccess: true,
            category: preprint.category,
        }))
    }
}
