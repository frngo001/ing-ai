import { useLayoutEffect, useRef } from "react"

interface UseAutosizeTextAreaProps {
  ref:
  | React.RefObject<HTMLTextAreaElement | null>
  | React.MutableRefObject<HTMLTextAreaElement | null>
  maxHeight?: number
  minHeight?: number
  borderWidth?: number
  dependencies: React.DependencyList
}

export function useAutosizeTextArea({
  ref,
  maxHeight = Number.MAX_SAFE_INTEGER,
  minHeight = 60,
  borderWidth = 0,
  dependencies,
}: UseAutosizeTextAreaProps) {
  useLayoutEffect(() => {
    if (!ref.current) return

    const currentRef = ref.current
    const borderAdjustment = borderWidth * 2

    // Reset height to auto to correctly measure scrollHeight based on content
    currentRef.style.height = "auto"

    const scrollHeight = currentRef.scrollHeight

    // Explicitly handle empty state to ensure minHeight is respected
    const isEmpty = currentRef.value.trim() === ""
    const contentHeight = isEmpty ? 0 : scrollHeight

    // Clamp between minHeight, content size and maxHeight
    const targetHeight = Math.max(minHeight, Math.min(contentHeight, maxHeight))

    currentRef.style.height = `${targetHeight + borderAdjustment}px`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxHeight, minHeight, ref, ...dependencies])
}
