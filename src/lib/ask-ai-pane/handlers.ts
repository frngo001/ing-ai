import type { ChatMessage, Mentionable, SlashCommand, ContextSelection, MessageContext } from './types'
import { detectArbeitType, extractThema } from './agent-utils'
import { buildContextSummary } from './context-utils'
import { parseAgentStream } from '@/lib/stream-parsers/agent-stream-parser'
import { parseStandardStream } from '@/lib/stream-parsers/standard-stream-parser'
import { extractFileContent, extractMultipleFilesContent, type FileContentResult } from '@/lib/file-extraction/extract-file-content'
import { canExtractClientSide } from '@/lib/file-extraction/file-types'

// Helper: Hole Editor-Inhalt als Markdown ueber Event-System
function getEditorContentAsMarkdown(): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve('')
      return
    }
    
    const editorEvent = new CustomEvent('get-editor-instance', {
      detail: {
        callback: (editor: any) => {
          if (!editor) {
            resolve('')
            return
          }
          
          try {
            // Extrahiere Text aus allen Nodes
            const extractText = (node: any): string => {
              if (!node) return ''
              if (typeof node.text === 'string') return node.text
              if (Array.isArray(node.children)) {
                return node.children.map(extractText).join(' ')
              }
              if (Array.isArray(node)) {
                return node.map(extractText).join('\n\n')
              }
              return ''
            }
            
            // Hole Editor-Inhalt
            const content = editor.children || []
            const text = extractText(content).trim()
            
            // Versuche Markdown-Serialisierung wenn verfuegbar
            try {
              const markdownApi = editor.getApi?.({ key: 'markdown' })
              if (markdownApi?.markdown?.serialize) {
                const markdown = markdownApi.markdown.serialize({ value: content })
                if (markdown) {
                  resolve(markdown)
                  return
                }
              }
            } catch {
              // Fallback auf Plain Text
            }
            
            resolve(text)
          } catch (error) {
            console.error('Fehler beim Extrahieren des Editor-Inhalts:', error)
            resolve('')
          }
        }
      }
    })
    
    window.dispatchEvent(editorEvent)
    
    // Timeout falls kein Editor verfuegbar
    setTimeout(() => resolve(''), 100)
  })
}

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
  history: Array<{ id: string; messages: ChatMessage[] }>
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

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    // Erkenne Bachelor/Masterarbeit
    const arbeitType = detectArbeitType(trimmed)
    const thema = extractThema(trimmed)

    // Wenn Arbeitstyp erkannt aber Agent noch nicht aktiv UND Agent-Modus ausgewählt
    if ((arbeitType || context.agentMode === 'general') && !agentStore.isActive && context.agentMode !== 'standard') {
      // Nutze den ausgewählten Modus oder den erkannten Arbeitstyp
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

    // Erstelle User-Nachricht mit Dateien und Kontext (Context nur im context-Feld, NICHT im content)
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed, // Nur der originale Text, ohne Context
      files: files && files.length > 0
        ? files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          }))
        : undefined,
      context: contextToInclude, // Context nur für UI-Anzeige
    }
    const assistantId = crypto.randomUUID()

    const contextSummary = buildContextSummary(trimmed, files, context, selectedMentions)
    const historyPayload = [...messages, userMsg].slice(-20)

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }])
    setInput("")
    setFiles(null) // Entferne Dateien aus dem Input-Feld nach dem Senden
    setSending(true)
    setStreamingId(assistantId)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      
      let apiEndpoint = "/api/ai/ask"
      const currentArbeitType = agentStore.arbeitType || (context.agentMode === 'general' ? 'general' : (context.agentMode === 'bachelor' ? 'bachelor' : null))
      
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
      const resolvedThema = agentStore.thema || thema || (context.agentMode === 'general' ? trimmed.substring(0, 100) : null)

      // Hole aktuellen Editor-Inhalt wenn Kontext aktiviert ist (fuer alle Modi)
      const editorContent = context.document ? await getEditorContentAsMarkdown() : ''

      // Extrahiere Content aus hochgeladenen Dateien
      let fileContents: Array<{ name: string; content: string; type: string }> = []
      if (files && files.length > 0) {
        try {
          // Toast wird bei Fehlern angezeigt

          // Trenne Dateien in clientseitig und serverseitig extrahierbare
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
                      // Falls JSON-Parsing fehlschlägt, verwende Status-Text
                      errorMessage = `Fehler ${response.status}: ${response.statusText || errorMessage}`
                    }
                    throw new Error(errorMessage)
                  }

                  const data = await response.json()
                  const extractedContent = data.content || ''
                  console.log(`[HANDLER] Datei "${file.name}" extrahiert: ${extractedContent.length} Zeichen`)
                  if (extractedContent.length > 0) {
                    console.log(`[HANDLER] Datei "${file.name}" Text-Vorschau: ${extractedContent.substring(0, 200)}...`)
                  } else {
                    console.warn(`[HANDLER] Warnung: Datei "${file.name}" hat keinen extrahierten Inhalt`)
                  }
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

          // Zeige Erfolgsmeldung, wenn Dateien erfolgreich extrahiert wurden
          if (fileContents.length > 0) {
            console.log(`[HANDLER] ${fileContents.length} Datei(en) erfolgreich extrahiert`)
            fileContents.forEach((file, index) => {
              console.log(`[HANDLER] Datei ${index + 1}: "${file.name}" (${file.type}) - ${file.content.length} Zeichen`)
            })
            const totalChars = fileContents.reduce((sum, file) => sum + file.content.length, 0)
            console.log(`[HANDLER] Gesamt extrahierter Text: ${totalChars} Zeichen`)
          } else {
            console.warn(`[HANDLER] Keine Dateien erfolgreich extrahiert`)
          }
        } catch (error) {
          console.error('Fehler beim Extrahieren von Datei-Content:', error)
          toast.error(
            `Fehler beim Extrahieren von Dateien: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`
          )
          // Weiter mit leeren fileContents - Metadaten werden trotzdem gesendet
        }
      }

      // Wenn WebSearch-Agent verwendet wird, verwende Agent-Format
      const isWebSearchAgent = context.agentMode === 'standard' && context.web && apiEndpoint === "/api/ai/agent/websearch"
      
      // Baue Context-Text aus MessageContext für den Prompt
      let messageContextText = ''
      if (contextToInclude && contextToInclude.length > 0) {
        const contextTexts = contextToInclude.map((ctx) => ctx.text).join('\n\n')
        messageContextText = `\n\n---\n\n**WICHTIG: Vom Nutzer markierter Text aus einer vorherigen Nachricht**\n\nDer Nutzer hat folgenden Text aus einer vorherigen Nachricht markiert und möchte mehr darüber erfahren:\n\n${contextTexts}\n\n**Bitte beziehe dich ausführlich auf diesen markierten Text und gib detaillierte Informationen dazu.**`
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
    const contextSummary = buildContextSummary(lastUserMessage.content, files, context, selectedMentions)

    const messagesWithoutLastAssistant = messages.filter((_, idx) => idx !== lastAssistantIndex)
    const historyPayload = [...messagesWithoutLastAssistant].slice(-20)

    setMessages((prev) =>
      prev.map((m, idx) =>
        idx === lastAssistantIndex ? { ...m, content: "" } : m
      )
    )
    setSending(true)
    setStreamingId(assistantId)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          question: lastUserMessage.content,
          context: contextSummary,
          documentContent: context.document ? "Current document context aktiv" : undefined,
          messages: historyPayload,
          attachments:
            files?.map((file) => ({
              name: file.name,
              size: file.size,
              type: file.type,
            })) ?? [],
        }),
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
        console.error("API-Fehler (/api/ai/ask):", {
          status: res.status,
          statusText: res.statusText,
          message: errorMessage,
        })
        throw new Error(errorMessage)
      }

      if (!res.body) {
        console.error("Kein Response-Body erhalten von /api/ai/ask")
        throw new Error("Keine Antwortdaten erhalten")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        fullText += decoder.decode(value)
        const chunk = fullText
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: chunk } : m))
        )
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

  const handleStop = () => {
    if (abortController) {
      abortController.abort()
    }
    setSending(false)
    setStreamingId(null)
  }

  const handleMentionSelect = (mention: Mentionable) => {
    setInput((prev) => prev.replace(/@([^\s@]*)$/, `${mention.value} `))
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

