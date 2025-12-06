import { search } from 'duckduckgo-search'

export interface SearchResult {
    title: string
    url: string
    description: string
}

export async function performWebSearch(query: string): Promise<SearchResult[]> {
    try {
        const results = await search(query, {
            safeSearch: 'strict',
        })

        if (!results || results.length === 0) {
            return []
        }

        return results.map((result: any) => ({
            title: result.title,
            url: result.url,
            description: result.description || '',
        }))
    } catch (error) {
        console.error('Web search error:', error)
        return []
    }
}
