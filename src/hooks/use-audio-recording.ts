import { useEffect, useRef, useState } from "react"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"

interface UseAudioRecordingOptions {
  onTranscriptionComplete?: (text: string) => void
  onError?: (error: Error) => void
  language?: string
}

export function useAudioRecording({
  onTranscriptionComplete,
  onError,
  language = "de-DE",
}: UseAudioRecordingOptions) {
  const log = (...args: any[]) => console.log("[speech]", ...args)

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({ clearTranscriptOnListen: true })

  const streamRef = useRef<MediaStream | null>(null)
  const transcriptRef = useRef("")

  const [isSpeechSupported, setIsSpeechSupported] = useState(
    browserSupportsSpeechRecognition && (isMicrophoneAvailable ?? true)
  )
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    setIsSpeechSupported(
      browserSupportsSpeechRecognition &&
        hasMediaDevices &&
        (isMicrophoneAvailable === undefined || isMicrophoneAvailable)
    )
    log("support check", {
      browserSupportsSpeechRecognition,
      hasMediaDevices,
      isMicrophoneAvailable,
    })
  }, [browserSupportsSpeechRecognition, isMicrophoneAvailable])

  useEffect(() => {
    if (transcript) {
      log("transcript updated", { length: transcript.length, preview: transcript.slice(0, 80) })
      transcriptRef.current = transcript
    }
  }, [transcript])

  const waitForTranscript = async (timeoutMs = 2000, intervalMs = 120) => {
    const start = Date.now()
    return new Promise<string>((resolve) => {
      const check = () => {
        const text = transcriptRef.current.trim()
        if (text.length > 0) {
          resolve(text)
          return
        }
        if (Date.now() - start >= timeoutMs) {
          resolve(text)
          return
        }
        setTimeout(check, intervalMs)
      }
      check()
    })
  }

  const stopRecording = async () => {
    try {
      log("stopRecording start")
      setIsTranscribing(true)
      SpeechRecognition.stopListening()
      // allow final SpeechRecognition result event to settle
      await new Promise((resolve) => setTimeout(resolve, 200))
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        setAudioStream(null)
      }

      const text = await waitForTranscript()
      log("stopRecording completed", {
        transcriptLength: text.length,
        transcriptPreview: text.slice(0, 80),
      })
      if (text) {
        onTranscriptionComplete?.(text)
      }
      resetTranscript()
      transcriptRef.current = ""
    } catch (error) {
      console.error("Error transcribing audio:", error)
      if (error instanceof Error) {
        onError?.(error)
      }
    } finally {
      setIsTranscribing(false)
      setIsRecording(false)
    }
  }

  const toggleListening = async () => {
    if (!listening) {
      try {
        if (!browserSupportsSpeechRecognition) {
          throw new Error("Spracherkennung wird von diesem Browser nicht unterstützt.")
        }
        log("startListening requested", { language })
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setAudioStream(stream)
        streamRef.current = stream
        setIsRecording(true)
        SpeechRecognition.startListening({ continuous: true, language, interimResults: true })
        log("startListening started")
      } catch (error) {
        console.error("Error recording audio:", error)
        if (error instanceof Error) {
          onError?.(error)
        }
        setIsRecording(false)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
          setAudioStream(null)
        }
      }
    } else {
      log("stopListening requested")
      await stopRecording()
    }
  }

  useEffect(() => {
    return () => {
      log("cleanup -> stopListening")
      SpeechRecognition.stopListening()
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    setIsRecording(listening)
    log("listening state changed", { listening })
  }, [listening])

  return {
    isListening: listening,
    isSpeechSupported,
    isRecording,
    isTranscribing,
    audioStream,
    transcript,
    toggleListening,
    stopRecording,
  }
}
