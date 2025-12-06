// PubMed/NCBI E-utilities API Client - 35M+ biomedical publications

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'
import { SourceNormalizer } from '../normalizer'

export class PubMedClient extends BaseApiClient {
    constructor(apiKey?: string) {
        const config: ApiConfig = {
            name: 'PubMed',
            baseUrl: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
            apiKey,
            rateLimit: {
                requestsPerSecond: apiKey ? 10 : 3,
            },
            timeout: 15000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        const ids = await this.searchIds(title, limit)
        if (!ids.success || !ids.data?.length) return ids

        return this.fetchDetails(ids.data)
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        const query = `${author}[Author]`
        const ids = await this.searchIds(query, limit)
        if (!ids.success || !ids.data?.length) return ids

        return this.fetchDetails(ids.data)
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

        const query = `${cleanDoi}[DOI]`
        const ids = await this.searchIds(query, 1)
        if (!ids.success || !ids.data?.length) return ids

        return this.fetchDetails(ids.data)
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.searchByTitle(keyword, limit)
    }

    /**
     * Search for PubMed IDs (PMIDs)
     */
    private async searchIds(query: string, limit: number): Promise<ApiResponse<string[]>> {
        const params = new URLSearchParams({
            db: 'pubmed',
            term: query,
            retmax: limit.toString(),
            retmode: 'json',
        })

        if (this.config.apiKey) {
            params.append('api_key', this.config.apiKey)
        }

        const response = await this.executeRequest<any>(
            () => fetch(`${this.config.baseUrl}/esearch.fcgi?${params}`)
        )

        if (!response.success) return response as ApiResponse<string[]>

        const ids = response.data?.esearchresult?.idlist || []
        return {
            ...response,
            data: ids,
        }
    }

    /**
     * Fetch detailed information for PMIDs
     */
    private async fetchDetails(pmids: string[]): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            db: 'pubmed',
            id: pmids.join(','),
            retmode: 'xml',
        })

        if (this.config.apiKey) {
            params.append('api_key', this.config.apiKey)
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/efetch.fcgi?${params}`)
        )
    }

    /**
     * Transform PubMed XML response to normalized format
     * Note: In production, use a proper XML parser
     */
    transformResponse(xmlText: string): any[] {
        // Simplified parsing - in production use proper XML parser
        const articles: any[] = []

        // Extract basic info with regex (not recommended for production)
        const titleMatch = xmlText.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/g)
        const authorMatch = xmlText.match(/<Author[\s\S]*?>([\s\S]*?)<\/Author>/g)
        const yearMatch = xmlText.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/g)
        const abstractMatch = xmlText.match(/<Abstract>([\s\S]*?)<\/Abstract>/g)
        const pmidMatch = xmlText.match(/<PMID[\s\S]*?>(.*?)<\/PMID>/g)
        const doiMatch = xmlText.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/g)

        if (titleMatch && titleMatch.length > 0) {
            for (let i = 0; i < titleMatch.length; i++) {
                articles.push({
                    pmid: pmidMatch?.[i]?.match(/>(.*?)</)?.[1],
                    doi: doiMatch?.[i]?.match(/>(.*?)</)?.[1],
                    title: titleMatch[i].match(/>(.*?)</)?.[1],
                    year: yearMatch?.[i]?.match(/(\d{4})/)?.[1],
                    abstract: abstractMatch?.[i]?.match(/>([\s\S]*?)</)?.[1],
                    type: 'journal',
                    authors: [], // Would need proper XML parsing
                })
            }
        }

        return articles
    }
}
