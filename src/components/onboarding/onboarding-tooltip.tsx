'use client'

import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background'
import { TooltipArrow } from './tooltip-arrow'
import { useLanguage } from '@/lib/i18n/use-language'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { ONBOARDING_MAIN_STEPS } from '@/lib/stores/onboarding-steps'
import type { TooltipPosition, TargetRect, OnboardingMainStep, OnboardingSubStep } from '@/lib/stores/onboarding-types'
import {
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OnboardingTooltipProps {
  isVisible: boolean
  targetRect: TargetRect | null
  mainStep: OnboardingMainStep | null
  subStep: OnboardingSubStep | null
  currentMainStepIndex: number
  currentSubStepIndex: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onComplete: () => void
}

const TOOLTIP_WIDTH = 360
const TOOLTIP_GAP = 16
const VIEWPORT_PADDING = 12

export function OnboardingTooltip({
  isVisible,
  targetRect,
  mainStep,
  subStep,
  currentMainStepIndex,
  currentSubStepIndex,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: OnboardingTooltipProps) {
  const { t } = useLanguage()
  const progress = useOnboardingStore((state) => state.getOverallProgress())
  const [tooltipHeight, setTooltipHeight] = useState(250)

  const isFirstStep = currentMainStepIndex === 0 && currentSubStepIndex === 0
  const isLastMainStep = currentMainStepIndex === ONBOARDING_MAIN_STEPS.length - 1
  const isLastSubStep = mainStep
    ? currentSubStepIndex === mainStep.subSteps.length - 1
    : false
  const isLastStep = isLastMainStep && isLastSubStep

  // Calculate position based on target rect and preferred position
  const { x, y, actualPosition } = useMemo(() => {
    if (!targetRect || !subStep) {
      // Center in viewport
      return {
        x: (window.innerWidth - TOOLTIP_WIDTH) / 2,
        y: (window.innerHeight - tooltipHeight) / 2,
        actualPosition: 'center' as TooltipPosition,
      }
    }

    const preferredPosition = subStep.position
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // For center position, center the tooltip
    if (preferredPosition === 'center') {
      return {
        x: (viewportWidth - TOOLTIP_WIDTH) / 2,
        y: (viewportHeight - tooltipHeight) / 2,
        actualPosition: 'center' as TooltipPosition,
      }
    }

    // Try preferred position first
    const tryPosition = (
      pos: Exclude<TooltipPosition, 'center'>
    ): { x: number; y: number; fits: boolean } => {
      let x = 0
      let y = 0

      switch (pos) {
        case 'right':
          x = targetRect.x + targetRect.width + TOOLTIP_GAP
          y = targetRect.y + targetRect.height / 2 - tooltipHeight / 2
          break
        case 'left':
          x = targetRect.x - TOOLTIP_WIDTH - TOOLTIP_GAP
          y = targetRect.y + targetRect.height / 2 - tooltipHeight / 2
          break
        case 'bottom':
          x = targetRect.x + targetRect.width / 2 - TOOLTIP_WIDTH / 2
          y = targetRect.y + targetRect.height + TOOLTIP_GAP
          break
        case 'top':
          x = targetRect.x + targetRect.width / 2 - TOOLTIP_WIDTH / 2
          const topGap = subStep?.id === 'export-formats' || subStep?.id === 'import-formats' || subStep?.id === 'open-mode' || subStep?.id === 'suggestions'
            ? TOOLTIP_GAP + 120 
            : TOOLTIP_GAP
          y = targetRect.y - tooltipHeight - topGap
          break
      }

      // Check if it fits in viewport
      const fits =
        x >= VIEWPORT_PADDING &&
        x + TOOLTIP_WIDTH <= viewportWidth - VIEWPORT_PADDING &&
        y >= VIEWPORT_PADDING &&
        y + tooltipHeight <= viewportHeight - VIEWPORT_PADDING

      return { x, y, fits }
    }

    // Try positions in order: preferred, then alternatives
    const positions: Exclude<TooltipPosition, 'center'>[] = [
      preferredPosition as Exclude<TooltipPosition, 'center'>,
      'right',
      'left',
      'bottom',
      'top',
    ]

    for (const pos of positions) {
      const result = tryPosition(pos)
      if (result.fits) {
        // For top position with export/import formats, ensure larger gap is maintained
        if (pos === 'top' && (subStep?.id === 'open-export' || subStep?.id === 'open-import' || subStep?.id === 'open-mode')) {
          const topGap = TOOLTIP_GAP + 100
          const idealY = targetRect.y - tooltipHeight - topGap
          if (idealY >= VIEWPORT_PADDING) {
            return { x: result.x, y: idealY, actualPosition: pos }
          }
        }
        // For left position with mode dropdown, ensure tooltip stays in viewport
        if (pos === 'left' && (subStep?.id === 'open-mode')) {
          // Clamp Y position to keep tooltip fully visible
          const clampedY = Math.max(
            VIEWPORT_PADDING,
            Math.min(result.y, viewportHeight - tooltipHeight - VIEWPORT_PADDING)
          )
          return { x: result.x, y: clampedY, actualPosition: pos }
        }
        return { x: result.x, y: result.y, actualPosition: pos }
      }
    }

    // Fallback: clamp to viewport
    const result = tryPosition(
      preferredPosition as Exclude<TooltipPosition, 'center'>
    )
    
    // For top position with export/import formats, maintain larger gap
    let finalY = result.y
    if (preferredPosition === 'top' && (subStep?.id === 'export-formats' || subStep?.id === 'import-formats' || subStep?.id === 'open-mode' || subStep?.id === 'suggestions')) {
      const topGap = TOOLTIP_GAP + 120
      const idealY = targetRect.y - tooltipHeight - topGap
      // Use ideal position if it fits, otherwise clamp but try to maintain gap
      if (idealY >= VIEWPORT_PADDING) {
        finalY = idealY
      } else {
        // Clamp but try to maintain as much gap as possible
        finalY = Math.max(VIEWPORT_PADDING, idealY)
      }
      // Ensure tooltip doesn't go below viewport
      finalY = Math.min(finalY, viewportHeight - tooltipHeight - VIEWPORT_PADDING)
    } else {
      finalY = Math.max(
        VIEWPORT_PADDING,
        Math.min(result.y, viewportHeight - tooltipHeight - VIEWPORT_PADDING)
      )
    }
    
    return {
      x: Math.max(
        VIEWPORT_PADDING,
        Math.min(result.x, viewportWidth - TOOLTIP_WIDTH - VIEWPORT_PADDING)
      ),
      y: finalY,
      actualPosition: preferredPosition,
    }
  }, [targetRect, subStep, tooltipHeight])

  // Get tip text and split by pipe
  const tips = useMemo(() => {
    if (!subStep?.tipKey) return []
    const tipText = t(subStep.tipKey)
    if (tipText === subStep.tipKey) return [] // Translation not found
    return tipText.split('|').map((tip) => tip.trim())
  }, [subStep, t])

  return (
    <AnimatePresence>
      {isVisible && mainStep && subStep && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, x, y }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
          className="fixed"
          style={{ width: TOOLTIP_WIDTH }}
          ref={(el) => {
            if (el) {
              const height = el.getBoundingClientRect().height
              if (height !== tooltipHeight) {
                setTooltipHeight(height)
              }
            }
          }}
        >
          <div className="relative bg-background rounded-xl border shadow-2xl overflow-hidden">
            {/* Arrow */}
            <TooltipArrow position={actualPosition} />

            {/* Header with gradient */}
            <div className="relative h-16 overflow-hidden bg-muted/30">
              <DottedGlowBackground
                gap={12}
                radius={2}
                color="rgba(0, 0, 0, 0.3)"
                darkColor="rgba(255, 255, 255, 0.2)"
                glowColor="rgba(59, 130, 246, 0.6)"
                darkGlowColor="rgba(96, 165, 250, 0.6)"
                opacity={0.8}
                backgroundOpacity={0}
              />

              {/* Step indicator */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full bg-white/80 dark:bg-background/80',
                    mainStep.accentColor
                  )}
                >
                  {currentMainStepIndex + 1}/{ONBOARDING_MAIN_STEPS.length}
                </span>
              </div>

              {/* Skip button */}
              {!isLastStep && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 text-foreground/60 hover:text-foreground hover:bg-white/20"
                  onClick={onSkip}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Main step title */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-[10px] font-semibold tracking-wider uppercase',
                    mainStep.accentColor
                  )}
                >
                  {t(mainStep.titleKey)}
                </span>
              </div>

              {/* Sub step title */}
              <h3 className="text-base font-semibold text-foreground leading-tight">
                {t(subStep.titleKey)}
              </h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(subStep.descriptionKey)}
              </p>

              {/* Tips */}
              {tips.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sub-step indicators */}
              {mainStep.subSteps.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {mainStep.subSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        index === currentSubStepIndex
                          ? 'w-4 bg-primary'
                          : index < currentSubStepIndex
                          ? 'w-1.5 bg-primary/50'
                          : 'w-1.5 bg-muted-foreground/30'
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-4 pt-2 border-t bg-muted/20">
              {/* Progress bar */}
              <div className="mb-3">
                <Progress value={progress} className="h-1" />
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrev}
                  disabled={isFirstStep}
                  className="gap-1 h-8"
                >
                  <ChevronLeft className="w-3 h-3" />
                  {t('onboarding.back')}
                </Button>

                <Button
                  size="sm"
                  onClick={isLastStep ? onComplete : onNext}
                  className={cn(
                    'gap-1 h-8 min-w-[100px]',
                    isLastStep && 'bg-green-600 hover:bg-green-700'
                  )}
                >
                  {isLastStep ? (
                    <>
                      {t('onboarding.finish')}
                      <CheckCircle2 className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      {t('onboarding.next')}
                      <ChevronRight className="w-3 h-3" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
