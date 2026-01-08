'use client'

import { create } from 'zustand'
import {
  getOrCreateOnboarding,
  updateOnboardingProgress,
  skipOnboarding as dbSkipOnboarding,
  resetOnboarding as dbResetOnboarding,
} from '@/lib/supabase/utils/onboarding'
import { ONBOARDING_MAIN_STEPS, getSubStepByIndex, getMainStepByIndex } from './onboarding-steps'
import type { TargetRect } from './onboarding-types'

interface OnboardingState {
  isOpen: boolean
  isLoading: boolean
  isTransitioning: boolean
  userId: string | null
  currentMainStep: number
  currentSubStep: number
  completedSteps: number[]
  isCompleted: boolean
  isSkipped: boolean
  targetRect: TargetRect | null

  // Computed getters
  getCurrentMainStep: () => ReturnType<typeof getMainStepByIndex>
  getCurrentSubStep: () => ReturnType<typeof getSubStepByIndex>
  getTotalMainSteps: () => number
  getSubStepsForCurrentMain: () => number
  getOverallProgress: () => number

  // Actions
  setOpen: (open: boolean) => void
  setTargetRect: (rect: TargetRect | null) => void
  setTransitioning: (transitioning: boolean) => void
  initialize: (userId: string) => Promise<void>
  nextSubStep: () => Promise<void>
  prevSubStep: () => void
  goToStep: (mainStep: number, subStep?: number) => Promise<void>
  skipOnboarding: () => Promise<void>
  resetOnboarding: () => Promise<void>
  resumeOnboarding: () => void
  completeOnboarding: () => Promise<void>
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  isOpen: false,
  isLoading: false,
  isTransitioning: false,
  userId: null,
  currentMainStep: 0,
  currentSubStep: 0,
  completedSteps: [],
  isCompleted: false,
  isSkipped: false,
  targetRect: null,

  // Computed getters
  getCurrentMainStep: () => getMainStepByIndex(get().currentMainStep),
  getCurrentSubStep: () => getSubStepByIndex(get().currentMainStep, get().currentSubStep),
  getTotalMainSteps: () => ONBOARDING_MAIN_STEPS.length,
  getSubStepsForCurrentMain: () => {
    const mainStep = getMainStepByIndex(get().currentMainStep)
    return mainStep?.subSteps.length || 0
  },
  getOverallProgress: () => {
    const { currentMainStep, currentSubStep } = get()
    let totalSubSteps = 0
    let completedSubSteps = 0

    for (let i = 0; i < ONBOARDING_MAIN_STEPS.length; i++) {
      const stepSubSteps = ONBOARDING_MAIN_STEPS[i].subSteps.length
      totalSubSteps += stepSubSteps

      if (i < currentMainStep) {
        completedSubSteps += stepSubSteps
      } else if (i === currentMainStep) {
        completedSubSteps += currentSubStep
      }
    }

    return totalSubSteps > 0 ? (completedSubSteps / totalSubSteps) * 100 : 0
  },

  setOpen: (open) => set({ isOpen: open }),
  setTargetRect: (rect) => set({ targetRect: rect }),
  setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

  initialize: async (userId) => {
    set({ isLoading: true, userId })

    const onboarding = await getOrCreateOnboarding(userId)

    if (onboarding) {
      // Parse the current_step which might encode both main and sub step
      // Format: mainStep * 100 + subStep (e.g., 205 = main step 2, sub step 5)
      const storedStep = onboarding.current_step
      const mainStep = Math.floor(storedStep / 100)
      const subStep = storedStep % 100

      set({
        currentMainStep: Math.min(mainStep, ONBOARDING_MAIN_STEPS.length - 1),
        currentSubStep: subStep,
        completedSteps: onboarding.completed_steps,
        isCompleted: onboarding.is_completed,
        isSkipped: onboarding.is_skipped,
        isLoading: false,
        // Show onboarding if not completed and not skipped and at start
        isOpen: !onboarding.is_completed && !onboarding.is_skipped && storedStep === 0,
      })
    } else {
      set({ isLoading: false })
    }
  },

  nextSubStep: async () => {
    const { currentMainStep, currentSubStep, userId, completedSteps } = get()
    const mainStep = getMainStepByIndex(currentMainStep)

    if (!mainStep) return

    set({ isTransitioning: true })

    const isLastSubStep = currentSubStep >= mainStep.subSteps.length - 1
    const isLastMainStep = currentMainStep >= ONBOARDING_MAIN_STEPS.length - 1

    if (isLastSubStep) {
      // Mark current main step as completed
      const newCompletedSteps = [...new Set([...completedSteps, currentMainStep])]

      if (isLastMainStep) {
        // Complete the entire onboarding
        if (userId) {
          await updateOnboardingProgress(userId, {
            current_step: (currentMainStep + 1) * 100,
            is_completed: true,
            completed_steps: newCompletedSteps,
          })
        }
        set({
          currentMainStep: currentMainStep + 1,
          currentSubStep: 0,
          isCompleted: true,
          completedSteps: newCompletedSteps,
          isOpen: false,
          isTransitioning: false,
        })
      } else {
        // Move to next main step
        const nextMainStep = currentMainStep + 1
        if (userId) {
          await updateOnboardingProgress(userId, {
            current_step: nextMainStep * 100,
            completed_steps: newCompletedSteps,
          })
        }
        set({
          currentMainStep: nextMainStep,
          currentSubStep: 0,
          completedSteps: newCompletedSteps,
          isTransitioning: false,
        })
      }
    } else {
      // Move to next sub step within current main step
      const nextSubStep = currentSubStep + 1
      if (userId) {
        await updateOnboardingProgress(userId, {
          current_step: currentMainStep * 100 + nextSubStep,
        })
      }
      set({
        currentSubStep: nextSubStep,
        isTransitioning: false,
      })
    }
  },

  prevSubStep: () => {
    const { currentMainStep, currentSubStep } = get()

    set({ isTransitioning: true })

    if (currentSubStep > 0) {
      // Go to previous sub step
      set({ currentSubStep: currentSubStep - 1, isTransitioning: false })
    } else if (currentMainStep > 0) {
      // Go to last sub step of previous main step
      const prevMainStep = currentMainStep - 1
      const prevMainStepData = getMainStepByIndex(prevMainStep)
      const lastSubStep = prevMainStepData ? prevMainStepData.subSteps.length - 1 : 0
      set({
        currentMainStep: prevMainStep,
        currentSubStep: lastSubStep,
        isTransitioning: false,
      })
    } else {
      set({ isTransitioning: false })
    }
  },

  goToStep: async (mainStep, subStep = 0) => {
    const { userId } = get()
    if (mainStep >= 0 && mainStep < ONBOARDING_MAIN_STEPS.length) {
      const mainStepData = getMainStepByIndex(mainStep)
      const validSubStep = mainStepData
        ? Math.min(subStep, mainStepData.subSteps.length - 1)
        : 0

      if (userId) {
        await updateOnboardingProgress(userId, {
          current_step: mainStep * 100 + validSubStep,
        })
      }
      set({
        currentMainStep: mainStep,
        currentSubStep: validSubStep,
        isOpen: true,
      })
    }
  },

  skipOnboarding: async () => {
    const { userId } = get()
    if (userId) {
      await dbSkipOnboarding(userId)
    }
    set({ isSkipped: true, isOpen: false })
  },

  resetOnboarding: async () => {
    const { userId } = get()
    if (userId) {
      await dbResetOnboarding(userId)
    }
    set({
      currentMainStep: 0,
      currentSubStep: 0,
      completedSteps: [],
      isCompleted: false,
      isSkipped: false,
      isOpen: true,
    })
  },

  resumeOnboarding: () => {
    const { isCompleted, isSkipped, currentMainStep, currentSubStep } = get()
    if (!isCompleted) {
      set({ isOpen: true, isSkipped: false })
      // If was skipped, resume from where left off
      if (isSkipped) {
        const validMainStep = Math.min(currentMainStep, ONBOARDING_MAIN_STEPS.length - 1)
        const mainStepData = getMainStepByIndex(validMainStep)
        const validSubStep = mainStepData
          ? Math.min(currentSubStep, mainStepData.subSteps.length - 1)
          : 0
        set({ currentMainStep: validMainStep, currentSubStep: validSubStep })
      }
    }
  },

  completeOnboarding: async () => {
    const { userId, completedSteps, currentMainStep } = get()
    const newCompletedSteps = [...new Set([...completedSteps, currentMainStep])]

    if (userId) {
      await updateOnboardingProgress(userId, {
        current_step: ONBOARDING_MAIN_STEPS.length * 100,
        is_completed: true,
        completed_steps: newCompletedSteps,
      })
    }
    set({
      isCompleted: true,
      completedSteps: newCompletedSteps,
      isOpen: false,
    })
  },
}))

// Re-export for convenience
export { ONBOARDING_MAIN_STEPS } from './onboarding-steps'
export type { OnboardingMainStep, OnboardingSubStep } from './onboarding-types'
