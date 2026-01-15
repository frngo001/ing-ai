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

        return this.fetchSummaries(ids.data)
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        const query = `${author}[Author]`
        const ids = await this.searchIds(query, limit)
        if (!ids.success || !ids.data?.length) return ids

        return this.fetchSummaries(ids.data)
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

        return this.fetchSummaries(ids.data)
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return this.searchByTitle(keyword, limit)
    }

    /**
     * Search for PubMed IDs (PMIDs) using ESearch
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
     * Fetch document summaries using ESummary with JSON format
     * This is the proper way to get structured data from PubMed
     */
    private async fetchSummaries(pmids: string[]): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            db: 'pubmed',
            id: pmids.join(','),
            retmode: 'json', // JSON format is supported by ESummary!
        })

        if (this.config.apiKey) {
            params.append('api_key', this.config.apiKey)
        }

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/esummary.fcgi?${params}`)
        )
    }

    /**
     * Transform ESummary JSON response to normalized format
     * ESummary returns structured JSON - no regex parsing needed!
     */
    transformResponse(response: unknown): any[] {
        if (!response || typeof response !== 'object') {
            return []
        }

        const data = response as Record<string, any>
        const result = data.result

        if (!result) {
            return []
        }

        const articles: any[] = []
        const uids = result.uids || []

        for (const uid of uids) {
            const article = result[uid]
            if (!article) continue

            // Extract authors from the structured format
            const authors = article.authors?.map((a: any) => ({
                fullName: a.name,
                lastName: a.name?.split(' ').pop(),
                firstName: a.name?.split(' ').slice(0, -1).join(' '),
            })) || []

            // Extract DOI from articleids
            const articleIds = article.articleids || []
            const doiEntry = articleIds.find((id: any) => id.idtype === 'doi')
            const doi = doiEntry?.value

            // Extract publication year from sortpubdate or pubdate
            const pubDate = article.sortpubdate || article.pubdate || ''
            const yearMatch = pubDate.match(/(\d{4})/)
            const year = yearMatch ? yearMatch[1] : undefined

            articles.push({
                pmid: uid,
                doi,
                title: article.title,
                year,
                abstract: article.abstract, // ESummary may not include abstract
                type: 'journal',
                authors,
                journal: article.source || article.fulljournalname,
                volume: article.volume,
                issue: article.issue,
                pages: article.pages,
                url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
                citationCount: article.pmcrefcount, // Citation count if available
            })
        }

        return articles
    }
}
