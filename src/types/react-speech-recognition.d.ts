declare module "react-speech-recognition" {
  import { ComponentType } from "react"

  export interface SpeechRecognitionOptions {
    continuous?: boolean
    interimResults?: boolean
    language?: string
  }

  export interface SpeechRecognitionBrowser {
    startListening: (options?: SpeechRecognitionOptions) => void
    stopListening: () => void
    browserSupportsSpeechRecognition: () => boolean
    abortListening: () => void
  }

  export interface UseSpeechRecognitionOptions {
    clearTranscriptOnListen?: boolean
    commands?: Array<{
      command: string | RegExp
      callback: (match?: string | string[]) => void
      matchInterim?: boolean
    }>
  }

  export interface SpeechRecognitionResult {
    transcript: string
    interimTranscript: string
    finalTranscript: string
    listening: boolean
    isMicrophoneAvailable?: boolean
    browserSupportsSpeechRecognition?: boolean
    resetTranscript: () => void
  }

  export function useSpeechRecognition(
    options?: UseSpeechRecognitionOptions
  ): SpeechRecognitionResult

  const SpeechRecognition: SpeechRecognitionBrowser

  export default SpeechRecognition
}
