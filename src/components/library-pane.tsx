"use client"

import Link from "next/link"
import {
  Library,
  CirclePlus,
  Download,
  ExternalLink,
  Upload,
  PanelLeftClose,
  Search,
  Trash,
  Plus,
  Quote,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useCitationStore, type SavedCitation } from "@/lib/stores/citation-store"
import { useProjectStore, type Project } from "@/lib/stores/project-store"
import * as React from "react"
import { useLanguage } from "@/lib/i18n/use-language"
import { useProjectLibraryRealtime } from "@/hooks/use-project-library-realtime"
import { ImportCitationsDialog } from "@/components/citations/import-citations-dialog"

const fallbackCitations: SavedCitation[] = []

export function LibraryPane({
  className,
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const { t, language } = useLanguage()
  const currentProjectId = useProjectStore((state) => state.currentProjectId)
  const currentProject = useProjectStore((state) => state.getCurrentProject())
  const openSearch = useCitationStore((state) => state.openSearch)
  const setPendingCitation = useCitationStore((state) => state.setPendingCitation)

  const isSharedProject = currentProject?.isShared === true;
  const isViewOnly = isSharedProject && currentProject?.shareMode === 'view';
  const removeCitation = useCitationStore((state) => state.removeCitation)
  const citations = useCitationStore((state) => state.savedCitations)
  const libraries = useCitationStore((state) => state.libraries)
  const activeLibraryId = useCitationStore((state) => state.activeLibraryId)
  const setActiveLibrary = useCitationStore((state) => state.setActiveLibrary)
  const addLibrary = useCitationStore((state) => state.addLibrary)
  const deleteLibrary = useCitationStore((state) => state.deleteLibrary)
  const syncLibrariesFromBackend = useCitationStore((state) => state.syncLibrariesFromBackend)
  const setCurrentProjectId = useCitationStore((state) => state.setCurrentProjectId)
  const [isCreateLibraryOpen, setIsCreateLibraryOpen] = React.useState(false)
  const [newLibraryName, setNewLibraryName] = React.useState("")
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [libraryToDelete, setLibraryToDelete] = React.useState<{ id: string; name: string } | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedAbstracts, setExpandedAbstracts] = React.useState<Record<string, boolean>>({})
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false)

  // Memoized translations that update on language change
  const translations = React.useMemo(() => ({
    title: t('library.title'),
    refreshLibraries: t('library.refreshLibraries'),
    importBib: t('library.importBib'),
    exportBib: t('library.exportBib'),
    addCitations: t('library.addCitations'),
    closePanel: t('library.closePanel'),
    import: t('library.import') || "Importieren",
    selectLibrary: t('library.selectLibrary'),
    chooseLibrary: t('library.chooseLibrary'),
    newLibrary: t('library.newLibrary'),
    deleteLibrary: t('library.deleteSource'),
    libraryName: t('library.libraryName'),
    cancel: t('library.cancel'),
    createLibrary: t('library.createLibrary'),
    searchSources: t('library.searchSources'),
    noResultsFor: t('library.noResultsFor'),
    noSourcesYetSaved: t('library.noSourcesYetSaved'),
    adjustSearch: t('library.adjustSearch'),
    importOrAdd: t('library.importOrAdd'),
    resetSearch: t('library.resetSearch'),
    citeInText: t('library.citeInText'),
    openSource: t('library.openSource'),
    deleteSource: t('library.deleteSource'),
    showMore: t('library.showMore'),
    showLess: t('library.showLess'),
    deleteSourceTitle: t('library.deleteSourceTitle'),
    delete: t('library.delete'),
    deleteLibraryTitle: t('library.deleteLibraryTitle'),
    deleteLibraryDescription: t('library.deleteLibraryDescription'),
    addedOn: t('library.addedOn'),

  }), [t, language])

  React.useEffect(() => {
    setCurrentProjectId(currentProjectId ?? null)
    syncLibrariesFromBackend(currentProjectId, currentProject?.isShared === true)
  }, [syncLibrariesFromBackend, setCurrentProjectId, currentProjectId, currentProject?.isShared])

  // Custom Realtime Hook for Library
  useProjectLibraryRealtime({
    projectId: currentProjectId,
    onLibraryChange: () => {
      // Add a small delay to ensure propagation
      setTimeout(() => {
        syncLibrariesFromBackend(currentProjectId, currentProject?.isShared === true)
      }, 1);
    },
    enabled: !!currentProjectId
  });
  const confirmCitation = React.useMemo(
    () => citations.find((c) => c.id === confirmDeleteId),
    [citations, confirmDeleteId]
  )

  const filteredCitations = React.useMemo(() => {
    const base = citations.length ? citations : fallbackCitations
    const q = searchQuery.trim().toLowerCase()
    if (!q) return base
    return base.filter((c) => {
      const haystack = [
        c.title,
        c.source,
        c.lastEdited,
        c.doi,
        c.externalUrl,
        c.year ? String(c.year) : "",
        ...(c.authors || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [citations, searchQuery])

  const exportBib = () => {
    const target = citations.length ? citations : fallbackCitations
    if (!target.length) return
    const entries = target
      .map((c) => {
        const authors = c.authors?.length ? c.authors.join(" and ") : ""
        const id = c.id || `cite_${Math.random().toString(16).slice(2)}`

        // Determine BibTeX type
        let type = 'article'
        if (c.type === 'book') type = 'book'
        else if (c.type === 'webpage' || c.type === 'website') type = 'misc'
        else if (c.type === 'conference') type = 'inproceedings'
        else if (c.type === 'thesis') type = 'phdthesis'

        // Construct fields dynamically
        const fields = []
        fields.push(`title={${c.title}}`)
        if (authors) fields.push(`author={${authors}}`)
        if (c.year) fields.push(`year={${c.year}}`)
        if (c.doi) fields.push(`doi={${c.doi}}`)
        if (c.externalUrl || c.href) fields.push(`url={${c.externalUrl || c.href}}`)

        // Metadata fields
        if (c.abstract) fields.push(`abstract={${c.abstract}}`)
        if (c.imageUrl) fields.push(`image={${c.imageUrl}}`)
        if (c.isbn) fields.push(`isbn={${c.isbn}}`)
        if (c.edition) fields.push(`edition={${c.edition}}`)
        if (c.publisherPlace) fields.push(`address={${c.publisherPlace}}`)
        if (c.volume) fields.push(`volume={${c.volume}}`)
        if (c.issue) fields.push(`number={${c.issue}}`)
        if (c.pages) fields.push(`pages={${c.pages}}`)
        if (c.issn) fields.push(`issn={${c.issn}}`)

        // Add source/journal/publisher based on type
        // Use explicit publisher if available, otherwise fallback to source for books
        if (c.publisher && type === 'book') {
          fields.push(`publisher={${c.publisher}}`)
        } else if (c.source) {
          if (type === 'article') {
            fields.push(`journal={${c.source}}`)
          } else if (type === 'book' && !c.publisher) {
            fields.push(`publisher={${c.source}}`)
          } else {
            fields.push(`howpublished={${c.source}}`)
          }
        }

        return `@${type}{${id},
  ${fields.join(',\n  ')}
}`
      })
      .join("\n\n")
    const blob = new Blob([entries], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    // Get active library name for filename
    const activeLibrary = libraries.find(lib => lib.id === activeLibraryId)
    const filename = activeLibrary ? `${activeLibrary.name}.bib` : "library.bib"
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCreateLibrary = async () => {
    const name = newLibraryName.trim() || translations.newLibrary
    const id = await addLibrary(name)
    setActiveLibrary(id)
    setNewLibraryName("")
    setIsCreateLibraryOpen(false)
  }

  const handleConfirmDeleteLibrary = React.useCallback(async () => {
    if (!libraryToDelete) return

    try {
      await deleteLibrary(libraryToDelete.id)
      setLibraryToDelete(null)
    } catch (error) {
      console.error("Fehler beim Löschen der Bibliothek:", error)
      setLibraryToDelete(null)
    }
  }, [libraryToDelete, deleteLibrary])

  return (
    <div
      data-onboarding="library-pane"
      className={cn(
        "text-foreground flex h-full min-w-[260px] max-w-[320px] flex-col px-3 pb-3 pt-0 border-r border-border/70",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-2 mt-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold">{translations.title}</h2>
            <Library className="size-4" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isViewOnly && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-transparent"
                  onClick={() => setIsImportDialogOpen(true)}
                  aria-label={translations.import}
                >
                  <Upload className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{translations.import}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-transparent"
                onClick={exportBib}
                aria-label={translations.exportBib}
              >
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{translations.exportBib}</TooltipContent>
          </Tooltip>
          {!isViewOnly && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-transparent"
                  onClick={openSearch}
                  aria-label={translations.addCitations}
                  data-onboarding="add-source-btn"
                >
                  <Plus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{translations.addCitations}</TooltipContent>
            </Tooltip>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 bg-transparent"
            onClick={onClose}
            aria-label={translations.closePanel}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
      </div>
      <div className="pb-3">
        <div className="flex items-center gap-1.5">
          <Select
            value={activeLibraryId ?? undefined}
            onValueChange={(value) => {
              if (value === "__new__") {
                // Open popover after the select closes to avoid immediate re-close
                setTimeout(() => setIsCreateLibraryOpen(true), 0)
                return
              }
              setActiveLibrary(value)
            }}
          >
            <SelectTrigger className="h-9 flex-1 min-w-[120px] text-sm" aria-label={translations.selectLibrary}>
              <SelectValue placeholder={translations.chooseLibrary} />
            </SelectTrigger>
            <SelectContent>
              {libraries.map((lib) => (
                <SelectItem key={lib.id} value={lib.id} className="text-sm">
                  {lib.name}
                </SelectItem>
              ))}

            </SelectContent>
          </Select>
          {!isViewOnly && (
            <Popover open={isCreateLibraryOpen} onOpenChange={setIsCreateLibraryOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 whitespace-nowrap shrink-0"
                      onClick={() => setIsCreateLibraryOpen((prev) => !prev)}
                    >
                      <CirclePlus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom">{translations.newLibrary}</TooltipContent>
              </Tooltip>
              <PopoverContent align="start" className="w-[260px]">
                <div className="flex flex-col gap-3">
                  <Input
                    value={newLibraryName}
                    onChange={(e) => setNewLibraryName(e.target.value)}
                    placeholder={translations.libraryName}
                    aria-label={translations.libraryName}
                    className="focus-within:ring-0 focus-within:ring-offset-0 group rounded-md border px-2 py-2"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsCreateLibraryOpen(false)}>
                      {translations.cancel}
                    </Button>
                    <Button size="sm" onClick={handleCreateLibrary}>
                      {translations.createLibrary}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
          {activeLibraryId &&
            !isViewOnly &&
            activeLibraryId !== 'library_default' &&
            libraries.length > 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 whitespace-nowrap shrink-0"
                    onClick={() => {
                      const library = libraries.find((lib) => lib.id === activeLibraryId)
                      if (library) {
                        setLibraryToDelete({ id: library.id, name: library.name })
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{translations.deleteLibraryTitle}</TooltipContent>
              </Tooltip>
            )}
        </div>
      </div>
      <div className="pb-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-2 flex items-center text-muted-foreground">
            <Search className="size-4" />
          </span>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={translations.searchSources}
            className="h-9 pl-8 text-sm"
            aria-label={translations.searchSources}
            data-onboarding="library-search"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredCitations.length === 0 ? (
            <div className="px-3 py-6">
              <div className="rounded-md border border-dashed border-border/70 bg-muted/30 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Search className="size-4 text-muted-foreground" />
                  {searchQuery.trim()
                    ? `${translations.noResultsFor} „${searchQuery.trim()}"`
                    : translations.noSourcesYetSaved}
                </div>
                <p className="text-muted-foreground text-xs">
                  {searchQuery.trim()
                    ? translations.adjustSearch
                    : translations.importOrAdd}
                </p>
                {searchQuery.trim() && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                      onClick={() => setSearchQuery("")}
                    >
                      {translations.resetSearch}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            filteredCitations.map((item, index) => {
              const rawUrl = item.externalUrl || item.href
              const url = rawUrl === '/editor' ? undefined : rawUrl
              return (
                <div
                  key={item.id}
                  className={cn(
                    "border-border/50 hover:bg-muted/50 group rounded-md border px-2 py-2 transition focus:outline-none focus:ring-0 cursor-default",
                    index !== filteredCitations.length - 1 && "mb-2"
                  )}
                  tabIndex={-1}
                >
                  <div className="flex gap-3">
                    {/* Thumbnail Display */}
                    {item.imageUrl && (
                      <div className="shrink-0">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-12 h-auto object-cover rounded-sm border border-border/40 shadow-sm"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col gap-1 min-w-0">
                      <p className="text-xs font-semibold leading-tight line-clamp-2">
                        {item.title}
                      </p>
                      <div className="text-muted-foreground text-[11px] leading-snug line-clamp-2">
                        {item.type && (
                          <span className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-inset ring-gray-500/10 mr-1.5 align-middle uppercase tracking-wider scale-[0.9] origin-left">
                            {item.type}
                          </span>
                        )}
                        <span>
                          {item.source}
                          {item.year ? ` • ${item.year}` : ""}
                        </span>
                      </div>
                      {item.authors?.length ? (
                        <div className="text-muted-foreground text-[11px] leading-snug line-clamp-2">
                          {item.authors
                            .map((a) => {
                              // Handle various author formats defensively
                              if (typeof a === 'string') {
                                // Skip [object Object] strings
                                return a === '[object Object]' ? '' : a;
                              }
                              if (typeof a === 'object' && a !== null) {
                                // Extract name from object format
                                return (a as any).fullName ||
                                  [(a as any).firstName, (a as any).lastName].filter(Boolean).join(' ') ||
                                  '';
                              }
                              return '';
                            })
                            .filter(Boolean)
                            .join(', ')
                          }
                        </div>
                      ) : null}
                      {item.abstract ? (
                        <div className="space-y-1">
                          <div
                            className={cn(
                              "text-muted-foreground text-[11px] leading-snug",
                              !expandedAbstracts[item.id] && "line-clamp-3"
                            )}
                          >
                            {item.abstract}
                          </div>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto px-0 text-[11px]"
                            onClick={() =>
                              setExpandedAbstracts((prev) => ({
                                ...prev,
                                [item.id]: !prev[item.id],
                              }))
                            }
                          >
                            {expandedAbstracts[item.id] ? translations.showLess : translations.showMore}
                          </Button>
                        </div>
                      ) : null}
                      {item.doi ? (
                        <div className="text-muted-foreground text-[11px] leading-snug line-clamp-1">
                          DOI: {item.doi}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-0">
                    <div className="flex items-center gap-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 cursor-pointer"
                            onClick={() => setPendingCitation(item)}
                            aria-label={translations.citeInText}
                          >
                            <Quote className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{translations.citeInText}</TooltipContent>
                      </Tooltip>
                      {url && (url.startsWith('http://') || url.startsWith('https://')) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 cursor-pointer"
                              aria-label={translations.openSource}
                              asChild
                            >
                              <a href={url} target="_blank" rel="noreferrer">
                                <ExternalLink className="size-3" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{translations.openSource}</TooltipContent>
                        </Tooltip>
                      )}
                      {!isViewOnly && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                              aria-label={translations.deleteSource}
                              onClick={() => setConfirmDeleteId(item.id)}
                            >
                              <Trash2 className="size-3 text-destructive hover:text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{translations.deleteSource}</TooltipContent>
                        </Tooltip>
                      )}

                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {item.lastEdited}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <AlertDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteSourceTitle}</AlertDialogTitle>

            {confirmCitation && (
              <div className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground">{confirmCitation.title}</div>
                <div className="flex flex-col gap-0.5">
                  <span>
                    {confirmCitation.source}
                    {confirmCitation.year ? ` • ${confirmCitation.year}` : ""}
                  </span>
                  {confirmCitation.authors?.length ? (
                    <span className="line-clamp-2">
                      {confirmCitation.authors
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
                    </span>
                  ) : null}
                  {confirmCitation.doi ? <span>DOI: {confirmCitation.doi}</span> : null}
                  {confirmCitation.lastEdited ? <span>{confirmCitation.lastEdited}</span> : null}
                </div>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteId(null)}>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDeleteId) removeCitation(confirmDeleteId)
                setConfirmDeleteId(null)
              }}
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!libraryToDelete}
        onOpenChange={(open) => {
          if (!open) setLibraryToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{translations.deleteLibraryTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${libraryToDelete?.name ?? translations.title}"`} {translations.deleteLibraryDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setLibraryToDelete(null)}>{translations.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteLibrary}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {translations.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportCitationsDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
      />
    </div >
  )
}

