// CrossRef API Client - 130M+ DOI records

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'
import { SourceNormalizer } from '../normalizer'

export class CrossRefClient extends BaseApiClient {
    constructor(apiKey?: string) {
        const config: ApiConfig = {
            name: 'CrossRef',
            baseUrl: 'https://api.crossref.org',
            apiKey,
            rateLimit: {
                requestsPerSecond: apiKey ? 50 : 1, // Polite: 50/s, Anonymous: 1/s
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            query: title,
            rows: limit.toString(),
        })

        if (this.config.apiKey) {
            params.append('mailto', this.config.apiKey) // Used as polite contact
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/works?${params}`)
        )
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            'query.author': author,
            rows: limit.toString(),
        })

        if (this.config.apiKey) {
            params.append('mailto', this.config.apiKey)
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/works?${params}`)
        )
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
            () => fetch(`${this.config.baseUrl}/works/${cleanDoi}`)
        )
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.searchByTitle(keyword, limit)
    }

    /**
     * Transform CrossRef response to normalized format
     */
    transformResponse(response: any): any[] {
        if (!response || !response.message) return []

        const items = Array.isArray(response.message.items)
            ? response.message.items
            : [response.message]

        return items.map((item: any) => ({
            doi: item.DOI,
            title: item.title?.[0],
            authors: item.author || [],
            year: item.published?.['date-parts']?.[0]?.[0],
            published: item.published?.['date-parts']?.[0]?.join('-'),
            type: item.type,
            journal: item['container-title']?.[0],
            volume: item.volume,
            issue: item.issue,
            pages: item.page,
            publisher: item.publisher,
            url: item.URL,
            isOpenAccess: item['is-oa'] || false,
            citationCount: item['is-referenced-by-count'],
            abstract: item.abstract,
        }))
    }
}
