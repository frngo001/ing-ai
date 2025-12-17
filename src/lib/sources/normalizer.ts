// Normalizer for API responses to unified format

import { NormalizedSource, Author, SourceType } from './types'

export class SourceNormalizer {
    /**
     * Normalize author names to consistent format
     */
    static normalizeAuthors(authors: any[]): Author[] {
        if (!authors || !Array.isArray(authors)) return []

        return authors.map(author => {
            if (typeof author === 'string') {
                return this.parseAuthorString(author)
            }

            return {
                firstName: author.given || author.firstName || author.first_name,
                lastName: author.family || author.lastName || author.last_name,
                fullName: author.name || author.fullName || this.buildFullName(author),
                orcid: author.ORCID || author.orcid,
                affiliation: author.affiliation?.[0]?.name || author.affiliation,
            }
        }).filter(a => a.fullName || a.lastName)
    }

    /**
     * Parse author string like "Last, First" or "First Last"
     */
    private static parseAuthorString(authorStr: string): Author {
        const parts = authorStr.split(',').map(p => p.trim())

        if (parts.length === 2) {
            return {
                lastName: parts[0],
                firstName: parts[1],
                fullName: `${parts[1]} ${parts[0]}`,
            }
        }

        const nameParts = authorStr.trim().split(' ')
        if (nameParts.length >= 2) {
            return {
                firstName: nameParts.slice(0, -1).join(' '),
                lastName: nameParts[nameParts.length - 1],
                fullName: authorStr,
            }
        }

        return {
            fullName: authorStr,
        }
    }

    /**
     * Build full name from first and last name
     */
    private static buildFullName(author: any): string {
        const first = author.given || author.firstName || author.first_name || ''
        const last = author.family || author.lastName || author.last_name || ''
        return `${first} ${last}`.trim()
    }

    /**
     * Normalize publication type
     */
    static normalizeType(type: string): SourceType {
        const typeStr = type?.toLowerCase() || ''

        if (typeStr.includes('journal') || typeStr.includes('article')) return 'journal'
        if (typeStr.includes('book')) return 'book'
        if (typeStr.includes('conference') || typeStr.includes('proceeding')) return 'conference'
        if (typeStr.includes('preprint') || typeStr.includes('arxiv')) return 'preprint'
        if (typeStr.includes('thesis') || typeStr.includes('dissertation')) return 'thesis'
        if (typeStr.includes('dataset') || typeStr.includes('data')) return 'dataset'
        if (typeStr.includes('website') || typeStr.includes('web')) return 'website'

        return 'other'
    }

    /**
     * Extract DOI from various formats
     */
    static extractDoi(doi: string | undefined): string | undefined {
        if (!doi) return undefined

        // Remove URL prefix if present
        const doiMatch = doi.match(/10\.\d{4,}\/[^\s]+/)
        return doiMatch ? doiMatch[0] : doi
    }

    /**
     * Extract year from date string
     */
    static extractYear(date: string | number | undefined): number | undefined {
        if (!date) return undefined

        if (typeof date === 'number') return date

        const yearMatch = date.match(/\d{4}/)
        return yearMatch ? parseInt(yearMatch[0]) : undefined
    }

    /**
     * Calculate completeness score (0-1) based on available metadata
     */
    static calculateCompleteness(source: Partial<NormalizedSource>): number {
        let score = 0
        const weights = {
            title: 0.2,
            authors: 0.15,
            year: 0.1,
            doi: 0.15,
            abstract: 0.1,
            journal: 0.1,
            url: 0.05,
            type: 0.05,
            volume: 0.025,
            issue: 0.025,
            pages: 0.025,
            publisher: 0.025,
        }

        if (source.title) score += weights.title
        if (source.authors && source.authors.length > 0) score += weights.authors
        if (source.publicationYear) score += weights.year
        if (source.doi) score += weights.doi
        if (source.abstract) score += weights.abstract
        if (source.journal) score += weights.journal
        if (source.url) score += weights.url
        if (source.type) score += weights.type
        if (source.volume) score += weights.volume
        if (source.issue) score += weights.issue
        if (source.pages) score += weights.pages
        if (source.publisher) score += weights.publisher

        return Math.min(score, 1)
    }

    /**
     * Clean and normalize title
     */
    static normalizeTitle(title: string | undefined): string | undefined {
        if (!title) return undefined

        return title
            .replace(/\s+/g, ' ')
            .replace(/\n/g, ' ')
            .trim()
    }

    /**
     * Normalize URL
     */
    static normalizeUrl(url: string | undefined): string | undefined {
        if (!url) return undefined

        try {
            const urlObj = new URL(url)
            return urlObj.toString()
        } catch {
            return url
        }
    }

    /**
     * Extract keywords from text
     */
    static extractKeywords(text: string | string[] | undefined): string[] {
        if (!text) return []

        if (Array.isArray(text)) return text

        return text.split(/[,;]/).map(k => k.trim()).filter(k => k.length > 0)
    }

    /**
     * Normalize a complete source object
     */
    static normalize(rawSource: any, apiName: string): NormalizedSource {
        const normalized: NormalizedSource = {
            id: rawSource.id || rawSource.doi || this.generateId(rawSource),
            doi: this.extractDoi(rawSource.doi || rawSource.DOI),
            pmid: rawSource.pmid || rawSource.PMID,
            pmcid: rawSource.pmcid || rawSource.PMCID,
            arxivId: rawSource.arxiv_id || rawSource.arxivId,
            isbn: rawSource.isbn || rawSource.ISBN,
            issn: rawSource.issn || rawSource.ISSN,

            title: this.normalizeTitle(rawSource.title || rawSource.Title) || '',
            authors: this.normalizeAuthors(rawSource.authors || rawSource.author || rawSource.creator || []),
            publicationYear: this.extractYear(rawSource.year || rawSource.publicationYear || rawSource.published || rawSource.date),
            publicationDate: rawSource.published || rawSource.publicationDate || rawSource.date,

            type: this.normalizeType(rawSource.type || rawSource.publicationType || 'other'),
            journal: rawSource.journal || rawSource['container-title'] || rawSource.journalTitle,
            volume: rawSource.volume?.toString(),
            issue: rawSource.issue?.toString(),
            pages: rawSource.pages || rawSource.page,
            publisher: rawSource.publisher || rawSource.Publisher,

            url: this.normalizeUrl(rawSource.url || rawSource.URL || rawSource.link),
            pdfUrl: rawSource.pdfUrl || rawSource.pdf_url,
            isOpenAccess: rawSource.is_oa || rawSource.isOpenAccess || rawSource.open_access || false,

            abstract: rawSource.abstract || rawSource.Abstract,
            keywords: this.extractKeywords(rawSource.keywords || rawSource.tags),
            citationCount: rawSource.citationCount || rawSource.citation_count || rawSource.cited_by_count,
            impactFactor: rawSource.impactFactor || rawSource.impact_factor,

            completeness: 0, // Will be calculated
            sourceApi: apiName,
            fetchedAt: new Date(),
        }

        normalized.completeness = this.calculateCompleteness(normalized)

        return normalized
    }

    /**
     * Generate a unique ID from source metadata
     */
    private static generateId(source: any): string {
        const title = source.title || ''
        const year = source.year || ''
        const hash = this.simpleHash(`${title}${year}`)
        return `source_${hash}_${Date.now()}`
    }

    /**
     * Simple hash function for generating IDs
     */
    private static simpleHash(str: string): string {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        return Math.abs(hash).toString(36)
    }

    /**
     * Deduplicate sources based on DOI, title similarity
     */
    static deduplicate(sources: NormalizedSource[]): NormalizedSource[] {
        const seen = new Map<string, NormalizedSource>()

        for (const source of sources) {
            // Use DOI as primary key if available
            if (source.doi) {
                const existing = seen.get(source.doi)
                if (!existing || source.completeness > existing.completeness) {
                    seen.set(source.doi, source)
                }
                continue
            }

            // Otherwise use normalized title
            const titleKey = this.normalizeTitleForComparison(source.title)
            const existing = seen.get(titleKey)
            if (!existing || source.completeness > existing.completeness) {
                seen.set(titleKey, source)
            }
        }

        return Array.from(seen.values())
    }

    /**
     * Normalize title for comparison (lowercase, remove special chars)
     */
    private static normalizeTitleForComparison(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
    }
}
