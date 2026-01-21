'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Etwas ist schiefgelaufen!</h2>
          <p className="text-muted-foreground max-w-md">
            Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es erneut.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={reset} variant="default">
            Erneut versuchen
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  )
}
