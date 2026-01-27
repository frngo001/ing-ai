'use client'

import { m, AnimatePresence } from 'framer-motion'
import type { TargetRect } from '@/lib/stores/onboarding-types'

interface OnboardingOverlayProps {
  isVisible: boolean
  targetRect: TargetRect | null
  padding?: number
  onOverlayClick?: () => void
}

export function OnboardingOverlay({
  isVisible,
  targetRect,
  padding = 8,
  onOverlayClick,
}: OnboardingOverlayProps) {
  // If no target rect or it's centered (body), show full overlay without cutout
  const showFullOverlay = !targetRect || (
    targetRect.x === 0 &&
    targetRect.y === 0 &&
    targetRect.width === window.innerWidth &&
    targetRect.height === window.innerHeight
  )

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 pointer-events-auto"
          onClick={onOverlayClick}
        >
          {showFullOverlay ? (
            // Full overlay without cutout
            <div className="absolute inset-0 bg-black/60" />
          ) : (
            // Overlay with spotlight cutout
            <svg
              className="absolute inset-0 w-full h-full"
              style={{ pointerEvents: 'none' }}
            >
              <defs>
                <mask id="spotlight-mask">
                  {/* White background = visible overlay */}
                  <rect width="100%" height="100%" fill="white" />
                  {/* Black rect = transparent cutout */}
                  <m.rect
                    initial={{
                      x: targetRect.x - padding,
                      y: targetRect.y - padding,
                      width: targetRect.width + padding * 2,
                      height: targetRect.height + padding * 2,
                    }}
                    animate={{
                      x: targetRect.x - padding,
                      y: targetRect.y - padding,
                      width: targetRect.width + padding * 2,
                      height: targetRect.height + padding * 2,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                    }}
                    rx={8}
                    ry={8}
                    fill="black"
                  />
                </mask>
              </defs>
              {/* The overlay with the mask applied */}
              <rect
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.6)"
                mask="url(#spotlight-mask)"
                style={{ pointerEvents: 'auto' }}
              />
            </svg>
          )}

          {/* Highlight ring around target */}
          {targetRect && !showFullOverlay && (
            <m.div
              initial={{
                left: targetRect.x - padding,
                top: targetRect.y - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
                opacity: 0,
              }}
              animate={{
                left: targetRect.x - padding,
                top: targetRect.y - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
                opacity: 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              className="fixed rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none"
              style={{ boxShadow: '0 0 0 9999px transparent' }}
            />
          )}
        </m.div>
      )}
    </AnimatePresence>
  )
}
