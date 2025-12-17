"use client"

import { isValidElement, type ReactNode } from "react"
import type { Components } from "react-markdown"
import type { MarkdownCodeProps } from './types'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { codeBlockStaticClassName } from "@/components/ui/code-block-node-static"
import { inlineCodeClassName } from "@/components/ui/code-node"
import {
  extractTextFromNode,
  getCodeLanguage,
  getCodeLanguageLabel,
  buildMarkdownTable,
  buildMarkdownTableFromMdast,
  buildMarkdownTableFromHast,
} from './markdown-utils'

export const markdownComponents: Components = {
  a: ({ node: _node, className, ...props }) => (
    <a
      className={cn("text-primary underline underline-offset-4 hover:text-primary/80 break-words", className)}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    />
  ),
  code: ({ node, inline, className, children, ref: _ref, ...props }: MarkdownCodeProps) => {
    const isInline =
      inline ?? (typeof node === "object" && node !== null && (node as { type?: string }).type === "inlineCode")

    const codeText = extractTextFromNode(children)
    const hasLineBreak = codeText.includes("\n")
    if (isInline || !hasLineBreak) {
      return (
        <code
          className={cn(inlineCodeClassName, className)}
          {...props}
        >
          {children}
        </code>
      )
    }
    const language = getCodeLanguage(className)
    const languageLabel = getCodeLanguageLabel(language)
    const showControls = hasLineBreak

    return (
      <div className={cn(codeBlockStaticClassName)}>
        <div className="relative rounded-md bg-muted-foreground/10">
          <pre
            className={cn(
              "overflow-x-auto p-8 pr-4 font-mono text-sm leading-[normal] [tab-size:2] print:break-inside-avoid",
              className
            )}
            data-language={language}
            {...props}
          >
            <code className={className} data-language={language}>
              {children}
            </code>
          </pre>

          {showControls && (
            <div className="absolute top-1 right-1 z-10 flex select-none items-center gap-0.5">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 select-none justify-between gap-1 px-2 text-muted-foreground text-xs"
                disabled
              >
                {languageLabel}
              </Button>
              <CopyButton
                className="h-5 w-5 text-muted-foreground [&_svg]:h-3 [&_svg]:w-3"
                content={codeText}
                copyMessage="Kopiert"
              />
            </div>
          )}
        </div>
      </div>
    )
  },
  pre: ({ node: _node, children }) => <>{children}</>,
  p: ({ className, children, ...props }) => {
    // Formatierung für Schritte: "Schritt X: Name" wird speziell formatiert
    const formatStepReferences = (content: ReactNode): ReactNode => {
      // Extrahiere Text aus ReactNode
      const extractText = (node: ReactNode): string => {
        if (typeof node === 'string') return node
        if (typeof node === 'number') return String(node)
        if (Array.isArray(node)) return node.map(extractText).join('')
        if (isValidElement(node) && node.props && typeof node.props === 'object' && 'children' in node.props) {
          return extractText(node.props.children as ReactNode)
        }
        return ''
      }

      const text = extractText(content)
      if (!text) return children

      // Erkenne Muster wie "Schritt 4: Literaturrecherche" oder "> Schritt 4: Literaturrecherche"
      const stepPattern = /(>?\s*)(Schritt\s+\d+:\s*[^\s]+(?:\s+[^\s]+)*)/gi
      const parts: ReactNode[] = []
      let lastIndex = 0
      let match
      let keyCounter = 0

      while ((match = stepPattern.exec(text)) !== null) {
        // Text vor dem Match
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index))
        }
        
        // Formatierter Schritt
        const stepText = match[2] // "Schritt 4: Literaturrecherche"
        parts.push(
          <span
            key={`step-${keyCounter++}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20"
          >
            {stepText}
          </span>
        )
        
        lastIndex = match.index + match[0].length
      }

      // Restlicher Text
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex))
      }

      // Wenn keine Schritte gefunden wurden, original children zurückgeben
      if (parts.length === 0) {
        return children
      }

      // Wenn nur ein Teil vorhanden ist und es der originale Text ist, original zurückgeben
      if (parts.length === 1 && typeof parts[0] === 'string' && parts[0] === text) {
        return children
      }

      return <>{parts}</>
    }

    return (
      <p className={cn("mb-3 last:mb-0 leading-relaxed", className)} {...props}>
        {formatStepReferences(children)}
      </p>
    )
  },
  table: ({ className, children, node, ...props }: { className?: string; children?: ReactNode; node?: unknown }) => {
    const tableMarkdown =
      buildMarkdownTableFromMdast(node) ?? buildMarkdownTableFromHast(node) ?? buildMarkdownTable(children)
    const fallbackText = extractTextFromNode(children).trim()
    const copyContent = tableMarkdown ?? fallbackText
    const hasContent = (tableMarkdown?.length ?? fallbackText.length) > 0

    return (
      <div className="relative mb-3 last:mb-0 overflow-hidden overflow-x-auto rounded-sm border border-border my-6">
        <table className={cn("w-full border-collapse text-sm", className)} {...props}>
          {children}
        </table>
        {hasContent && (
          <div className="absolute top-2 right-2 z-10">
            <CopyButton
              className="h-3 w-3 text-muted-foreground"
              content={copyContent}
              copyMessage="Tabelle kopiert (Markdown)"
            />
          </div>
        )}
      </div>
    )
  },
  thead: ({ className, ...props }) => (
    <thead className={cn("bg-muted/70 text-foreground", className)} {...props} />
  ),
  tbody: ({ className, ...props }) => <tbody className={cn("bg-background", className)} {...props} />,
  tr: ({ className, ...props }) => (
    <tr className={cn("border border-border even:bg-muted/40", className)} {...props} />
  ),
  th: ({ className, ...props }) => (
    <th className={cn("border border-border px-3 py-2 text-left font-semibold", className)} {...props} />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-border px-3 py-2 align-top", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn("mb-3 last:mb-0 list-disc pl-5 space-y-1", className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn("mb-3 last:mb-0 list-decimal pl-5 space-y-1", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "mb-3 last:mb-0 border-l-2 border-primary/40 pl-3 text-muted-foreground leading-relaxed",
        className
      )}
      {...props}
    />
  ),
}

