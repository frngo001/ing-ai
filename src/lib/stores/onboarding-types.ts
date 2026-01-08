import type { LucideIcon } from 'lucide-react'

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'center'

export interface OnboardingSubStep {
  id: string
  target: string // CSS selector for the element to highlight
  position: TooltipPosition // Where to position the tooltip relative to target
  titleKey: string // i18n key for the title
  descriptionKey: string // i18n key for the description
  tipKey?: string // i18n key for tips (optional)
  highlightPadding?: number // Extra padding around highlight cutout (default: 8)
  allowTargetInteraction?: boolean // Allow clicking on the target element (default: false)
  waitForElement?: boolean // Wait for target element to appear (default: true)
  actionId?: string // ID of the action to execute on enter (resolved by controller)
}

export interface OnboardingMainStep {
  id: string
  titleKey: string
  icon: LucideIcon
  color: string // Tailwind gradient classes for background
  accentColor: string // Tailwind text color classes
  subSteps: OnboardingSubStep[]
}

export interface OnboardingActions {
  openSidebar: () => void
  closeSidebar: () => void
  togglePane: (pane: 'documents' | 'library' | 'askAi') => void
  openPane: (pane: 'documents' | 'library' | 'askAi') => void
  closePane: (pane: 'documents' | 'library' | 'askAi') => void
  createNewDocument: () => void
  openSettings: (nav?: string) => void
  closeSettings: () => void
}

export interface TargetRect {
  x: number
  y: number
  width: number
  height: number
}

export interface OnboardingControllerProps {
  actions: OnboardingActions
}
