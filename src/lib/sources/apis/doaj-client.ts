// DOAJ API Client - 20,000+ Open Access Journals

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'

export class DoajClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'DOAJ',
            baseUrl: 'https://doaj.org/api/v2/search',


            rateLimit: {
                requestsPerSecond: 2,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(`bibjson.title:"${title}"`, limit, offset)
    }

    async searchByAuthor(author: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(`bibjson.author.name:"${author}"`, limit, offset)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        return this.search(`bibjson.identifier.id:"${doi}"`, 1)
    }

    async searchByKeyword(keyword: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(keyword, limit, offset)
    }

    private async search(query: string, limit: number, offset = 0): Promise<ApiResponse<any>> {
        const encodedQuery = encodeURIComponent(query)
        const page = Math.floor(offset / limit) + 1
        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/articles/${encodedQuery}?pageSize=${limit}&page=${page}`, {
                headers: this.getCommonHeaders()
            })
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
                url: bib.link?.find((l: any) => l.type === 'fulltext')?.url
                    || bib.link?.[0]?.url
                    || (bib.identifier?.find((id: any) => id.type === 'doi')?.id
                        ? `https://doi.org/${bib.identifier.find((id: any) => id.type === 'doi').id}`
                        : undefined),
                isOpenAccess: true,
                abstract: bib.abstract,
                keywords: bib.keywords,
            }
        })
    }
}
