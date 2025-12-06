// DataCite API Client - Research Data DOIs

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'
import { SourceNormalizer } from '../normalizer'

export class DataCiteClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'DataCite',
            baseUrl: 'https://api.datacite.org',
            rateLimit: {
                requestsPerSecond: 2,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`titles.title:${title}`, limit)
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`creators.name:${author}`, limit)
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
            () => fetch(`${this.config.baseUrl}/dois/${cleanDoi}`)
        )
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(keyword, limit)
    }

    private async search(query: string, limit: number): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            query,
            'page[size]': limit.toString(),
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/dois?${params}`)
        )
    }

    transformResponse(response: any): any[] {
        if (!response?.data) return []

        const items = Array.isArray(response.data) ? response.data : [response.data]

        return items.map((item: any) => {
            const attrs = item.attributes
            return {
                doi: attrs.doi,
                title: attrs.titles?.[0]?.title,
                authors: attrs.creators?.map((c: any) => ({
                    fullName: c.name,
                    orcid: c.nameIdentifiers?.find((id: any) => id.nameIdentifierScheme === 'ORCID')?.nameIdentifier,
                })),
                year: attrs.publicationYear,
                publicationDate: attrs.published,
                type: this.mapResourceType(attrs.types?.resourceTypeGeneral),
                publisher: attrs.publisher,
                url: attrs.url,
                abstract: attrs.descriptions?.find((d: any) => d.descriptionType === 'Abstract')?.description,
            }
        })
    }

    private mapResourceType(type: string): string {
        const typeMap: Record<string, string> = {
            'JournalArticle': 'journal',
            'Book': 'book',
            'Dissertation': 'thesis',
            'Dataset': 'dataset',
            'ConferencePaper': 'conference',
        }
        return typeMap[type] || 'other'
    }
}
