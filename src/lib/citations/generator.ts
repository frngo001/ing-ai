// Citation generation using citation-js library

export type CitationStyle =
    | 'apa'
    | 'mla'
    | 'chicago'
    | 'ieee'
    | 'harvard'
    | 'vancouver'

export interface SourceMetadata {
    title: string
    authors?: string[]
    publicationYear?: number
    publicationType?: 'journal' | 'book' | 'website' | 'article' | 'paper'
    journal?: string
    volume?: string
    issue?: string
    pages?: string
    publisher?: string
    url?: string
    doi?: string
    accessDate?: string
}

const STYLE_TEMPLATES = {
    apa: {
        name: 'American Psychological Association 7th edition',
        inText: (authors: string[], year?: number) => {
            if (!authors.length) return '(n.d.)'
            if (authors.length === 1) return `(${authors[0].split(' ').pop()}, ${year || 'n.d.'})`
            if (authors.length === 2)
                return `(${authors[0].split(' ').pop()} & ${authors[1].split(' ').pop()}, ${year || 'n.d.'})`
            return `(${authors[0].split(' ').pop()} et al., ${year || 'n.d.'})`
        },
    },
    mla: {
        name: 'Modern Language Association 9th edition',
        inText: (authors: string[]) => {
            if (!authors.length) return ''
            if (authors.length === 1) return `(${authors[0].split(' ').pop()})`
            if (authors.length === 2)
                return `(${authors[0].split(' ').pop()} and ${authors[1].split(' ').pop()})`
            return `(${authors[0].split(' ').pop()} et al.)`
        },
    },
    chicago: {
        name: 'Chicago Manual of Style 17th edition',
        inText: (authors: string[], year?: number) => {
            if (!authors.length) return ''
            return `(${authors[0].split(' ').pop()} ${year || 'n.d.'})`
        },
    },
    ieee: {
        name: 'Institute of Electrical and Electronics Engineers',
        inText: (index: number) => `[${index}]`,
    },
    harvard: {
        name: 'Harvard citation style',
        inText: (authors: string[], year?: number) => {
            if (!authors.length) return '(Anon.)'
            if (authors.length === 1) return `(${authors[0].split(' ').pop()}, ${year || 'n.d.'})`
            if (authors.length === 2)
                return `(${authors[0].split(' ').pop()} and ${authors[1].split(' ').pop()}, ${year || 'n.d.'})`
            return `(${authors[0].split(' ').pop()} et al., ${year || 'n.d.'})`
        },
    },
    vancouver: {
        name: 'Vancouver citation style',
        inText: (index: number) => `[${index}]`,
    },
}

export function generateInTextCitation(
    style: CitationStyle,
    metadata: SourceMetadata,
    citationIndex?: number
): string {
    const { authors = [], publicationYear } = metadata

    switch (style) {
        case 'apa':
            return STYLE_TEMPLATES.apa.inText(authors, publicationYear)
        case 'mla':
            return STYLE_TEMPLATES.mla.inText(authors)
        case 'chicago':
            return STYLE_TEMPLATES.chicago.inText(authors, publicationYear)
        case 'ieee':
            return STYLE_TEMPLATES.ieee.inText(citationIndex || 1)
        case 'harvard':
            return STYLE_TEMPLATES.harvard.inText(authors, publicationYear)
        case 'vancouver':
            return STYLE_TEMPLATES.vancouver.inText(citationIndex || 1)
        default:
            return STYLE_TEMPLATES.apa.inText(authors, publicationYear)
    }
}

export function generateFullCitation(
    style: CitationStyle,
    metadata: SourceMetadata
): string {
    const {
        title,
        authors = [],
        publicationYear,
        publicationType,
        journal,
        volume,
        issue,
        pages,
        publisher,
        url,
        doi,
    } = metadata

    const authorString = formatAuthors(authors, style)

    switch (style) {
        case 'apa':
            return formatAPACitation(
                authorString,
                publicationYear,
                title,
                publicationType,
                journal,
                volume,
                issue,
                pages,
                publisher,
                url,
                doi
            )
        case 'mla':
            return formatMLACitation(
                authorString,
                title,
                publicationType,
                journal,
                volume,
                issue,
                pages,
                publisher,
                publicationYear,
                url
            )
        case 'chicago':
            return formatChicagoCitation(
                authorString,
                publicationYear,
                title,
                publicationType,
                journal,
                volume,
                issue,
                pages,
                publisher,
                url
            )
        default:
            return formatAPACitation(
                authorString,
                publicationYear,
                title,
                publicationType,
                journal,
                volume,
                issue,
                pages,
                publisher,
                url,
                doi
            )
    }
}

function formatAuthors(authors: string[], style: CitationStyle): string {
    if (!authors.length) return 'Anonymous'

    switch (style) {
        case 'apa':
        case 'chicago':
        case 'harvard':
            if (authors.length === 1) return authors[0]
            if (authors.length === 2) return `${authors[0]}, & ${authors[1]}`
            return authors.map((a, i) => (i === authors.length - 1 ? `& ${a}` : a)).join(', ')
        case 'mla':
            if (authors.length === 1) return authors[0]
            return `${authors[0]}, et al.`
        default:
            return authors.join(', ')
    }
}

function formatAPACitation(
    authors: string,
    year?: number,
    title?: string,
    type?: string,
    journal?: string,
    volume?: string,
    issue?: string,
    pages?: string,
    publisher?: string,
    url?: string,
    doi?: string
): string {
    let citation = `${authors} (${year || 'n.d.'}).`

    if (title) {
        citation += ` ${title}.`
    }

    if (journal) {
        citation += ` <em>${journal}</em>`
        if (volume) citation += `, ${volume}`
        if (issue) citation += `(${issue})`
        if (pages) citation += `, ${pages}`
        citation += '.'
    } else if (publisher) {
        citation += ` ${publisher}.`
    }

    if (doi) {
        citation += ` https://doi.org/${doi}`
    } else if (url) {
        citation += ` ${url}`
    }

    return citation
}

function formatMLACitation(
    authors: string,
    title?: string,
    type?: string,
    journal?: string,
    volume?: string,
    issue?: string,
    pages?: string,
    publisher?: string,
    year?: number,
    url?: string
): string {
    let citation = `${authors}.`

    if (title) {
        citation += ` "${title}."`
    }

    if (journal) {
        citation += ` <em>${journal}</em>`
        if (volume) citation += `, vol. ${volume}`
        if (issue) citation += `, no. ${issue}`
        if (year) citation += `, ${year}`
        if (pages) citation += `, pp. ${pages}`
        citation += '.'
    } else if (publisher && year) {
        citation += ` ${publisher}, ${year}.`
    }

    if (url) {
        citation += ` ${url}.`
    }

    return citation
}

function formatChicagoCitation(
    authors: string,
    year?: number,
    title?: string,
    type?: string,
    journal?: string,
    volume?: string,
    issue?: string,
    pages?: string,
    publisher?: string,
    url?: string
): string {
    let citation = `${authors}.`

    if (year) {
        citation += ` ${year}.`
    }

    if (title) {
        citation += ` "${title}."`
    }

    if (journal) {
        citation += ` <em>${journal}</em>`
        if (volume) citation += ` ${volume}`
        if (issue) citation += ` (${issue})`
        if (pages) citation += `: ${pages}`
        citation += '.'
    } else if (publisher) {
        citation += ` ${publisher}.`
    }

    if (url) {
        citation += ` ${url}.`
    }

    return citation
}

export const SUPPORTED_STYLES: Record<CitationStyle, string> = {
    apa: 'APA 7th Edition',
    mla: 'MLA 9th Edition',
    chicago: 'Chicago 17th Edition',
    ieee: 'IEEE',
    harvard: 'Harvard',
    vancouver: 'Vancouver',
}
