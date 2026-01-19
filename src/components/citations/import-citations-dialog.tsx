"use client"

import * as React from "react"
import { Check, Library, Search, FileDown, Upload, FileCode } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  useCitationStore,
  type CitationLibrary,
  type SavedCitation,
} from "@/lib/stores/citation-store"
import { useLanguage } from "@/lib/i18n/use-language"

interface ImportCitationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportCitationsDialog({
  open,
  onOpenChange,
}: ImportCitationsDialogProps) {
  const { t, language } = useLanguage()
  const activeLibraryId = useCitationStore((state) => state.activeLibraryId)
  const importCitationsFromLibrary = useCitationStore(
    (state) => state.importCitationsFromLibrary
  )
  const importBulkCitations = useCitationStore(
    (state) => state.importBulkCitations
  )
  const getAllLibrariesWithCitations = useCitationStore(
    (state) => state.getAllLibrariesWithCitations
  )

  const [allLibraries, setAllLibraries] = React.useState<CitationLibrary[]>([])
  const [selectedLibraryId, setSelectedLibraryId] = React.useState<string>("")
  const [selectedCitationIds, setSelectedCitationIds] = React.useState<
    Set<string>
  >(new Set())
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isImporting, setIsImporting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("library")
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  // Translations
  const translations = React.useMemo(
    () => ({
      title: t("library.importFromLibrary"),
      description: t("library.importFromLibraryDescription"),
      selectSourceLibrary: t("library.selectSourceLibrary"),
      searchCitations: t("library.searchCitations"),
      selectAll: t("library.selectAll"),
      deselectAll: t("library.deselectAll"),
      noCitationsInLibrary: t("library.noCitationsInLibrary"),
      noLibrariesAvailable: t("library.noLibrariesAvailable"),
      importSelected: t("library.importSelected"),
      cancel: t("library.cancel"),
      importing: t("library.importing"),
      citationsSelected: t("library.citationsSelected"),
      loadingLibraries: t("library.loadingLibraries"),
      fromLibrary: t("library.fromLibrary") || "Aus Bibliothek",
      fromFile: t("library.fromFile") || "Aus Datei",
      uploadBibFile: t("library.uploadBibFile") || "BibTeX-Datei hochladen",
      dropFileHere: t("library.dropFileHere") || "Datei auswählen oder hierher ziehen",
      supportsBib: t("library.supportsBib") || "Unterstützt .bib Dateien",
      importFile: t("library.importFile") || "Datei importieren",
    }),
    [t, language]
  )

  // Lade alle Bibliotheken beim Öffnen
  React.useEffect(() => {
    if (open) {
      setIsLoading(true)
      getAllLibrariesWithCitations()
        .then((libs) => {
          // Filtere die aktive Bibliothek heraus
          const filtered = libs.filter((lib) => lib.id !== activeLibraryId)
          setAllLibraries(filtered)
          if (filtered.length > 0 && !selectedLibraryId) {
            setSelectedLibraryId(filtered[0].id)
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [open, getAllLibrariesWithCitations, activeLibraryId])

  // Reset selection when library changes
  React.useEffect(() => {
    setSelectedCitationIds(new Set())
    setSearchQuery("")
  }, [selectedLibraryId])

  const selectedLibrary = React.useMemo(
    () => allLibraries.find((lib) => lib.id === selectedLibraryId),
    [allLibraries, selectedLibraryId]
  )

  const filteredCitations = React.useMemo(() => {
    if (!selectedLibrary) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return selectedLibrary.citations

    return selectedLibrary.citations.filter((c) => {
      const haystack = [
        c.title,
        c.source,
        c.doi,
        c.year ? String(c.year) : "",
        ...(c.authors || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [selectedLibrary, searchQuery])

  const handleToggleCitation = (citationId: string) => {
    setSelectedCitationIds((prev) => {
      const next = new Set(prev)
      if (next.has(citationId)) {
        next.delete(citationId)
      } else {
        next.add(citationId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const allIds = filteredCitations.map((c) => c.id)
    setSelectedCitationIds(new Set(allIds))
  }

  const handleDeselectAll = () => {
    setSelectedCitationIds(new Set())
  }



  const handleImport = async () => {
    if (selectedCitationIds.size === 0 || !selectedLibraryId) return

    setIsImporting(true)
    try {
      await importCitationsFromLibrary(
        selectedLibraryId,
        Array.from(selectedCitationIds)
      )
      onOpenChange(false)
      setSelectedCitationIds(new Set())
      setSelectedLibraryId("")
    } finally {
      setIsImporting(false)
    }
  }

  const parseBib = (text: string): SavedCitation[] => {
    const rawEntries = text.split("@").filter((e) => e.trim())
    const parsed: SavedCitation[] = []
    for (const entry of rawEntries) {
      const matchKey = entry.match(/^(\w+)\s*{\s*([^,]+),/)
      const typeStr = matchKey?.[1]?.toLowerCase() || 'other'
      let type = 'other'
      if (typeStr.includes('book')) type = 'book'
      else if (typeStr.includes('article') || typeStr.includes('journal')) type = 'journal'
      else if (typeStr.includes('web')) type = 'website'
      else if (typeStr.includes('proc') || typeStr.includes('inproceedings')) type = 'conference'
      else if (typeStr.includes('thesis')) type = 'thesis'

      const id = matchKey?.[2]?.trim() || `cite_${Math.random().toString(16).slice(2)}`
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

      // Extended Metadata
      const abstract = getField("abstract")
      const imageUrl = getField("image")
      const isbn = getField("isbn")
      const edition = getField("edition")
      const publisher = getField("publisher")
      const publisherPlace = getField("address")

      const nowText = `Importier am ${new Date().toLocaleDateString(language, { dateStyle: "short" })}`
      parsed.push({
        id,
        title,
        source: journal,
        year,
        lastEdited: nowText,
        href: undefined,
        externalUrl: url,
        doi: doi || undefined,
        authors,
        type,
        abstract,
        imageUrl,
        isbn,
        edition,
        publisher,
        publisherPlace,
      })
    }
    return parsed
  }

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const entries = parseBib(text)
      await importBulkCitations(entries)
      onOpenChange(false)
    } catch (error) {
      console.error("Fehler beim Datei-Import:", error)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] flex flex-col max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-4 w-4 text-muted-foreground shrink-0" />
            {translations.title}
          </DialogTitle>
          <DialogDescription>{translations.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-6 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 mb-4 shrink-0">
              <TabsTrigger value="library">{translations.fromLibrary}</TabsTrigger>
              <TabsTrigger value="file">{translations.fromFile}</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="flex-1 flex flex-col min-h-0 gap-4 data-[state=inactive]:hidden mt-0">
              {/* Library Selection & Search */}
              <div className="flex flex-col gap-3 shrink-0">
                <div className="flex gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Select
                      value={selectedLibraryId}
                      onValueChange={setSelectedLibraryId}
                      disabled={isLoading || allLibraries.length === 0}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue
                          placeholder={
                            isLoading
                              ? translations.loadingLibraries
                              : translations.selectSourceLibrary
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {allLibraries.map((lib) => (
                          <SelectItem key={lib.id} value={lib.id}>
                            {lib.name} ({lib.citations.length})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedLibrary && selectedLibrary.citations.length > 0 && (
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={translations.searchCitations}
                        className="pl-8"
                      />
                    </div>
                  )}
                </div>

                {filteredCitations.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selectedCitationIds.size} {translations.citationsSelected}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="h-7 text-xs"
                      >
                        {translations.selectAll}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAll}
                        className="h-7 text-xs"
                      >
                        {translations.deselectAll}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Citations List */}
              <div className="flex-1 border rounded-md min-h-[200px] overflow-y-auto">
                <div className="p-2 space-y-1">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                      {translations.loadingLibraries}
                    </div>
                  ) : allLibraries.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                      {translations.noLibrariesAvailable}
                    </div>
                  ) : !selectedLibrary || selectedLibrary.citations.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                      {translations.noCitationsInLibrary}
                    </div>
                  ) : filteredCitations.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                      {translations.noCitationsInLibrary}
                    </div>
                  ) : (
                    filteredCitations.map((citation) => (
                      <CitationItem
                        key={citation.id}
                        citation={citation}
                        isSelected={selectedCitationIds.has(citation.id)}
                        onToggle={() => handleToggleCitation(citation.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="file" className="flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden mt-0">
              <div
                className="flex-1 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer min-h-[300px]"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".bib,text/plain"
                  className="hidden"
                  onChange={handleFileImport}
                />
                <div className="bg-muted p-4 rounded-full mb-4">
                  <FileCode className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg mb-1">
                  {translations.uploadBibFile}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                  {translations.dropFileHere}
                </p>
                <p className="text-xs text-muted-foreground">
                  {translations.supportsBib}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  disabled={isImporting}
                >
                  {isImporting ? translations.importing : translations.uploadBibFile}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {translations.cancel}
          </Button>
          {activeTab === "library" && (
            <Button
              onClick={handleImport}
              disabled={selectedCitationIds.size === 0 || isImporting}
            >
              {isImporting
                ? translations.importing
                : `${translations.importSelected}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CitationItem({
  citation,
  isSelected,
  onToggle,
}: {
  citation: SavedCitation
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
        isSelected && "bg-muted"
      )}
      onClick={onToggle}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {citation.title}
        </p>
        <div className="text-xs text-muted-foreground mt-0.5">
          {citation.source}
          {citation.year ? ` • ${citation.year}` : ""}
        </div>
        {citation.authors?.length ? (
          <div className="text-xs text-muted-foreground line-clamp-1">
            {citation.authors
              .map((a) => {
                if (typeof a === "string")
                  return a === "[object Object]" ? "" : a
                if (typeof a === "object" && a !== null) {
                  return (
                    (a as any).fullName ||
                    [(a as any).firstName, (a as any).lastName]
                      .filter(Boolean)
                      .join(" ") ||
                    ""
                  )
                }
                return ""
              })
              .filter(Boolean)
              .join(", ")}
          </div>
        ) : null}
        {citation.doi && (
          <div className="text-xs text-muted-foreground line-clamp-1">
            DOI: {citation.doi}
          </div>
        )}
      </div>

    </div>
  )
}
