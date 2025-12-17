"use client"

import { useEffect, useState } from "react"
import { ShimmeringText } from "@/components/ui/shimmering-text"
import { STREAMING_PHRASES } from './constants'

export function StreamingShimmer() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % STREAMING_PHRASES.length)
    }, 2400)
    return () => clearInterval(id)
  }, [])

  return <ShimmeringText text={STREAMING_PHRASES[currentIndex]} />
}

