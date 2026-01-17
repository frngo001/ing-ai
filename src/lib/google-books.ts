/**
 * Google Books API Utility
 * Provides functions to search for books and fetch detailed metadata.
 */

export interface GoogleBookVolume {
    id: string;
    volumeInfo: {
        title: string;
        subtitle?: string;
        authors?: string[];
        publisher?: string;
        publishedDate?: string;
        description?: string;
        industryIdentifiers?: Array<{
            type: 'ISBN_10' | 'ISBN_13' | 'ISSN' | 'OTHER';
            identifier: string;
        }>;
        pageCount?: number;
        categories?: string[];
        imageLinks?: {
            smallThumbnail?: string;
            thumbnail?: string;
        };
        language?: string;
        previewLink?: string;
        infoLink?: string;
        canonicalVolumeLink?: string;
    };
}

export interface GoogleBooksResponse {
    items?: GoogleBookVolume[];
    totalItems: number;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY || '';
const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export async function searchGoogleBooks(query: string, maxResults: number = 20): Promise<GoogleBooksResponse> {
    const params = new URLSearchParams({
        q: query,
        maxResults: maxResults.toString(),
        printType: 'books',
        orderBy: 'relevance',
    });

    if (API_KEY) {
        params.append('key', API_KEY);
    }

    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Google Books API error (${response.status}): ${error.error?.message || response.statusText}`);
    }

    return response.json();
}

/**
 * Maps Google Books API structure to the application's Source format
 */
export function mapGoogleBookToSource(volume: GoogleBookVolume): any {
    const info = volume.volumeInfo;

    // Extract identifiers
    const isbn13 = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier;
    const isbn10 = info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier;
    const isbn = isbn13 || isbn10;

    // Improve year extraction
    const yearMatch = info.publishedDate?.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

    // Date parts for BibTeX/CSL
    const dateParts = (() => {
        if (!info.publishedDate) return undefined;
        const parts = info.publishedDate.split('-').map(p => parseInt(p, 10));
        return {
            'date-parts': [parts.filter(p => !isNaN(p))]
        };
    })();

    return {
        id: volume.id,
        title: info.title + (info.subtitle ? `: ${info.subtitle}` : ''),
        authors: (info.authors ?? []).map(name => ({ fullName: name })),
        publicationYear: year,
        type: 'book',
        publisher: info.publisher,
        abstract: info.description,
        url: info.infoLink || info.previewLink || `https://books.google.com/books?id=${volume.id}`,
        completeness: 1,
        sourceApi: 'google-books',
        numberOfPages: info.pageCount,
        categories: info.categories,
        thumbnail: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail,
        image: info.imageLinks?.thumbnail,
        language: info.language,
        issued: dateParts,
        isbn: isbn,
        volume: undefined, // Google Books doesn't usually provide this in the same way
    };
}
