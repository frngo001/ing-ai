"use client"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type MessageRole = "assistant" | "user" | "system"

type MessageProps = ComponentProps<"div"> & {
  from?: MessageRole
}

export const Message = ({
  from = "assistant",
  className,
  children,
  ...props
}: MessageProps) => (
  <div
    className={cn(
      "flex w-full gap-3 py-2 [&_*]:scrollbar-hide",
      from === "user" ? "justify-end" : "justify-start",
      className
    )}
    {...props}
  >
    <div
      className={cn(
        "flex w-full max-w-full items-start gap-3",
        from === "user" ? "flex-row-reverse text-right" : "flex-row"
      )}
    >
      {children}
    </div>
  </div>
)

type MessageContentProps = ComponentProps<"div">

export const MessageContent = ({
  className,
  ...props
}: MessageContentProps) => (
  <div
    className={cn("flex w-auto max-w-[100%] flex-col gap-2 text-sm leading-relaxed", className)}
    {...props}
  />
)

