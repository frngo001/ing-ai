import type { ChatMessage, Mentionable, SlashCommand, ContextSelection, MessageContext, StoredConversation, AgentMode } from './types'
import { detectArbeitType, extractThema } from './agent-utils'
import { buildContextSummary } from './context-utils'
import { getEditorContentAsMarkdown } from './editor-helpers'
import { parseAgentStream } from '@/lib/stream-parsers/agent-stream-parser'
import { parseStandardStream } from '@/lib/stream-parsers/standard-stream-parser'
import { extractFileContent, extractMultipleFilesContent, type FileContentResult } from '@/lib/file-extraction/extract-file-content'
import { canExtractClientSide } from '@/lib/file-extraction/file-types'
import { useProjectStore } from '@/lib/stores/project-store'
import { uploadChatFile, getChatFilesForMessage, createFileFromChatFile } from '@/lib/supabase/utils/chat-files'
import { getCurrentUserId } from '@/lib/supabase/utils/auth'

export interface AgentStore {
  isActive: boolean
  arbeitType: 'bachelor' | 'master' | 'general' | null
  thema?: string
  currentStep: number | null
  startAgent: (arbeitType: 'bachelor' | 'master' | 'general' | null, thema?: string) => void
  stopAgent: () => void
}

export interface HandlerDependencies {
  // State
  input: string
  messages: ChatMessage[]
  context: ContextSelection
  files: File[] | null
  selectedMentions: Mentionable[]
  isSending: boolean
  abortController: AbortController | null
  history: StoredConversation[]
  conversationId: string
  slashQuery: string | null
  agentStore: AgentStore
  pendingContext: MessageContext[]

  // Setters
  setInput: (value: string | ((prev: string) => string)) => void
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
  setSending: (value: boolean) => void
  setStreamingId: (value: string | null) => void
  setAbortController: (value: AbortController | null) => void
  setConversationId: (value: string) => void
  setFeedback: React.Dispatch<React.SetStateAction<Record<string, "up" | "down">>>
  setSelectedMentions: React.Dispatch<React.SetStateAction<Mentionable[]>>
  setFiles: (value: File[] | null) => void
  setHistoryOpen: (value: boolean) => void
  setNewSlashLabel: (value: string) => void
  setNewSlashContent: (value: string) => void
  setSlashDialogOpen: (value: boolean) => void
  setPendingContext: React.Dispatch<React.SetStateAction<MessageContext[]>>

  // Refs
  messageInputRef: React.RefObject<HTMLTextAreaElement | null>

  // Other
  toast: { error: (message: string) => void; success?: (message: string) => void }
  onClose?: () => void
  setContext: React.Dispatch<React.SetStateAction<ContextSelection>>
}

export const createHandlers = (deps: HandlerDependencies) => {
  const {
    input,
    messages,
    context,
    files,
    selectedMentions,
    isSending,
    abortController,
    history,
    conversationId,
    slashQuery,
    agentStore,
    pendingContext,
    setInput,
    setMessages,
    setSending,
    setStreamingId,
    setAbortController,
    setConversationId,
    setFeedback,
    setSelectedMentions,
    setFiles,
    setHistoryOpen,
    setNewSlashLabel,
    setNewSlashContent,
    setSlashDialogOpen,
    setPendingContext,
    messageInputRef,
    toast,
    onClose,
    setContext,
  } = deps

  const resetChat = () => {
    if (abortController) {
      abortController.abort()
    }
    setMessages([])
    setConversationId(crypto.randomUUID())
    setStreamingId(null)
    setFeedback({})
    setSelectedMentions([])
    setInput("")
    setFiles(null)
    setPendingContext([])
    setAbortController(null)
  }

  const handleSend = async (
    e?: React.FormEvent,
    manualInput?: string,
    options?: { hidden?: boolean }
  ) => {
    e?.preventDefault()
    const trimmed = (manualInput !== undefined ? manualInput : input).trim()
    if (!trimmed || isSending) return

    // Erkenne Bachelor/Masterarbeit
    const arbeitType = detectArbeitType(trimmed)
    const thema = extractThema(trimmed)

    // Wenn Arbeitstyp erkannt aber Agent noch nicht aktiv UND Agent-Modus ausgewählt
    // Default ist 'bachelor' oder 'master', nicht 'general'
    if ((arbeitType || context.agentMode === 'bachelor') && !agentStore.isActive && context.agentMode !== 'standard') {
      // Nutze den ausgewählten Modus oder den erkannten Arbeitstyp, Default ist 'bachelor'
      const typeToStart = context.agentMode === 'general' ? 'general' : (arbeitType || 'bachelor')

      agentStore.startAgent(typeToStart, thema || undefined)
      // Frage nach Thema falls nicht vorhanden
      if (!thema) {
        const topicPrompt = typeToStart === 'general'
          ? "Ich helfe dir bei allgemeinen Schreibarbeiten. Worum geht es?"
          : `Ich sehe, dass du eine ${typeToStart === 'bachelor' ? 'Bachelorarbeit' : 'Masterarbeit'} schreiben möchtest. Über welches Thema möchtest du schreiben?`

        const themaQuestion: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: topicPrompt,
        }
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }, themaQuestion])
        setInput("")
        return
      }
    }

    // Verwende pendingContext für die neue Nachricht
    const contextToInclude = pendingContext.length > 0 ? [...pendingContext] : undefined;

    // Leere pendingContext SOFORT, damit er aus dem Input-Feld verschwindet
    setPendingContext([])

    // Speichere die Dateien lokal, bevor sie aus dem State entfernt werden
    const filesToUpload = files && files.length > 0 ? [...files] : null

    // Erstelle User-Nachricht mit Dateien und Kontext (Context nur im context-Feld, NICHT im content)
    const userMsgId = crypto.randomUUID()

    // Speichere die verwendeten Mentions für die spätere Anzeige im Chat
    const userMentions = selectedMentions.length > 0 ? [...selectedMentions] : undefined

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: trimmed, // Nur der originale Text, ohne Context
      files: filesToUpload
        ? filesToUpload.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        }))
        : undefined,
      context: contextToInclude, // Context nur für UI-Anzeige
      mentions: userMentions, // Speichere Mentions im Nachrichten-Objekt
      hidden: options?.hidden,
    }
    const assistantId = crypto.randomUUID()

    const contextSummary = buildContextSummary(trimmed, files, context, selectedMentions)
    const historyPayload = [...messages, userMsg].slice(-20)

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }])
    setInput("")
    setFiles(null) // Entferne Dateien aus dem Input-Feld nach dem Senden
    setSelectedMentions([]) // Entferne Mentions aus dem Input-Feld nach dem Senden
    setSending(true)
    setStreamingId(assistantId)

    const controller = new AbortController()
    setAbortController(controller)

    try {

      let apiEndpoint = "/api/ai/ask"
      // Default ist 'bachelor', nicht 'general'
      const currentArbeitType = agentStore.arbeitType || (context.agentMode === 'bachelor' ? 'bachelor' : (context.agentMode === 'general' ? 'general' : 'bachelor'))

      if (context.agentMode === 'standard') {
        // Standard Chat Modus - wenn Websuche aktiviert, verwende WebSearch-Agent
        if (context.web) {
          apiEndpoint = "/api/ai/agent/websearch"
        } else {
          apiEndpoint = "/api/ai/ask"
        }
      } else if (agentStore.isActive && currentArbeitType) {
        // Use the mode stored in agentStore if active
        apiEndpoint = currentArbeitType === 'general' ? "/api/ai/agent/general" : "/api/ai/agent/bachelorarbeit"
      } else if (context.agentMode === 'bachelor') {
        apiEndpoint = "/api/ai/agent/bachelorarbeit"
      } else if (context.agentMode === 'general') {
        apiEndpoint = "/api/ai/agent/general"
      }

      // Debug-Logging für Endpoint-Auswahl
      console.log('[HANDLER DEBUG] Endpoint-Auswahl:', {
        agentMode: context.agentMode,
        isActive: agentStore.isActive,
        arbeitType: agentStore.arbeitType,
        currentArbeitType,
        selectedEndpoint: apiEndpoint,
      })

      // Für general-Modus: Wenn kein Thema vorhanden ist, verwende die erste Nachricht oder einen Standard-Wert
      // Default ist 'bachelor', daher verwenden wir die erste Nachricht nur für expliziten general-Modus
      const resolvedThema = agentStore.thema || thema || (context.agentMode === 'general' ? trimmed.substring(0, 100) : null)

      const isAgentModeForEditor = context.agentMode === 'bachelor' || context.agentMode === 'general' ||
        (agentStore.isActive && (currentArbeitType === 'bachelor' || currentArbeitType === 'master' || currentArbeitType === 'general'))

      const isEditorMentioned = selectedMentions.some(m => m.type === 'document')
      const shouldFetchEditorContent = isAgentModeForEditor || context.document || isEditorMentioned
      const editorContent = shouldFetchEditorContent ? await getEditorContentAsMarkdown() : ''

      if (isAgentModeForEditor || isEditorMentioned) {
        console.log(`[HANDLER] Editor-Inhalt für Agent-Modus/Mention geholt: ${editorContent.length} Zeichen`)
      }

      // Extrahiere Content aus hochgeladenen Dateien
      let fileContents: Array<{ name: string; content: string; type: string }> = []
      if (files && files.length > 0) {
        try {
          const clientFiles: File[] = []
          const serverFiles: File[] = []

          files.forEach((file) => {
            if (canExtractClientSide(file)) {
              clientFiles.push(file)
            } else {
              serverFiles.push(file)
            }
          })

          // Extrahiere clientseitig (TXT, MD)
          if (clientFiles.length > 0) {
            const clientResults = await extractMultipleFilesContent(clientFiles)
            const successful = clientResults.filter((result) => result.content && !result.error)
            const failed = clientResults.filter((result) => result.error)

            if (failed.length > 0) {
              toast.error(
                `Fehler beim Extrahieren von ${failed.length} Datei(en): ${failed.map((f) => f.metadata?.fileName).join(', ')}`
              )
            }

            fileContents.push(
              ...successful.map((result) => ({
                name: result.metadata?.fileName || 'unknown',
                content: result.content,
                type: result.metadata?.fileType || 'unknown',
              }))
            )
          }

          // Extrahiere serverseitig (PDF, DOCX, RTF)
          if (serverFiles.length > 0) {
            const serverResults = await Promise.all(
              serverFiles.map(async (file) => {
                try {
                  const formData = new FormData()
                  formData.append('file', file)

                  const response = await fetch('/api/files/extract', {
                    method: 'POST',
                    body: formData,
                  })

                  if (!response.ok) {
                    let errorMessage = `Fehler beim Extrahieren von ${file.name}`
                    try {
                      const errorData = await response.json()
                      if (errorData && typeof errorData.error === 'string') {
                        errorMessage = errorData.error
                      } else if (typeof errorData === 'string') {
                        errorMessage = errorData
                      }
                    } catch (parseError) {
                      errorMessage = `Fehler ${response.status}: ${response.statusText || errorMessage}`
                    }
                    throw new Error(errorMessage)
                  }

                  const data = await response.json()
                  const extractedContent = data.content || ''
                  console.log(`[HANDLER] Datei "${file.name}" extrahiert: ${extractedContent.length} Zeichen`)
                  return {
                    name: file.name,
                    content: extractedContent,
                    type: data.metadata?.fileType || file.type || 'unknown',
                  }
                } catch (error) {
                  console.error(`Fehler beim Extrahieren von ${file.name}:`, error)
                  toast.error(
                    `Fehler beim Extrahieren von ${file.name}: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
                  )
                  return null
                }
              })
            )

            const successful = serverResults.filter(
              (result): result is { name: string; content: string; type: string } =>
                result !== null && result.content.length > 0
            )

            fileContents.push(...successful)
          }

          if (fileContents.length > 0) {
            console.log(`[HANDLER] ${fileContents.length} Datei(en) erfolgreich extrahiert`)
          }
        } catch (error) {
          console.error('Fehler beim Extrahieren von Datei-Content:', error)
          toast.error(
            `Fehler beim Extrahieren von Dateien: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          )
        }
      }

      // Füge auch Inhalte von @-erwähnten Dateien hinzu (aus früheren Uploads)
      const mentionedFileContents = selectedMentions
        .filter((m) => m.type === 'file' && m.content)
        .map((m) => ({
          name: m.label,
          content: m.content || '',
          type: m.metadata?.fileType || 'unknown',
        }))

      if (mentionedFileContents.length > 0) {
        console.log(`[HANDLER] ${mentionedFileContents.length} @-erwähnte Datei(en) mit Inhalt hinzugefügt`)
        const existingNames = new Set(fileContents.map((f) => f.name))
        mentionedFileContents.forEach((mf) => {
          if (!existingNames.has(mf.name)) {
            fileContents.push(mf)
          }
        })
      }

      const isWebSearchAgent = context.agentMode === 'standard' && context.web && apiEndpoint === "/api/ai/agent/websearch"

      // Hole aktuelle projectId aus dem Store
      const currentProjectId = useProjectStore.getState().currentProjectId

      // Füge Inhalte von @-erwähnten Zitaten hinzu
      const citationContexts = selectedMentions
        .filter(m => m.type === 'citation')
        .map(m => `ZITAT "${m.label}":\n${m.content || m.label}`)

      let messageContextText = ''

      if (citationContexts.length > 0) {
        messageContextText += `\n\n---\n\n**REFERENZIERTE ZITATE:**\n\n${citationContexts.join('\n\n')}\n`
      }

      if (contextToInclude && contextToInclude.length > 0) {
        const contextTexts = contextToInclude.map((ctx) => ctx.text).join('\n\n')
        messageContextText += `\n\n---\n\n**WICHTIG: Vom Nutzer markierter Text aus einer vorherigen Nachricht**\n\nDer Nutzer hat folgenden Text aus einer vorherigen Nachricht markiert und möchte mehr darüber erfahren:\n\n${contextTexts}\n\n**Bitte beziehe dich ausführlich auf diesen markierten Text und gib detaillierte Informationen dazu.**`
      }


      const requestBody = (context.agentMode !== 'standard' || isWebSearchAgent)
        ? {
          messages: historyPayload.map((m) => {

            if (m.role === 'user' && m.id === userMsg.id && messageContextText) {
              return {
                role: m.role,
                content: m.content + messageContextText,
              }
            }
            return {
              role: m.role,
              content: m.content,
            }
          }),
          useWeb: context.web,
          editorContent,
          documentContextEnabled: context.document,
          fileContents: fileContents.length > 0 ? fileContents : undefined,
          projectId: currentProjectId, // Projekt-ID für Library/Citation-Tools
          agentState: isWebSearchAgent ? {
            isActive: false,
            arbeitType: null,
            thema: null,
            currentStep: null,
          } : {
            isActive: agentStore.isActive,
            arbeitType: currentArbeitType,
            thema: resolvedThema,
            currentStep: agentStore.currentStep,
          },
        }
        : {
          question: trimmed,
          context: contextSummary + (messageContextText ? messageContextText : ''), // Context im Hintergrund hinzufügen
          useWeb: context.web,
          editorContent: context.document ? editorContent : undefined, // Editor-Inhalt fuer Standard-Modus
          documentContextEnabled: context.document,
          fileContents: fileContents.length > 0 ? fileContents : undefined, // Extrahierter Datei-Content
          messages: historyPayload,
          attachments:
            files?.map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })) ?? [],
        }

      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        // Versuche, die Fehlermeldung aus der Response zu extrahieren
        let errorMessage = "Antwort fehlgeschlagen"
        try {
          const errorData = await res.json().catch(() => null)
          if (errorData?.error) {
            errorMessage = errorData.error
          } else if (typeof errorData === "string") {
            errorMessage = errorData
          } else {
            errorMessage = `Fehler ${res.status}: ${res.statusText}`
          }
        } catch {
          // Falls JSON-Parsing fehlschlägt, verwende Status-Text
          errorMessage = `Fehler ${res.status}: ${res.statusText || "Unbekannter Fehler"}`
        }
        const errorDetails = {
          status: res.status,
          statusText: res.statusText,
          message: errorMessage,
          endpoint: apiEndpoint,
        }
        console.error(`API-Fehler (${apiEndpoint}):`, errorDetails)
        throw new Error(errorMessage)
      }

      if (!res.body) {
        console.error(`Kein Response-Body erhalten von ${apiEndpoint}`)
        throw new Error("Keine Antwortdaten erhalten")
      }

      const reader = res.body.getReader()

      const isAgentMode = context.agentMode !== 'standard' || apiEndpoint === "/api/ai/agent/websearch"

      if (isAgentMode) {
        await parseAgentStream(reader, {
          assistantId,
          setMessages,
          agentStore,
        })
      } else {
        await parseStandardStream(reader, {
          assistantId,
          setMessages,
        })
      }

      // Nach erfolgreichem Streaming: Dateien in Supabase Storage speichern
      if (filesToUpload && filesToUpload.length > 0) {
        try {
          const userId = await getCurrentUserId()
          if (userId) {
            const uploadedFiles = await Promise.all(
              filesToUpload.map(async (file, index) => {
                try {
                  // Finde den extrahierten Inhalt für diese Datei
                  const extractedContent = fileContents.find(fc => fc.name === file.name)?.content

                  const result = await uploadChatFile(file, {
                    userId,
                    conversationId,
                    messageId: userMsgId,
                    projectId: currentProjectId || undefined,
                    extractedContent,
                  })

                  return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    id: result.id,
                    url: result.url,
                    extractedContent,
                  }
                } catch (uploadError) {
                  console.error(`Fehler beim Hochladen von ${file.name}:`, uploadError)
                  // Behalte die Original-Metadaten ohne ID/URL
                  return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                  }
                }
              })
            )

            // Aktualisiere die User-Nachricht mit den Datei-IDs
            setMessages((prev) =>
              prev.map((m) =>
                m.id === userMsgId
                  ? { ...m, files: uploadedFiles }
                  : m
              )
            )
            console.log('[HANDLER] Dateien erfolgreich in Supabase gespeichert:', uploadedFiles.length)

            // Event auslösen, um useChatFiles zum Aktualisieren zu bringen
            window.dispatchEvent(new CustomEvent('chat-file-uploaded'))
          }
        } catch (uploadError) {
          console.error('[HANDLER] Fehler beim Speichern der Dateien:', uploadError)
          // Kein Throw - Nachricht wurde bereits erfolgreich gesendet
        }
      }
    } catch (error) {
      if ((error as any)?.name !== "AbortError") {
        const errorMessage =
          error instanceof Error && error.message !== "Antwort fehlgeschlagen"
            ? error.message
            : "Entschuldigung, die Antwort konnte nicht geladen werden. Bitte versuche es erneut."

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                ...m,
                content: errorMessage,
              }
              : m
          )
        )
        console.error("Fehler in handleSend:", error)
      }
    } finally {
      setSending(false)
      setStreamingId(null)
      setAbortController(null)
    }
  }

  const handleRegenerate = async () => {
    if (isSending) return

    const lastAssistantIndex = [...messages].map((m, idx) => ({ m, idx })).reverse().find((entry) => entry.m.role === "assistant")?.idx
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")

    if (lastAssistantIndex === undefined || lastAssistantIndex < 0 || !lastUserMessage) {
      toast.error("Keine letzte Antwort zum Neu-Generieren gefunden.")
      return
    }

    const assistantId = messages[lastAssistantIndex].id
    const trimmed = lastUserMessage.content.trim()

    // Erkenne Bachelor/Masterarbeit (gleiche Logik wie handleSend)
    const arbeitType = detectArbeitType(trimmed)
    const thema = extractThema(trimmed)

    // Messages ohne die letzte Assistant-Nachricht (wird neu generiert)
    const messagesWithoutLastAssistant = messages.filter((_, idx) => idx !== lastAssistantIndex)
    const historyPayload = [...messagesWithoutLastAssistant].slice(-20)

    // Reset die letzte Assistant-Nachricht
    setMessages((prev) =>
      prev.map((m, idx) =>
        idx === lastAssistantIndex ? { ...m, content: "", parts: undefined, reasoning: undefined, toolSteps: undefined } : m
      )
    )
    setSending(true)
    setStreamingId(assistantId)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      let apiEndpoint = "/api/ai/ask"
      const currentArbeitType = agentStore.arbeitType || (context.agentMode === 'bachelor' ? 'bachelor' : (context.agentMode === 'general' ? 'general' : 'bachelor'))

      if (context.agentMode === 'standard') {
        if (context.web) {
          apiEndpoint = "/api/ai/agent/websearch"
        } else {
          apiEndpoint = "/api/ai/ask"
        }
      } else if (agentStore.isActive && currentArbeitType) {
        apiEndpoint = currentArbeitType === 'general' ? "/api/ai/agent/general" : "/api/ai/agent/bachelorarbeit"
      } else if (context.agentMode === 'bachelor') {
        apiEndpoint = "/api/ai/agent/bachelorarbeit"
      } else if (context.agentMode === 'general') {
        apiEndpoint = "/api/ai/agent/general"
      }

      console.log('[HANDLER DEBUG] Regenerate Endpoint-Auswahl:', {
        agentMode: context.agentMode,
        isActive: agentStore.isActive,
        arbeitType: agentStore.arbeitType,
        currentArbeitType,
        selectedEndpoint: apiEndpoint,
      })

      const resolvedThema = agentStore.thema || thema || (context.agentMode === 'general' ? trimmed.substring(0, 100) : null)

      // Prüfe ob Editor in den ursprünglichen Mentions war
      const originalMentions = lastUserMessage.mentions || []
      const isEditorMentioned = originalMentions.some(m => m.type === 'document')

      const isAgentModeForEditor = context.agentMode === 'bachelor' || context.agentMode === 'general' ||
        (agentStore.isActive && (currentArbeitType === 'bachelor' || currentArbeitType === 'master' || currentArbeitType === 'general'))
      const shouldFetchEditorContent = isAgentModeForEditor || context.document || isEditorMentioned
      const editorContent = shouldFetchEditorContent ? await getEditorContentAsMarkdown() : ''

      if (isAgentModeForEditor || isEditorMentioned) {
        console.log(`[HANDLER] Editor-Inhalt für Regenerate Agent-Modus/Mention geholt: ${editorContent.length} Zeichen`)
      }

      const isWebSearchAgent = context.agentMode === 'standard' && context.web && apiEndpoint === "/api/ai/agent/websearch"

      // Hole aktuelle projectId aus dem Store
      const currentProjectId = useProjectStore.getState().currentProjectId

      // Stelle fileContents aus gespeicherten Mentions wieder her
      let fileContents: Array<{ name: string; content: string; type: string }> = []

      // Füge Datei-Inhalte aus den gespeicherten Mentions wieder hinzu
      const mentionedFileContents = originalMentions
        .filter((m) => m.type === 'file' && m.content)
        .map((m) => ({
          name: m.label,
          content: m.content || '',
          type: m.metadata?.fileType || 'unknown',
        }))

      if (mentionedFileContents.length > 0) {
        console.log(`[HANDLER REGENERATE] ${mentionedFileContents.length} gespeicherte Datei(en) wiederhergestellt`)
        fileContents.push(...mentionedFileContents)
      }

      // Füge Zitat-Inhalte aus den gespeicherten Mentions wieder hinzu
      const citationContexts = originalMentions
        .filter(m => m.type === 'citation')
        .map(m => `ZITAT "${m.label}":\n${m.content || m.label}`)

      // Kontext aus der letzten User-Nachricht (falls vorhanden)
      let messageContextText = ''

      if (citationContexts.length > 0) {
        messageContextText += `\n\n---\n\n**REFERENZIERTE ZITATE:**\n\n${citationContexts.join('\n\n')}\n`
      }

      if (lastUserMessage.context && lastUserMessage.context.length > 0) {
        const contextTexts = lastUserMessage.context.map((ctx) => ctx.text).join('\n\n')
        messageContextText += `\n\n---\n\n**WICHTIG: Vom Nutzer markierter Text aus einer vorherigen Nachricht**\n\nDer Nutzer hat folgenden Text aus einer vorherigen Nachricht markiert und möchte mehr darüber erfahren:\n\n${contextTexts}\n\n**Bitte beziehe dich ausführlich auf diesen markierten Text und gib detaillierte Informationen dazu.**`
      }

      const contextSummary = buildContextSummary(trimmed, files, context, selectedMentions)

      const requestBody = (context.agentMode !== 'standard' || isWebSearchAgent)
        ? {
          messages: historyPayload.map((m) => {
            if (m.role === 'user' && m.id === lastUserMessage.id && messageContextText) {
              return {
                role: m.role,
                content: m.content + messageContextText,
              }
            }
            return {
              role: m.role,
              content: m.content,
            }
          }),
          useWeb: context.web,
          editorContent,
          documentContextEnabled: context.document,
          fileContents: fileContents.length > 0 ? fileContents : undefined,
          projectId: currentProjectId,
          agentState: isWebSearchAgent ? {
            isActive: false,
            arbeitType: null,
            thema: null,
            currentStep: null,
          } : {
            isActive: agentStore.isActive,
            arbeitType: currentArbeitType,
            thema: resolvedThema,
            currentStep: agentStore.currentStep,
          },
        }
        : {
          question: trimmed,
          context: contextSummary + (messageContextText ? messageContextText : ''),
          useWeb: context.web,
          editorContent: context.document ? editorContent : undefined,
          documentContextEnabled: context.document,
          fileContents: fileContents.length > 0 ? fileContents : undefined,
          messages: historyPayload,
          attachments: [],
        }


      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        let errorMessage = "Antwort fehlgeschlagen"
        try {
          const errorData = await res.json().catch(() => null)
          if (errorData?.error) {
            errorMessage = errorData.error
          } else if (typeof errorData === "string") {
            errorMessage = errorData
          } else {
            errorMessage = `Fehler ${res.status}: ${res.statusText}`
          }
        } catch {
          errorMessage = `Fehler ${res.status}: ${res.statusText || "Unbekannter Fehler"}`
        }
        console.error(`API-Fehler (${apiEndpoint}):`, {
          status: res.status,
          statusText: res.statusText,
          message: errorMessage,
        })
        throw new Error(errorMessage)
      }

      if (!res.body) {
        console.error(`Kein Response-Body erhalten von ${apiEndpoint}`)
        throw new Error("Keine Antwortdaten erhalten")
      }

      const reader = res.body.getReader()

      const isAgentMode = context.agentMode !== 'standard' || apiEndpoint === "/api/ai/agent/websearch"

      if (isAgentMode) {
        await parseAgentStream(reader, {
          assistantId,
          setMessages,
          agentStore,
        })
      } else {
        await parseStandardStream(reader, {
          assistantId,
          setMessages,
        })
      }
    } catch (error) {
      if ((error as any)?.name !== "AbortError") {
        const errorMessage =
          error instanceof Error && error.message !== "Antwort fehlgeschlagen"
            ? error.message
            : "Entschuldigung, die Antwort konnte nicht geladen werden. Bitte versuche es erneut."

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                ...m,
                content: errorMessage,
              }
              : m
          )
        )
        console.error("Fehler in handleRegenerate:", error)
      }
    } finally {
      setSending(false)
      setStreamingId(null)
      setAbortController(null)
    }
  }

  const handleEditLastMessage = async () => {
    if (isSending) return

    // Finde die letzte User-Nachricht
    const lastUserIndex = [...messages].map((m, idx) => ({ m, idx })).reverse().find((entry) => entry.m.role === "user")?.idx

    if (lastUserIndex === undefined || lastUserIndex < 0) {
      toast.error("Keine Nachricht zum Bearbeiten gefunden.")
      return
    }

    const lastUserMessage = messages[lastUserIndex]

    // Setze den Inhalt der letzten User-Nachricht in das Input-Feld
    setInput(lastUserMessage.content)

    // Entferne die letzte User-Nachricht und alle darauf folgenden Nachrichten (inkl. Assistant-Antwort)
    setMessages((prev) => prev.slice(0, lastUserIndex))

    // Setze pendingContext auf den Context der letzten Nachricht (falls vorhanden)
    if (lastUserMessage.context && lastUserMessage.context.length > 0) {
      setPendingContext(lastUserMessage.context)
    }

    // Lade Dateien aus Supabase Storage und stelle sie wieder her
    if (lastUserMessage.files && lastUserMessage.files.length > 0) {
      const filesWithIds = lastUserMessage.files.filter(f => f.id && f.url)

      if (filesWithIds.length > 0) {
        try {
          // Lade die Dateien parallel herunter
          const restoredFiles = await Promise.all(
            filesWithIds.map(async (fileInfo) => {
              try {
                const file = await createFileFromChatFile({
                  id: fileInfo.id!,
                  url: fileInfo.url!,
                  path: '',
                  name: fileInfo.name,
                  size: fileInfo.size,
                  type: fileInfo.type,
                })
                return file
              } catch (error) {
                console.error(`Fehler beim Laden von ${fileInfo.name}:`, error)
                return null
              }
            })
          )

          // Filtere erfolgreich geladene Dateien
          const validFiles = restoredFiles.filter((f): f is File => f !== null)

          if (validFiles.length > 0) {
            setFiles(validFiles)
            if (toast.success) {
              toast.success(`${validFiles.length} Datei(en) wiederhergestellt`)
            }
          }

          // Informiere über nicht wiederhergestellte Dateien
          const failedFiles = lastUserMessage.files.filter(f => !f.id || !f.url)
          if (failedFiles.length > 0) {
            const failedNames = failedFiles.map(f => f.name).join(', ')
            toast.error(`Diese Dateien konnten nicht wiederhergestellt werden: ${failedNames}`)
          }
        } catch (error) {
          console.error('Fehler beim Wiederherstellen der Dateien:', error)
          const fileNames = lastUserMessage.files.map((f) => f.name).join(', ')
          toast.error(`Dateien erneut anhängen: ${fileNames}`)
        }
      } else {
        // Keine Dateien mit IDs - alte Nachricht vor dem Update
        const fileNames = lastUserMessage.files.map((f) => f.name).join(', ')
        toast.error(`Dateien erneut anhängen: ${fileNames}`)
      }
    }

    // Fokussiere das Input-Feld
    focusMessageInput()
  }

  const handleStop = () => {
    if (abortController) {
      abortController.abort()
    }
    setSending(false)
    setStreamingId(null)
  }

  const handleMentionSelect = (mention: Mentionable) => {
    // Remove the @... text completely from input - the mention will be shown as a badge
    setInput((prev) => prev.replace(/@([^\s@]*)$/, '').trimEnd())
    setSelectedMentions((prev) => {
      if (prev.find((m) => m.id === mention.id)) return prev
      return [...prev, mention]
    })
    focusMessageInput()
  }

  const handleSlashInsert = (command: SlashCommand) => {
    setInput((prev) => prev.replace(/\/([^\s/]*)$/, command.content + " "))
    focusMessageInput()
  }

  const focusMessageInput = () => {
    requestAnimationFrame(() => {
      messageInputRef.current?.focus()
    })
  }

  const handleLoadConversation = (id: string) => {
    const entry = history.find((item) => item.id === id)
    if (!entry) return
    if (abortController) {
      abortController.abort()
    }
    setConversationId(entry.id)
    setMessages(entry.messages)
    // Restore agent mode from conversation if available
    if (entry.agentMode) {
      setContext((prev) => ({ ...prev, agentMode: entry.agentMode as AgentMode }))
    }
    setStreamingId(null)
    setFeedback({})
    setSelectedMentions([])
    setInput("")
    setFiles(null)
    setAbortController(null)
    setHistoryOpen(false)
    focusMessageInput()
  }

  const handleStartNewChatFromHistory = () => {
    resetChat()
    setHistoryOpen(false)
    focusMessageInput()
  }

  const handleSlashCreate = () => {
    const trimmed = input.trim()
    const label = slashQuery && slashQuery.length > 0 ? slashQuery : ""
    setNewSlashLabel(label)
    setNewSlashContent(trimmed)
    setSlashDialogOpen(true)
  }

  const handleRemoveMention = (id: string) => {
    setSelectedMentions((prev) => prev.filter((m) => m.id !== id))
    focusMessageInput()
  }

  const handleClose = () => {
    onClose?.()
  }

  const toggleContext = (key: keyof ContextSelection) => {
    setContext((prev: ContextSelection) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleFeedback = (id: string, value: "up" | "down") => {
    setFeedback((prev: Record<string, "up" | "down">) => {
      const next = { ...prev }
      if (prev[id] === value) {
        delete next[id]
      } else {
        next[id] = value
      }
      return next
    })
  }

  return {
    resetChat,
    handleSend,
    handleRegenerate,
    handleEditLastMessage,
    handleStop,
    handleMentionSelect,
    handleSlashInsert,
    focusMessageInput,
    handleLoadConversation,
    handleStartNewChatFromHistory,
    handleSlashCreate,
    handleRemoveMention,
    handleClose,
    handleFeedback,
    toggleContext,
  }
}

