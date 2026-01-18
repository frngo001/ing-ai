'use client'

import { useState, useMemo } from 'react'
import { Search, Loader2, BookOpen, ExternalLink, Bookmark, Quote } from 'lucide-react'
import { useEditorRef } from 'platejs/react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useCitationStore, type SavedCitation } from '@/lib/stores/citation-store'
import { fetchWebsiteInfo } from '@/lib/bibify'
import { searchGoogleBooks, mapGoogleBookToSource } from '@/lib/google-books'
import { insertCitationWithMerge } from '@/components/editor/utils/insert-citation-with-merge'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/use-language'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'

export interface Source {
    id: string
    doi?: string
    title: string | { title?: string; identifiers?: Array<{ title?: string }> }
    authors: Array<{ fullName?: string; firstName?: string; lastName?: string }>
    publicationYear?: number
    type: string
    journal?: string | { title?: string; identifiers?: Array<{ title?: string }> }
    publisher?: string
    abstract?: string
    url?: string
    pdfUrl?: string
    isOpenAccess?: boolean
    completeness: number
    sourceApi: string
    volume?: string
    issue?: string
    page?: string
    pages?: string
    numberOfPages?: number
    categories?: string[]
    thumbnail?: string
    image?: string
    description?: string
    containerTitle?: string
    collectionTitle?: string
    edition?: string
    isbn?: string
    issn?: string
    language?: string
    publisherPlace?: string
    note?: string
    issued?: { 'date-parts': number[][] }
    accessed?: { 'date-parts': number[][] }
    URL?: string
    citationCount?: number
    impactFactor?: number
}

interface SourceSearchDialogProps {
    onImport?: (source: Source) => void
    showTrigger?: boolean
}

export function SourceSearchDialog({ onImport, showTrigger = true }: SourceSearchDialogProps) {
    const { isSearchOpen, closeSearch } = useCitationStore()
    const savedCitations = useCitationStore((state) => state.savedCitations)
    const libraries = useCitationStore((state) => state.libraries)
    const activeLibraryId = useCitationStore((state) => state.activeLibraryId)
    const setActiveLibrary = useCitationStore((state) => state.setActiveLibrary)
    const setPendingCitation = useCitationStore((state) => state.setPendingCitation)
    const [isLocalOpen, setIsLocalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'library' | 'search'>('library')
    const editor = useEditorRef()
    const { t, language } = useLanguage()
    const isOnboardingOpen = useOnboardingStore((state) => state.isOpen)

    // Memoized translations that update on language change
    const translations = useMemo(() => ({
        searchSourcesButton: t('library.searchSourcesButton'),
        addSources: t('library.addSources'),
        addSourcesDescription: t('library.addSourcesDescription'),
        chooseLibrary: t('library.chooseLibrary'),
        libraryTab: t('library.libraryTab'),
        newSourcesTab: t('library.newSourcesTab'),
        noLibraryCitations: t('library.noLibraryCitations'),
        importBibOrSearch: t('library.importBibOrSearch'),
        searchNewSources: t('library.searchNewSources'),
        citeInText: t('library.citeInText'),
        openSource: t('library.openSource'),
        searchQuery: t('library.searchQuery'),
        searchPlaceholder: t('library.searchPlaceholder'),
        searchTypeKeyword: t('library.searchTypeKeyword'),
        searchTypeTitle: t('library.searchTypeTitle'),
        searchTypeAuthor: t('library.searchTypeAuthor'),
        searchTypeBook: t('library.searchTypeBook'),
        searching: t('library.searching'),
        search: t('library.search'),
        searchRunning: t('library.searchRunning'),
        noResultsYet: t('library.noResultsYet'),
        databases: t('library.databases'),
        pages: t('library.pages'),
        edition: t('library.edition'),
        citations: t('library.citations'),
        import: t('library.import'),
        cite: t('library.cite'),
        view: t('library.view'),
        less: t('library.less'),
        more: t('library.more'),
        pleaseEnterSearchTerm: t('library.pleaseEnterSearchTerm'),
        couldNotLoadWebsiteMetadata: t('library.couldNotLoadWebsiteMetadata'),
        couldNotLoadBookInfo: t('library.couldNotLoadBookInfo'),
        searchFailed: t('library.searchFailed'),
        sourceAddedToCitationManager: t('library.sourceAddedToCitationManager'),
        citationInsertedFromLibrary: t('library.citationInsertedFromLibrary'),
        unnamedWebsite: t('library.unnamedWebsite'),
    }), [t, language])

    // Sync with global store
    const isOpen = isSearchOpen || isLocalOpen
    const setIsOpen = (open: boolean) => {
        setIsLocalOpen(open)
        if (!open) closeSearch()
    }
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState<'keyword' | 'title' | 'author' | 'doi' | 'url' | 'book'>('keyword')
    const [isSearching, setIsSearching] = useState(false)
    const [results, setResults] = useState<Source[]>([])
    const [currentApi, setCurrentApi] = useState<string>('')
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({})

    const normalizeTitle = (title: Source['title']): string => {
        if (typeof title === 'string') return title
        if (title?.title) return String(title.title)
        if (title?.identifiers?.length) {
            const first = title.identifiers.find((i) => i?.title)
            if (first?.title) return String(first.title)
        }
        return ''
    }

    const normalizeAuthors = (
        authors: Source['authors']
    ): Array<{ fullName?: string; firstName?: string; lastName?: string }> => {
        if (!Array.isArray(authors)) return []
        return authors.map((a) => ({
            fullName: a.fullName,
            firstName: a.firstName,
            lastName: a.lastName,
        }))
    }

    const normalizeJournal = (journal: Source['journal']): string => {
        if (!journal) return ''
        if (typeof journal === 'string') return journal
        if (journal?.title) return String(journal.title)
        if (journal?.identifiers?.length) {
            const first = journal.identifiers.find((i) => i?.title)
            if (first?.title) return String(first.title)
        }
        return ''
    }

    const toSafeSource = (source: Source): Source => ({
        ...source,
        title: normalizeTitle(source.title),
        authors: normalizeAuthors(source.authors),
        journal: normalizeJournal(source.journal),
    })

    const isLikelyUrl = (value: string) => {
        if (!value) return false
        try {
            // Accept plain domain or full URL
            const maybe = value.startsWith('http') ? value : `https://${value}`
            const u = new URL(maybe)
            return Boolean(u.hostname && u.hostname.includes('.'))
        } catch {
            return false
        }
    }

    const websiteInfoToSource = (info: Awaited<ReturnType<typeof fetchWebsiteInfo>>): Source => {
        const year = info.date ? Number.parseInt(info.date.slice(0, 4), 10) : undefined
        const authors =
            info.authors?.map((full) => ({ fullName: full })) ??
            (info.publisher ? [{ fullName: info.publisher }] : [])

        const issuedDateParts = (() => {
            if (!info.date) return undefined
            const [y, m, d] = info.date.split('-').map((n) => Number.parseInt(n, 10))
            return { 'date-parts': [[y, m || undefined, d || undefined].filter(Boolean) as number[]] }
        })()

        const accessedDateParts = (() => {
            const now = new Date()
            return { 'date-parts': [[now.getFullYear(), now.getMonth() + 1, now.getDate()]] }
        })()

        return {
            id: info.url || info.URL || crypto.randomUUID(),
            title: info.title || info.URL || info.url || translations.unnamedWebsite,
            authors,
            publicationYear: Number.isNaN(year) ? undefined : year,
            type: 'webpage',
            journal: info['container-title'] || info.publisher,
            containerTitle: info['container-title'] || info.publisher,
            publisher: info.publisher,
            abstract: info.description,
            description: info.description,
            url: info.URL || info.url,
            URL: info.URL || info.url,
            pdfUrl: undefined,
            isOpenAccess: true,
            completeness: 1,
            sourceApi: 'bibify.website',
            citationCount: undefined,
            impactFactor: undefined,
            volume: undefined,
            issue: undefined,
            page: undefined,
            pages: undefined,
            numberOfPages: undefined,
            categories: undefined,
            thumbnail: info.thumbnail || info.image,
            image: info.image,
            language: info.language,
            note: info.description,
            issued: issuedDateParts,
            accessed: accessedDateParts,
        }
    }

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            toast.error(translations.pleaseEnterSearchTerm)
            return
        }

        setIsSearching(true)
        setResults([])
        setCurrentApi('')
        setProgress({ current: 0, total: 0 })

        // Direkte URL-Suche über Bibify
        if (searchType === 'url' || isLikelyUrl(searchQuery.trim())) {
            try {
                const info = await fetchWebsiteInfo(searchQuery.trim())
                const source = websiteInfoToSource(info)
                setResults([source])
            } catch (error) {
                console.error('Website lookup failed', error)
                toast.error(translations.couldNotLoadWebsiteMetadata)
            } finally {
                setIsSearching(false)
                setCurrentApi('')
            }
            return
        }

        // Buchsuche über Google Books API (ersetzt Bibify)
        if (searchType === 'book') {
            try {
                const response = await searchGoogleBooks(searchQuery.trim(), 40)
                const mapped = (response.items ?? []).map(mapGoogleBookToSource)
                setResults(mapped)
            } catch (error) {
                console.error('Book lookup failed', error)
                toast.error(translations.couldNotLoadBookInfo)
            } finally {
                setIsSearching(false)
                setCurrentApi('')
            }
            return
        }

        const params = new URLSearchParams({
            query: searchQuery,
            type: searchType,
        })

        const eventSource = new EventSource(`/api/sources/search/stream?${params}`)

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)

                switch (data.type) {
                    case 'start':
                        setProgress({ current: 0, total: data.totalApis })
                        break

                    case 'progress':
                        setCurrentApi(data.api)
                        setProgress({ current: data.current, total: data.total })
                        break

                    case 'results':
                        setResults(prev => {
                            const normalized = (data.sources as Source[]).map(toSafeSource)
                            const newResults = [...prev, ...normalized]
                            // Sort by citation count, then by year
                            return newResults.sort((a, b) => {
                                if (b.citationCount && a.citationCount) {
                                    return b.citationCount - a.citationCount
                                }
                                if (b.publicationYear && a.publicationYear) {
                                    return b.publicationYear - a.publicationYear
                                }
                                return 0
                            })
                        })
                        break

                    case 'done':
                        eventSource.close()
                        setIsSearching(false)
                        setCurrentApi('')
                        break
                }
            } catch (error) {
                console.error('Parse error:', error)
            }
        }

        eventSource.onerror = () => {
            eventSource.close()
            setIsSearching(false)
            toast.error(translations.searchFailed)
        }
    }

    const handleImport = (source: Source) => {
        const safeSource = toSafeSource(source)
        onImport?.(safeSource)
        toast.success(translations.sourceAddedToCitationManager)
    }

    const handleCite = (source: Source) => {
        const safeSource = toSafeSource(source)
        const url = safeSource.url || safeSource.URL

        const accessDateParts =
            safeSource.accessed?.['date-parts']?.[0] ||
            (url
                ? (() => {
                    const now = new Date()
                    return [now.getFullYear(), now.getMonth() + 1, now.getDate()] as number[]
                })()
                : undefined)

        const accessedAtIso = (() => {
            if (!accessDateParts || accessDateParts.length === 0) return undefined
            const [y, m, d] = accessDateParts
            if (!y) return undefined
            return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).toISOString()
        })()

        insertCitationWithMerge(editor, {
            sourceId: safeSource.id,
            authors: safeSource.authors || [],
            year: safeSource.publicationYear,
            title: normalizeTitle(safeSource.title),
            doi: safeSource.doi,
            url,
            sourceType: safeSource.type,
            journal: typeof safeSource.journal === 'string' ? safeSource.journal : undefined,
            containerTitle: safeSource.containerTitle,
            collectionTitle: safeSource.collectionTitle,
            publisher: safeSource.publisher,
            volume: safeSource.volume,
            issue: safeSource.issue,
            pages: safeSource.pages || (safeSource as any).page,
            isbn: safeSource.isbn,
            issn: safeSource.issn,
            note: safeSource.note,
            accessed: safeSource.accessed,
            accessedAt: accessedAtIso,
            issued: safeSource.issued,
            children: [{ text: '' }],
        })

        setIsOpen(false)
    }

    const handleUseSaved = (citation: SavedCitation) => {
        setPendingCitation(citation)
        toast.success(translations.citationInsertedFromLibrary)
        setIsOpen(false)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSearching) {
            handleSearch()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Search className="h-4 w-4 mr-2" />
                        {translations.searchSourcesButton}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent
                className="max-w-4xl h-[80vh] overflow-hidden flex flex-col gap-4 border-0 shadow-none ring-0 outline-none focus-visible:outline-none"
                data-onboarding="citation-dialog"
                onInteractOutside={(e) => {
                    if (isOnboardingOpen) {
                        e.preventDefault()
                    }
                }}
            >
                <DialogHeader className="shrink-0 space-y-2 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <div className="space-y-1 flex-1">
                            <DialogTitle className="text-lg font-semibold">{translations.addSources}</DialogTitle>
                        </div>
                        <div className="sm:w-[260px] w-full">
                            <Select
                                value={activeLibraryId ?? undefined}
                                onValueChange={(value) => setActiveLibrary(value)}
                            >
                                <SelectTrigger id="library-select" className="h-9 w-full">
                                    <SelectValue placeholder={translations.chooseLibrary} />
                                </SelectTrigger>
                                <SelectContent>
                                    {libraries.map((lib) => (
                                        <SelectItem key={lib.id} value={lib.id}>
                                            {lib.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogDescription className="text-sm w-full">
                        {translations.addSourcesDescription}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'library' | 'search')} className="flex-1 min-h-0 flex flex-col gap-4">
                    <TabsList className="w-full">
                        <TabsTrigger value="library" className="flex-1">{translations.libraryTab}</TabsTrigger>
                        <TabsTrigger value="search" className="flex-1">{translations.newSourcesTab}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="library" className="flex-1 min-h-0 flex flex-col gap-3">
                        <ScrollArea className="flex-1 min-h-0 pr-3">
                            <div className="space-y-2">
                                {savedCitations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-muted-foreground">
                                        <BookOpen className="h-8 w-8 opacity-60" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-foreground">{translations.noLibraryCitations}</p>
                                            <p className="text-xs">
                                                {translations.importBibOrSearch}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => setActiveTab('search')}>
                                            {translations.searchNewSources}
                                        </Button>
                                    </div>
                                ) : (
                                    savedCitations.map((citation) => {
                                        const url = citation.externalUrl || citation.href
                                        return (
                                            <div
                                                key={citation.id}
                                                className="flex items-start gap-3 px-3 py-3"
                                            >
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    <p className="text-sm font-semibold leading-tight line-clamp-2">
                                                        {citation.title}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                                                        {citation.source}
                                                        {citation.year ? ` • ${citation.year}` : ''} • {citation.lastEdited}
                                                    </p>
                                                    {citation.authors?.length ? (
                                                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                                            {citation.authors
                                                                .map((a) => {
                                                                    if (typeof a === 'string') return a === '[object Object]' ? '' : a;
                                                                    if (typeof a === 'object' && a !== null) {
                                                                        return (a as any).fullName || [(a as any).firstName, (a as any).lastName].filter(Boolean).join(' ') || '';
                                                                    }
                                                                    return '';
                                                                })
                                                                .filter(Boolean)
                                                                .join(', ')
                                                            }
                                                        </p>
                                                    ) : null}
                                                    {citation.doi ? (
                                                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1">
                                                            DOI: {citation.doi}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => handleUseSaved(citation)}
                                                        title={translations.citeInText}
                                                    >
                                                        <Quote className="h-4 w-4" />
                                                    </Button>
                                                    {url && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8"
                                                            onClick={() => window.open(url, '_blank')}
                                                            title={translations.openSource}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="search" className="flex-1 min-h-0 flex flex-col gap-3">
                        {/* Search Controls */}
                        <div className="flex flex-col gap-3 p-3">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Label htmlFor="search-query" className="sr-only">{translations.searchQuery}</Label>
                                    <Input
                                        id="search-query"
                                        placeholder={translations.searchPlaceholder}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        disabled={isSearching}
                                    />
                                </div>
                                <Select value={searchType} onValueChange={(v: any) => setSearchType(v)}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="keyword">{translations.searchTypeKeyword}</SelectItem>
                                        <SelectItem value="title">{translations.searchTypeTitle}</SelectItem>
                                        <SelectItem value="author">{translations.searchTypeAuthor}</SelectItem>
                                        <SelectItem value="doi">DOI</SelectItem>
                                        <SelectItem value="url">URL</SelectItem>
                                        <SelectItem value="book">{translations.searchTypeBook}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="gap-2 rounded-md px-4 border border-primary/70 bg-gradient-to-r from-primary/90 via-primary to-primary/80 text-primary-foreground shadow-md hover:from-primary hover:via-primary/90 hover:to-primary/70 hover:border-primary/80 hover:shadow-lg"
                                >
                                    {isSearching ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {translations.searching}
                                        </>
                                    ) : (
                                        <>
                                            <Search className="h-4 w-4 mr-2 text-primary-foreground" />
                                            {translations.search}
                                        </>
                                    )}
                                </Button>
                            </div>
                            {isSearching && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span>
                                        {currentApi ? `${currentApi}` : translations.searchRunning} ({progress.current}/{progress.total})
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Results - scrollable area */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {results.length === 0 && !isSearching && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>{translations.noResultsYet}</p>
                                </div>
                            )}

                            {isSearching && results.length === 0 && (
                                <div className="text-center py-12">
                                    <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">
                                        {currentApi ? `${currentApi}...` : translations.searchRunning}
                                    </p>
                                    {progress.total > 0 && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {progress.current} / {progress.total} {translations.databases}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2 pr-2">
                                {results.map((source) => {
                                    const journal = normalizeJournal(source.journal)
                                    const container = source.containerTitle || journal
                                    const publisher = source.publisher
                                    const categories = source.categories || []
                                    const pages = source.page || source.pages
                                    const description = source.description || source.abstract
                                    const showFull =
                                        description && expandedDescriptions[source.id ?? normalizeTitle(source.title)]
                                    const edition = source.edition
                                    const language = source.language
                                    const publisherPlace = source.publisherPlace
                                    const numberOfPages = source.numberOfPages
                                    const isbn = source.isbn
                                    const issn = source.issn

                                    return (
                                        <div key={source.id} className="p-3 rounded-md hover:bg-muted/50 transition-colors">
                                            <div className="flex gap-3">
                                                {source.thumbnail && (
                                                    <div className="shrink-0">
                                                        <img
                                                            src={source.thumbnail}
                                                            alt={normalizeTitle(source.title)}
                                                            className="w-14 h-20 object-cover rounded border border-border/60"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}
                                                {/* Content */}
                                                <div className="flex-1 min-w-0 space-y-1">
                                                    {/* Title */}
                                                    <h4 className="font-medium text-xs leading-tight line-clamp-2">
                                                        {normalizeTitle(source.title)}
                                                    </h4>

                                                    {/* Authors and Year */}
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        {normalizeAuthors(source.authors)
                                                            ?.slice(0, 3)
                                                            .map(a => a.fullName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim())
                                                            .join(', ')}
                                                        {source.authors && source.authors.length > 3 && ' et al.'}
                                                        {source.publicationYear && ` (${source.publicationYear})`}
                                                    </p>

                                                    {/* Metadata */}
                                                    <div className="flex flex-wrap items-center gap-1">
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                            {source.type}
                                                        </Badge>
                                                        {container && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                {container}
                                                            </Badge>
                                                        )}
                                                        {publisher && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                {publisher}
                                                            </Badge>
                                                        )}
                                                        {pages && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                {pages} {translations.pages}
                                                            </Badge>
                                                        )}
                                                        {numberOfPages && !pages && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                {numberOfPages} {translations.pages}
                                                            </Badge>
                                                        )}
                                                        {edition && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                {translations.edition}: {edition}
                                                            </Badge>
                                                        )}
                                                        {isbn && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                ISBN: {isbn}
                                                            </Badge>
                                                        )}
                                                        {issn && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                ISSN: {issn}
                                                            </Badge>
                                                        )}
                                                        {source.doi && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                DOI: {source.doi}
                                                            </Badge>
                                                        )}
                                                        {language && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                {language}
                                                            </Badge>
                                                        )}
                                                        {publisherPlace && (
                                                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                {publisherPlace}
                                                            </Badge>
                                                        )}
                                                        {source.citationCount !== undefined && source.citationCount > 0 && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {source.citationCount} {translations.citations}
                                                            </span>
                                                        )}
                                                        {source.impactFactor !== undefined && source.impactFactor > 0 && (
                                                            <span className="text-[10px] text-muted-foreground">
                                                                IF: {source.impactFactor.toFixed(1)}
                                                            </span>
                                                        )}
                                                        {categories.slice(0, 3).map((cat) => (
                                                            <Badge
                                                                key={cat}
                                                                variant="outline"
                                                                className="text-[10px] px-1.5 py-0"
                                                            >
                                                                {cat}
                                                            </Badge>
                                                        ))}
                                                    </div>

                                                    {description && (
                                                        <div className="space-y-1">
                                                            <p
                                                                className={cn(
                                                                    "text-[10px] text-muted-foreground leading-snug",
                                                                    !showFull && "line-clamp-2"
                                                                )}
                                                            >
                                                                {description}
                                                            </p>
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="h-auto px-0 text-[10px]"
                                                                onClick={() =>
                                                                    setExpandedDescriptions((prev) => ({
                                                                        ...prev,
                                                                        [source.id ?? normalizeTitle(source.title)]: !prev[
                                                                            source.id ?? normalizeTitle(source.title)
                                                                        ],
                                                                    }))
                                                                }
                                                            >
                                                                {showFull ? translations.less : translations.more}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions - Icon only */}
                                                <div className="flex gap-0.5 shrink-0">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-5 w-5"
                                                        onClick={() => handleImport(source)}
                                                        title={translations.import}
                                                    >
                                                        <Bookmark className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-5 w-5"
                                                        onClick={() => handleCite(source)}
                                                        title={translations.cite}
                                                    >
                                                        <Quote className="h-3 w-3" />
                                                    </Button>
                                                    {source.url && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-5 w-5"
                                                            onClick={() => window.open(source.url, '_blank')}
                                                            title={translations.view}
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
