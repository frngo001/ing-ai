import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

type UseCopyToClipboardProps = {
  text: string
  copyMessage?: string
  withToast?: boolean
}

export function useCopyToClipboard({
  text,
  copyMessage = "Copied to clipboard!",
  withToast = true,
}: UseCopyToClipboardProps) {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        if (withToast) {
        toast.success(copyMessage)
        }
        setIsCopied(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        timeoutRef.current = setTimeout(() => {
          setIsCopied(false)
        }, 2000)
      })
      .catch((error) => {
        if (withToast) {
        toast.error("Failed to copy to clipboard.")
        } else {
          console.error("Failed to copy to clipboard.", error)
        }
      })
  }, [text, copyMessage, withToast])

  return { isCopied, handleCopy }
}
