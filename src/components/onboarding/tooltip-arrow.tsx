'use client'

import { cn } from '@/lib/utils'
import type { TooltipPosition } from '@/lib/stores/onboarding-types'

interface TooltipArrowProps {
  position: TooltipPosition
  className?: string
}

export function TooltipArrow({ position, className }: TooltipArrowProps) {
  // Don't show arrow for centered position
  if (position === 'center') return null

  const arrowClasses = cn(
    'absolute w-3 h-3 bg-background border rotate-45',
    className
  )

  const positionStyles: Record<Exclude<TooltipPosition, 'center'>, string> = {
    top: 'bottom-[-7px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
    bottom: 'top-[-7px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
    left: 'right-[-7px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
    right: 'left-[-7px] top-1/2 -translate-y-1/2 border-r-0 border-t-0',
  }

  return (
    <div
      className={cn(arrowClasses, positionStyles[position])}
      style={{ zIndex: -1 }}
    />
  )
}
