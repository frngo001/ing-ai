"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Check, ChevronRight } from "lucide-react"

export interface AIChoice {
  label: string
  value: string
}

interface AIChoiceButtonsProps {
  choices: AIChoice[]
  onSelect: (choice: AIChoice) => void
  disabled?: boolean
  className?: string
}

/**
 * Elegante klickbare Auswahloptionen für AI-Fragen.
 * Inspiriert von Cursor IDE's Choice-UI.
 *
 * @example
 * ```tsx
 * <AIChoiceButtons
 *   choices={[
 *     { label: "Mit aktuellem Thema weitermachen", value: "keep" },
 *     { label: "Thema ändern", value: "change" }
 *   ]}
 *   onSelect={(choice) => console.log(choice)}
 * />
 * ```
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

    // Kurze Animation bevor die Auswahl gesendet wird
    setTimeout(() => {
      onSelect(choice)
    }, 200)
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 py-3",
        className
      )}
    >
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
              // Base styles
              "group relative flex items-center gap-3 w-full text-left",
              "px-4 py-3 rounded-xl",
              "transition-all duration-200 ease-out",
              "border",

              // Default state
              !isSelected && !isOtherSelected && [
                "bg-muted/30 dark:bg-muted/20",
                "border-border/50 dark:border-border/30",
                "hover:bg-muted/60 dark:hover:bg-muted/40",
                "hover:border-border dark:hover:border-border/60",
                "hover:shadow-sm",
              ],

              // Selected state
              isSelected && [
                "bg-primary/10 dark:bg-primary/20",
                "border-primary/50 dark:border-primary/40",
                "shadow-sm shadow-primary/10",
                "scale-[0.98]",
              ],

              // Other option when one is selected (fade out)
              isOtherSelected && [
                "opacity-40",
                "bg-muted/20 dark:bg-muted/10",
                "border-transparent",
                "pointer-events-none",
              ],

              // Disabled state
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Selection indicator */}
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
                  "border-primary bg-primary",
                  "text-primary-foreground",
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

            {/* Choice label */}
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

            {/* Arrow indicator on hover */}
            <ChevronRight
              className={cn(
                "w-4 h-4 flex-shrink-0",
                "transition-all duration-200",
                "text-muted-foreground/0",
                "group-hover:text-muted-foreground/60",
                "group-hover:translate-x-0.5",

                isSelected && "text-primary/60 translate-x-0.5"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

/**
 * Regex pattern um [AUSWAHL]...[/AUSWAHL] Blöcke zu finden
 * Akzeptiert auch Blöcke ohne schließendes Tag (am Ende der Nachricht)
 */
const CHOICE_BLOCK_REGEX = /\[AUSWAHL\]\s*([\s\S]*?)(?:\s*\[\/AUSWAHL\]|$)/g

/**
 * Parst den AI-Text und extrahiert Choice-Blöcke.
 *
 * Format:
 * ```
 * [AUSWAHL]
 * - Option 1
 * - Option 2
 * [/AUSWAHL]
 * ```
 *
 * @returns Array mit Segmenten (Text oder Choices)
 */
export function parseChoicesFromText(text: string): Array<
  | { type: "text"; content: string }
  | { type: "choices"; choices: AIChoice[] }
> {
  const segments: Array<
    | { type: "text"; content: string }
    | { type: "choices"; choices: AIChoice[] }
  > = []

  let lastIndex = 0
  let match: RegExpExecArray | null

  // Reset regex state
  CHOICE_BLOCK_REGEX.lastIndex = 0

  while ((match = CHOICE_BLOCK_REGEX.exec(text)) !== null) {
    // Text vor dem Choice-Block hinzufügen
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index).trim()
      if (textBefore) {
        segments.push({ type: "text", content: textBefore })
      }
    }

    // Choices parsen
    const choicesContent = match[1]
    const choiceLines = choicesContent
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.startsWith("-") || line.startsWith("•"))
      .map(line => line.replace(/^[-•]\s*/, "").trim())
      .filter(line => line.length > 0)

    if (choiceLines.length > 0) {
      segments.push({
        type: "choices",
        choices: choiceLines.map(label => ({
          label,
          value: label, // Kann später angepasst werden
        })),
      })
    }

    lastIndex = match.index + match[0].length
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
  // Einfacher Check für das öffnende Tag
  return text.includes('[AUSWAHL]')
}

/**
 * Entfernt Choice-Blöcke aus dem Text (für die Anzeige nach Auswahl)
 */
export function removeChoiceBlocks(text: string): string {
  // Reset regex state vor Verwendung
  CHOICE_BLOCK_REGEX.lastIndex = 0
  return text.replace(CHOICE_BLOCK_REGEX, "").trim()
}
