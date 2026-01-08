'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background'
import { useOnboardingStore } from '@/lib/stores/onboarding-store'
import { ONBOARDING_MAIN_STEPS } from '@/lib/stores/onboarding-steps'
import { useLanguage } from '@/lib/i18n/use-language'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  GraduationCap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const stepAccentColors = [
  'text-amber-600 dark:text-amber-400',
  'text-blue-600 dark:text-blue-400',
  'text-violet-600 dark:text-violet-400',
  'text-emerald-600 dark:text-emerald-400',
  'text-rose-600 dark:text-rose-400',
  'text-indigo-600 dark:text-indigo-400',
  'text-orange-600 dark:text-orange-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-slate-600 dark:text-slate-400',
  'text-green-600 dark:text-green-400',
]

export function OnboardingDialog() {
  const { t } = useLanguage()
  const {
    isOpen,
    setOpen,
    currentMainStep,
    completedSteps,
    nextSubStep,
    prevSubStep,
    skipOnboarding,
    isLoading,
  } = useOnboardingStore()

  const progress = ((currentMainStep + 1) / ONBOARDING_MAIN_STEPS.length) * 100
  const isLastStep = currentMainStep === ONBOARDING_MAIN_STEPS.length - 1
  const isFirstStep = currentMainStep === 0

  const handleNext = async () => {
    await nextSubStep()
  }

  const handleSkip = async () => {
    await skipOnboarding()
  }

  if (isLoading) return null

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/30 shadow-2xl">
        <DialogTitle className="sr-only">
          {t('onboarding.title')}
        </DialogTitle>

        {/* Decorative Header */}
        <div className="relative h-40 overflow-hidden bg-muted/30">
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

          {/* Skip button */}
          {!isLastStep && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 text-foreground/60 hover:text-foreground hover:bg-white/20"
              onClick={handleSkip}
            >
              {t('onboarding.skip')}
              <X className="w-4 h-4 ml-1" />
            </Button>
          )}

          {/* Step indicator */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {ONBOARDING_MAIN_STEPS.map((_, index) => (
              <motion.div
                key={index}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  index === currentMainStep
                    ? 'w-6 bg-foreground/70'
                    : completedSteps.includes(index)
                    ? 'w-1.5 bg-foreground/40'
                    : 'w-1.5 bg-foreground/20'
                )}
                animate={{
                  scale: index === currentMainStep ? 1 : 0.9,
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentMainStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Step Number */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs font-medium tracking-wider uppercase',
                  stepAccentColors[currentMainStep]
                )}>
                  {t('onboarding.stepOf')
                    .replace('{current}', String(currentMainStep + 1))
                    .replace('{total}', String(ONBOARDING_MAIN_STEPS.length))}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                {t(ONBOARDING_MAIN_STEPS[currentMainStep].titleKey)}
              </h2>

              {/* Description */}
              <p className="text-muted-foreground leading-relaxed text-base">
                {t(ONBOARDING_MAIN_STEPS[currentMainStep].subSteps[0]?.descriptionKey || '')}
              </p>

              {/* Step-specific content */}
              <OnboardingStepContent step={currentMainStep} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t bg-muted/30">
          {/* Progress bar */}
          <div className="mb-4">
            <Progress value={progress} className="h-1" />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={prevSubStep}
              disabled={isFirstStep}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('onboarding.back')}
            </Button>

            <Button
              onClick={handleNext}
              className={cn(
                'gap-1 min-w-[120px]',
                isLastStep && 'bg-green-600 hover:bg-green-700'
              )}
            >
              {isLastStep ? (
                <>
                  {t('onboarding.finish')}
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  {t('onboarding.next')}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function OnboardingStepContent({ step }: { step: number }) {
  const { t } = useLanguage()

  const tipKeys = [
    'onboarding.tips.welcome',
    'onboarding.tips.createDocument',
    'onboarding.tips.editorBasics',
    'onboarding.tips.aiAssistant',
    'onboarding.tips.citations',
    'onboarding.tips.library',
    'onboarding.tips.research',
    'onboarding.tips.export',
    'onboarding.tips.settings',
    'onboarding.tips.complete',
  ]

  const tips = t(tipKeys[step])?.split('|') || []

  if (tips.length === 0 || (tips.length === 1 && tips[0] === tipKeys[step])) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50"
    >
      <div className="flex items-start gap-3">
        <GraduationCap className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <ul className="space-y-2 text-sm text-muted-foreground">
          {tips.map((tip, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{tip.trim()}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}
