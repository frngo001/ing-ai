'use client';

import * as React from 'react';
import { ListOrdered, MessageCircleWarning, BookOpenCheck, Image as ImageIcon } from 'lucide-react';

import { useVisibilityStore } from '@/lib/stores/visibility-store';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';

import { ToolbarButton, ToolbarGroup } from './toolbar';

export function BottomTocToggle() {
  const { tocEnabled, toggleToc } = useVisibilityStore();
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.toc'), [t, language]);
  const tableOfContentsText = React.useMemo(() => t('toolbar.tableOfContents'), [t, language]);

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip={tooltipText}
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
        {tableOfContentsText}
      </ToolbarButton>
    </ToolbarGroup>
  );
}

export function BottomCommentTocToggle() {
  const { commentTocEnabled, toggleCommentToc } = useVisibilityStore();
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.commentToc'), [t, language]);
  const commentsText = React.useMemo(() => t('sidebar.comments'), [t, language]);

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip={tooltipText}
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
        {commentsText}
      </ToolbarButton>
    </ToolbarGroup>
  );
}

export function BottomSuggestionTocToggle() {
  const { suggestionTocEnabled, toggleSuggestionToc } = useVisibilityStore();
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.suggestionToc'), [t, language]);
  const suggestionText = React.useMemo(() => t('toolbar.suggestion'), [t, language]);

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip={tooltipText}
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
        {suggestionText}
      </ToolbarButton>
    </ToolbarGroup>
  );
}

export function BottomFigureTocToggle() {
  const { figureTocEnabled, toggleFigureToc } = useVisibilityStore();
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.figureToc'), [t, language]);
  const figureText = React.useMemo(() => t('figure.figure'), [t, language]);

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip={tooltipText}
        pressed={figureTocEnabled}
        className={cn(
          'text-xs bg-none text-muted-foreground hover:text-muted-foreground dark:bg-transparent dark:hover:text-foreground/50',
          figureTocEnabled &&
          'bg-none text-primary hover:text-muted-foreground dark:bg-transparent'
        )}
        onClick={toggleFigureToc}
      >
        <ImageIcon
          className={cn(
            'h-3 w-3 text-muted-foreground',
            figureTocEnabled && 'text-primary'
          )}
          aria-hidden
        />
        {figureText}
      </ToolbarButton>
    </ToolbarGroup>
  );
}
