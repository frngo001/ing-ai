"use client"

import { useEffect, useState, useMemo } from "react"
import { AnimatePresence, motion } from "motion/react"

import { ShimmeringText } from "@/components/ui/shimmering-text"
import { useLanguage } from "@/lib/i18n/use-language"

export function StreamingShimmer() {
  const { t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)

  const streamingPhrases = useMemo(() => [
    t('askAi.streamingThinking'),
    t('askAi.streamingProcessing'),
    t('askAi.streamingAnalyzing'),
    t('askAi.streamingAlmostDone'),
  ], [t])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % streamingPhrases.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [streamingPhrases.length])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <ShimmeringText text={streamingPhrases[currentIndex]} />
      </motion.div>
    </AnimatePresence>
  )
}
