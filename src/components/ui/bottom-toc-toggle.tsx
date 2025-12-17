'use client';

import { ListOrdered, MessageCircleWarning, BookOpenCheck } from 'lucide-react';

import { useVisibilityStore } from '@/lib/stores/visibility-store';
import { cn } from '@/lib/utils';

import { ToolbarButton, ToolbarGroup } from './toolbar';

export function BottomTocToggle() {
  const { tocEnabled, toggleToc } = useVisibilityStore();

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip="Inhaltsverzeichnis ein/ausblenden"
        pressed={tocEnabled}
        className={cn(
          'text-xs bg-none text-muted-foreground hover:text-muted-foreground dark:bg-transparent dark:hover:text-foreground/50',
          tocEnabled && 'bg-none text-primary hover:text-muted-foreground dark:bg-transparent'
        )}
        onClick={toggleToc}
      >
        <ListOrdered className={cn(
            'h-3 w-3 text-muted-foreground',
            tocEnabled && 'text-primary'
          )}
          aria-hidden
        />
        Inhaltsverzeichnis
      </ToolbarButton>
    </ToolbarGroup>
  );
}

export function BottomCommentTocToggle() {
  const { commentTocEnabled, toggleCommentToc } = useVisibilityStore();

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip="Kommentarverzeichnis ein/ausblenden"
        pressed={commentTocEnabled}
        className={cn(
          'text-xs bg-none text-muted-foreground hover:text-muted-foreground dark:bg-transparent dark:hover:text-foreground/50',
          commentTocEnabled &&
            'bg-none text-primary hover:text-muted-foreground dark:bg-transparent'
        )}
        onClick={toggleCommentToc}
      >
        <MessageCircleWarning 
          className={cn(
            'h-3 w-3 text-muted-foreground',
            commentTocEnabled && 'text-primary'
          )}
          aria-hidden
        />
        Kommentare
      </ToolbarButton>
    </ToolbarGroup>
  );
}

export function BottomSuggestionTocToggle() {
  const { suggestionTocEnabled, toggleSuggestionToc } = useVisibilityStore();

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip="Vorschlagsverzeichnis ein/ausblenden"
        pressed={suggestionTocEnabled}
        className={cn(
          'text-xs bg-none text-muted-foreground hover:text-muted-foreground dark:bg-transparent dark:hover:text-foreground/50',
          suggestionTocEnabled &&
            'bg-none text-primary hover:text-muted-foreground dark:bg-transparent'
        )}
        onClick={toggleSuggestionToc}
      >
        <BookOpenCheck
          className={cn(
            'h-3 w-3 text-muted-foreground',
            suggestionTocEnabled && 'text-primary'
          )}
          aria-hidden
        />
        Vorschläge
      </ToolbarButton>
    </ToolbarGroup>
  );
}
