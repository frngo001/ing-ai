import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-4">
          <FileQuestion className="h-12 w-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">404 - Seite nicht gefunden</h2>
          <p className="text-muted-foreground max-w-md">
            Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/">Zur Startseite</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/blog">Zum Blog</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
