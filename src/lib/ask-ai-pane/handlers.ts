import type { ChatMessage, Mentionable, SlashCommand, ContextSelection } from './types'
import { detectArbeitType, extractThema } from './agent-utils'
import { buildContextSummary } from './context-utils'
import { parseAgentStream } from '@/lib/stream-parsers/agent-stream-parser'
import { parseStandardStream } from '@/lib/stream-parsers/standard-stream-parser'

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
  
  // Refs
  messageInputRef: React.RefObject<HTMLTextAreaElement | null>
  
  // Other
  toast: { error: (message: string) => void }
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

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed }
    const assistantId = crypto.randomUUID()
    const contextSummary = buildContextSummary(trimmed, files, context, selectedMentions)
    const historyPayload = [...messages, userMsg].slice(-20)

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }])
    setInput("")
    setSending(true)
    setStreamingId(assistantId)

    const controller = new AbortController()
    setAbortController(controller)

    try {
      // Determine Endpoint based on Agent Mode
      // WICHTIG: Wenn Modus 'standard' ist, immer Ask-Endpoint verwenden, auch wenn Agent noch aktiv ist
      let apiEndpoint = "/api/ai/ask"
      if (context.agentMode === 'standard') {
        // Standard Chat Modus - immer Ask-Endpoint verwenden
        apiEndpoint = "/api/ai/ask"
      } else if (agentStore.isActive) {
        // Use the mode stored in agentStore if active
        apiEndpoint = agentStore.arbeitType === 'general' ? "/api/ai/agent/general" : "/api/ai/agent/bachelorarbeit"
      } else if (context.agentMode === 'bachelor') {
        apiEndpoint = "/api/ai/agent/bachelorarbeit"
      } else if (context.agentMode === 'general') {
        apiEndpoint = "/api/ai/agent/general"
      }

      const requestBody = context.agentMode !== 'standard'
        ? {
          messages: historyPayload.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          useWeb: context.web,
          agentState: {
            isActive: agentStore.isActive,
            arbeitType: agentStore.arbeitType || (context.agentMode === 'general' ? 'general' : arbeitType),
            thema: agentStore.thema || thema,
            currentStep: agentStore.currentStep,
          },
        }
        : {
          question: trimmed,
          context: contextSummary,
          useWeb: context.web,
          documentContent: context.document ? "Current document context aktiv" : undefined,
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

      if (!res.ok || !res.body) {
        throw new Error("Antwort fehlgeschlagen")
      }

      const reader = res.body.getReader()
      
      // TRENNUNG: Standard-Chat vs. Agenten - verwende separate Parser
      const isAgentMode = context.agentMode !== 'standard'
      
      if (isAgentMode) {
        // Agent-Modi: Einfaches Text-Stream-Parsing
        await parseAgentStream(reader, {
          assistantId,
          setMessages,
          agentStore,
        })
      } else {
        // Standard-Chat: Komplexes Parsing mit Reasoning/Sources
        await parseStandardStream(reader, {
          assistantId,
          setMessages,
        })
      }
    } catch (error) {
      if ((error as any)?.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    "Entschuldigung, die Antwort konnte nicht geladen werden. Bitte versuche es erneut.",
                }
              : m
          )
        )
        console.error(error)
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

      if (!res.ok || !res.body) {
        throw new Error("Antwort fehlgeschlagen")
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
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                ...m,
                content:
                  "Entschuldigung, die Antwort konnte nicht geladen werden. Bitte versuche es erneut.",
              }
              : m
          )
        )
        console.error(error)
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

