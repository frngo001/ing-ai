'use client';

export function EditorLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30" />
          <div className="absolute inset-0 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-foreground/60" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-sm font-medium">Lade</span>
          <div className="flex gap-1">
            <span
              className="inline-block h-1 w-1 rounded-full bg-muted-foreground/60 animate-pulse"
              style={{
                animationDelay: '0ms',
                animationDuration: '1200ms',
              }}
            />
            <span
              className="inline-block h-1 w-1 rounded-full bg-muted-foreground/60 animate-pulse"
              style={{
                animationDelay: '200ms',
                animationDuration: '1200ms',
              }}
            />
            <span
              className="inline-block h-1 w-1 rounded-full bg-muted-foreground/60 animate-pulse"
              style={{
                animationDelay: '400ms',
                animationDuration: '1200ms',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

