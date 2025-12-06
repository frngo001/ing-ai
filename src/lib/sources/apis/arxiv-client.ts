// arXiv API Client - 2.4M+ preprints in physics, math, CS

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'

export class ArxivClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'arXiv',
            baseUrl: 'http://export.arxiv.org/api',
            rateLimit: {
                requestsPerSecond: 1 / 3, // 1 request per 3 seconds
            },
            timeout: 10000,
            retries: 2,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        const query = `ti:"${title}"`
        return this.search(query, limit)
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        const query = `au:"${author}"`
        return this.search(query, limit)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        // arXiv doesn't support DOI search directly
        return {
            success: false,
            error: 'arXiv does not support DOI search',
            apiName: this.config.name,
            timestamp: new Date(),
        }
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        const query = `all:"${keyword}"`
        return this.search(query, limit)
    }

    /**
     * Search arXiv with custom query
     */
    private async search(query: string, limit: number): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            search_query: query,
            start: '0',
            max_results: limit.toString(),
            sortBy: 'relevance',
            sortOrder: 'descending',
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/query?${params}`)
        )
    }

    /**
     * Search by arXiv ID
     */
    async searchById(arxivId: string): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            id_list: arxivId,
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/query?${params}`)
        )
    }

    /**
     * Transform arXiv Atom feed to normalized format
     * Note: In production, use a proper XML/Atom parser
     */
    transformResponse(atomXml: string): any[] {
        const entries: any[] = []

        // Extract entries using regex (simplified - use proper XML parser in production)
        const entryMatches = atomXml.match(/<entry>(.*?)<\/entry>/gs)

        if (entryMatches) {
            for (const entry of entryMatches) {
                const id = entry.match(/<id>(.*?)<\/id>/)?.[1]
                const arxivId = id?.split('/abs/')?.[1]

                entries.push({
                    arxiv_id: arxivId,
                    id: id,
                    title: entry.match(/<title>(.*?)<\/title>/)?.[1]?.trim(),
                    abstract: entry.match(/<summary>(.*?)<\/summary>/s)?.[1]?.trim(),
                    published: entry.match(/<published>(.*?)<\/published>/)?.[1],
                    year: entry.match(/<published>(\d{4})/)?.[1],
                    authors: this.extractAuthors(entry),
                    url: id,
                    pdfUrl: id?.replace('/abs/', '/pdf/'),
                    type: 'preprint',
                    categories: this.extractCategories(entry),
                    isOpenAccess: true,
                })
            }
        }

        return entries
    }

    private extractAuthors(entry: string): any[] {
        const authorMatches = entry.match(/<author>.*?<name>(.*?)<\/name>.*?<\/author>/gs)
        if (!authorMatches) return []

        return authorMatches.map(author => {
            const name = author.match(/<name>(.*?)<\/name>/)?.[1]
            return { fullName: name }
        })
    }

    private extractCategories(entry: string): string[] {
        const categoryMatches = entry.match(/<category.*?term="(.*?)".*?\/>/g)
        if (!categoryMatches) return []

        return categoryMatches.map(cat => {
            const term = cat.match(/term="(.*?)"/)?.[1]
            return term || ''
        }).filter(Boolean)
    }
}
