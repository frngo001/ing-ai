// BASE API Client - Bielefeld Academic Search Engine (340M+ documents)

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'

export class BaseClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'BASE',
            baseUrl: 'https://api.base-search.net/cgi-bin/BaseHttpSearchInterface.fcgi',
            rateLimit: {
                requestsPerSecond: 1,
            },
            timeout: 15000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`dctitle:${title}`, limit)
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`dccreator:${author}`, limit)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        return this.search(`dcidentifier:${doi}`, 1)
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(keyword, limit)
    }

    private async search(query: string, limit: number): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            func: 'PerformSearch',
            query,
            hits: limit.toString(),
            format: 'json',
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}?${params}`)
        )
    }

    transformResponse(response: any): any[] {
        if (!response?.response?.docs) return []

        return response.response.docs.map((doc: any) => ({
            id: doc.dcidentifier,
            doi: doc.dcidentifier?.find((id: string) => id.startsWith('10.'))?.replace('doi:', ''),
            title: doc.dctitle?.[0],
            authors: doc.dccreator?.map((name: string) => ({ fullName: name })),
            year: doc.dcdate ? parseInt(doc.dcdate) : undefined,
            publicationDate: doc.dcdate,
            type: doc.dctypenorm?.[0] || 'other',
            publisher: doc.dcpublisher?.[0],
            url: doc.dclink?.[0],
            isOpenAccess: doc.dcoa === '1',
            abstract: doc.dcdescription?.[0],
            language: doc.dclang?.[0],
        }))
    }
}
