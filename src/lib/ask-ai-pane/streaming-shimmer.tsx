"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { ShimmeringText } from "@/components/ui/shimmering-text"
import { STREAMING_PHRASES } from './constants'

export function StreamingShimmer() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % STREAMING_PHRASES.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <ShimmeringText text={STREAMING_PHRASES[currentIndex]} />
      </motion.div>
    </AnimatePresence>
  )
}

