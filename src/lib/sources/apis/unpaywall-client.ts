// Unpaywall API Client - 50,000+ Publishers OA Content

import { BaseApiClient } from '../api-client'
import { ApiConfig, ApiResponse } from '../types'
import { SourceNormalizer } from '../normalizer'

export class UnpaywallClient extends BaseApiClient {
    constructor(email: string) {
        const config: ApiConfig = {
            name: 'Unpaywall',
            baseUrl: 'https://api.unpaywall.org/v2',
            apiKey: email, // Email required
            rateLimit: {
                requestsPerDay: 100000,
            },
            timeout: 10000,
            retries: 3,
        }
        super(config)
    }

    async searchByTitle(title: string, limit = 10): Promise<ApiResponse<any>> {
        // Unpaywall only supports DOI lookup
        return {
            success: false,
            error: 'Unpaywall only supports DOI lookup',
            apiName: this.config.name,
            timestamp: new Date(),
        }
    }

    async searchByAuthor(author: string, limit = 10): Promise<ApiResponse<any>> {
        return {
            success: false,
            error: 'Unpaywall only supports DOI lookup',
            apiName: this.config.name,
            timestamp: new Date(),
        }
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
            () => fetch(`${this.config.baseUrl}/${cleanDoi}?email=${this.config.apiKey}`)
        )
    }

    async searchByKeyword(keyword: string, limit = 10): Promise<ApiResponse<any>> {
        return {
            success: false,
            error: 'Unpaywall only supports DOI lookup',
            apiName: this.config.name,
            timestamp: new Date(),
        }
    }

    transformResponse(response: any): any[] {
        if (!response) return []

        return [{
            doi: response.doi,
            title: response.title,
            authors: response.z_authors?.map((a: any) => ({
                firstName: a.given,
                lastName: a.family,
                fullName: `${a.given} ${a.family}`,
            })),
            year: response.year,
            publicationDate: response.published_date,
            type: 'journal',
            journal: response.journal_name,
            publisher: response.publisher,
            url: response.doi_url,
            pdfUrl: response.best_oa_location?.url_for_pdf,
            isOpenAccess: response.is_oa,
        }]
    }
}
