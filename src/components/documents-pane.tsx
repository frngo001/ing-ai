"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FilePenLine, PanelLeftClose, Plus, Search, Trash, Trash2 } from "lucide-react"

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
import { devError, devWarn } from "@/lib/utils/logger"
import { useLanguage } from "@/lib/i18n/use-language"
import { getCurrentUserId } from "@/lib/supabase/utils/auth"
import * as documentsUtils from "@/lib/supabase/utils/documents"
import { extractTextFromNode, extractTitleFromContent } from "@/lib/supabase/utils/document-title"
import { useProjectStore } from "@/lib/stores/project-store"
import * as documentCountCache from "@/lib/supabase/utils/document-count-cache"

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

/**
 * Prüft ob ein Dokument-Status tatsächlichen Textinhalt enthält
 */
const hasContentText = (state: any): boolean => {
  const content = Array.isArray(state?.content) ? state.content : null
  if (!content) return false
  return extractTextFromNode(content).trim().length > 0
}

/**
 * Formatiert ein Datum als relative Zeitangabe (z.B. "vor 2 Stunden")
 */
const formatRelativeTime = (date: Date, locale: string = "de") => {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const minutes = Math.round(diffMs / 60000)
  const absMinutes = Math.abs(minutes)

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })

  if (absMinutes < 60) return rtf.format(minutes, "minute")

  const hours = Math.round(diffMs / 3600000)
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour")

  const days = Math.round(diffMs / 86400000)
  return rtf.format(days, "day")
}

/**
 * Sidebar-Komponente zur Anzeige und Verwaltung von Dokumenten
 * Lädt Dokumente aus Supabase und localStorage, unterstützt Suche, Erstellung und Löschung
 */
export function DocumentsPane({
  className,
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const currentProjectId = useProjectStore((state) => state.currentProjectId)
  const [documents, setDocuments] = React.useState<DocumentItem[]>([])
  const [searchQuery, setSearchQuery] = React.useState("")
  const [docToDelete, setDocToDelete] = React.useState<DocumentItem | null>(null)
  const [showDeleteAllDialog, setShowDeleteAllDialog] = React.useState(false)

  const untitledDocText = React.useMemo(() => t('documents.untitledDocument'), [t, language])
  const savedText = React.useMemo(() => t('documents.saved'), [t, language])
  const locallySavedText = React.useMemo(() => t('documents.locallySaved'), [t, language])
  const meText = React.useMemo(() => t('documents.me'), [t, language])
  const localText = React.useMemo(() => t('documents.local'), [t, language])

  const isLoadingRef = React.useRef(false)
  const reloadDebounceTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasInitialLoadRef = React.useRef(false)

  /**
   * Lädt lokal gespeicherte Dokumente aus localStorage
   */
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

        const title = extractTitleFromContent(hydrated?.content)
        const updatedAt = hydrated?.updatedAt ? new Date(hydrated.updatedAt) : undefined

        nextDocs.push({
          id,
          title,
          lastEdited: updatedAt ? formatRelativeTime(updatedAt, language) : locallySavedText,
          author: localText,
          href: `/editor?doc=${encodeURIComponent(id)}`,
        })
        seen.add(id)
      } catch {
        // Fehlerhafte Einträge werden ignoriert
      }
    }

    nextDocs.sort((a, b) => a.title.localeCompare(b.title, language))
    setDocuments(nextDocs)
  }, [language, locallySavedText, localText])

  /**
   * Lädt Dokumente aus Supabase für das aktuelle Projekt
   * Synchronisiert automatisch Dokumenttitel mit dem Content
   */
  const loadFromSupabase = React.useCallback(async (invalidateCache = false) => {
    if (isLoadingRef.current) {
      return
    }

    const userId = await getCurrentUserId()

    if (!userId) {
      setDocuments([])
      hasInitialLoadRef.current = true
      return
    }

    if (invalidateCache) {
      documentsUtils.invalidateDocumentsCache(userId)
    }

    isLoadingRef.current = true
    try {
      const docs = await documentsUtils.getDocuments(userId, currentProjectId ?? undefined)

      const nextDocs: DocumentItem[] = await Promise.all(
        docs.map(async (doc) => {
          const content = doc.content as any
          const extractedTitle = extractTitleFromContent(content)
          const updatedAt = doc.updated_at ? new Date(doc.updated_at) : undefined

          const currentTitle = doc.title || extractedTitle
          if (extractedTitle !== untitledDocText && currentTitle !== extractedTitle) {
            try {
              await documentsUtils.updateDocument(
                doc.id,
                { title: extractedTitle },
                doc.user_id
              )
            } catch (error) {
              devError(`Fehler beim Aktualisieren des Titels für Dokument ${doc.id}:`, error)
            }
          }

          return {
            id: doc.id,
            title: extractedTitle !== untitledDocText ? extractedTitle : currentTitle,
            lastEdited: updatedAt ? formatRelativeTime(updatedAt, language) : savedText,
            author: meText,
            href: `/editor?doc=${encodeURIComponent(doc.id)}`,
          }
        })
      )

      nextDocs.sort((a, b) => a.title.localeCompare(b.title, language))
      setDocuments(nextDocs)
      hasInitialLoadRef.current = true
      
      documentCountCache.setDocumentCount(userId, nextDocs.length, currentProjectId ?? undefined)
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("documents:loaded", { 
          detail: { count: nextDocs.length } 
        }))
      }
    } catch (error) {
      devError("Fehler beim Laden der Dokumente:", error)
      setDocuments([])
      hasInitialLoadRef.current = true
      
      if (userId) {
        documentCountCache.setDocumentCount(userId, 0, currentProjectId ?? undefined)
      }
      
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("documents:loaded", { 
          detail: { count: 0 } 
        }))
      }
    } finally {
      isLoadingRef.current = false
    }
  }, [untitledDocText, savedText, meText, language, currentProjectId])

  /**
   * Erstellt ein neues Dokument im aktuellen Projekt und navigiert zum Editor
   */
  const createNewDocument = React.useCallback(async () => {
    const userId = await getCurrentUserId()

    if (!userId) {
      devWarn("Kein User eingeloggt - Dokument kann nicht erstellt werden")
      return
    }

    try {
      const newDoc = await documentsUtils.createDocument({
        user_id: userId,
        title: untitledDocText,
        content: [{ type: "p", children: [{ text: "" }] }],
        document_type: "essay",
        word_count: 0,
        project_id: currentProjectId ?? undefined,
      })

      documentCountCache.incrementDocumentCount(userId, currentProjectId ?? undefined)

      router.push(`/editor?doc=${encodeURIComponent(newDoc.id)}`)
      loadFromSupabase()
      // Focus the editor on the first block after creating a new document
      window.dispatchEvent(new Event("editor:focus-start"))
    } catch (error) {
      devError("Fehler beim Erstellen des Dokuments:", error)
    }
  }, [router, untitledDocText, loadFromSupabase, currentProjectId])

  /**
   * Löscht ein Dokument aus localStorage und Supabase
   * Navigiert automatisch zum nächsten Dokument falls das aktuelle gelöscht wurde
   */
  const handleConfirmDelete = React.useCallback(async () => {
    if (!docToDelete) return

    const userId = await getCurrentUserId()
    const id = docToDelete.id
    const currentDocId = searchParams.get("doc")
    const isCurrentDocument = currentDocId === id

    const remainingDocs = documents.filter(doc => doc.id !== id)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(`${LOCAL_STATE_PREFIX}${id}`)
        window.localStorage.removeItem(`${LOCAL_CONTENT_PREFIX}${id}`)
        window.localStorage.removeItem(`${LOCAL_DISCUSS_PREFIX}${id}`)
      } catch {
        // Fehler beim Entfernen werden ignoriert
      }
    }

    if (isUUID && userId) {
      try {
        await documentsUtils.deleteDocument(id, userId)
        documentCountCache.decrementDocumentCount(userId, currentProjectId ?? undefined)
      } catch (error) {
        devError("Fehler beim Löschen des Dokuments aus Supabase:", error)
      }
    } else if (userId) {
      documentCountCache.decrementDocumentCount(userId, currentProjectId ?? undefined)
    }

    if (isCurrentDocument) {
      if (remainingDocs.length > 0) {
        router.push(`/editor?doc=${encodeURIComponent(remainingDocs[0].id)}`)
      } else {
        router.push("/editor")
      }
    }

    loadFromSupabase()
    setDocToDelete(null)
  }, [docToDelete, loadFromSupabase, searchParams, router, documents, currentProjectId])

  /**
   * Löscht alle Dokumente des aktuellen Projekts aus localStorage und Supabase
   */
  const handleDeleteAllDocuments = React.useCallback(async () => {
    if (!currentProjectId) return

    const userId = await getCurrentUserId()
    if (!userId) return

    const currentDocId = searchParams.get("doc")
    const isCurrentDocumentInList = documents.some(doc => doc.id === currentDocId)

    try {
      if (typeof window !== "undefined") {
        documents.forEach((doc) => {
          try {
            window.localStorage.removeItem(`${LOCAL_STATE_PREFIX}${doc.id}`)
            window.localStorage.removeItem(`${LOCAL_CONTENT_PREFIX}${doc.id}`)
            window.localStorage.removeItem(`${LOCAL_DISCUSS_PREFIX}${doc.id}`)
          } catch {
            // Fehler beim Entfernen werden ignoriert
          }
        })
      }

      await documentsUtils.deleteAllDocumentsByProject(currentProjectId, userId)

      documentCountCache.resetDocumentCount(userId, currentProjectId)

      await loadFromSupabase()
      setShowDeleteAllDialog(false)

      if (isCurrentDocumentInList) {
        router.push("/editor")
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("documents:reload"))
      }
    } catch (error) {
      devError("Fehler beim Löschen aller Dokumente:", error)
    }
  }, [currentProjectId, documents, loadFromSupabase, searchParams, router])

  React.useEffect(() => {
    loadFromSupabase()

    const handleReloadEvent = () => {
      if (!hasInitialLoadRef.current) {
        return
      }

      if (reloadDebounceTimeoutRef.current) {
        clearTimeout(reloadDebounceTimeoutRef.current)
      }

      reloadDebounceTimeoutRef.current = setTimeout(() => {
        if (!isLoadingRef.current) {
          loadFromSupabase(false)
        }
        reloadDebounceTimeoutRef.current = null
      }, 300)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("documents:reload", handleReloadEvent)
      return () => {
        window.removeEventListener("documents:reload", handleReloadEvent)
        if (reloadDebounceTimeoutRef.current) {
          clearTimeout(reloadDebounceTimeoutRef.current)
        }
      }
    }
  }, [loadFromSupabase, currentProjectId])

  
  /**
   * Filtert Dokumente basierend auf der Suchanfrage
   * Durchsucht Titel, Bearbeitungszeit, Autor und href
   */
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
      data-onboarding="documents-pane"
      className={cn(
        "bg-background text-foreground flex h-full min-w-[260px] max-w-[320px] flex-col px-3 pb-3 pt-0 border-r border-border/70",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 pb-3 mt-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-semibold">{t('documents.title')}</h2>
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
                aria-label={t('documents.newDocument')}
                onClick={createNewDocument}
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('documents.newDocument')}</TooltipContent>
          </Tooltip>
          {currentProjectId && documents.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 bg-transparent hover:text-destructive"
                  aria-label={t('documents.deleteAllDocuments')}
                  onClick={() => setShowDeleteAllDialog(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('documents.deleteAllDocuments')}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 bg-transparent"
                onClick={onClose}
                aria-label={t('documents.closePanel')}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('documents.closePanel')}</TooltipContent>
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
            placeholder={t('documents.searchDocuments')}
            className="h-9 pl-8 text-sm"
            aria-label={t('documents.searchDocuments')}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {documents.length === 0 || filteredDocs.length === 0 ? (
            <div className="px-3 py-6">
              <div className="rounded-md border border-dashed border-border/70 bg-muted/30 px-4 py-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {searchQuery.trim()
                    ? `${t('documents.noResults')} „${searchQuery.trim()}"`
                    : t('documents.noDocumentsYet')}
                </div>
                <p className="text-muted-foreground text-xs">
                  {searchQuery.trim()
                    ? t('documents.adjustSearch')
                    : t('documents.createOrImport')}
                </p>
                {searchQuery.trim() && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 px-3 text-xs"
                    onClick={() => setSearchQuery("")}
                  >
                    {t('documents.resetSearch')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            filteredDocs.map((doc, index) => (
              <div
                key={doc.id}
                className={cn(
                  "group flex items-start gap-2 rounded-md border border-border/50 px-2 py-2 transition hover:bg-muted/70 focus-within:outline-none",
                  index !== filteredDocs.length - 1 && "mb-2"
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
                      aria-label={`${t('documents.deleteDocument')} ${doc.title}`}
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        setDocToDelete(doc)
                      }}
                    >
                      <Trash className="size-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{t('documents.delete')}</TooltipContent>
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
            <AlertDialogTitle>{t('documents.deleteDocumentTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${docToDelete?.title ?? untitledDocText}"`}{" "}
              {t('documents.deleteDocumentDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocToDelete(null)}>
              {t('documents.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('documents.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.deleteAllDocumentsTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.deleteAllDocumentsDescription').replace(
                '{count}',
                String(documents.length)
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAllDialog(false)}>
              {t('documents.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllDocuments}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('documents.deleteAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      </div>
  )
}

