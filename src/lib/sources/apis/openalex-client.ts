// OpenAlex API Client - 250M+ works, fully open (CC0)

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'
import { SourceNormalizer } from '../normalizer'

export class OpenAlexClient extends BaseApiClient {
    constructor(email?: string) {
        const config: ApiConfig = {
            name: 'OpenAlex',
            baseUrl: 'https://api.openalex.org',
            apiKey: email, // Email for polite pool
            rateLimit: {
                requestsPerSecond: 10,
                requestsPerDay: 100000,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            filter: `title.search:${title}`,
            per_page: limit.toString(),
        })

        if (this.config.apiKey) {
            params.append('mailto', this.config.apiKey)
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/works?${params}`)
        )
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            filter: `author.search:${author}`,
            per_page: limit.toString(),
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

        const params = new URLSearchParams()
        if (this.config.apiKey) {
            params.append('mailto', this.config.apiKey)
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/works/doi:${cleanDoi}${params.toString() ? '?' + params : ''}`)
        )
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            search: keyword,
            per_page: limit.toString(),
        })

        if (this.config.apiKey) {
            params.append('mailto', this.config.apiKey)
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/works?${params}`)
        )
    }

    /**
     * Transform OpenAlex response to normalized format
     */
    transformResponse(response: any): any[] {
        if (!response) return []

        const works = response.results || [response]

        return works.map((work: any) => ({
            id: work.id,
            doi: work.doi?.replace('https://doi.org/', ''),
            title: work.title,
            authors: work.authorships?.map((a: any) => ({
                fullName: a.author?.display_name,
                orcid: a.author?.orcid,
                affiliation: a.institutions?.[0]?.display_name,
            })),
            year: work.publication_year,
            publicationDate: work.publication_date,
            type: this.mapType(work.type),
            journal: work.primary_location?.source?.display_name,
            volume: work.biblio?.volume,
            issue: work.biblio?.issue,
            pages: work.biblio?.first_page && work.biblio?.last_page
                ? `${work.biblio.first_page}-${work.biblio.last_page}`
                : undefined,
            publisher: work.primary_location?.source?.host_organization_name,
            url: work.primary_location?.landing_page_url
                || (work.doi ? `https://doi.org/${work.doi.replace('https://doi.org/', '')}` : undefined),
            pdfUrl: work.open_access?.oa_url,
            isOpenAccess: work.open_access?.is_oa || false,
            abstract: work.abstract_inverted_index ? this.reconstructAbstract(work.abstract_inverted_index) : undefined,
            citationCount: work.cited_by_count,
            impactFactor: work.primary_location?.source?.summary_stats?.['2yr_mean_citedness'],
            keywords: work.concepts?.map((c: any) => c.display_name),
        }))
    }

    private mapType(type: string): string {
        const typeMap: Record<string, string> = {
            'journal-article': 'journal',
            'book-chapter': 'book',
            'proceedings-article': 'conference',
            'posted-content': 'preprint',
            'dissertation': 'thesis',
            'dataset': 'dataset',
        }
        return typeMap[type] || 'other'
    }

    /**
     * Reconstruct abstract from inverted index
     */
    private reconstructAbstract(invertedIndex: Record<string, number[]>): string {
        const words: [string, number][] = []

        for (const [word, positions] of Object.entries(invertedIndex)) {
            for (const pos of positions) {
                words.push([word, pos])
            }
        }

        words.sort((a, b) => a[1] - b[1])
        return words.map(w => w[0]).join(' ')
    }
}
