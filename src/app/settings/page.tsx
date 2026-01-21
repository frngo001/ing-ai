"use client"

import { useState } from "react"
import { SettingsDialog } from "@/components/settings-dialog"

export default function Page() {
  const [open, setOpen] = useState(true)

  return (
    <div className="flex h-svh items-center justify-center">
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
