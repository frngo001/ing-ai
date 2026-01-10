'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { OnboardingOverlay } from './onboarding-overlay'
import { OnboardingTooltip } from './onboarding-tooltip'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import type { OnboardingActions, TargetRect } from '@/lib/stores/onboarding-types'
import { useLanguage } from '@/lib/i18n/use-language'

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
  const { t } = useLanguage()

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentTargetRef = useRef<Element | null>(null)
  // Track executed actions to prevent re-execution on re-renders
  const executedActionsRef = useRef<Set<string>>(new Set())

  // Action handler based on actionId
  const executeAction = useCallback(
    async (actionId: string | undefined) => {
      if (!actionId) return

      // Parse action and params (format: "actionName:param1,param2")
      const [action, paramsStr] = actionId.split(':')
      const params = paramsStr ? paramsStr.split(',') : []

      switch (action) {
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
        case 'openExportDropdown':
          {
            const exportButton = document.querySelector('[data-onboarding="export-btn"]')
            if (exportButton) {
              const button = exportButton as HTMLElement
              button.click()
              await new Promise((resolve) => setTimeout(resolve, 200))
            }
          }
          break
        case 'openImportDropdown':
          {
            const importButton = document.querySelector('[data-onboarding="import-btn"]')
            if (importButton) {
              const button = importButton as HTMLElement
              button.click()
              await new Promise((resolve) => setTimeout(resolve, 200))
            }
          }
          break
        // Editor simulation actions
        case 'focusEditor':
          actions.focusEditor()
          break
        case 'typeInEditor':
          if (params[0]) {
            let text = decodeURIComponent(params[0])
            if (text.startsWith('onboarding.')) {
              text = t(text)
            }
            const delay = params[1] ? parseInt(params[1]) : 30
            await actions.typeInEditor(text, delay)
          }
          break
        case 'showSlashMenu':
          await actions.showSlashMenu()
          break
        case 'closeSlashMenu':
          await actions.closeSlashMenu()
          break
        case 'insertHeading':
          if (params[0] && params[1]) {
            const level = parseInt(params[0]) as 1 | 2 | 3
            let text = decodeURIComponent(params[1])
            if (text.startsWith('onboarding.')) {
              text = t(text)
            }
            await actions.insertHeading(level, text)
          }
          break
        case 'insertCitation':
          await actions.insertCitation()
          break
        case 'openAskAiWithQuestion':
          if (params[0]) {
            let question = decodeURIComponent(params[0])
            if (question.startsWith('onboarding.')) {
              question = t(question)
            }
            await actions.openAskAiWithQuestion(question)
          }
          break
        case 'selectTextRange':
          if (params[0] && params[1]) {
            const start = parseInt(params[0])
            const end = parseInt(params[1])
            await actions.selectTextRange(start, end)
          }
          break
        case 'clearEditorSelection':
          actions.clearEditorSelection()
          break
        case 'moveBlockUp':
          await actions.moveBlockUp()
          break
        case 'moveBlockDown':
          await actions.moveBlockDown()
          break
        case 'openProjectShare':
          actions.openProjectShare()
          break
        case 'closeSearch':
          actions.closeSearch()
          break
        case 'prepareLibraryStep':
          actions.prepareLibraryStep()
          break
        case 'prepareAiStep':
          actions.prepareAiStep()
          break
        case 'prepareSettingsStep':
          actions.prepareSettingsStep()
          break
      }

      // Wait a bit for UI to update
      await new Promise((resolve) => setTimeout(resolve, 300))
    },
    [actions, t]
  )

  // Update target element position
  const updateTargetPosition = useCallback(() => {
    const subStep = getCurrentSubStep()
    if (!subStep) return

    let element = document.querySelector(subStep.target)

    // For export/import formats, keep using button but position will be adjusted in tooltip
    // The tooltip will use a larger gap to position above the dropdown

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

  // Scroll element into view if needed
  const scrollElementIntoView = useCallback((element: Element) => {
    const rect = element.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const isVisible =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth

    if (!isVisible) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    }
  }, [])

  // Handle step changes
  useEffect(() => {
    if (!isOpen || isLoading) return

    const subStep = getCurrentSubStep()
    if (!subStep) return

    // Create a unique key for the current step+action combination
    const stepKey = `${currentMainStep}-${currentSubStep}-${subStep.actionId || 'none'}`

    const setupStep = async () => {
      // Only execute action if it hasn't been executed for this step yet
      if (subStep.actionId && !executedActionsRef.current.has(stepKey)) {
        executedActionsRef.current.add(stepKey)
        await executeAction(subStep.actionId)
        // Give more time after action execution for DOM to settle
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Wait for element if needed
      if (subStep.waitForElement !== false && subStep.target !== 'body') {
        await waitForElement(subStep.target)
      }

      // Scroll element into view if it's not body/center
      if (subStep.target !== 'body' && subStep.position !== 'center') {
        const element = document.querySelector(subStep.target)
        if (element) {
          scrollElementIntoView(element)
          // Wait for scroll animation to complete
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }

      // Small delay to let animations settle
      await new Promise((resolve) => setTimeout(resolve, 150))

      // Update position multiple times to ensure accuracy
      updateTargetPosition()
      await new Promise((resolve) => setTimeout(resolve, 100))
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
    scrollElementIntoView,
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
    // Clear executed actions for current and previous steps to allow re-execution
    const keysToRemove = Array.from(executedActionsRef.current).filter(
      (key) => key.startsWith(`${currentMainStep}-`) || key.startsWith(`${currentMainStep - 1}-`)
    )
    keysToRemove.forEach((key) => executedActionsRef.current.delete(key))
    prevSubStep()
  }, [prevSubStep, currentMainStep])

  const handleSkip = useCallback(async () => {
    // Clear all executed actions
    executedActionsRef.current.clear()
    await skipOnboarding()
  }, [skipOnboarding])

  const handleComplete = useCallback(async () => {
    // Clear all executed actions
    executedActionsRef.current.clear()
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
