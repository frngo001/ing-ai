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
} from "lucide-react"
import { PlateMarkdown } from "@/components/ui/plate-markdown"

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
  defaultContext,
  addSourcesToLibrary,
  saveSlashCommands,
  loadSlashCommands,
  persistConversation,
  loadChatHistory,
  saveMessage,
  removeSavedMessage,
  loadSavedMessages,
  filterMentionables,
  StreamingShimmer,
  useMentionables,
  useMentionQuery,
  useSlashQuery,
  useFilteredHistory,
  createHandlers,
  createRenderers,
} from "@/lib/ask-ai-pane"

// Re-export MessagePart for external use
export type { MessagePart }

// All markdown utilities, components, and streaming shimmer are now imported from @/lib/ask-ai-pane

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
  const autoClosedReasoning = useRef<Set<string>>(new Set())
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPersistingRef = useRef(false)
  // Stabile Referenzen für persistConversation und setHistory
  const persistConversationRef = useRef(persistConversation)
  persistConversationRef.current = persistConversation
  const setHistoryRef = useRef(setHistory)
  setHistoryRef.current = setHistory

  // Memoized translations that update on language change
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
  }), [t, language])
  
  const lastAssistantId = useMemo(
    () => [...messages].reverse().find((m) => m.role === "assistant")?.id ?? null,
    [messages]
  )

  const mentionables = useMentionables(citations || [])
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
      const loadedHistory = await loadChatHistory()
      setHistory(loadedHistory)
      if (loadedHistory[0]) {
        setConversationId(loadedHistory[0].id)
        setMessages(loadedHistory[0].messages)
      }
      
      // Lade gespeicherte Nachrichten
      const saved = await loadSavedMessages()
      setSavedMessages(new Set(saved.map((m: { messageId: string }) => m.messageId)))
      setSavedMessagesList(saved)
      
      setIsHydrated(true)
    }
    loadData()
  }, [])

  const filteredMentionables = useMemo(() => {
    return filterMentionables(mentionables, mentionQuery)
  }, [mentionQuery, mentionables])

  // Schließe Reasoning automatisch, sobald finale Antwort beginnt (nur einmal pro Nachricht)
  useEffect(() => {
    messages.forEach((message) => {
      if (message.role === 'assistant' && message.parts) {
        const reasoningPart = message.parts.find((p) => p.type === 'reasoning')
        const textPart = message.parts.find((p) => p.type === 'text')
        
        // Wenn finale Antwort vorhanden ist und Reasoning noch nicht automatisch geschlossen wurde
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
    
    // Verhindere parallele Aufrufe
    if (isPersistingRef.current) {
      // Wenn bereits ein Persist-Vorgang läuft, warte bis er fertig ist
      return
    }
    
    // Lösche vorherigen Timeout
    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current)
    }
    
    // Debounce: Warte 500ms nach der letzten Änderung
    persistTimeoutRef.current = setTimeout(async () => {
      // Prüfe erneut, ob bereits ein Persist-Vorgang läuft
      if (isPersistingRef.current) return
      
      isPersistingRef.current = true
      try {
        await persistConversationRef.current(messages, conversationId, setHistoryRef.current)
      } finally {
        isPersistingRef.current = false
      }
    }, 500)
    
    // Cleanup
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current)
      }
    }
  }, [conversationId, isHydrated, messages])

  // Stoppe Agent wenn Modus auf 'standard' geändert wird
  useEffect(() => {
    if (context.agentMode === 'standard' && agentStore.isActive) {
      agentStore.stopAgent()
    }
  }, [context.agentMode, agentStore])

  // Event-Listener für set-agent-thema
  useEffect(() => {
    const handleSetThema = (event: CustomEvent<{ thema: string }>) => {
      const { thema } = event.detail
      if (thema && agentStore.setThema) {
        agentStore.setThema(thema)
        console.log('📝 [ASK-AI-PANE] Thema gesetzt:', thema)
      }
    }

    window.addEventListener('set-agent-thema', handleSetThema as EventListener)
    return () => {
      window.removeEventListener('set-agent-thema', handleSetThema as EventListener)
    }
  }, [agentStore])

  // Create handlers
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
    messageInputRef,
    toast,
    onClose,
    setContext,
  })

  const {
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
  } = handlers

  // Handler für gespeicherte Nachrichten
  const handleSaveMessage = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message) return
    
    if (savedMessages.has(messageId)) {
      // Entferne aus Favoriten
      await removeSavedMessage(messageId)
      setSavedMessages(prev => {
        const next = new Set(prev)
        next.delete(messageId)
        return next
      })
      setSavedMessagesList(prev => prev.filter(m => m.messageId !== messageId))
    } else {
      // Füge zu Favoriten hinzu
      const saved = await saveMessage(message, conversationId)
      setSavedMessages(prev => new Set(prev).add(messageId))
      setSavedMessagesList(prev => [saved, ...prev.filter(m => m.messageId !== message.id)])
    }
  }

  // Handler für Navigation zu einer Nachricht
  const handleNavigateToMessage = (savedMessage: { messageId: string; conversationId: string }) => {
    // Lade die Konversation
    const conversation = history.find(c => c.id === savedMessage.conversationId)
    if (conversation) {
      setConversationId(savedMessage.conversationId)
      setMessages(conversation.messages)
      setFavoritesDialogOpen(false)
      
      // Scroll zur Nachricht nach kurzer Verzögerung
      setTimeout(() => {
        const messageElement = document.querySelector(`[data-message-id="${savedMessage.messageId}"]`)
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Highlight kurz
          messageElement.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
          setTimeout(() => {
            messageElement.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
          }, 2000)
        }
      }, 100)
    }
  }

  // Handler zum Löschen eines Chats
  const handleConfirmDeleteChat = async () => {
    if (!chatToDelete) return

    try {
      const userId = await getCurrentUserId()
      
      if (userId) {
        // Lösche Messages zuerst (wegen Foreign Key Constraint)
        await chatMessagesUtils.deleteChatMessagesByConversation(chatToDelete.id)
        // Lösche Conversation
        await chatConversationsUtils.deleteChatConversation(chatToDelete.id, userId)
      }

      // Lösche auch aus localStorage falls vorhanden
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

      // Lade History neu
      const loadedHistory = await loadChatHistory()
      setHistory(loadedHistory)

      // Wenn der gelöschte Chat aktuell geladen war, starte einen neuen Chat
      if (conversationId === chatToDelete.id) {
        // Stoppe laufende Requests
        if (abortController) {
          abortController.abort()
        }
        // Starte neuen Chat
        setConversationId(crypto.randomUUID())
        setMessages([])
        setStreamingId(null)
        setFeedback({})
        setSelectedMentions([])
        setInput("")
        setFiles(null)
        setAbortController(null)
        // Schließe History-Dialog falls offen
        setHistoryOpen(false)
        // Fokussiere Input
        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 100)
      }

      toast.success(translations.chatDeleted)

      setChatToDelete(null)
    } catch (error) {
      console.error('Fehler beim Löschen des Chats:', error)
      toast.error(translations.chatDeleteError)
    }
  }

  // Create renderers
  const renderers = createRenderers({
    lastAssistantId,
    feedback,
    isSending,
    sourcesDialogOpen,
    setSourcesDialogOpen,
    handleFeedback,
    handleRegenerate,
    handleSaveMessage,
    savedMessages,
  })

  const { renderAssistantActions, renderUserActions } = renderers

  useEffect(() => {
    if (isHydrated && messages.length === 0) {
    focusMessageInput()
  }
  }, [isHydrated, messages.length, focusMessageInput])

  const hasMessages = messages.some((m) => m.role === "assistant" || m.role === "user")

  return (
    <div className={cn(
      "bg-background text-foreground flex h-full min-h-0 w-full flex-col px-3 pb-3 pt-0 border-r border-border/70",
      className
    )}>
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
        <div className="flex-1 min-h-0 overflow-hidden pb-2 sm:pb-0">
          <Conversation className="h-full">
            <ConversationContent className="pb-4">
              {hasMessages &&
                messages.map((message) => (
                   <Message from={message.role} key={message.id} data-message-id={message.id}>
                    <MessageContent className={message.role === "assistant" ? "w-full" : undefined}>
                      <Response
                        className={
                          message.role === "assistant"
                            ? "w-full border-0 bg-transparent shadow-none px-0 py-0"
                            : "max-h-[15vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                        }
                      >
                        {message.role === "assistant" ? (
                          <div className="space-y-4">
                            {/* Render Parts in Reihenfolge (fuer Cursor-Feeling) */}
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
                                {/* Fallback fuer alte Nachrichten oder Nachrichten ohne Parts */}
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
                          <div className="space-y-2">
                            {/* Zeige Dateien vor der Nachricht */}
                            {message.files && message.files.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-2">
                                {message.files.map((file, idx) => (
                                  <div
                                    key={`${file.name}-${idx}`}
                                    className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 text-xs"
                                  >
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="truncate max-w-[200px] text-muted-foreground">
                                      {file.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground/70">
                                      ({(file.size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {message.content ||
                              (streamingId === message.id ? <StreamingShimmer /> : translations.noAnswerAvailable)}
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
                      variant="secondary"
                      className="flex items-center gap-1.5 px-2 py-1 text-xs"
                    >
                      <span className="truncate max-w-[150px]">{mention.label}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMention(mention.id)}
                        className="ml-0.5 hover:bg-muted-foreground/20 rounded-full p-0.5 transition-colors"
                        aria-label={`${mention.label} ${translations.removeMention}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="mb-2 flex items-center gap-1 w-full">
              </div>
              {mentionQuery !== null && filteredMentionables.length > 0 && (
                <div className="absolute bottom-[100%] left-0 z-20 mb-1.5 sm:mb-2 w-full rounded-md border border-border/60 bg-popover shadow-lg">
                  <div className="max-h-40 sm:max-h-48 overflow-auto py-1.5 sm:py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {filteredMentionables.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm hover:bg-muted"
                        onClick={() => handleMentionSelect(item)}
                      >
                        <div className="font-medium truncate">{item.label}</div>
                        {item.hint && (
                          <div className="text-muted-foreground text-[10px] sm:text-xs truncate">{item.hint}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mentionQuery === null && slashQuery !== null && (
                <div className="absolute bottom-[100%] left-0 z-20 mb-1.5 sm:mb-2 w-full rounded-md border border-border/60 bg-popover shadow-lg">
                  <div className="max-h-64 overflow-auto py-2 sm:py-3 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                          className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left text-sm sm:text-sm hover:bg-muted rounded-md"
                          onClick={() => handleSlashInsert(cmd)}
                        >
                          <div className="font-medium truncate">{cmd.label}</div>
                          <div className="text-muted-foreground text-[12px] sm:text-xs truncate">
                            {cmd.content}
                          </div>
                        </button>
                      ))}
                    <div className="border-t border-border/60 pt-2 px-3 sm:px-4 pb-1 sticky bottom-0 bg-popover">
                      <button
                        type="button"
                        className="w-full rounded-md border border-primary/50 bg-primary text-primary-foreground px-3 py-2 text-sm sm:text-sm font-medium hover:bg-primary/90 transition-colors"
                        onClick={handleSlashCreate}
                      >
                        {translations.saveCommand}
                      </button>
                    </div>
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
                  contextActions={
                    <>
                      <Select
                        value={context.agentMode}
                        onValueChange={(value: AgentMode) => {
                          setContext((prev) => ({ ...prev, agentMode: value }))
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="font-medium truncate">
                            {item.title || translations.newChatTitle}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {lastRelevantMessage}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {new Date(item.updatedAt).toLocaleString(language)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute bottom-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setChatToDelete({ id: item.id, title: item.title || translations.newChatTitle })
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
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

        {/* Bestätigungsdialog zum Löschen eines Chats */}
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

        {/* Favoriten Dialog */}
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
                onClick={() => {
                  const content = newSlashContent.trim()
                  if (!content) return
                  const label = newSlashLabel.trim()
                  if (!label) return
                  const newCommand: SlashCommand = {
                    id: crypto.randomUUID(),
                    label,
                    content,
                  }
                  const next = [...slashCommands, newCommand]
                  setSlashCommands(next)
                  saveSlashCommands(next)
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

