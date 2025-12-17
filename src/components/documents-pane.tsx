"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FilePenLine, PanelLeftClose, Plus, Search, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type DocumentItem = {
  id: string
  title: string
  lastEdited: string
  author: string
  href: string
}

const LOCAL_STATE_PREFIX = "plate-editor-state-"
const LOCAL_CONTENT_PREFIX = "plate-editor-content-"
const LOCAL_DISCUSS_PREFIX = "plate-editor-discussions-"

const extractText = (node: any): string => {
  if (!node) return ""
  if (Array.isArray(node)) {
    return node.map((child: any) => extractText(child)).join(" ")
  }
  if (typeof node.text === "string") {
    return node.text
  }
  if (Array.isArray(node.children)) {
    return node.children.map((child: any) => extractText(child)).join(" ")
  }
  return ""
}

const extractTitle = (state: any): string => {
  const content = Array.isArray(state?.content) ? state.content : null
  if (!content) return "Unbenanntes Dokument"

  for (const block of content) {
    const text = extractText(block).trim()
    if (text) return text.slice(0, 120)
  }

  return "Unbenanntes Dokument"
}

const hasContentText = (state: any): boolean => {
  const content = Array.isArray(state?.content) ? state.content : null
  if (!content) return false
  return extractText(content).trim().length > 0
}

const formatRelativeTime = (date: Date) => {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const minutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(minutes)

  const rtf = new Intl.RelativeTimeFormat("de", { numeric: "auto" })

  if (absMinutes < 60) return rtf.format(minutes, "minute")

  const hours = Math.round(diffMs / 3600000)
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour")

  const days = Math.round(diffMs / 86400000)
  return rtf.format(days, "day")
}

export function DocumentsPane({
  className,
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const router = useRouter()
  const [documents, setDocuments] = React.useState<DocumentItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [docToDelete, setDocToDelete] = React.useState<DocumentItem | null>(null)
  const createNewDocument = React.useCallback(() => {
    if (typeof window === "undefined") return

    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `doc-${Date.now()}`

    const payload = {
      content: [{ type: "p", children: [{ text: "" }] }],
      discussions: [],
      updatedAt: new Date().toISOString(),
    }

    try {
      window.localStorage.setItem(`${LOCAL_STATE_PREFIX}${newId}`, JSON.stringify(payload))
      window.dispatchEvent(new Event("documents:reload"))
    } catch {
      // ignore
    }

    router.push(`/editor?doc=${encodeURIComponent(newId)}`)
  }, [router])

  const loadFromLocalStorage = React.useCallback(() => {
    if (typeof window === "undefined") return

    const nextDocs: DocumentItem[] = []
    const seen = new Set<string>()

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (!key) continue

      const isState = key.startsWith(LOCAL_STATE_PREFIX)
      const isContent = key.startsWith(LOCAL_CONTENT_PREFIX)
      if (!isState && !isContent) continue

      const id = isState ? key.replace(LOCAL_STATE_PREFIX, "") : key.replace(LOCAL_CONTENT_PREFIX, "")
      if (seen.has(id)) continue

      const rawState = window.localStorage.getItem(`${LOCAL_STATE_PREFIX}${id}`)
      const rawContent = window.localStorage.getItem(`${LOCAL_CONTENT_PREFIX}${id}`)

      try {
        const parsedState = rawState ? JSON.parse(rawState) : null
        const parsedContent = rawContent ? JSON.parse(rawContent) : null
        const hydrated = parsedState ?? (parsedContent ? { content: parsedContent } : null)
        if (!hydrated) continue
        if (!hasContentText(hydrated)) continue

        const title = extractTitle(hydrated)
        const updatedAt = hydrated?.updatedAt ? new Date(hydrated.updatedAt) : undefined

        nextDocs.push({
          id,
          title,
          lastEdited: updatedAt ? formatRelativeTime(updatedAt) : "Lokal gespeichert",
          author: "Lokal",
          href: `/editor?doc=${encodeURIComponent(id)}`,
        })
        seen.add(id)
      } catch {
        // ignore malformed entries
      }
    }

    nextDocs.sort((a, b) => a.title.localeCompare(b.title, "de"))
    setDocuments(nextDocs)
  }, [])

  const handleConfirmDelete = React.useCallback(() => {
    if (!docToDelete || typeof window === "undefined") return

    const id = docToDelete.id
    try {
      window.localStorage.removeItem(`${LOCAL_STATE_PREFIX}${id}`)
      window.localStorage.removeItem(`${LOCAL_CONTENT_PREFIX}${id}`)
      window.localStorage.removeItem(`${LOCAL_DISCUSS_PREFIX}${id}`)
      window.dispatchEvent(new Event("documents:reload"))
    } catch {
      // ignore removal failures
    }

    setDocToDelete(null)
    loadFromLocalStorage()
  }, [docToDelete, loadFromLocalStorage])

  React.useEffect(() => {
    loadFromLocalStorage()

    const handleStorage = () => loadFromLocalStorage()
    const handleReloadEvent = () => loadFromLocalStorage()
    window.addEventListener("storage", handleStorage)
    window.addEventListener("focus", handleStorage)
    window.addEventListener("documents:reload", handleReloadEvent)
    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener("focus", handleStorage)
      window.removeEventListener("documents:reload", handleReloadEvent)
    }
  }, [loadFromLocalStorage])

  const filteredDocs = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return documents
    return documents.filter((doc) => {
      const haystack = [doc.title, doc.lastEdited, doc.author, doc.href].join(" ").toLowerCase()
      return haystack.includes(q)
    })
  }, [documents, searchQuery])

  return (
    <div
      className={cn(
        "bg-background text-foreground flex h-full min-w-[260px] max-w-[320px] flex-col px-3 pb-3 pt-0 border-r border-border/70",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-3 mt-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-semibold">Dokumente</h2>
            <FilePenLine className="size-4" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-transparent"
                aria-label="Neues Dokument"
                onClick={createNewDocument}
              >
            <Plus className="size-4" />
          </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Neues Dokument</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 bg-transparent"
            onClick={onClose}
            aria-label="Panel schließen"
          >
          <PanelLeftClose className="size-4" />
          </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Panel schließen</TooltipContent>
          </Tooltip>
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
          placeholder="Dokumente durchsuchen"
            className="h-9 pl-8 text-sm"
          aria-label="Dokumente durchsuchen"
        />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredDocs.length === 0 ? (
            <div className="px-3 py-6">
              <div className="rounded-md border border-dashed border-border/70 bg-muted/30 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {searchQuery.trim()
                    ? `Keine Treffer für „${searchQuery.trim()}“`
                    : "Noch keine Dokumente gespeichert"}
                </div>
                <p className="text-muted-foreground text-xs">
                  {searchQuery.trim()
                    ? "Passe deine Suche an oder setze sie zurück."
                    : "Lege ein neues Dokument an oder importiere Dateien."}
                </p>
                {searchQuery.trim() && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                      onClick={() => setSearchQuery("")}
                    >
                      Suche zurücksetzen
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="size-8 p-0"
                          onClick={createNewDocument}
                          aria-label="Neues Dokument"
                        >
                          <Plus className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Neues Dokument</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          ) : (
            filteredDocs.map((doc, index) => (
              <div
                key={doc.id}
                className={cn(
                  "group flex items-start gap-2 rounded-md px-2 py-2 transition hover:bg-muted/70 focus-within:outline-none border border-border/60 hover:border-border/80 focus-within:border-border/80",
                  index !== filteredDocs.length - 1 && "border-b border-border/50"
                )}
              >
                <Link
                  href={doc.href}
                  className="flex-1 focus-visible:outline-none"
                >
                  <p className="text-xs font-medium leading-tight line-clamp-2">{doc.title}</p>
                  <div className="text-muted-foreground text-xs">{doc.lastEdited}</div>
                </Link>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="size-4 p-0 opacity-70 hover:opacity-100 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      aria-label={`Dokument ${doc.title} löschen`}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setDocToDelete(doc)
                      }}
                    >
                      <Trash className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Löschen</TooltipContent>
                </Tooltip>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <AlertDialog
        open={!!docToDelete}
        onOpenChange={(open) => {
          if (!open) setDocToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokument löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${docToDelete?.title ?? "Dieses Dokument"}"`} wird dauerhaft aus dem lokalen Speicher entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocToDelete(null)}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

