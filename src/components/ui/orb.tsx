"use client"

import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

type AgentState = "idle" | "talking" | null

type OrbProps = ComponentProps<"div"> & {
  agentState?: AgentState
}

export const Orb = ({ agentState = "idle", className, ...props }: OrbProps) => (
  <div
    className={cn(
      "relative isolate aspect-square overflow-hidden rounded-full",
      agentState === "talking"
        ? "animate-pulse bg-gradient-to-br from-primary/80 via-primary/60 to-indigo-500/70"
        : "bg-gradient-to-br from-muted/70 via-muted/50 to-muted/70",
      className
    )}
    {...props}
  >
    <div className="absolute inset-0 opacity-60 blur-md bg-gradient-to-br from-primary/60 via-foreground/30 to-primary/60" />
    <div className="absolute inset-0" />
  </div>
)

