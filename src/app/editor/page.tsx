"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { type ImperativePanelHandle } from "react-resizable-panels"
import { Toaster } from "sonner"

import { AppSidebar } from "@/components/app-sidebar"
import { AskAiPane } from "@/components/ask-ai-pane"
import { DocumentsPane } from "@/components/documents-pane"
import { PlateEditor } from "@/components/editor/plate-editor"
import { LibraryPane } from "@/components/library-pane"
import { SettingsDialog } from "@/components/settings-dialog"
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { EditorLoading } from "@/components/ui/editor-loading"
import { useVisibilityStore } from "@/lib/stores/visibility-store"
import { setupEditorTextInsertion } from "@/lib/editor/insert-text"
import { setupEditorStreaming } from "@/lib/editor/stream-text"
import { getCurrentUserId } from "@/lib/supabase/utils/auth"
import * as documentsUtils from "@/lib/supabase/utils/documents"
import { extractTextFromNode } from "@/lib/supabase/utils/document-title"
import { useIsAuthenticated } from "@/hooks/use-auth"

type Pane = "documents" | "library" | "askAi"

export default function Page() {
  const router = useRouter()
  const isAuthenticated = useIsAuthenticated()
  const [panes, setPanes] = useState<Record<Pane, boolean>>({
    documents: false,
    library: false,
    askAi: false,
  })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsInitialNav, setSettingsInitialNav] = useState<string | undefined>(undefined)

  // Authentifizierungsprüfung: Weiterleitung zur Login-Seite wenn nicht authentifiziert
  useEffect(() => {
    if (isAuthenticated === false && typeof window !== 'undefined') {
      const currentPath = window.location.pathname + window.location.search
      router.replace(`/auth/login?next=${encodeURIComponent(currentPath)}`)
    }
  }, [isAuthenticated, router])

  // Setup Editor-Text-Einfügung beim Mount
  useEffect(() => {
    setupEditorTextInsertion()
    setupEditorStreaming()
  }, [])

  if (isAuthenticated === null || isAuthenticated === false) {
    return <EditorLoading />
  }

  const askAiPaneTransition =
    "absolute inset-0 overflow-hidden data-[pane-state=open]:w-full data-[pane-state=closed]:w-0 data-[pane-state=closed]:min-w-0 data-[pane-state=closed]:pointer-events-none"

  return (
    <SidebarProvider defaultOpen={false}>
      <Suspense fallback={<EditorLoading />}>
        <PageContent
          panes={panes}
          setPanes={setPanes}
          settingsOpen={settingsOpen}
          setSettingsOpen={setSettingsOpen}
          settingsInitialNav={settingsInitialNav}
          setSettingsInitialNav={setSettingsInitialNav}
          askAiPaneTransition={askAiPaneTransition}
        />
      </Suspense>
    </SidebarProvider>
  )
}

function PageContent({
  panes,
  setPanes,
  settingsOpen,
  setSettingsOpen,
  settingsInitialNav,
  setSettingsInitialNav,
  askAiPaneTransition,
}: {
  panes: Record<Pane, boolean>
  setPanes: React.Dispatch<React.SetStateAction<Record<Pane, boolean>>>
  settingsOpen: boolean
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>
  settingsInitialNav: string | undefined
  setSettingsInitialNav: React.Dispatch<React.SetStateAction<string | undefined>>
  askAiPaneTransition: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const findLatestDocId = useCallback(async (): Promise<string | null> => {
    if (typeof window === "undefined") return null

    const STATE_PREFIX = "plate-editor-state-"
    const CONTENT_PREFIX = "plate-editor-content-"

    const hasContentText = (state: any): boolean => {
      const content = Array.isArray(state?.content) ? state.content : null
      if (!content) return false
      return extractTextFromNode(content).trim().length > 0
    }

    const seen = new Set<string>()
    let latestId: string | null = null
    let latestTs = -Infinity

    // Prüfe zuerst Supabase-Dokumente, wenn User eingeloggt
    try {
      const userId = await getCurrentUserId()
      if (userId) {
        const docs = await documentsUtils.getDocuments(userId)
        for (const doc of docs) {
          if (seen.has(doc.id)) continue
          seen.add(doc.id)

          // Prüfe ob Content vorhanden ist
          if (doc.content && hasContentText({ content: doc.content })) {
            const ts = doc.updated_at ? new Date(doc.updated_at).getTime() : 0
            if (ts >= latestTs) {
              latestTs = ts
              latestId = doc.id
            }
          }
        }
      }
    } catch (error) {
      console.error("Fehler beim Laden der Dokumente aus Supabase:", error)
    }

    // Prüfe dann localStorage
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i)
      if (!key) continue

      const isState = key.startsWith(STATE_PREFIX)
      const isContent = key.startsWith(CONTENT_PREFIX)
      if (!isState && !isContent) continue

      const id = isState ? key.replace(STATE_PREFIX, "") : key.replace(CONTENT_PREFIX, "")
      if (seen.has(id)) continue

      const rawState = window.localStorage.getItem(`${STATE_PREFIX}${id}`)
      const rawContent = window.localStorage.getItem(`${CONTENT_PREFIX}${id}`)

      try {
        const parsedState = rawState ? JSON.parse(rawState) : null
        const parsedContent = rawContent ? JSON.parse(rawContent) : null
        const hydrated = parsedState ?? (parsedContent ? { content: parsedContent } : null)
        if (!hydrated) continue

        // Prüfe ob Content vorhanden ist
        if (!hasContentText(hydrated)) continue

        const ts = hydrated?.updatedAt ? new Date(hydrated.updatedAt).getTime() : 0
        if (ts >= latestTs) {
          latestTs = ts
          latestId = id
        }
        seen.add(id)
      } catch {
        // ignore malformed entries
      }
    }

    return latestId
  }, [])
  const [storageId, setStorageId] = useState<string | null>(null)
  const hasDecidedInitialDoc = useRef(false)

  const showDocuments = panes.documents
  const showLibrary = panes.library
  const showAskAi = panes.askAi
  const sidePaneOpen = showDocuments || showLibrary

  const { state: sidebarState } = useSidebar()
  const { tocEnabled, commentTocEnabled, suggestionTocEnabled } = useVisibilityStore()

  const baseTocVisible = !showAskAi && !showDocuments && !showLibrary && sidebarState === "collapsed"
  const tocVisible = tocEnabled && baseTocVisible
  const commentTocVisible = commentTocEnabled && baseTocVisible
  const suggestionTocVisible = suggestionTocEnabled && baseTocVisible
  const askAiPanelRef = useRef<ImperativePanelHandle | null>(null)

  useEffect(() => {
    if (showAskAi) {
      askAiPanelRef.current?.expand(30)
    } else {
      askAiPanelRef.current?.collapse()
    }
  }, [showAskAi])

  useEffect(() => {
    if (hasDecidedInitialDoc.current) return
    hasDecidedInitialDoc.current = true

    const paramId = searchParams.get("doc")
    if (paramId) {
      setStorageId(paramId)
      // Kein Event beim ersten Mount - DocumentsPane lädt bereits beim Mount
      return
    }

    // findLatestDocId ist jetzt async
    findLatestDocId().then((latestExisting) => {
      if (latestExisting) {
        setStorageId(latestExisting)
        router.replace(`/editor?doc=${encodeURIComponent(latestExisting)}`)
        // Event wird durch den nachfolgenden useEffect ausgelöst, wenn searchParams sich ändert
        return
      }

      const newId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `doc-${Date.now()}`
      setStorageId(newId)
      router.replace(`/editor?doc=${encodeURIComponent(newId)}`)
      // Event wird durch den nachfolgenden useEffect ausgelöst, wenn searchParams sich ändert
    })
  }, [findLatestDocId, router, searchParams])

  useEffect(() => {
    const paramId = searchParams.get("doc")
    if (paramId && paramId !== storageId) {
      setStorageId(paramId)
      // Event nur auslösen wenn sich der doc Parameter wirklich ändert
      // Debounce wird in DocumentsPane gehandhabt
      window.dispatchEvent(new Event("documents:reload"))
    }
  }, [searchParams, storageId])

  const togglePane = (pane: Pane) =>
    setPanes((prev) => {
      const isOpening = !prev[pane]
      if (isOpening) {
        return {
          documents: pane === "documents",
          library: pane === "library",
          askAi: pane === "askAi",
        }
      }
      return { ...prev, [pane]: false }
    })

  const openDocumentsPane = () =>
    setPanes({
      documents: true,
      library: false,
      askAi: false,
    })

  const createNewDocument = () => {
    const newId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `doc-${Date.now()}`

    if (typeof window !== "undefined") {
      const payload = {
        content: [{ type: "p", children: [{ text: "" }] }],
        discussions: [],
        updatedAt: new Date().toISOString(),
      }
      try {
        window.localStorage.setItem(`plate-editor-state-${newId}`, JSON.stringify(payload))
        window.dispatchEvent(new Event("documents:reload"))
      } catch {
        // ignore storage failures for now
      }
    }

    setStorageId(newId)
    setPanes({
      documents: true,
      library: false,
      askAi: false,
    })
    router.push(`/editor?doc=${encodeURIComponent(newId)}`)
  }

  const closePane = (pane: Pane) =>
    setPanes((prev) => {
      if (!prev[pane]) return prev
      return { ...prev, [pane]: false }
    })

  return (
    <>
      <AppSidebar
        documentsVisible={showDocuments}
        onToggleDocuments={() => togglePane("documents")}
        libraryVisible={showLibrary}
        onToggleLibrary={() => togglePane("library")}
        askAiVisible={showAskAi}
        onToggleAskAi={() => togglePane("askAi")}
        settingsOpen={settingsOpen}
        onOpenSettings={(nav) => {
          setSettingsInitialNav(nav)
          setSettingsOpen(true)
        }}
        onCreateDocument={createNewDocument}
      />
      <SidebarInset className="flex min-h-screen w-0 min-w-0 flex-1 flex-col overflow-visible">
        <div className="flex flex-1 overflow-hidden pt-0 pb-0">
          <div
            data-pane-state={showDocuments ? "open" : "closed"}
            className="shrink-0 h-screen overflow-hidden data-[pane-state=open]:w-[300px] data-[pane-state=closed]:w-0 data-[pane-state=closed]:pointer-events-none"
          >
            <DocumentsPane
              className="h-full"
              onClose={() => closePane("documents")}
            />
          </div>

          <div
            data-pane-state={showLibrary ? "open" : "closed"}
            className="shrink-0 h-screen overflow-hidden data-[pane-state=open]:w-[300px] data-[pane-state=closed]:w-0 data-[pane-state=closed]:pointer-events-none"
          >
            <LibraryPane
              className="h-full"
              onClose={() => closePane("library")}
            />
          </div>

          <div className="relative flex-1 min-w-0">
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0 items-stretch">
              <ResizablePanel
                ref={askAiPanelRef}
                defaultSize={0}
                minSize={0}
                maxSize={45}
                collapsedSize={0}
                collapsible
                className="relative h-screen transition-none"
              >
                <div data-pane-state={showAskAi ? "open" : "closed"} className={askAiPaneTransition}>
                  <AskAiPane className="h-full" onClose={() => closePane("askAi")} />
                </div>
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className={`w-1 data-[panel-group-direction=horizontal]:cursor-col-resize ${showAskAi ? "hidden sm:flex" : "hidden"
                  }`}
              />
              <ResizablePanel minSize={40} defaultSize={100}>
                <div
                  className={`h-screen overflow-hidden bg-background ${sidePaneOpen ? "border-l border-border/70" : ""
                    }`}
                >
                  <div className="flex h-full flex-col overflow-hidden">
                    <div className="flex-1 overflow-auto">
                      {storageId && (
                        <PlateEditor
                          key={storageId}
                          storageId={storageId}
                          showToc={tocVisible}
                          showCommentToc={commentTocVisible}
                          showSuggestionToc={suggestionTocVisible}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          initialNav={settingsInitialNav}
        />
        <Toaster />
      </SidebarInset>
    </>
  )
}
