// DOAJ API Client - 20,000+ Open Access Journals

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'

export class DoajClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'DOAJ',
            baseUrl: 'https://doaj.org/api/search',
            rateLimit: {
                requestsPerSecond: 2,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`bibjson.title:"${title}"`, limit)
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(`bibjson.author.name:"${author}"`, limit)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        return this.search(`bibjson.identifier.id:"${doi}"`, 1)
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.search(keyword, limit)
    }

    private async search(query: string, limit: number): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            q: query,
            pageSize: limit.toString(),
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/articles/${params}`)
        )
    }

    transformResponse(response: any): any[] {
        if (!response?.results) return []

        return response.results.map((article: any) => {
            const bib = article.bibjson
            return {
                id: article.id,
                doi: bib.identifier?.find((id: any) => id.type === 'doi')?.id,
                title: bib.title,
                authors: bib.author?.map((a: any) => ({ fullName: a.name })),
                year: bib.year ? parseInt(bib.year) : undefined,
                publicationDate: bib.month ? `${bib.year}-${bib.month}` : bib.year,
                type: 'journal',
                journal: bib.journal?.title,
                volume: bib.journal?.volume,
                issue: bib.journal?.number,
                pages: bib.start_page && bib.end_page ? `${bib.start_page}-${bib.end_page}` : undefined,
                publisher: bib.journal?.publisher,
                url: bib.link?.find((l: any) => l.type === 'fulltext')?.url,
                isOpenAccess: true,
                abstract: bib.abstract,
                keywords: bib.keywords,
            }
        })
    }
}
