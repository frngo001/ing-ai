/**
 * Leichte Wrapper für den Bibserver (https://api.bibify.org).
 * Unterstützt Styles, Feldlisten, Zitation, Buch- und Website-Metadaten.
 *
 * Die API nutzt aktuell GET mit Query-Strings, weshalb wir komplexe
 * Objekte (z. B. Autoren-Arrays) rekursiv in Query-Parameter abbilden.
 */

export type BibifyAuthorPerson = {
  type: 'Person'
  first?: string
  last?: string
}

export type BibifyAuthorOrganization = {
  type: 'Organization'
  full: string
}

export type BibifyAuthor = BibifyAuthorPerson | BibifyAuthorOrganization

export type BibifyCiteRequest = {
  style: string // z. B. "apa.csl"
  type: string // Zotero Medientyp, z. B. "book"
  authors?: BibifyAuthor[]
  [key: string]: unknown
}

export type BibifyCiteResponse = string[] // HTML-Strings, pro Eintrag eine formatierte Zitation

export type BibifyStyle = {
  citationName: string
  citationShortName: string | null
  citationFile: string // z. B. "apa.csl"
}

export type BibifyStylesResponse = {
  citationStyles: BibifyStyle[]
  totalStyleCount: number
}

export type BibifyField = {
  label: string
  field: string
}

export type BibifyBook = {
  title: string
  authors?: string[]
  publisher?: string
  date?: string
  categories?: string[]
  thumbnail?: string
  pages?: number
  url?: string
  link?: string
  id?: string
  isbn?: string
  ISBN?: string
  issn?: string
  ISSN?: string
  edition?: string
  'publisher-place'?: string
  publisherPlace?: string
  language?: string
  note?: string
  abstract?: string
  description?: string
  volume?: string | number
  issue?: string | number
  subtitle?: string
  series?: string
  'container-title'?: string
  containerTitle?: string
  DOI?: string
  doi?: string
  'event-place'?: string
  eventPlace?: string
  'number-of-pages'?: number
  numberOfPages?: number
  'page'?: string
  'page-first'?: string
  pageFirst?: string
  'original-date'?: string
  originalDate?: string
  'original-title'?: string
  originalTitle?: string
  'short-title'?: string
  shortTitle?: string
  'title-short'?: string
  titleShort?: string
  translator?: string[]
  [key: string]: unknown // Erlaubt zusätzliche Felder, die die API zurückgeben könnte
}

export type BibifyWebsiteInfo = {
  date?: string
  description?: string
  image?: string
  publisher?: string
  title?: string
  url?: string
  thumbnail?: string
  'container-title'?: string
  URL?: string
  authors?: string[]
  language?: string
}

const DEFAULT_BASE_URL = 'https://api.bibify.org'

const baseUrl = process.env.NEXT_PUBLIC_BIBIFY_URL || DEFAULT_BASE_URL

const withBase = (path: string) => new URL(path, baseUrl).toString()

const toQueryString = (obj: Record<string, unknown>): string => {
  const params = new URLSearchParams()

  const append = (prefix: string, value: unknown) => {
    if (value === undefined || value === null) return
    if (Array.isArray(value)) {
      value.forEach((v, idx) => append(`${prefix}[${idx}]`, v))
      return
    }
    if (typeof value === 'object') {
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
        append(`${prefix}[${k}]`, v)
      })
      return
    }
    params.append(prefix, String(value))
  }

  Object.entries(obj).forEach(([key, value]) => append(key, value))

  return params.toString()
}

const fetchJson = async <T>(input: string | URL, init?: RequestInit): Promise<T> => {
  const res = await fetch(input, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Bibify request failed (${res.status}): ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function getCitationStyles(limit?: number): Promise<BibifyStylesResponse> {
  const query = limit ? `?limit=${encodeURIComponent(limit)}` : ''
  return fetchJson<BibifyStylesResponse>(withBase(`/api/styles${query}`))
}

export async function searchCitationStyles(query: string): Promise<BibifyStyle[]> {
  const q = encodeURIComponent(query)
  return fetchJson<BibifyStyle[]>(withBase(`/api/styles/search?q=${q}`))
}

export async function getFieldsForType(type: string): Promise<BibifyField[]> {
  return fetchJson<BibifyField[]>(withBase(`/api/fields/${encodeURIComponent(type)}`))
}

/**
 * Formatiert eine Zitation via Bibify. Achtung: aktuell GET-basiert,
 * daher sollte der Payload kompakt bleiben (max. ~2048 Zeichen).
 */
export async function citeWithBibify(request: BibifyCiteRequest): Promise<BibifyCiteResponse> {
  const qs = toQueryString(request)
  return fetchJson<BibifyCiteResponse>(withBase(`/api/cite?${qs}`))
}

export async function searchBooks(query: string, limit?: number): Promise<BibifyBook[]> {
  const q = encodeURIComponent(query)
  const params = new URLSearchParams({ q })
  if (limit !== undefined) {
    params.append('limit', limit.toString())
  }
  return fetchJson<BibifyBook[]>(withBase(`/api/books?${params.toString()}`))
}

export async function fetchWebsiteInfo(url: string): Promise<BibifyWebsiteInfo> {
  const q = encodeURIComponent(url)
  return fetchJson<BibifyWebsiteInfo>(withBase(`/api/website?url=${q}`))
}
