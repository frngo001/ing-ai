// Zenodo API Client - Research Data Repository

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'

export class ZenodoClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'Zenodo',
            baseUrl: 'https://zenodo.org/api',
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
        return this.search(`creators.name:"${author}"`, limit)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        return this.search(`doi:"${doi}"`, 1)
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(keyword, limit)
    }

    private async search(query: string, limit: number): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            q: query,
            size: limit.toString(),
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/records?${params}`)
        )
    }

    transformResponse(response: any): any[] {
        if (!response?.hits?.hits) return []

        return response.hits.hits.map((record: any) => {
            const metadata = record.metadata
            return {
                id: record.id,
                doi: metadata.doi,
                title: metadata.title,
                authors: metadata.creators?.map((c: any) => ({
                    fullName: c.name,
                    orcid: c.orcid,
                    affiliation: c.affiliation,
                })),
                year: metadata.publication_date ? parseInt(metadata.publication_date.split('-')[0]) : undefined,
                publicationDate: metadata.publication_date,
                type: metadata.resource_type?.type || 'dataset',
                publisher: metadata.imprint?.publisher,
                url: record.links?.html,
                pdfUrl: record.files?.[0]?.links?.self,
                isOpenAccess: metadata.access_right === 'open',
                abstract: metadata.description,
                keywords: metadata.keywords,
            }
        })
    }
}
