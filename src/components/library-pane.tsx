"use client"

import Link from "next/link"
import {
  Library,
  CirclePlus,
  Download,
  ExternalLink,
  PanelLeftClose,
  Plus,
  Quote,
  Trash2,
  Upload,
  Search,
  RefreshCw,
  Trash,
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
import * as React from "react"
import { useLanguage } from "@/lib/i18n/use-language"

const fallbackCitations: SavedCitation[] = []

export function LibraryPane({
  className,
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const { t, language } = useLanguage()
  const openSearch = useCitationStore((state) => state.openSearch)
  const setPendingCitation = useCitationStore((state) => state.setPendingCitation)
  const addCitation = useCitationStore((state) => state.addCitation)
  const removeCitation = useCitationStore((state) => state.removeCitation)
  const citations = useCitationStore((state) => state.savedCitations)
  const libraries = useCitationStore((state) => state.libraries)
  const activeLibraryId = useCitationStore((state) => state.activeLibraryId)
  const setActiveLibrary = useCitationStore((state) => state.setActiveLibrary)
  const addLibrary = useCitationStore((state) => state.addLibrary)
  const deleteLibrary = useCitationStore((state) => state.deleteLibrary)
  const syncLibrariesFromBackend = useCitationStore((state) => state.syncLibrariesFromBackend)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isCreateLibraryOpen, setIsCreateLibraryOpen] = React.useState(false)
  const [newLibraryName, setNewLibraryName] = React.useState("")
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [libraryToDelete, setLibraryToDelete] = React.useState<{ id: string; name: string } | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [expandedAbstracts, setExpandedAbstracts] = React.useState<Record<string, boolean>>({})
  const [isSyncing, setIsSyncing] = React.useState(false)

  // Memoized translations that update on language change
  const translations = React.useMemo(() => ({
    title: t('library.title'),
    refreshLibraries: t('library.refreshLibraries'),
    importBib: t('library.importBib'),
    exportBib: t('library.exportBib'),
    addCitations: t('library.addCitations'),
    closePanel: t('library.closePanel'),
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

  // Synchronisiere Bibliotheken vom Backend beim Mount
  React.useEffect(() => {
    syncLibrariesFromBackend()
  }, [syncLibrariesFromBackend])
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
        return `@article{${c.id || `cite_${Math.random().toString(16).slice(2)}`},
  title={${c.title}},
  author={${authors}},
  year={${c.year ?? ""}},
  journal={${c.source}},
  doi={${c.doi ?? ""}},
  url={${c.externalUrl || c.href}}
}`
      })
      .join("\n\n")
    const blob = new Blob([entries], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "library.bib"
    a.click()
    URL.revokeObjectURL(url)
  }

  const parseBib = (text: string): SavedCitation[] => {
    const rawEntries = text.split("@").filter((e) => e.trim())
    const parsed: SavedCitation[] = []
    for (const entry of rawEntries) {
      const matchKey = entry.match(/^\w+\s*{\s*([^,]+),/)
      const id = matchKey?.[1]?.trim() || `cite_${Math.random().toString(16).slice(2)}`
      const getField = (name: string) => {
        const regex = new RegExp(`${name}\\s*=\\s*[{\"]([^}"]+)[}\"]`, "i")
        return entry.match(regex)?.[1]?.trim()
      }
      const title = getField("title") || "Untitled"
      const authorsRaw = getField("author") || ""
      const year = getField("year")
      const doi = getField("doi")
      const url = getField("url")
      const journal = getField("journal") || getField("booktitle") || "Quelle"
      const authors = authorsRaw
        ? authorsRaw.split(/\s+and\s+/i).map((a) => a.trim()).filter(Boolean)
        : []
      const nowText = `${translations.addedOn} ${new Date().toLocaleDateString(language, { dateStyle: "short" })}`
      parsed.push({
        id,
        title,
        source: journal,
        year,
        lastEdited: nowText,
        href: "/editor",
        externalUrl: url,
        doi: doi || undefined,
        authors,
      })
    }
    return parsed
  }

  const importBib = async (file?: File | null) => {
    if (!file) return
    const text = await file.text()
    const entries = parseBib(text)
    entries.forEach((c) => addCitation(c))
  }

  const handleImportClick = () => fileInputRef.current?.click()

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
          <input
            ref={fileInputRef}
            type="file"
            accept=".bib,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              importBib(file)
              if (fileInputRef.current) {
                fileInputRef.current.value = ""
              }
            }}
          />
          <Tooltip>
            <TooltipContent>{translations.refreshLibraries}</TooltipContent>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-transparent"
                onClick={async () => {
                  setIsSyncing(true)
                  try {
                    await syncLibrariesFromBackend()
                  } finally {
                    // Kurze Verzögerung für bessere UX
                    setTimeout(() => setIsSyncing(false), 500)
                  }
                }}
                disabled={isSyncing}
              >
                <RefreshCw
                  className={`size-4 transition-transform duration-500 ${
                    isSyncing ? 'animate-spin' : ''
                  }`}
                />
              </Button>
            </TooltipTrigger>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 bg-transparent"
            onClick={handleImportClick}
            aria-label={translations.importBib}
          >
            <Upload className="size-4" />
          </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{translations.importBib}</TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 bg-transparent"
            onClick={openSearch}
                aria-label={translations.addCitations}
          >
            <Plus className="size-4" />
          </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{translations.addCitations}</TooltipContent>
          </Tooltip>
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
          <Popover open={isCreateLibraryOpen} onOpenChange={setIsCreateLibraryOpen}>
            <Tooltip>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 whitespace-nowrap shrink-0"
                    onClick={() => setIsCreateLibraryOpen((prev) => !prev)}
                  >
                    <CirclePlus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
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
          {activeLibraryId && 
           activeLibraryId !== 'library_default' && 
           libraries.filter((lib) => lib.id !== 'library_default').length > 1 && (
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
              const url = item.externalUrl || item.href
              return (
                <div
                  key={item.id}
                  className={cn(
                    "border-border/50 hover:bg-muted/50 group rounded-md border px-2 py-2 transition focus:outline-none focus:ring-0 cursor-default",
                    index !== (citations.length ? citations : fallbackCitations).length - 1 &&
                      "mb-2"
                  )}
                  tabIndex={-1}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-semibold leading-tight line-clamp-2">
                      {item.title}
                    </p>
                    <div className="text-muted-foreground text-[11px] leading-snug line-clamp-2">
                      {item.source}
                      {item.year ? ` • ${item.year}` : ""}
                    </div>
                    {item.authors?.length ? (
                      <div className="text-muted-foreground text-[11px] leading-snug line-clamp-2">
                        {item.authors.join(", ")}
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
                    <span className="line-clamp-2">{confirmCitation.authors.join(", ")}</span>
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
    </div>
  )
}

