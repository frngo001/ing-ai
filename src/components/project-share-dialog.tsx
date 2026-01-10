"use client"

import * as React from "react"
import { format } from "date-fns"
import { de, enUS } from "date-fns/locale"
import {
  CalendarIcon,
  Check,
  Copy,
  Eye,
  Loader2,
  Pencil,
  MessageSquare,
  Trash2,
  Link as LinkIcon,
  X,
} from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n/use-language"
import { useOnboardingStore } from "@/lib/stores/onboarding-store"
import { devError } from "@/lib/utils/logger"

type ShareMode = "view" | "edit" | "suggest"

interface ProjectShare {
  id: string
  share_token: string
  mode: ShareMode
  is_active: boolean
  expires_at: string | null
  created_at: string
}

interface ProjectShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
}

export function ProjectShareDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: ProjectShareDialogProps) {
  const { t, language } = useLanguage()
  const dateLocale = language === "de" ? de : enUS

  const [mode, setMode] = React.useState<ShareMode>("view")
  const [expiresAt, setExpiresAt] = React.useState<Date | undefined>(undefined)
  const [shares, setShares] = React.useState<ProjectShare[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isCreating, setIsCreating] = React.useState(false)
  const [copiedShareId, setCopiedShareId] = React.useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = React.useState<string | null>(null)

  const loadShares = React.useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/share?projectId=${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.shares || [])
      }
    } catch (error) {
      devError("[ProjectShareDialog] Error loading shares:", error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  React.useEffect(() => {
    if (open && projectId) {
      loadShares()
      setGeneratedLink(null)
    }
  }, [open, projectId, loadShares])

  const handleCreateShare = async () => {
    setIsCreating(true)
    try {
      const response = await fetch("/api/projects/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          mode,
          expiresAt: expiresAt?.toISOString(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedLink(data.shareUrl)
        setShares((prev) => [data.share, ...prev])
        setExpiresAt(undefined)
      }
    } catch (error) {
      devError("[ProjectShareDialog] Error creating share:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevokeShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/projects/share?shareId=${shareId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setShares((prev) =>
          prev.map((share) =>
            share.id === shareId ? { ...share, is_active: false } : share
          )
        )
      }
    } catch (error) {
      devError("[ProjectShareDialog] Error revoking share:", error)
    }
  }

  const handleDeleteShare = async (shareId: string) => {
    try {
      const response = await fetch(
        `/api/projects/share?shareId=${shareId}&permanent=true`,
        { method: "DELETE" }
      )

      if (response.ok) {
        setShares((prev) => prev.filter((share) => share.id !== shareId))
      }
    } catch (error) {
      devError("[ProjectShareDialog] Error deleting share:", error)
    }
  }

  const handleCopyLink = async (shareToken: string, shareId: string) => {
    const url = `${window.location.origin}/shared/${shareToken}`
    await navigator.clipboard.writeText(url)
    setCopiedShareId(shareId)
    setTimeout(() => setCopiedShareId(null), 2000)
  }

  const getModeIcon = (shareMode: ShareMode) => {
    switch (shareMode) {
      case "view":
        return <Eye className="size-4" />
      case "edit":
        return <Pencil className="size-4" />
      case "suggest":
        return <MessageSquare className="size-4" />
    }
  }

  const getModeLabel = (shareMode: ShareMode) => {
    switch (shareMode) {
      case "view":
        return t("projectSharing.viewMode")
      case "edit":
        return t("projectSharing.editMode")
      case "suggest":
        return t("projectSharing.suggestMode")
    }
  }

  const activeShares = shares.filter((s) => s.is_active)

  const { isOpen: isOnboardingOpen } = useOnboardingStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => {
          if (isOnboardingOpen) {
            e.preventDefault()
          }
        }}
        data-onboarding="share-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t("projectSharing.title")}</DialogTitle>
          <DialogDescription>
            {t("projectSharing.description", { projectName })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>{t("projectSharing.accessMode")}</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as ShareMode)}>
              <SelectTrigger data-onboarding="share-mode-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4" />
                    <span>{t("projectSharing.viewMode")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="edit">
                  <div className="flex items-center gap-2">
                    <Pencil className="size-4" />
                    <span>{t("projectSharing.editMode")}</span>
                  </div>
                </SelectItem>
                <SelectItem value="suggest">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="size-4" />
                    <span>{t("projectSharing.suggestMode")}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {mode === "view" && t("projectSharing.viewModeDescription")}
              {mode === "edit" && t("projectSharing.editModeDescription")}
              {mode === "suggest" && t("projectSharing.suggestModeDescription")}
            </p>
          </div>

          <div className="grid gap-2">
            <Label>{t("projectSharing.expiryDate")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {expiresAt
                    ? format(expiresAt, "PPP", { locale: dateLocale })
                    : t("projectSharing.noExpiry")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < new Date()}
                  locale={dateLocale}
                />
                {expiresAt && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setExpiresAt(undefined)}
                    >
                      {t("projectSharing.clearExpiry")}
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={handleCreateShare} disabled={isCreating} data-onboarding="share-generate-btn">
            {isCreating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("common.loading")}
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 size-4" />
                {t("projectSharing.generateLink")}
              </>
            )}
          </Button>

          {generatedLink && (
            <div className="rounded-lg border bg-muted/50 p-3" data-onboarding="share-link-area">
              <Label className="text-xs text-muted-foreground">
                {t("projectSharing.generatedLink")}
              </Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink)
                    setCopiedShareId("new")
                    setTimeout(() => setCopiedShareId(null), 2000)
                  }}
                >
                  {copiedShareId === "new" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {activeShares.length > 0 && (
            <>
              <Separator />
              <div>
                <Label className="text-sm font-medium">
                  {t("projectSharing.activeShares")} ({activeShares.length})
                </Label>
                <ScrollArea className="mt-2 h-[150px]">
                  <div className="space-y-2">
                    {activeShares.map((share) => (
                      <div
                        key={share.id}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="flex items-center gap-2">
                          {getModeIcon(share.mode)}
                          <div>
                            <p className="text-sm font-medium">
                              {getModeLabel(share.mode)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {share.expires_at
                                ? t("projectSharing.expiresOn", {
                                  date: format(
                                    new Date(share.expires_at),
                                    "PPP",
                                    { locale: dateLocale }
                                  ),
                                })
                                : t("projectSharing.noExpirySet")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              handleCopyLink(share.share_token, share.id)
                            }
                          >
                            {copiedShareId === share.id ? (
                              <Check className="size-4" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRevokeShare(share.id)}
                          >
                            <X className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteShare(share.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
