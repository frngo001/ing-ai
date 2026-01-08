"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { useLanguage } from "@/lib/i18n/use-language"
import { getCurrentUserId } from "@/lib/supabase/utils/auth"
import * as documentsUtils from "@/lib/supabase/utils/documents"
import { extractTextFromNode, extractTitleFromContent } from "@/lib/supabase/utils/document-title"
import { useProjectStore } from "@/lib/stores/project-store"

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

const hasContentText = (state: any): boolean => {
  const content = Array.isArray(state?.content) ? state.content : null
  if (!content) return false
  return extractTextFromNode(content).trim().length > 0
}

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

export function DocumentsPane({
  className,
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const router = useRouter()
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
        // ignore malformed entries
      }
    }

    nextDocs.sort((a, b) => a.title.localeCompare(b.title, language))
    setDocuments(nextDocs)
  }, [language, locallySavedText, localText])

  const loadFromSupabase = React.useCallback(async (invalidateCache = false) => {
    // Verhindere parallele Requests
    if (isLoadingRef.current) {
      return
    }

    const userId = await getCurrentUserId()

    if (!userId) {
      // Fallback auf localStorage wenn kein User eingeloggt
      loadFromLocalStorage()
      return
    }

    // Cache nur invalidieren wenn explizit angefordert UND Daten nicht mehr gültig sind
    if (invalidateCache) {
      documentsUtils.invalidateDocumentsCache(userId)
    }

    isLoadingRef.current = true
    try {
      // Filter documents by current project
      const docs = await documentsUtils.getDocuments(userId, currentProjectId ?? undefined)
      
      const nextDocs: DocumentItem[] = await Promise.all(
        docs.map(async (doc) => {
          const content = doc.content as any
          const extractedTitle = extractTitleFromContent(content)
          const updatedAt = doc.updated_at ? new Date(doc.updated_at) : undefined

          // Synchronisiere Titel: Wenn der gespeicherte Titel nicht mit dem aktuellen Content übereinstimmt,
          // aktualisiere den Titel in der Datenbank
          const currentTitle = doc.title || extractedTitle
          if (extractedTitle !== untitledDocText && currentTitle !== extractedTitle) {
            try {
              await documentsUtils.updateDocument(
                doc.id,
                { title: extractedTitle },
                doc.user_id
              )
              // Cache wurde bereits in updateDocument invalidiert
            } catch (error) {
              console.error(`Fehler beim Aktualisieren des Titels für Dokument ${doc.id}:`, error)
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
    } catch (error) {
      console.error("Fehler beim Laden der Dokumente:", error)
      // Fallback auf localStorage
      loadFromLocalStorage()
    } finally {
      isLoadingRef.current = false
    }
  }, [untitledDocText, savedText, meText, language, loadFromLocalStorage, currentProjectId])

  const createNewDocument = React.useCallback(async () => {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      // Fallback auf localStorage wenn kein User eingeloggt
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
      return
    }

    try {
      // Erstelle Dokument in Supabase with project association
      const newDoc = await documentsUtils.createDocument({
        user_id: userId,
        title: untitledDocText,
        content: [{ type: "p", children: [{ text: "" }] }],
        document_type: "essay",
        word_count: 0,
        project_id: currentProjectId ?? undefined,
      })

      router.push(`/editor?doc=${encodeURIComponent(newDoc.id)}`)
      // Lade Dokumente neu
      loadFromSupabase()
    } catch (error) {
      console.error("Fehler beim Erstellen des Dokuments:", error)
      // Fallback auf localStorage
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
    }
  }, [router, untitledDocText, loadFromSupabase, currentProjectId])

  const handleConfirmDelete = React.useCallback(async () => {
    if (!docToDelete) return

    const userId = await getCurrentUserId()
    const id = docToDelete.id
    
    // Prüfe ob es eine UUID ist (Supabase-Dokument)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

    // Lösche immer aus localStorage (falls vorhanden)
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(`${LOCAL_STATE_PREFIX}${id}`)
        window.localStorage.removeItem(`${LOCAL_CONTENT_PREFIX}${id}`)
        window.localStorage.removeItem(`${LOCAL_DISCUSS_PREFIX}${id}`)
      } catch {
        // ignore removal failures
      }
    }

    // Lösche aus Supabase, wenn es eine UUID ist und User eingeloggt
    if (isUUID && userId) {
      try {
        await documentsUtils.deleteDocument(id, userId)
        // Lade Dokumente neu
        loadFromSupabase()
      } catch (error) {
        console.error("Fehler beim Löschen des Dokuments aus Supabase:", error)
        // Auch wenn Supabase-Löschen fehlschlägt, localStorage wurde bereits bereinigt
        // Lade Dokumente neu (zeigt dann nur noch Supabase-Dokumente)
        loadFromSupabase()
      }
    } else {
      // Für lokale Dokumente oder wenn kein User eingeloggt
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("documents:reload"))
      }
      loadFromLocalStorage()
    }

    setDocToDelete(null)
  }, [docToDelete, loadFromSupabase, loadFromLocalStorage])

  const handleDeleteAllDocuments = React.useCallback(async () => {
    if (!currentProjectId) return

    const userId = await getCurrentUserId()
    if (!userId) return

    try {
      await documentsUtils.deleteAllDocumentsByProject(currentProjectId, userId)
      loadFromSupabase()
      setShowDeleteAllDialog(false)
    } catch (error) {
      console.error("Fehler beim Löschen aller Dokumente:", error)
    }
  }, [currentProjectId, loadFromSupabase])

  React.useEffect(() => {
    // Initialer Load beim Mount oder wenn Projekt wechselt
    loadFromSupabase()

    const handleStorage = () => loadFromLocalStorage()

    // Debounced Event-Handler für documents:reload
    // Verhindert mehrfache Requests bei schnellen Event-Auslösungen
    const handleReloadEvent = () => {
      // Ignoriere Event beim ersten Load (wird bereits durch loadFromSupabase() oben behandelt)
      if (!hasInitialLoadRef.current) {
        return
      }

      // Lösche vorherigen Timeout falls vorhanden
      if (reloadDebounceTimeoutRef.current) {
        clearTimeout(reloadDebounceTimeoutRef.current)
      }

      // Setze neuen Timeout - nur wenn nicht bereits ein Request läuft
      reloadDebounceTimeoutRef.current = setTimeout(() => {
        // Prüfe ob bereits ein Request läuft
        if (!isLoadingRef.current) {
          // Cache nur invalidieren wenn wirklich nötig
          // Der Cache in documentsUtils prüft selbst, ob die Daten noch gültig sind
          loadFromSupabase(false)
        }
        reloadDebounceTimeoutRef.current = null
      }, 300) // 300ms Debounce
    }

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage)
      window.addEventListener("focus", handleStorage)
      window.addEventListener("documents:reload", handleReloadEvent)
      return () => {
        window.removeEventListener("storage", handleStorage)
        window.removeEventListener("focus", handleStorage)
        window.removeEventListener("documents:reload", handleReloadEvent)
        // Cleanup: Lösche Timeout beim Unmount
        if (reloadDebounceTimeoutRef.current) {
          clearTimeout(reloadDebounceTimeoutRef.current)
        }
      }
    }
  }, [loadFromSupabase, loadFromLocalStorage, currentProjectId])

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
          {filteredDocs.length === 0 ? (
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 px-3 text-xs"
                      onClick={() => setSearchQuery("")}
                    >
                      {t('documents.resetSearch')}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="size-8 p-0"
                          onClick={createNewDocument}
                          aria-label={t('documents.newDocument')}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{t('documents.newDocument')}</TooltipContent>
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
              {`"${docToDelete?.title ?? untitledDocText}"`} {t('documents.deleteDocumentDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDocToDelete(null)}>{t('documents.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
              {t('documents.deleteAllDocumentsDescription').replace('{count}', String(documents.length))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteAllDialog(false)}>{t('documents.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllDocuments} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('documents.deleteAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

