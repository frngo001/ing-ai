"use client"

import { Check, Copy } from "lucide-react"

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CopyButtonProps = {
  content: string
  copyMessage?: string
  className?: string
}

export function CopyButton({ content, copyMessage, className }: CopyButtonProps) {
  const { isCopied, handleCopy } = useCopyToClipboard({
    text: content,
    copyMessage,
    withToast: false,
  })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative h-8 w-8", className)}
          aria-label="Kopieren"
          onClick={handleCopy}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <Check
              className={cn(
                "h-4 w-4 transition-transform ease-in-out",
                isCopied ? "scale-100" : "scale-0"
              )}
            />
          </div>
          <Copy
            className={cn(
              "h-4 w-4 transition-transform ease-in-out",
              isCopied ? "scale-0" : "scale-100"
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{isCopied ? "Kopiert" : "Kopieren"}</TooltipContent>
    </Tooltip>
  )
}
