declare module 'duckduckgo-search' {
    export interface SearchOptions {
        safeSearch?: 'strict' | 'moderate' | 'off';
        time?: 'd' | 'w' | 'm' | 'y';
        locale?: string;
    }

    export interface SearchResult {
        title: string;
        url: string;
        description?: string;
        body?: string;
    }

    export function search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
