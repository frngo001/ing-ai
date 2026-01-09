"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  ChevronDown,
  FileText,
  History,
  MessageSquareQuote,
  PanelLeftClose,
  Plus,
  Globe,
  Search,
  Brain,
  X,
  Bookmark,
  Trash2,
  MoreHorizontal,
} from "lucide-react"
import { PlateMarkdown } from "@/components/ui/plate-markdown"
import { ChatSelectionToolbar } from "./ask-ai-pane/chat-selection-toolbar"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Conversation, ConversationContent, ConversationScrollButton } from "@/components/ui/conversation"
import { Message, MessageContent } from "@/components/ui/message"
import { Response } from "@/components/ui/response"
import { useToast } from "@/hooks/use-toast"
import { MessageInput } from "@/components/ui/message-input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AgentStepperView } from "@/components/ui/agent-stepper"
import { useCitationStore } from "@/lib/stores/citation-store"
import { useBachelorarbeitAgentStore, type SelectedSource } from "@/lib/stores/bachelorarbeit-agent-store"
import { useProjectStore } from "@/lib/stores/project-store"
import { cn } from "@/lib/utils"
import { getCurrentUserId } from "@/lib/supabase/utils/auth"
import * as chatConversationsUtils from "@/lib/supabase/utils/chat-conversations"
import * as chatMessagesUtils from "@/lib/supabase/utils/chat-messages"
import { useLanguage } from "@/lib/i18n/use-language"
import {
  type MessagePart,
  type ChatMessage,
  type StoredConversation,
  type AgentMode,
  type ContextSelection,
  type Mentionable,
  type SlashCommand,
  type SavedMessage,
  type MessageContext,
  defaultContext,
  addSourcesToLibrary,
  saveSlashCommands,
  saveSingleSlashCommand,
  loadSlashCommands,
  persistConversation,
  loadChatHistory,
  saveMessage,
  removeSavedMessage,
  loadSavedMessages,
  filterMentionables,
  StreamingShimmer,
  useMentionables,
  useChatFiles,
  useMentionQuery,
  useSlashQuery,
  useFilteredHistory,
  createHandlers,
  createRenderers,
} from "@/lib/ask-ai-pane"
import { detectArbeitType, extractThema } from "@/lib/ask-ai-pane/agent-utils"
import { buildContextSummary } from "@/lib/ask-ai-pane/context-utils"
import { getEditorContentAsMarkdown } from "@/lib/ask-ai-pane/editor-helpers"
import { parseAgentStream } from "@/lib/stream-parsers/agent-stream-parser"
import { parseStandardStream } from "@/lib/stream-parsers/standard-stream-parser"
import { devLog, devWarn, devError } from "@/lib/utils/logger"

export type { MessagePart }

/**
 * Hauptkomponente für den Ask AI Chat-Panel.
 * 
 * Diese Komponente stellt eine vollständige Chat-Interface bereit mit folgenden Features:
 * - Chat-Historie und Konversationsverwaltung
 * - Verschiedene Agent-Modi (Bachelor/Master, Essay, Standard)
 * - Inline-Bearbeitung von Nachrichten
 * - Favoriten-System für Nachrichten
 * - Slash-Commands
 * - Context-Selection (Dokumente, Web-Suche)
 * - Streaming-Antworten mit Reasoning-Anzeige
 * - Datei-Uploads
 * 
 * @param className - Optionale CSS-Klassen für das Wrapper-Element
 * @param onClose - Callback-Funktion, die aufgerufen wird, wenn der Panel geschlossen wird
 * 
 * @example
 * ```tsx
 * <AskAiPane 
 *   className="custom-class"
 *   onClose={() => console.log('Panel closed')}
 * />
 * ```
 */
export function AskAiPane({
  className,
  onClose,
}: {
  className?: string
  onClose?: () => void
}) {
  const { t, language } = useLanguage()
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID())
  const [history, setHistory] = useState<StoredConversation[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [streamingId, setStreamingId] = useState<string | null>(null)
  const [context, setContext] = useState<ContextSelection>(defaultContext)
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({})
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [selectedMentions, setSelectedMentions] = useState<Mentionable[]>([])
  const messageInputRef = useRef<HTMLTextAreaElement | null>(null)
  const [files, setFiles] = useState<File[] | null>(null)
  const { toast } = useToast()
  const citations = useCitationStore((state) => state.savedCitations)
  const addCitation = useCitationStore((state) => state.addCitation)
  const agentStore = useBachelorarbeitAgentStore()
  const currentProjectId = useProjectStore((state) => state.currentProjectId)
  const [slashCommands, setSlashCommands] = useState<SlashCommand[]>([])
  const [slashDialogOpen, setSlashDialogOpen] = useState(false)
  const [newSlashLabel, setNewSlashLabel] = useState("")
  const [newSlashContent, setNewSlashContent] = useState("")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyQuery, setHistoryQuery] = useState("")
  const [chatToDelete, setChatToDelete] = useState<{ id: string; title: string } | null>(null)
  const [sourcesDialogOpen, setSourcesDialogOpen] = useState<Record<string, boolean>>({})
  const [reasoningOpen, setReasoningOpen] = useState<Record<string, boolean>>({})
  const [savedMessages, setSavedMessages] = useState<Set<string>>(new Set())
  const [savedMessagesList, setSavedMessagesList] = useState<SavedMessage[]>([])
  const [favoritesDialogOpen, setFavoritesDialogOpen] = useState(false)
  const [pendingContext, setPendingContext] = useState<MessageContext[]>([])
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const autoClosedReasoning = useRef<Set<string>>(new Set())
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPersistingRef = useRef(false)
  const persistConversationRef = useRef(persistConversation)
  persistConversationRef.current = persistConversation
  const setHistoryRef = useRef(setHistory)
  setHistoryRef.current = setHistory

  const translations = useMemo(() => ({
    title: t('askAi.title'),
    favorites: t('askAi.favorites'),
    chatHistory: t('askAi.chatHistory'),
    newChat: t('askAi.newChat'),
    closePanel: t('askAi.closePanel'),
    bachelorMasterAgent: t('askAi.bachelorMasterAgent'),
    essayAgent: t('askAi.essayAgent'),
    standardChat: t('askAi.standardChat'),
    enableContext: t('askAi.enableContext'),
    enableWebSearch: t('askAi.enableWebSearch'),
    placeholder: t('askAi.placeholder'),
    audioError: t('askAi.audioError'),
    showReasoning: t('askAi.showReasoning'),
    answer: t('askAi.answer'),
    noAnswerAvailable: t('askAi.noAnswerAvailable'),
    saveCommand: t('askAi.saveCommand'),
    removeMention: t('askAi.removeMention'),
    chatHistoryTitle: t('askAi.chatHistoryTitle'),
    searchChats: t('askAi.searchChats'),
    noMessages: t('askAi.noMessages'),
    newChatTitle: t('askAi.newChatTitle'),
    noResultsFor: t('askAi.noResultsFor'),
    noChatHistory: t('askAi.noChatHistory'),
    adjustSearch: t('askAi.adjustSearch'),
    startNewChat: t('askAi.startNewChat'),
    resetSearch: t('askAi.resetSearch'),
    startNewChatButton: t('askAi.startNewChatButton'),
    deleteChatTitle: t('askAi.deleteChatTitle'),
    deleteChatDescription: t('askAi.deleteChatDescription'),
    cancel: t('askAi.cancel'),
    delete: t('askAi.delete'),
    chatDeleted: t('askAi.chatDeleted'),
    chatDeleteError: t('askAi.chatDeleteError'),
    favoritesTitle: t('askAi.favoritesTitle'),
    favoritesDescription: t('askAi.favoritesDescription'),
    unknownChat: t('askAi.unknownChat'),
    noFavorites: t('askAi.noFavorites'),
    saveMessageHint: t('askAi.saveMessageHint'),
    saveCommandTitle: t('askAi.saveCommandTitle'),
    saveCommandDescription: t('askAi.saveCommandDescription'),
    label: t('askAi.label'),
    labelPlaceholder: t('askAi.labelPlaceholder'),
    command: t('askAi.command'),
    commandPlaceholder: t('askAi.commandPlaceholder'),
    save: t('askAi.save'),
    contextAdded: t('askAi.contextAdded'),
  }), [t, language])

  const lastAssistantId = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.id ?? null,
    [messages]
  )

  const lastUserId = useMemo(
    () => [...messages].reverse().find((m) => m.role === "user")?.id ?? null,
    [messages]
  )

  const chatFiles = useChatFiles()
  const mentionables = useMentionables(citations || [], chatFiles)
  const mentionQuery = useMentionQuery(input)
  const slashQuery = useSlashQuery(input)
  const filteredHistory = useFilteredHistory(history, historyQuery)

  useEffect(() => {
    const loadCommands = async () => {
      const commands = await loadSlashCommands()
      setSlashCommands(commands)
    }
    loadCommands()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        await agentStore.loadAgentStateFromSupabase()
        devLog('📝 [ASK-AI-PANE] Agent State aus Supabase geladen:', {
          isActive: agentStore.isActive,
          thema: agentStore.thema,
          currentStep: agentStore.currentStep,
          arbeitType: agentStore.arbeitType,
        })
      } catch (error) {
        devWarn('⚠️ [ASK-AI-PANE] Fehler beim Laden des Agent States:', error)
      }

      const loadedHistory = await loadChatHistory(currentProjectId || undefined)
      setHistory(loadedHistory)
      if (loadedHistory[0]) {
        setConversationId(loadedHistory[0].id)
        setMessages(loadedHistory[0].messages)
        if (loadedHistory[0].agentMode) {
          setContext((prev) => ({ ...prev, agentMode: loadedHistory[0].agentMode! }))
        }
      } else {
        setConversationId(crypto.randomUUID())
        setMessages([])
      }

      const saved = await loadSavedMessages()
      setSavedMessages(new Set(saved.map((m: { messageId: string }) => m.messageId)))
      setSavedMessagesList(saved)

      setIsHydrated(true)
    }
    loadData()
  }, [currentProjectId])

  const filteredMentionables = useMemo(() => {
    return filterMentionables(mentionables, mentionQuery)
  }, [mentionQuery, mentionables])

  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        const reasoningPart = message.parts.find((p) => p.type === 'reasoning')
        const textPart = message.parts.find((p) => p.type === 'text')

        if (reasoningPart && textPart && textPart.text && textPart.text.length > 0) {
          if (!autoClosedReasoning.current.has(message.id)) {
            const isCurrentlyOpen = reasoningOpen[message.id] ?? true
            if (isCurrentlyOpen) {
              setReasoningOpen((prev) => ({ ...prev, [message.id]: false }))
              autoClosedReasoning.current.add(message.id)
            }
          }
        }
      }
    })
  }, [messages, reasoningOpen])

  useEffect(() => {
    if (!isHydrated) return
    if (!messages.length) return

    if (isPersistingRef.current) {
      return
    }

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current)
    }

    persistTimeoutRef.current = setTimeout(async () => {
      if (isPersistingRef.current) return

      isPersistingRef.current = true
      try {
        await persistConversationRef.current(messages, conversationId, setHistoryRef.current, context.agentMode, currentProjectId || undefined)
      } finally {
        isPersistingRef.current = false
      }
    }, 500)

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current)
      }
    }
  }, [conversationId, isHydrated, messages, currentProjectId])

  useEffect(() => {
    if (context.agentMode === 'standard' && agentStore.isActive) {
      agentStore.stopAgent()
    }
  }, [context.agentMode, agentStore])

  useEffect(() => {
    const handleSetThema = (event: CustomEvent<{ thema: string }>) => {
      const { thema } = event.detail
      if (thema && agentStore.setThema) {
        agentStore.setThema(thema)
        devLog('📝 [ASK-AI-PANE] Thema gesetzt:', thema)
      }
    }

    window.addEventListener('set-agent-thema', handleSetThema as EventListener)
    return () => {
      window.removeEventListener('set-agent-thema', handleSetThema as EventListener)
    }
  }, [agentStore])

  const handlers = createHandlers({
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
    setSending: setIsSending,
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
  })

  const {
    resetChat,
    handleSend,
    handleRegenerate,
    handleEditLastMessage: _originalHandleEditLastMessage,
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
  } = handlers
  void _originalHandleEditLastMessage

  /**
   * Aktiviert den Bearbeitungsmodus für die letzte User-Nachricht.
   * Setzt die Nachricht-ID und den Inhalt für die Inline-Bearbeitung.
   */
  const handleEditLastMessage = () => {
    if (isSending) return

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")

    if (!lastUserMessage) {
      toast.error("Keine Nachricht zum Bearbeiten gefunden.")
      return
    }

    setEditingMessageId(lastUserMessage.id)
    setEditingContent(lastUserMessage.content)
  }

  /**
   * Speichert eine bearbeitete Nachricht und generiert eine neue Antwort.
   * Ersetzt die alte Nachricht, entfernt alle nachfolgenden Nachrichten und ruft die API auf.
   * 
   * @param messageId - Die ID der zu bearbeitenden Nachricht
   */
  const handleSaveEditedMessage = async (messageId: string) => {
    if (isSending || !editingContent.trim()) return

    const trimmed = editingContent.trim()
    const messageIndex = messages.findIndex((m) => m.id === messageId)

    if (messageIndex < 0) return

    const originalMessage = messages[messageIndex]

    const updatedMessages = messages.slice(0, messageIndex)
    const editedMessage: ChatMessage = {
      ...originalMessage,
      content: trimmed,
    }

    const assistantId = crypto.randomUUID()
    setMessages([...updatedMessages, editedMessage, { id: assistantId, role: "assistant", content: "" }])
    setEditingMessageId(null)
    setEditingContent("")

    const arbeitType = detectArbeitType(trimmed)
    const thema = extractThema(trimmed)

    const historyPayload = [...updatedMessages, editedMessage].slice(-20)

    setIsSending(true)
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

      const resolvedThema = agentStore.thema || thema || (context.agentMode === 'general' ? trimmed.substring(0, 100) : null)

      const isAgentModeForEditor = context.agentMode === 'bachelor' || context.agentMode === 'general' ||
        (agentStore.isActive && (currentArbeitType === 'bachelor' || currentArbeitType === 'master' || currentArbeitType === 'general'))
      const shouldFetchEditorContent = isAgentModeForEditor || context.document
      const editorContent = shouldFetchEditorContent ? await getEditorContentAsMarkdown() : ''

      const isWebSearchAgent = context.agentMode === 'standard' && context.web && apiEndpoint === "/api/ai/agent/websearch"

      let messageContextText = ''
      if (editedMessage.context && editedMessage.context.length > 0) {
        const contextTexts = editedMessage.context.map((ctx) => ctx.text).join('\n\n')
        messageContextText = `\n\n---\n\n**WICHTIG: Vom Nutzer markierter Text aus einer vorherigen Nachricht**\n\nDer Nutzer hat folgenden Text aus einer vorherigen Nachricht markiert und möchte mehr darüber erfahren:\n\n${contextTexts}\n\n**Bitte beziehe dich ausführlich auf diesen markierten Text und gib detaillierte Informationen dazu.**`
      }

      const contextSummary = buildContextSummary(trimmed, files, context, selectedMentions)

      const requestBody = (context.agentMode !== 'standard' || isWebSearchAgent)
        ? {
          messages: historyPayload.map((m) => {
            if (m.role === 'user' && m.id === editedMessage.id && messageContextText) {
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
          projectId: currentProjectId || undefined,
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
        throw new Error(errorMessage)
      }

      if (!res.body) {
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
        devError("Fehler in handleSaveEditedMessage:", error)
      }
    } finally {
      setIsSending(false)
      setStreamingId(null)
      setAbortController(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  /**
   * Speichert oder entfernt eine Nachricht aus den Favoriten.
   * 
   * @param messageId - Die ID der Nachricht, die gespeichert/entfernt werden soll
   */
  const handleSaveMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return

    if (savedMessages.has(messageId)) {
      await removeSavedMessage(messageId)
      setSavedMessages(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
      setSavedMessagesList(prev => prev.filter(m => m.messageId !== messageId))
    } else {
      const saved = await saveMessage(message, conversationId)
      setSavedMessages(prev => new Set(prev).add(messageId))
      setSavedMessagesList(prev => [saved, ...prev.filter(m => m.messageId !== message.id)])
    }
  }

  /**
   * Navigiert zu einer gespeicherten Nachricht in der Chat-Historie.
   * Lädt die entsprechende Konversation und scrollt zur Nachricht.
   * 
   * @param savedMessage - Objekt mit messageId und conversationId
   */
  const handleNavigateToMessage = (savedMessage: { messageId: string; conversationId: string }) => {
    const conversation = history.find(c => c.id === savedMessage.conversationId)
    if (conversation) {
      setConversationId(savedMessage.conversationId)
      setMessages(conversation.messages)
      setFavoritesDialogOpen(false)

      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${savedMessage.messageId}"]`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          messageElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
          setTimeout(() => {
            messageElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
          }, 2000)
        }
      }, 100)
    }
  }

  /**
   * Löscht einen Chat aus der Historie (Supabase und localStorage).
   * Startet einen neuen Chat, falls der gelöschte Chat aktuell geladen war.
   */
  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return

    try {
      const userId = await getCurrentUserId()

      if (userId) {
        await chatMessagesUtils.deleteChatMessagesByConversation(chatToDelete.id)
        await chatConversationsUtils.deleteChatConversation(chatToDelete.id, userId)
      }

      if (typeof window !== 'undefined' && localStorage) {
        const stored = localStorage.getItem('ask-ai-chat-history')
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as StoredConversation[]
            if (Array.isArray(parsed)) {
              const filtered = parsed.filter((item) => item.id !== chatToDelete.id)
              localStorage.setItem('ask-ai-chat-history', JSON.stringify(filtered))
            }
          } catch {
            // Ignoriere Fehler beim Parsen
          }
        }
      }

      const loadedHistory = await loadChatHistory(currentProjectId || undefined)
      setHistory(loadedHistory)

      if (conversationId === chatToDelete.id) {
        if (abortController) {
          abortController.abort()
        }
        setConversationId(crypto.randomUUID())
        setMessages([])
        setStreamingId(null)
        setFeedback({})
        setSelectedMentions([])
        setInput("")
        setFiles(null)
        setAbortController(null)
        setHistoryOpen(false)
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 100)
      }

      toast.success(translations.chatDeleted)

      setChatToDelete(null)
    } catch (error) {
      devError('Fehler beim Löschen des Chats:', error)
      toast.error(translations.chatDeleteError)
    }
  }

  const renderers = createRenderers({
    lastAssistantId,
    lastUserId,
    feedback,
    isSending,
    sourcesDialogOpen,
    setSourcesDialogOpen,
    handleFeedback,
    handleRegenerate,
    handleEditLastMessage,
    handleSaveMessage,
    savedMessages,
    editingMessageId,
    editingContent,
    handleCancelEdit,
    handleSaveEditedMessage,
  })

  const { renderAssistantActions, renderUserActions } = renderers

  useEffect(() => {
    if (isHydrated && messages.length === 0) {
      focusMessageInput()
    }
  }, [isHydrated, messages.length, focusMessageInput])

  const hasMessages = messages.some((m) => m.role === "assistant" || m.role === "user")

  return (
    <div
      data-onboarding="ask-ai-pane"
      className={cn(
        "bg-background text-foreground flex h-full min-h-0 w-full flex-col px-3 pb-3 pt-0 border-r border-border/70",
        className
      )}
    >
      <div className="mt-1.5 flex items-center justify-between gap-1.5 sm:gap-2 pb-2 sm:pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold">
            <span>{translations.title}</span>
            <MessageSquareQuote className="size-4" />
            <Badge
              variant="outline"
              className={cn(
                "ml-2 h-5 px-1.5 text-[10px] font-medium border-transparent",
                context.agentMode === 'bachelor'
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : context.agentMode === 'general'
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              )}
            >
              {context.agentMode === 'bachelor'
                ? translations.bachelorMasterAgent
                : context.agentMode === 'general'
                  ? translations.essayAgent
                  : translations.standardChat}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-md border border-border/60 bg-background hover:bg-muted transition-colors text-foreground"
                aria-label={translations.favorites}
                onClick={() => setFavoritesDialogOpen(true)}
              >
                <Bookmark className="size-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{translations.favorites}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-md border border-border/60 bg-background hover:bg-muted transition-colors text-foreground"
                aria-label={translations.chatHistory}
                onClick={() => setHistoryOpen((v) => !v)}
              >
                <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{translations.chatHistory}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-md border border-border/60 bg-background hover:bg-muted transition-colors text-foreground"
                onClick={resetChat}
                aria-label={translations.newChat}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{translations.newChat}</TooltipContent>
          </Tooltip>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 sm:h-7 sm:w-7 bg-transparent"
            onClick={handleClose}
            aria-label={translations.closePanel}
          >
            <PanelLeftClose className="size-3.5 sm:size-4" />
          </Button>
        </div>
      </div>

      <Card className="relative flex h-full min-h-0 flex-1 flex-col overflow-visible py-0 border-0 shadow-none bg-transparent">
        <div className="flex-1 min-h-0 overflow-hidden pb-2 sm:pb-0 relative">
          <ChatSelectionToolbar
            messages={messages}
            setMessages={setMessages}
            conversationId={conversationId}
            input={input}
            setInput={setInput}
            pendingContext={pendingContext}
            setPendingContext={setPendingContext}
          />
          <Conversation className="h-full [&::-webkit-scrollbar]:!hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <ConversationContent className="pb-4">
              {hasMessages &&
                messages.map((message) => (
                  <Message from={message.role} key={message.id} data-message-id={message.id}>
                    <MessageContent className={message.role === "assistant" ? "w-full" : "w-full items-end"}>
                      <Response
                        className={
                          message.role === "assistant"
                            ? "w-full border-0 bg-transparent shadow-none px-0 py-0"
                            : editingMessageId === message.id
                              ? "w-[95%] border-0 bg-muted/50 rounded-xl rounded-tr-sm px-4 py-3 ml-auto"
                              : `max-w-[85%] border-0 bg-muted/50 rounded-xl rounded-tr-sm px-4 py-3 ml-auto ${expandedMessages.has(message.id) ? "" : "max-h-[70vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"}`
                        }
                      >
                        {message.role === "assistant" ? (
                          <div className="space-y-4">
                            {message.parts && message.parts.length > 0 ? (
                              message.parts.map((part, idx) => {
                                if (part.type === 'reasoning') {
                                  return (
                                    <Collapsible
                                      key={`reasoning-${idx}`}
                                      open={reasoningOpen[message.id] ?? true}
                                      onOpenChange={(open) => setReasoningOpen((prev) => ({ ...prev, [message.id]: open }))}
                                    >
                                      <CollapsibleTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-auto py-2 text-xs text-muted-foreground hover:text-foreground w-full justify-start -ml-3 pl-3 [&[data-state=open]>svg]:rotate-180">
                                          {translations.showReasoning}
                                          <ChevronDown className="h-3 w-3 ml-1.5 transition-transform duration-200" />
                                        </Button>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent className="max-h-[50vh] overflow-y-auto transition-all duration-200 ease-in-out [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                        <div className="text-xs mt-2 p-3 bg-none border-none max-w-none text-muted-foreground">
                                          <PlateMarkdown id={`${message.id}-reasoning-${idx}`}>
                                            {part.reasoning}
                                          </PlateMarkdown>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  )
                                }

                                if (part.type === 'text') {
                                  return part.text ? (
                                    <PlateMarkdown key={`text-${idx}`} id={`${message.id}-text-${idx}`}>
                                      {part.text}
                                    </PlateMarkdown>
                                  ) : null
                                }

                                if (part.type === 'tool-step') {
                                  return (
                                    <AgentStepperView
                                      key={`step-${part.toolStep.id}`}
                                      steps={[part.toolStep]}
                                      minimal={true}
                                    />
                                  )
                                }

                                return null
                              })
                            ) : (
                              <>
                                {message.toolSteps && message.toolSteps.length > 0 && (
                                  <AgentStepperView steps={message.toolSteps} />
                                )}

                                {message.reasoning && (
                                  <Collapsible defaultOpen={false}>
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-auto py-2 text-xs text-muted-foreground hover:text-foreground w-full justify-start -ml-3 pl-3">
                                        <Brain className="h-3 w-3 mr-1.5" />
                                        {translations.showReasoning}
                                        <ChevronDown className="h-3 w-3 ml-1.5" />
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="px-3 bg-none border-none max-w-none text-muted-foreground">
                                        <PlateMarkdown id={`${message.id}-reasoning-fallback`}>
                                          {message.reasoning}
                                        </PlateMarkdown>
                                      </div>
                                    </CollapsibleContent>
                                  </Collapsible>
                                )}

                                {message.content ? (
                                  <PlateMarkdown id={`${message.id}-content-fallback`}>
                                    {message.content}
                                  </PlateMarkdown>
                                ) : streamingId === message.id ? (
                                  message.toolSteps && message.toolSteps.length > 0 ? null : <StreamingShimmer />
                                ) : (
                                  translations.noAnswerAvailable
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {message.context && message.context.length > 0 && (
                              <div className="space-y-1.5">
                                {message.context.map((ctx, ctxIdx) => (
                                  <div
                                    key={`context-${ctxIdx}`}
                                    className="flex items-start gap-2 text-xs text-muted-foreground/80 italic"
                                  >
                                    <MessageSquareQuote className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-60" />
                                    <span className="line-clamp-2">
                                      {ctx.text.length > 80 ? `${ctx.text.slice(0, 80)}...` : ctx.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {message.files && message.files.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {message.files.map((file, idx) => (
                                  <div
                                    key={`${file.name}-${idx}`}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] text-primary"
                                  >
                                    <FileText className="h-3 w-3" />
                                    <span className="truncate max-w-[120px] font-medium">
                                      {file.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {editingMessageId === message.id ? (
                              <div className="relative w-full ml-auto">
                                <textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="w-full min-h-[2em] max-h-[70vh] p-0 text-sm bg-transparent border-none focus:outline-none resize-none field-sizing-content"
                                  style={{ fieldSizing: 'content' } as React.CSSProperties}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                      handleCancelEdit()
                                    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                      handleSaveEditedMessage(message.id)
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="whitespace-pre-wrap break-words">
                                  {message.content || (streamingId === message.id ? <StreamingShimmer /> : translations.noAnswerAvailable)}
                                </div>
                                {!expandedMessages.has(message.id) && message.content && message.content.length > 500 && (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedMessages(prev => new Set(prev).add(message.id))}
                                    className="absolute bottom-0 left-0 right-0 flex items-center justify-center pt-8 pb-1 bg-gradient-to-t from-muted/50 to-transparent"
                                  >
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </Response>
                      {message.role === "assistant"
                        ? renderAssistantActions(message)
                        : renderUserActions(message)}
                    </MessageContent>
                  </Message>
                ))}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
        </div>

        <div className="bg-background px-2.5 sm:px-3 py-2 sm:py-2.5 sticky bottom-0 z-10 border border-r border-primary/60 rounded-md">
          <form onSubmit={handleSend} className="relative space-y-2 w-full max-w-full">
            <div className="relative w-full flex flex-col items-center">
              {selectedMentions.length > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-1.5 w-full">
                  {selectedMentions.map((mention) => (
                    <Badge
                      key={mention.id}
                      variant="outline"
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-muted/50 border-border/50 text-foreground"
                    >
                      <span className="truncate max-w-[140px]">{mention.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMention(mention.id)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                        aria-label={`${mention.label} ${translations.removeMention}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              {mentionQuery !== null && filteredMentionables.length > 0 && (
                <div className="absolute bottom-[100%] left-0 z-20 mb-1.5 sm:mb-2 w-full rounded-lg border border-border/60 bg-popover shadow-lg">
                  <div className="px-3 py-2 border-b border-border/40">
                    <span className="text-xs font-medium text-muted-foreground">Kontext hinzufügen</span>
                  </div>
                  <div className="max-h-48 overflow-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredMentionables.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                        onClick={() => handleMentionSelect(item)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-sm truncate">{item.label}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {item.type === 'citation' ? 'Zitat' : item.type === 'document' ? 'Dokument' : 'Prompt'}
                          </span>
                        </div>
                        {item.hint && (
                          <div className="text-muted-foreground text-xs mt-0.5 truncate">{item.hint}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mentionQuery === null && slashQuery !== null && (
                <div className="absolute bottom-[100%] left-0 z-20 mb-1.5 sm:mb-2 w-full rounded-lg border border-border/60 bg-popover shadow-lg">
                  <div className="px-3 py-2 border-b border-border/40">
                    <span className="text-xs font-medium text-muted-foreground">Schnellbefehle</span>
                  </div>
                  <div className="max-h-48 overflow-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {slashCommands
                      .filter((cmd) =>
                        slashQuery
                          ? cmd.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
                          cmd.content.toLowerCase().includes(slashQuery.toLowerCase())
                          : true
                      )
                      .map((cmd) => (
                        <button
                          type="button"
                          key={cmd.id}
                          className="w-full px-3 py-2 text-left hover:bg-muted transition-colors"
                          onClick={() => handleSlashInsert(cmd)}
                        >
                          <div className="font-medium text-sm truncate">{cmd.label}</div>
                          <div className="text-muted-foreground text-xs mt-0.5 line-clamp-2">
                            {cmd.content}
                          </div>
                        </button>
                      ))}
                  </div>
                  <div className="border-t border-border/40 p-2">
                    <button
                      type="button"
                      className="w-full rounded-md border border-border/60 bg-muted/50 text-foreground px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
                      onClick={handleSlashCreate}
                    >
                      {translations.saveCommand}
                    </button>
                  </div>
                </div>
              )}
              <div className="w-full">
                <MessageInput
                  textAreaRef={messageInputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={translations.placeholder}
                  isGenerating={isSending}
                  allowAttachments
                  files={files}
                  setFiles={setFiles}
                  onAudioError={(err) => {
                    toast.error(translations.audioError)
                  }}
                  stop={handleStop}
                  pendingContext={pendingContext}
                  onRemoveContext={(index) => {
                    setPendingContext((prev) => prev.filter((_, i) => i !== index))
                  }}
                  contextActions={
                    <>
                      <Select
                        value={context.agentMode}
                        onValueChange={(value: AgentMode) => {
                          setContext((prev) => {
                            const document = value === 'standard' ? false : prev.document
                            return { ...prev, agentMode: value, document }
                          })
                        }}
                      >
                        <SelectTrigger className="h-8 max-w-32 text-xs border-0 bg-transparent shadow-none focus:ring-0 focus:outline-none [&>span]:pr-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="bachelor">{translations.bachelorMasterAgent}</SelectItem>
                          <SelectItem value="general" className="text-xs">
                            {translations.essayAgent}
                          </SelectItem>
                          <SelectItem value="standard">{translations.standardChat}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant={context.document ? "secondary" : "ghost"}
                            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 flex items-center justify-center"
                            onClick={() => toggleContext("document")}
                            aria-label={translations.enableContext}
                          >
                            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 m-auto" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{translations.enableContext}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant={context.web ? "secondary" : "ghost"}
                            className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 flex items-center justify-center"
                            onClick={() => toggleContext("web")}
                            aria-label={translations.enableWebSearch}
                          >
                            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 m-auto" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{translations.enableWebSearch}</TooltipContent>
                      </Tooltip>
                    </>
                  }
                />
              </div>
            </div>
          </form>
        </div>

        <Dialog
          open={historyOpen}
          onOpenChange={(open) => {
            setHistoryOpen(open)
            if (!open) {
              focusMessageInput()
            }
          }}
        >
          <DialogContent className="max-w-sm sm:max-w-sm md:max-w-sm overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>{translations.chatHistoryTitle}</DialogTitle>
            </DialogHeader>
            <div className="mb-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-2 flex items-center text-muted-foreground">
                  <Search className="size-4" />
                </span>
                <input
                  className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm focus-visible:outline-none"
                  placeholder={translations.searchChats}
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground max-h-64 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {filteredHistory.length ? (
                filteredHistory.map((item) => {
                  const lastRelevantMessage =
                    [...item.messages]
                      .reverse()
                      .find((m) => m.role === "assistant" || m.role === "user")
                      ?.content ?? translations.noMessages

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="relative w-full rounded-md border border-border/70 bg-muted/40 px-3 py-3 text-left text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                      onClick={() => handleLoadConversation(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleLoadConversation(item.id)
                        }
                      }}
                    >
                      <div className="flex items-start gap-1.5">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-sm font-medium truncate">
                            {item.title || translations.newChatTitle}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {lastRelevantMessage}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                            {new Date(item.updatedAt).toLocaleString(language)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              setChatToDelete({ id: item.id, title: item.title || translations.newChatTitle })
                            }}
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="rounded-md border border-dashed border-border/70 bg-muted/50 px-3 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Search className="size-4 text-muted-foreground" />
                    {historyQuery.trim()
                      ? `${translations.noResultsFor} „${historyQuery.trim()}“`
                      : translations.noChatHistory}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {historyQuery.trim()
                      ? translations.adjustSearch
                      : translations.startNewChat}
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {historyQuery.trim() && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  onClick={() => setHistoryQuery("")}
                >
                  {translations.resetSearch}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs bg-muted-foreground/10 dark:bg-muted-foreground/10 text-foreground border-border hover:bg-muted-foreground/30 dark:hover:bg-muted-foreground/20"
                onClick={handleStartNewChatFromHistory}
              >
                {translations.startNewChatButton}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={!!chatToDelete}
          onOpenChange={(open) => {
            if (!open) setChatToDelete(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{translations.deleteChatTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${chatToDelete?.title ?? translations.newChatTitle}"`} {translations.deleteChatDescription}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setChatToDelete(null)}>{translations.cancel}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteChat}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {translations.delete}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={favoritesDialogOpen}
          onOpenChange={(open) => {
            setFavoritesDialogOpen(open)
            if (!open) {
              focusMessageInput()
            }
          }}
        >
          <DialogContent className="max-w-sm sm:max-w-sm md:max-w-sm overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <DialogHeader>
              <DialogTitle>{translations.favoritesTitle}</DialogTitle>
              <DialogDescription>
                {translations.favoritesDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 text-sm text-muted-foreground max-h-64 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {savedMessagesList.length > 0 ? (
                savedMessagesList.map((saved) => {
                  const conversation = history.find(c => c.id === saved.conversationId)
                  const conversationTitle = conversation?.title || translations.unknownChat

                  return (
                    <button
                      key={saved.id}
                      type="button"
                      className="w-full rounded-md border border-border/70 bg-muted/40 px-3 py-3 text-left text-foreground hover:bg-muted/70 transition-colors"
                      onClick={() => handleNavigateToMessage(saved)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-medium text-xs text-muted-foreground truncate">
                            {conversationTitle}
                          </div>
                          <div className="text-xs text-foreground line-clamp-3">
                            {saved.preview}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(saved.timestamp).toLocaleDateString(language)}
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="rounded-md border border-dashed border-border/70 bg-muted/50 px-3 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Bookmark className="size-4 text-muted-foreground" />
                    {translations.noFavorites}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {translations.saveMessageHint}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={slashDialogOpen}
          onOpenChange={(open) => {
            setSlashDialogOpen(open)
            if (!open) {
              focusMessageInput()
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{translations.saveCommandTitle}</DialogTitle>
              <DialogDescription>
                {translations.saveCommandDescription}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">{translations.label}</label>
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none"
                  value={newSlashLabel}
                  onChange={(e) => setNewSlashLabel(e.target.value)}
                  placeholder={translations.labelPlaceholder}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">{translations.command}</label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-1 py-1 text-sm focus-visible:outline-none"
                  rows={4}
                  value={newSlashContent}
                  onChange={(e) => setNewSlashContent(e.target.value)}
                  placeholder={translations.commandPlaceholder}
                />
              </div>
            </div>
            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button variant="ghost">{translations.cancel}</Button>
              </DialogClose>
              <Button
                disabled={!newSlashLabel.trim() || !newSlashContent.trim()}
                onClick={async () => {
                  const content = newSlashContent.trim()
                  if (!content) return
                  const label = newSlashLabel.trim()
                  if (!label) return

                  const newCommand: SlashCommand = {
                    id: crypto.randomUUID(),
                    label,
                    content,
                  }

                  try {
                    const savedCommand = await saveSingleSlashCommand(newCommand)
                    const reloadedCommands = await loadSlashCommands()
                    setSlashCommands(reloadedCommands)
                    toast.success(t('askAi.commandSaved'))
                  } catch (error) {
                    console.error('Fehler beim Speichern des Commands:', error)
                    toast.error(t('askAi.commandSaveError'))
                    const next = [...slashCommands, newCommand]
                    setSlashCommands(next)
                  }

                  setSlashDialogOpen(false)
                  setNewSlashContent("")
                  setNewSlashLabel("")
                  focusMessageInput()
                }}
              >
                {translations.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

    </div >
  )
}

