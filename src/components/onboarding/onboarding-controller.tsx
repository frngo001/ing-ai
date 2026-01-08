'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { OnboardingOverlay } from './onboarding-overlay'
import { OnboardingTooltip } from './onboarding-tooltip'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import type { OnboardingActions, TargetRect } from '@/lib/stores/onboarding-types'

interface OnboardingControllerProps {
  actions: OnboardingActions
}

// Utility to wait for an element to appear in DOM
async function waitForElement(
  selector: string,
  timeout = 5000
): Promise<Element | null> {
  // Check if it's body (special case)
  if (selector === 'body') {
    return document.body
  }

  const element = document.querySelector(selector)
  if (element) return element

  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) {
        observer.disconnect()
        resolve(el)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}

// Get rect for body (full viewport)
function getBodyRect(): TargetRect {
  return {
    x: 0,
    y: 0,
    width: window.innerWidth,
    height: window.innerHeight,
  }
}

export function OnboardingController({ actions }: OnboardingControllerProps) {
  const {
    isOpen,
    isLoading,
    currentMainStep,
    currentSubStep,
    targetRect,
    setTargetRect,
    getCurrentMainStep,
    getCurrentSubStep,
    nextSubStep,
    prevSubStep,
    skipOnboarding,
    completeOnboarding,
  } = useOnboardingStore()

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentTargetRef = useRef<Element | null>(null)

  // Action handler based on actionId
  const executeAction = useCallback(
    async (actionId: string | undefined) => {
      if (!actionId) return

      switch (actionId) {
        case 'openSidebar':
          actions.openSidebar()
          break
        case 'closeSidebar':
          actions.closeSidebar()
          break
        case 'createNewDocument':
          actions.createNewDocument()
          break
        case 'openDocumentsPane':
          actions.openPane('documents')
          break
        case 'closeDocumentsPane':
          actions.closePane('documents')
          break
        case 'openLibraryPane':
          actions.openPane('library')
          break
        case 'closeLibraryPane':
          actions.closePane('library')
          break
        case 'openAiPane':
          actions.openPane('askAi')
          break
        case 'closeAiPane':
          actions.closePane('askAi')
          break
        case 'openSettings':
          actions.openSettings()
          break
        case 'closeSettings':
          actions.closeSettings()
          break
      }

      // Wait a bit for UI to update
      await new Promise((resolve) => setTimeout(resolve, 300))
    },
    [actions]
  )

  // Update target element position
  const updateTargetPosition = useCallback(() => {
    const subStep = getCurrentSubStep()
    if (!subStep) return

    const element = document.querySelector(subStep.target)
    if (!element) {
      // If target is body or element not found, use full viewport
      if (subStep.target === 'body' || subStep.position === 'center') {
        setTargetRect(getBodyRect())
      }
      return
    }

    const rect = element.getBoundingClientRect()
    setTargetRect({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    })
    currentTargetRef.current = element
  }, [getCurrentSubStep, setTargetRect])

  // Handle step changes
  useEffect(() => {
    if (!isOpen || isLoading) return

    const subStep = getCurrentSubStep()
    if (!subStep) return

    const setupStep = async () => {
      // Execute action first
      await executeAction(subStep.actionId)

      // Wait for element if needed
      if (subStep.waitForElement !== false && subStep.target !== 'body') {
        await waitForElement(subStep.target)
      }

      // Small delay to let animations settle
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Update position
      updateTargetPosition()
    }

    setupStep()

    // Set up interval to track position changes
    updateIntervalRef.current = setInterval(updateTargetPosition, 100)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [
    isOpen,
    isLoading,
    currentMainStep,
    currentSubStep,
    executeAction,
    getCurrentSubStep,
    updateTargetPosition,
  ])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      updateTargetPosition()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateTargetPosition])

  // Navigation handlers
  const handleNext = useCallback(async () => {
    await nextSubStep()
  }, [nextSubStep])

  const handlePrev = useCallback(() => {
    prevSubStep()
  }, [prevSubStep])

  const handleSkip = useCallback(async () => {
    await skipOnboarding()
  }, [skipOnboarding])

  const handleComplete = useCallback(async () => {
    await completeOnboarding()
  }, [completeOnboarding])

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  // Create portal container on mount
  useEffect(() => {
    // Create a dedicated container for the onboarding portal
    let container = document.getElementById('onboarding-portal-root')
    if (!container) {
      container = document.createElement('div')
      container.id = 'onboarding-portal-root'
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 99999;
      `
      document.body.appendChild(container)
    }
    setPortalContainer(container)

    return () => {
      // Don't remove on unmount as it might be reused
    }
  }, [])

  // Don't render if not open or loading or no portal container
  if (!isOpen || isLoading || !portalContainer) return null

  const mainStep = getCurrentMainStep()
  const subStep = getCurrentSubStep()

  // Portal to dedicated container to ensure proper z-index stacking
  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      <OnboardingOverlay
        isVisible={isOpen}
        targetRect={targetRect}
        padding={subStep?.highlightPadding ?? 8}
      />
      <OnboardingTooltip
        isVisible={isOpen}
        targetRect={targetRect}
        mainStep={mainStep}
        subStep={subStep}
        currentMainStepIndex={currentMainStep}
        currentSubStepIndex={currentSubStep}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        onComplete={handleComplete}
      />
    </div>,
    portalContainer
  )
}
