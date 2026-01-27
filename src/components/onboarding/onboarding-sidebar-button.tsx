'use client'

import { m } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useOnboardingStore, ONBOARDING_MAIN_STEPS } from '@/lib/stores/onboarding-store'
import { useLanguage } from '@/lib/i18n/use-language'
import { GraduationCap, PlayCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'

export function OnboardingSidebarButton() {
  const { t } = useLanguage()
  const { state } = useSidebar()
  const {
    isCompleted,
    isSkipped,
    currentMainStep,
    currentSubStep,
    completedSteps,
    resumeOnboarding,
    isLoading,
    getOverallProgress,
  } = useOnboardingStore()

  const progress = getOverallProgress()
  const hasStarted = currentMainStep > 0 || currentSubStep > 0 || completedSteps.length > 0
  const isCollapsed = state === 'collapsed'

  // Don't show if completed
  if (isCompleted || isLoading) return null

  // Collapsed state - just show icon
  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={resumeOnboarding}
        className={cn(
          'relative w-8 h-8 mx-auto',
          !isSkipped && 'animate-pulse'
        )}
        title={t('onboarding.continueOnboarding')}
      >
        <GraduationCap className="w-4 h-4" />
        {hasStarted && !isSkipped && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
        )}
      </Button>
    )
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-1 mb-2"
    >
      <div className="p-3 rounded-lg border border-border/60 bg-gradient-to-br from-background to-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate">
              {hasStarted ? t('onboarding.continueOnboarding') : t('onboarding.startOnboarding')}
            </h4>
            {hasStarted && (
              <p className="text-xs text-muted-foreground">
                {t('onboarding.stepProgress')
                  .replace('{completed}', String(completedSteps.length))
                  .replace('{total}', String(ONBOARDING_MAIN_STEPS.length))}
              </p>
            )}
          </div>
        </div>

        {hasStarted && (
          <div className="mb-3">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={resumeOnboarding}
            variant="default"
            className="group/btn relative flex-1 gap-2 overflow-hidden font-medium shadow-sm transition-all hover:shadow-md dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
          >
            <span className="relative z-10 flex items-center gap-2">
              {hasStarted ? (
                <>
                  <PlayCircle className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                  {t('onboarding.continue')}
                </>
              ) : (
                <>
                  <GraduationCap className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                  {t('onboarding.start')}
                </>
              )}
            </span>
          </Button>
        </div>
      </div>
    </m.div>
  )
}
