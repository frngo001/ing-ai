// Europe PMC API Client - Life Sciences Publications

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'
import { SourceNormalizer } from '../normalizer'

export class EuropePmcClient extends BaseApiClient {
    constructor() {
        const config: ApiConfig = {
            name: 'EuropePMC',
            baseUrl: 'https://www.ebi.ac.uk/europepmc/webservices/rest',
            rateLimit: {
                requestsPerSecond: 5,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(`TITLE:"${title}"`, limit, offset)
    }

    async searchByAuthor(author: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(`AUTH:"${author}"`, limit, offset)
    }

    async searchByDoi(doi: string): Promise<ApiResponse<any>> {
        const cleanDoi = SourceNormalizer.extractDoi(doi)
        return this.search(`DOI:"${cleanDoi}"`, 1)
    }

    async searchByKeyword(keyword: string, limit = 10, offset = 0): Promise<ApiResponse<any>> {
        return this.search(keyword, limit, offset)
    }

    private async search(query: string, limit: number, offset = 0): Promise<ApiResponse<any>> {
        const params = new URLSearchParams({
            query,
            pageSize: limit.toString(),
            offSet: offset.toString(),
            format: 'json',
        })

        return this.executeRequest(
            () => fetch(`${this.config.baseUrl}/search?${params}`)
        )
    }

    transformResponse(response: any): any[] {
        if (!response?.resultList?.result) return []

        return response.resultList.result.map((article: any) => ({
            id: article.id,
            pmid: article.pmid,
            pmcid: article.pmcid,
            doi: article.doi,
            title: article.title,
            authors: article.authorString?.split(', ').map((a: string) => ({ fullName: a })),
            year: article.pubYear,
            publicationDate: article.firstPublicationDate,
            type: 'journal',
            journal: article.journalTitle,
            volume: article.journalVolume,
            issue: article.issue,
            pages: article.pageInfo,
            abstract: article.abstractText,
            url: article.pmid
                ? `https://europepmc.org/article/MED/${article.pmid}`
                : (article.pmcid
                    ? `https://europepmc.org/article/PMC/${article.pmcid}`
                    : (article.doi ? `https://doi.org/${article.doi}` : undefined)),
            isOpenAccess: article.isOpenAccess === 'Y',
            citationCount: article.citedByCount,
        }))
    }
}
