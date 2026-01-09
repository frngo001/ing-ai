"use client"

import { Eye, Pencil, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSharedAccess } from "@/hooks/use-shared-access"
import { useLanguage } from "@/lib/i18n/use-language"
import { cn } from "@/lib/utils"
import * as React from "react"

interface SharedAccessBannerProps {
  className?: string
}

export function SharedAccessBanner({ className }: SharedAccessBannerProps) {
  const { t } = useLanguage()
  const { isSharedAccess, shareMode, isOwner } = useSharedAccess()
  const [dismissed, setDismissed] = React.useState(false)

  if (!isSharedAccess || isOwner || dismissed) {
    return null
  }

  const getModeInfo = () => {
    switch (shareMode) {
      case "view":
        return {
          icon: <Eye className="size-4" />,
          text: t("projectSharing.viewModeActive"),
          bgColor: "bg-blue-500/10 border-blue-500/20",
          textColor: "text-blue-700 dark:text-blue-300",
        }
      case "edit":
        return {
          icon: <Pencil className="size-4" />,
          text: t("projectSharing.editModeActive"),
          bgColor: "bg-green-500/10 border-green-500/20",
          textColor: "text-green-700 dark:text-green-300",
        }
      case "suggest":
        return {
          icon: <MessageSquare className="size-4" />,
          text: t("projectSharing.suggestModeActive"),
          bgColor: "bg-amber-500/10 border-amber-500/20",
          textColor: "text-amber-700 dark:text-amber-300",
        }
      default:
        return null
    }
  }

  const modeInfo = getModeInfo()
  if (!modeInfo) return null

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b px-4 py-2",
        modeInfo.bgColor,
        className
      )}
    >
      <div className={cn("flex items-center gap-2 text-sm font-medium", modeInfo.textColor)}>
        {modeInfo.icon}
        <span>{modeInfo.text}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={() => setDismissed(true)}
      >
        <X className="size-3" />
      </Button>
    </div>
  )
}
