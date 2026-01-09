"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useSharedProjectStore } from "@/lib/stores/shared-project-store"
import { useLanguage } from "@/lib/i18n/use-language"

interface SharedProjectPageProps {
  params: Promise<{ token: string }>
}

export default function SharedProjectPage({ params }: SharedProjectPageProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const loadSharedProject = useSharedProjectStore((state) => state.loadSharedProject)
  const isLoading = useSharedProjectStore((state) => state.isLoading)
  const error = useSharedProjectStore((state) => state.error)
  const sharedProject = useSharedProjectStore((state) => state.sharedProject)

  const [token, setToken] = React.useState<string | null>(null)

  React.useEffect(() => {
    params.then((p) => setToken(p.token))
  }, [params])

  React.useEffect(() => {
    if (token) {
      loadSharedProject(token)
    }
  }, [token, loadSharedProject])

  React.useEffect(() => {
    if (sharedProject && !isLoading && !error) {
      if (sharedProject.documents.length > 0) {
        router.push(`/editor?doc=${sharedProject.documents[0].id}&shared=${token}`)
      } else {
        router.push(`/editor?shared=${token}`)
      }
    }
  }, [sharedProject, isLoading, error, router, token])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("projectSharing.loadingSharedProject")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg
              className="size-8 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">{t("projectSharing.invalidLink")}</h1>
          <p className="text-muted-foreground">{t("projectSharing.linkExpiredOrInvalid")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  )
}
