"use client"

import React, { useEffect, useRef, useState, useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowUp, Info, Loader2, Mic, Paperclip, Square, X, ChevronsDown } from "lucide-react"
import { omit } from "remeda"

import { cn } from "@/lib/utils"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { useAutosizeTextArea } from "@/hooks/use-autosize-textarea"
import { AudioVisualizer } from "@/components/ui/audio-visualizer"
import { Button } from "@/components/ui/button"
import { FilePreview } from "@/components/ui/file-preview"
import { InterruptPrompt } from "@/components/ui/interrupt-prompt"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useLanguage } from "@/lib/i18n/use-language"
import { useToast } from "@/hooks/use-toast"
import { isSupportedFileType, getFileInputAccept, getSupportedExtensionsList } from "@/lib/file-extraction/file-types"
import type { MessageContext } from "@/lib/ask-ai-pane/types"

interface MessageInputBaseProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string
  submitOnEnter?: boolean
  stop?: () => void
  isGenerating: boolean
  enableInterrupt?: boolean
  textAreaRef?:
  | React.RefObject<HTMLTextAreaElement | null>
  | React.MutableRefObject<HTMLTextAreaElement | null>
  onAudioError?: (error: Error) => void
  onAudioStart?: () => void
  contextActions?: React.ReactNode
  pendingContext?: MessageContext[]
  onRemoveContext?: (index: number) => void
}

interface MessageInputWithoutAttachmentProps extends MessageInputBaseProps {
  allowAttachments?: false
}

interface MessageInputWithAttachmentsProps extends MessageInputBaseProps {
  allowAttachments: true
  files: File[] | null
  setFiles: React.Dispatch<React.SetStateAction<File[] | null>>
}

type MessageInputProps =
  | MessageInputWithoutAttachmentProps
  | MessageInputWithAttachmentsProps

export function MessageInput({
  placeholder = "Ask AI...",
  className,
  onKeyDown: onKeyDownProp,
  submitOnEnter = true,
  stop,
  isGenerating,
  enableInterrupt = true,
  textAreaRef,
  onAudioError,
  onAudioStart,
  contextActions,
  pendingContext,
  onRemoveContext,
  ...props
}: MessageInputProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [showInterruptPrompt, setShowInterruptPrompt] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Memoized translations that update on language change
  const translations = useMemo(() => ({
    attachFile: t('askAi.attachFile'),
    voiceInput: t('askAi.voiceInput'),
    stopGenerating: t('askAi.stopGenerating'),
    sendMessage: t('askAi.sendMessage'),
    dropFilesHere: t('askAi.dropFilesHere'),
    transcribingAudio: t('askAi.transcribingAudio'),
    clickToStopRecording: t('askAi.clickToStopRecording'),
    contextAdded: t('askAi.contextAdded'),
  }), [t, language])

  const {
    isListening,
    isSpeechSupported,
    isRecording,
    isTranscribing,
    audioStream,
    toggleListening,
    stopRecording,
  } = useAudioRecording({
    onTranscriptionComplete: (text) => {
      console.log("[speech] apply transcript to input", {
        length: text.length,
        preview: text.slice(0, 80),
      })
      props.onChange?.({ target: { value: text } } as any)
    },
    onError: onAudioError,
  })

  useEffect(() => {
    if (!isGenerating) {
      setShowInterruptPrompt(false)
    }
  }, [isGenerating])

  useEffect(() => {
    setIsClient(true)
  }, [])

  const addFiles = (files: File[] | null) => {
    if (props.allowAttachments && files) {
      // Validiere Dateitypen
      const supportedFiles: File[] = []
      const unsupportedFiles: string[] = []

      files.forEach((file) => {
        if (isSupportedFileType(file)) {
          supportedFiles.push(file)
        } else {
          unsupportedFiles.push(file.name)
        }
      })

      // Zeige Fehler für unsupported Dateien
      if (unsupportedFiles.length > 0) {
        const supportedList = getSupportedExtensionsList()
        toast.error(
          `Folgende Dateitypen werden nicht unterstützt: ${unsupportedFiles.join(', ')}. Unterstützte Formate: ${supportedList}`
        )
      }

      // Füge nur unterstützte Dateien hinzu
      if (supportedFiles.length > 0) {
        props.setFiles((currentFiles) => {
          if (currentFiles === null) {
            return supportedFiles
          }
          return [...currentFiles, ...supportedFiles]
        })
      }
    }
  }

  const onDragOver = (event: React.DragEvent) => {
    if (props.allowAttachments !== true) return
    event.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = (event: React.DragEvent) => {
    if (props.allowAttachments !== true) return
    event.preventDefault()
    setIsDragging(false)
  }

  const onDrop = (event: React.DragEvent) => {
    setIsDragging(false)
    if (props.allowAttachments !== true) return
    event.preventDefault()
    const dataTransfer = event.dataTransfer
    if (dataTransfer.files.length) {
      addFiles(Array.from(dataTransfer.files))
    }
  }

  const onPaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) return

    const files = Array.from(items)
      .map((item) => item.getAsFile())
      .filter((file) => file !== null)

    if (props.allowAttachments && files.length > 0) {
      addFiles(files)
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (submitOnEnter && event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()

      if (isGenerating && stop && enableInterrupt) {
        if (showInterruptPrompt) {
          stop()
          setShowInterruptPrompt(false)
          event.currentTarget.form?.requestSubmit()
        } else if (
          props.value ||
          (props.allowAttachments && props.files?.length)
        ) {
          setShowInterruptPrompt(true)
          return
        }
      }

      event.currentTarget.form?.requestSubmit()
    }

    onKeyDownProp?.(event)
  }

  const innerTextAreaRef = textAreaRef ?? useRef<HTMLTextAreaElement | null>(null)
  const [textAreaHeight, setTextAreaHeight] = useState<number>(0)

  useEffect(() => {
    if (innerTextAreaRef.current) {
      setTextAreaHeight(innerTextAreaRef.current.offsetHeight)
    }
  }, [props.value])

  const showFileList =
    props.allowAttachments && props.files && props.files.length > 0

  useAutosizeTextArea({
    ref: innerTextAreaRef,
    maxHeight: 320,
    minHeight: 60,
    borderWidth: 0,
    dependencies: [props.value, showFileList],
  })

  return (
    <div
      className="relative flex w-full max-w-full flex-col gap-1.5 rounded-lg border border-primary/60 bg-background/50 transition-all duration-200 focus-within:ring-1 focus-within:ring-primary/40 focus-within:bg-background/80 focus-within:border-primary focus-within:shadow-sm"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {enableInterrupt && (
        <InterruptPrompt
          isOpen={showInterruptPrompt}
          close={() => setShowInterruptPrompt(false)}
        />
      )}

      <RecordingPrompt
        isVisible={isRecording}
        onStopRecording={stopRecording}
        clickToStopRecording={translations.clickToStopRecording}
      />

      <div className="relative w-full space-y-2">
        {/* Zeige Kontext oben im Input-Feld */}
        {pendingContext && pendingContext.length > 0 && (
          <div className="px-2.5 pt-2 whitespace-normal space-y-2">
            {pendingContext.map((ctx, index) => (
              <div
                key={`context-${index}`}
                className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs shadow-sm transition-all animate-in fade-in slide-in-from-top-1"
              >
                <ChevronsDown className="h-3.5 w-3.5 mt-0.5 text-primary/70 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-muted-foreground/80 mb-0.5 text-[10px] font-medium uppercase tracking-wider">
                    {translations.contextAdded}
                  </div>
                  <div className="text-foreground/90 whitespace-pre-wrap break-words line-clamp-2 leading-relaxed">
                    {ctx.text}
                  </div>
                </div>
                {onRemoveContext && (
                  <button
                    type="button"
                    onClick={() => onRemoveContext(index)}
                    className="flex-shrink-0 h-5 w-5 rounded-md hover:bg-muted flex items-center justify-center transition-colors hover:text-destructive"
                    aria-label="Kontext entfernen"
                  >
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {props.allowAttachments && showFileList && (
          <ScrollArea className="pb-1 px-2.5">
            <div className="flex gap-2 sm:gap-3">
              <AnimatePresence mode="popLayout">
                {props.files?.map((file) => {
                  return (
                    <FilePreview
                      key={file.name + String(file.lastModified)}
                      file={file}
                      onRemove={() => {
                        props.setFiles((files) => {
                          if (!files) return null
                          const filtered = Array.from(files).filter((f) => f !== file)
                          if (filtered.length === 0) return null
                          return filtered
                        })
                      }}
                    />
                  )
                })}
              </AnimatePresence>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        )}

        <textarea
          aria-label="Write your prompt here"
          placeholder={placeholder}
          ref={innerTextAreaRef}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          className={cn(
            "z-10 w-full resize-none bg-transparent p-2.5 sm:p-3 text-sm ring-0 focus:ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 focus-visible:outline-none border-0 shadow-none disabled:cursor-not-allowed disabled:opacity-50 overflow-y-auto scrollbar-none min-h-[60px]",
            className
          )}
          {...(props.allowAttachments
            ? omit(props, ["allowAttachments", "files", "setFiles"])
            : omit(props, ["allowAttachments"]))}
        />


        {props.allowAttachments && <FileUploadOverlay isDragging={isDragging} dropFilesHere={translations.dropFilesHere} />}

        <RecordingControls
          isRecording={isRecording}
          isTranscribing={isTranscribing}
          audioStream={audioStream}
          textAreaHeight={textAreaHeight}
          onStopRecording={stopRecording}
          transcribingAudio={translations.transcribingAudio}
        />
      </div>

      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-shrink-0">
          {contextActions}
          {props.allowAttachments && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 flex items-center justify-center"
                  aria-label={translations.attachFile}
                  onClick={async () => {
                    const files = await showFileUploadDialog()
                    addFiles(files)
                  }}
                >
                  <Paperclip className="h-3 w-3 sm:h-3.5 sm:w-3.5 m-auto" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{translations.attachFile}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-shrink-0">
          {isGenerating && stop ? (
            <Button
              type="button"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center"
              aria-label={translations.stopGenerating}
              onClick={stop}
            >
              <Square className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-pulse m-auto" fill="currentColor" />
            </Button>
          ) : props.value && props.value.trim().length > 0 ? (
            <Button
              type="submit"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 transition-opacity flex items-center justify-center break-words"
              aria-label={translations.sendMessage}
              disabled={isGenerating}
            >
              <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 m-auto" />
            </Button>
          ) : isClient && isSpeechSupported ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 flex items-center justify-center",
                    isListening && "text-primary bg-primary/15 hover:bg-primary/20"
                  )}
                  aria-label={translations.voiceInput}
                  size="icon"
                  onClick={() => {
                    onAudioStart?.()
                    toggleListening()
                  }}
                >
                  <Mic className="h-3 w-3 sm:h-3.5 sm:w-3.5 m-auto" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{translations.voiceInput}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 transition-opacity flex items-center justify-center break-words"
              aria-label={translations.sendMessage}
              disabled
            >
              <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 m-auto" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
MessageInput.displayName = "MessageInput"

interface FileUploadOverlayProps {
  isDragging: boolean
  dropFilesHere: string
}

function FileUploadOverlay({ isDragging, dropFilesHere }: FileUploadOverlayProps) {
  return (
    <AnimatePresence>
      {isDragging && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center space-x-2 rounded-xl border border-dashed border-border bg-background text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden
        >
          <Paperclip className="h-4 w-4" />
          <span>{dropFilesHere}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function showFileUploadDialog() {
  const input = document.createElement("input")

  input.type = "file"
  input.multiple = true
  input.accept = getFileInputAccept()
  input.click()

  return new Promise<File[] | null>((resolve) => {
    input.onchange = (e) => {
      const files = (e.currentTarget as HTMLInputElement).files

      if (files) {
        resolve(Array.from(files))
        return
      }

      resolve(null)
    }
  })
}

interface TranscribingOverlayProps {
  transcribingAudio: string
}

function TranscribingOverlay({ transcribingAudio }: TranscribingOverlayProps) {
  return (
    <motion.div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <motion.div
          className="absolute inset-0 h-8 w-8 animate-pulse rounded-full bg-primary/20"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">
        {transcribingAudio}
      </p>
    </motion.div>
  )
}

interface RecordingPromptProps {
  isVisible: boolean
  onStopRecording: () => void
  clickToStopRecording: string
}

function RecordingPrompt({ isVisible, onStopRecording, clickToStopRecording }: RecordingPromptProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ top: 0, filter: "blur(5px)" }}
          animate={{
            top: -40,
            filter: "blur(0px)",
            transition: {
              type: "spring",
              filter: { type: "tween" },
            },
          }}
          exit={{ top: 0, filter: "blur(5px)" }}
          className="absolute left-1/2 flex -translate-x-1/2 cursor-pointer overflow-hidden whitespace-nowrap rounded-full border bg-background py-1 text-center text-sm text-muted-foreground"
          onClick={onStopRecording}
        >
          <span className="mx-2.5 flex items-center">
            <Info className="mr-2 h-3 w-3" />
            {clickToStopRecording}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface RecordingControlsProps {
  isRecording: boolean
  isTranscribing: boolean
  audioStream: MediaStream | null
  textAreaHeight: number
  onStopRecording: () => void
  transcribingAudio: string
}

function RecordingControls({
  isRecording,
  isTranscribing,
  audioStream,
  textAreaHeight,
  onStopRecording,
  transcribingAudio,
}: RecordingControlsProps) {
  if (isRecording) {
    return (
      <div
        className="absolute inset-[1px] z-50 overflow-hidden rounded-xl"
        style={{ height: textAreaHeight - 2 }}
      >
        <AudioVisualizer
          stream={audioStream}
          isRecording={isRecording}
          onClick={onStopRecording}
        />
      </div>
    )
  }

  if (isTranscribing) {
    return (
      <div
        className="absolute inset-[1px] z-50 overflow-hidden rounded-xl"
        style={{ height: textAreaHeight - 2 }}
      >
        <TranscribingOverlay transcribingAudio={transcribingAudio} />
      </div>
    )
  }

  return null
}
