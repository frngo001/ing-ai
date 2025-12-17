"use client"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export const Response = ({ className, ...props }: ComponentProps<"div">) => (
  <div
    className={cn(
      "relative rounded-xl border border-border/70 bg-card/80 px-2 py-2 text-sm sm:text-[15px] leading-relaxed text-foreground shadow-sm backdrop-blur break-words scrollbar-hide",
      className
    )}
    {...props}
  />
)

