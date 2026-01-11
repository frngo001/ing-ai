import { useLayoutEffect, useRef } from "react"

interface UseAutosizeTextAreaProps {
  ref:
  | React.RefObject<HTMLTextAreaElement | null>
  | React.MutableRefObject<HTMLTextAreaElement | null>
  maxHeight?: number
  borderWidth?: number
  dependencies: React.DependencyList
}

export function useAutosizeTextArea({
  ref,
  maxHeight = Number.MAX_SAFE_INTEGER,
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

    // Clamp between content size and maxHeight
    const targetHeight = Math.min(scrollHeight, maxHeight)

    currentRef.style.height = `${targetHeight + borderAdjustment}px`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxHeight, ref, ...dependencies])
}
