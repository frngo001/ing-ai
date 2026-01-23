"use client"

import { useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronRight, Send, PenLine, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/lib/i18n/use-language"

export interface AIChoice {
  label: string
  value: string
}

export interface AIQuestion {
  id: string
  title?: string
  choices: AIChoice[]
}

export interface AIAnswer {
  questionId: string
  questionTitle?: string
  answer: string
  isCustom: boolean
}

interface AIChoiceButtonsProps {
  choices: AIChoice[]
  onSelect: (choice: AIChoice) => void
  disabled?: boolean
  className?: string
}

interface AIQuestionnaireProps {
  questions: AIQuestion[]
  onSubmit: (answers: AIAnswer[]) => void
  disabled?: boolean
  className?: string
}

/**
 * Elegante klickbare Auswahloptionen für AI-Fragen.
 * Für einzelne Fragen - wird sofort gesendet.
 */
export function AIChoiceButtons({
  choices,
  onSelect,
  disabled = false,
  className,
}: AIChoiceButtonsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const handleSelect = (choice: AIChoice, index: number) => {
    if (disabled || isAnimating) return

    setIsAnimating(true)
    setSelectedIndex(index)

    setTimeout(() => {
      onSelect(choice)
    }, 200)
  }

  return (
    <div className={cn("flex flex-col gap-2 py-3", className)}>
      {choices.map((choice, index) => {
        const isSelected = selectedIndex === index
        const isOtherSelected = selectedIndex !== null && selectedIndex !== index

        return (
          <button
            key={index}
            type="button"
            disabled={disabled || isAnimating}
            onClick={() => handleSelect(choice, index)}
            className={cn(
              "group relative flex items-center gap-3 w-full text-left",
              "px-4 py-3 rounded-xl",
              "transition-all duration-200 ease-out",
              "border",
              !isSelected && !isOtherSelected && [
                "bg-muted/30 dark:bg-muted/20",
                "border-border/50 dark:border-border/30",
                "hover:bg-muted/60 dark:hover:bg-muted/40",
                "hover:border-border dark:hover:border-border/60",
                "hover:shadow-sm",
              ],
              isSelected && [
                "bg-muted dark:bg-muted/40",
                "border-border dark:border-border/60",
                "shadow-sm",
                "scale-[0.98]",
              ],
              isOtherSelected && [
                "opacity-40",
                "bg-muted/20 dark:bg-muted/10",
                "border-transparent",
                "pointer-events-none",
              ],
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center",
                "w-5 h-5 rounded-full",
                "border-2 transition-all duration-200",
                "flex-shrink-0",
                !isSelected && [
                  "border-muted-foreground/30",
                  "group-hover:border-muted-foreground/50",
                ],
                isSelected && [
                  "border-green-600 bg-green-600/10 dark:bg-green-600/20",
                  "text-green-600 dark:text-green-400",
                ]
              )}
            >
              {isSelected && (
                <Check
                  className="w-3 h-3 animate-in zoom-in-50 duration-150"
                  strokeWidth={3}
                />
              )}
            </div>
            <span
              className={cn(
                "flex-1 text-sm font-medium",
                "transition-colors duration-200",
                !isSelected && [
                  "text-foreground/80",
                  "group-hover:text-foreground",
                ],
                isSelected && "text-foreground"
              )}
            >
              {choice.label}
            </span>
            <ChevronRight
              className={cn(
                "w-4 h-4 flex-shrink-0",
                "transition-all duration-200",
                "text-muted-foreground/0",
                "group-hover:text-muted-foreground/60",
                "group-hover:translate-x-0.5",
                isSelected && "text-muted-foreground/60 translate-x-0.5"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/**
 * Multi-Question Questionnaire Komponente.
 * Zeigt Fragen nacheinander an - nächste Frage erscheint erst nach Beantwortung.
 * Unterstützt Custom-Antworten für jede Frage.
 */
export function AIQuestionnaire({
  questions,
  onSubmit,
  disabled = false,
  className,
}: AIQuestionnaireProps) {
  const { t } = useLanguage()
  const [answers, setAnswers] = useState<Record<string, { answer: string; isCustom: boolean }>>({})
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({})
  const [showCustomInput, setShowCustomInput] = useState<Record<string, boolean>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [expandedAnswered, setExpandedAnswered] = useState<Set<string>>(new Set())

  const answeredCount = Object.keys(answers).filter(k => answers[k]?.answer).length
  const allAnswered = answeredCount === questions.length
  const progressPercent = (answeredCount / questions.length) * 100

  // Bestimme die aktuelle Frage (erste unbeantwortete)
  const currentQuestionIndex = useMemo(() => {
    for (let i = 0; i < questions.length; i++) {
      if (!answers[questions[i].id]?.answer) {
        return i
      }
    }
    return questions.length // Alle beantwortet
  }, [questions, answers])

  const handleSelectChoice = useCallback((questionId: string, choice: AIChoice) => {
    if (disabled || isSubmitted) return
    setAnswers(prev => ({
      ...prev,
      [questionId]: { answer: choice.label, isCustom: false }
    }))
    setShowCustomInput(prev => ({ ...prev, [questionId]: false }))
  }, [disabled, isSubmitted])

  const handleToggleCustom = useCallback((questionId: string) => {
    if (disabled || isSubmitted) return
    setShowCustomInput(prev => ({ ...prev, [questionId]: !prev[questionId] }))
    if (!showCustomInput[questionId]) {
      setAnswers(prev => {
        const newAnswers = { ...prev }
        delete newAnswers[questionId]
        return newAnswers
      })
    }
  }, [disabled, isSubmitted, showCustomInput])

  const handleCustomInputChange = useCallback((questionId: string, value: string) => {
    setCustomInputs(prev => ({ ...prev, [questionId]: value }))
    if (value.trim()) {
      setAnswers(prev => ({
        ...prev,
        [questionId]: { answer: value.trim(), isCustom: true }
      }))
    } else {
      setAnswers(prev => {
        const newAnswers = { ...prev }
        delete newAnswers[questionId]
        return newAnswers
      })
    }
  }, [])

  const handleEditAnswer = useCallback((questionId: string) => {
    setExpandedAnswered(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }, [])

  const handleSubmit = useCallback(() => {
    if (!allAnswered || disabled || isSubmitted) return

    setIsAnimating(true)

    setTimeout(() => {
      const formattedAnswers: AIAnswer[] = questions.map(q => ({
        questionId: q.id,
        questionTitle: q.title,
        answer: answers[q.id].answer,
        isCustom: answers[q.id].isCustom
      }))

      setIsSubmitted(true)
      onSubmit(formattedAnswers)
    }, 200)
  }, [allAnswered, disabled, isSubmitted, questions, answers, onSubmit])

  if (isSubmitted) {
    return null
  }

  return (
    <div className={cn("space-y-4 py-4", className)}>
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            {t('aiChoiceButtons.questionProgress')
              .replace('{current}', String(Math.min(currentQuestionIndex + 1, questions.length)))
              .replace('{total}', String(questions.length))}
          </span>
          <span className={cn(
            "font-semibold transition-colors",
            allAnswered ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
          )}>
            {t('aiChoiceButtons.answeredCount')
              .replace('{count}', String(answeredCount))
              .replace('{total}', String(questions.length))}
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5 [&>div]:bg-green-600 dark:[&>div]:bg-green-500" />
      </div>

      {/* Bereits beantwortete Fragen (kompakt) */}
      {currentQuestionIndex > 0 && (
        <div className="space-y-2">
          {questions.slice(0, currentQuestionIndex).map((question, qIndex) => {
            const answer = answers[question.id]
            const isExpanded = expandedAnswered.has(question.id)
            const isCustomMode = showCustomInput[question.id]

            return (
              <div
                key={question.id}
                className={cn(
                  "rounded-lg border transition-all duration-200",
                  isExpanded
                    ? "border-border/60 bg-muted-for"
                    : "border-border/40 bg-muted/10"
                )}
              >
                {/* Kompakte Ansicht */}
                <button
                  type="button"
                  onClick={() => handleEditAnswer(question.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                >
                  <div className="flex items-center justify-center w-5 h-5 rounded-full border border-border/60 bg-muted/20">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" strokeWidth={3} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-muted-foreground">
                      {question.title || t('aiChoiceButtons.defaultQuestionTitle').replace('{index}', String(qIndex + 1))}
                    </span>
                    <p className="text-sm font-medium text-foreground truncate">
                      {answer?.answer}
                    </p>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200",
                    isExpanded && "rotate-180"
                  )} />
                </button>

                {/* Erweiterte Ansicht zum Bearbeiten */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-1 border-t border-border/40 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-2">
                      {question.choices.map((choice, index) => {
                        const isSelected = answer?.answer === choice.label && !answer?.isCustom

                        return (
                          <button
                            key={index}
                            type="button"
                            disabled={disabled || isAnimating}
                            onClick={() => handleSelectChoice(question.id, choice)}
                            className={cn(
                              "group relative flex items-center gap-3 w-full text-left",
                              "px-3 py-2 rounded-md",
                              "transition-all duration-200 ease-out",
                              "border",
                              !isSelected && !isCustomMode && [
                                "bg-background/50",
                                "border-border/40",
                                "hover:bg-muted/40",
                              ],
                              isSelected && [
                                "bg-muted",
                                "border-border",
                              ],
                              isCustomMode && "opacity-40 border-transparent"
                            )}
                          >
                            <div className={cn(
                              "w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center",
                              !isSelected && "border-muted-foreground/30",
                              isSelected && "border-green-600 bg-green-600/10"
                            )}>
                              {isSelected && <Check className="w-2 h-2 text-green-600" strokeWidth={3} />}
                            </div>
                            <span className="text-sm">{choice.label}</span>
                          </button>
                        )
                      })}

                      {/* Custom Option */}
                      <button
                        type="button"
                        disabled={disabled || isAnimating}
                        onClick={() => handleToggleCustom(question.id)}
                        className={cn(
                          "flex items-center gap-3 w-full text-left px-3 py-2 rounded-md border border-dashed",
                          !isCustomMode && "border-border/40 hover:bg-muted/30",
                          isCustomMode && "border-border bg-muted/20"
                        )}
                      >
                        <PenLine className={cn("w-3.5 h-3.5", isCustomMode ? "text-foreground" : "text-muted-foreground/60")} />
                        <span className={cn("text-sm", isCustomMode ? "text-foreground" : "text-muted-foreground")}>
                          {t('aiChoiceButtons.ownAnswer')}
                        </span>
                      </button>

                      {isCustomMode && (
                        <textarea
                          value={customInputs[question.id] || ''}
                          onChange={(e) => handleCustomInputChange(question.id, e.target.value)}
                          placeholder={t('aiChoiceButtons.ownAnswerPlaceholder')}
                          disabled={disabled || isAnimating}
                          className="w-full px-3 py-2 rounded-md bg-background border border-border/60 text-sm resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-border/30"
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Aktuelle Frage (vollständig angezeigt) */}
      {currentQuestionIndex < questions.length && (
        <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          {(() => {
            const question = questions[currentQuestionIndex]
            const currentAnswer = answers[question.id]
            const isCustomMode = showCustomInput[question.id]

            return (
              <div className="space-y-3">
                {/* Question Header */}
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted border border-border/60 text-foreground text-sm font-semibold">
                    {currentQuestionIndex + 1}
                  </span>
                  <h4 className="text-sm font-medium text-foreground flex-1">
                    {question.title || t('aiChoiceButtons.defaultQuestionTitle').replace('{index}', String(currentQuestionIndex + 1))}
                  </h4>
                </div>

                {/* Choice Options */}
                <div className="flex flex-col gap-2 pl-9">
                  {question.choices.map((choice, index) => {
                    const isSelected = currentAnswer?.answer === choice.label && !currentAnswer?.isCustom

                    return (
                      <button
                        key={index}
                        type="button"
                        disabled={disabled || isAnimating}
                        onClick={() => handleSelectChoice(question.id, choice)}
                        className={cn(
                          "group relative flex items-center gap-3 w-full text-left",
                          "px-4 py-3 rounded-xl",
                          "transition-all duration-200 ease-out",
                          "border",
                          !isSelected && !isCustomMode && [
                            "bg-muted/30 dark:bg-muted/20",
                            "border-border/50 dark:border-border/30",
                            "hover:bg-muted/60 dark:hover:bg-muted/40",
                            "hover:border-border dark:hover:border-border/60",
                            "hover:shadow-sm",
                          ],
                          isSelected && [
                            "bg-muted dark:bg-muted/40",
                            "border-border dark:border-border/60",
                            "shadow-sm",
                          ],
                          isCustomMode && [
                            "opacity-40",
                            "bg-muted/20 dark:bg-muted/10",
                            "border-transparent",
                          ],
                          disabled && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center",
                            "w-5 h-5 rounded-full",
                            "border-2 transition-all duration-200",
                            "flex-shrink-0",
                            !isSelected && "border-muted-foreground/30",
                            isSelected && "border-green-600 bg-green-600/10 dark:bg-green-600/20 text-green-600 dark:text-green-400"
                          )}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3" strokeWidth={3} />
                          )}
                        </div>
                        <span className={cn(
                          "flex-1 text-sm",
                          isSelected ? "text-foreground font-medium" : "text-foreground/80"
                        )}>
                          {choice.label}
                        </span>
                      </button>
                    )
                  })}

                  {/* Custom Answer Toggle & Input */}
                  <button
                    type="button"
                    disabled={disabled || isAnimating}
                    onClick={() => handleToggleCustom(question.id)}
                    className={cn(
                      "group relative flex items-center gap-3 w-full text-left",
                      "px-4 py-3 rounded-xl",
                      "transition-all duration-200 ease-out",
                      "border border-dashed",
                      !isCustomMode && [
                        "border-border/50 dark:border-border/30",
                        "hover:border-border dark:hover:border-border/60",
                        "hover:bg-muted/30",
                      ],
                      isCustomMode && [
                        "border-border dark:border-border/60",
                        "bg-muted/40",
                      ],
                      disabled && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <PenLine className={cn(
                      "w-5 h-5 flex-shrink-0",
                      isCustomMode ? "text-foreground" : "text-muted-foreground/60"
                    )} />
                    <span className={cn(
                      "flex-1 text-sm",
                      isCustomMode ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {t('aiChoiceButtons.writeOwnAnswer')}
                    </span>
                  </button>

                  {/* Custom Input Field */}
                  {isCustomMode && (
                    <div className="mt-1 animate-in slide-in-from-top-2 duration-200">
                      <textarea
                        value={customInputs[question.id] || ''}
                        onChange={(e) => handleCustomInputChange(question.id, e.target.value)}
                        placeholder={t('aiChoiceButtons.enterOwnAnswerPlaceholder')}
                        disabled={disabled || isAnimating}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl",
                          "bg-background border border-border/60",
                          "text-sm text-foreground placeholder:text-muted-foreground/60",
                          "focus:outline-none focus:ring-2 focus:ring-border/30 focus:border-border/60",
                          "resize-none min-h-[80px]",
                          "transition-all duration-200"
                        )}
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Submit Button - nur sichtbar wenn alle beantwortet */}
      {allAnswered && (
        <div className="flex justify-end pt-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
          <Button
            onClick={handleSubmit}
            disabled={disabled || isAnimating}
            size="sm"
            className="gap-2 bg-foreground text-background hover:bg-foreground/90 dark:bg-muted dark:text-foreground dark:hover:bg-muted/80 border border-transparent"
          >
            <Send className="w-3.5 h-3.5" />
            {t('aiChoiceButtons.sendAnswers')}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Regex pattern um [AUSWAHL]...[/AUSWAHL] Blöcke zu finden
 * Akzeptiert auch Blöcke ohne schließendes Tag (am Ende der Nachricht)
 * Unterstützt optionalen Titel: [AUSWAHL: Titel hier]
 */
const CHOICE_BLOCK_REGEX = /\[AUSWAHL(?::\s*([^\]]*))?\]\s*([\s\S]*?)(?:\s*\[\/AUSWAHL\]|(?=\[AUSWAHL)|$)/g

/**
 * Parst den AI-Text und extrahiert Choice-Blöcke.
 *
 * Format:
 * ```
 * [AUSWAHL: Optional Question Title]
 * - Option 1
 * - Option 2
 * [/AUSWAHL]
 * ```
 *
 * @returns Array mit Segmenten (Text oder Choices/Questions)
 */
export function parseChoicesFromText(text: string): Array<
  | { type: "text"; content: string }
  | { type: "choices"; choices: AIChoice[]; title?: string }
  | { type: "questions"; questions: AIQuestion[] }
> {
  const segments: Array<
    | { type: "text"; content: string }
    | { type: "choices"; choices: AIChoice[]; title?: string }
    | { type: "questions"; questions: AIQuestion[] }
  > = []

  let lastIndex = 0
  let match: RegExpExecArray | null
  const collectedQuestions: AIQuestion[] = []
  let questionStartIndex: number | null = null

  // Reset regex state
  CHOICE_BLOCK_REGEX.lastIndex = 0

  while ((match = CHOICE_BLOCK_REGEX.exec(text)) !== null) {
    // Erstes Match: speichere den Start-Index für Text davor
    if (questionStartIndex === null) {
      questionStartIndex = match.index

      // Text vor dem ersten Choice-Block hinzufügen
      if (match.index > lastIndex) {
        const textBefore = text.slice(lastIndex, match.index).trim()
        if (textBefore) {
          segments.push({ type: "text", content: textBefore })
        }
      }
    }

    const title = match[1]?.trim() || undefined
    const choicesContent = match[2]

    // Choices parsen
    const choiceLines = choicesContent
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("-") || line.startsWith("•"))
      .map(line => line.replace(/^[-•]\s*/, "").trim())
      .filter(line => line.length > 0)

    if (choiceLines.length > 0) {
      collectedQuestions.push({
        id: `q-${collectedQuestions.length}`,
        title,
        choices: choiceLines.map(label => ({
          label,
          value: label,
        })),
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Wenn mehrere Fragen gesammelt wurden, als "questions" zurückgeben
  if (collectedQuestions.length > 1) {
    segments.push({
      type: "questions",
      questions: collectedQuestions,
    })
  } else if (collectedQuestions.length === 1) {
    // Einzelne Frage als "choices" zurückgeben (alte Verhaltensweise)
    segments.push({
      type: "choices",
      choices: collectedQuestions[0].choices,
      title: collectedQuestions[0].title,
    })
  }

  // Restlichen Text hinzufügen
  if (lastIndex < text.length) {
    const textAfter = text.slice(lastIndex).trim()
    if (textAfter) {
      segments.push({ type: "text", content: textAfter })
    }
  }

  // Falls keine Choices gefunden, gesamten Text zurückgeben
  if (segments.length === 0 && text.trim()) {
    segments.push({ type: "text", content: text })
  }

  return segments
}

/**
 * Prüft ob der Text Choice-Blöcke enthält
 */
export function hasChoices(text: string): boolean {
  return text.includes('[AUSWAHL')
}

/**
 * Entfernt Choice-Blöcke aus dem Text (für die Anzeige nach Auswahl)
 */
export function removeChoiceBlocks(text: string): string {
  CHOICE_BLOCK_REGEX.lastIndex = 0
  return text.replace(CHOICE_BLOCK_REGEX, "").trim()
}

/**
 * Formatiert Antworten für die Chat-Nachricht
 */
export function formatAnswersForMessage(answers: AIAnswer[]): string {
  if (answers.length === 1) {
    return answers[0].answer
  }

  return answers
    .map(a => a.questionTitle ? `**${a.questionTitle}:** ${a.answer}` : a.answer)
    .join('\n')
}
