// OpenCitations API Client - Open Citation Data

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'
import { SourceNormalizer } from '../normalizer'

export class OpenCitationsClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'OpenCitations',
            baseUrl: 'https://opencitations.net/index/coci/api/v1',
            rateLimit: {
                requestsPerSecond: 1,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        // OpenCitations doesn't support title search
        return {
            success: false,
            error: 'OpenCitations only supports DOI-based citation lookup',
            apiName: this.config.name,
            timestamp: new Date(),
        }
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        return {
            success: false,
            error: 'OpenCitations only supports DOI-based citation lookup',
            apiName: this.config.name,
            timestamp: new Date(),
        }
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

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/metadata/${cleanDoi}`)
        )
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return {
            success: false,
            error: 'OpenCitations only supports DOI-based citation lookup',
            apiName: this.config.name,
            timestamp: new Date(),
        }
    }

    /**
     * Get citations for a DOI
     */
    async getCitations(doi: string): Promise<ApiResponse<any>> {
        const cleanDoi = SourceNormalizer.extractDoi(doi)
        if (!cleanDoi) {
            return {
                success: false,
                error: 'Invalid DOI format',
                apiName: this.config.name,
                timestamp: new Date(),
            }
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/citations/${cleanDoi}`)
        )
    }

    transformResponse(response: any): any[] {
        if (!response || !Array.isArray(response)) return []

        return response.map((item: any) => ({
            doi: item.citing || item.cited,
            title: item.title,
            authors: item.author?.split('; ').map((name: string) => ({ fullName: name.trim() })),
            year: item.year ? parseInt(item.year) : undefined,
            type: 'journal',
            journal: item.source_title,
            volume: item.volume,
            issue: item.issue,
            pages: item.page,
        }))
    }
}
