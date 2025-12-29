'use client';

import * as React from 'react';

import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikethroughIcon,
  UnderlineIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorPlugin, useEditorReadOnly } from 'platejs/react';
import { AIChatPlugin } from '@platejs/ai/react';

import { CitationToolbarButton } from './citation-toolbar-button';
import { CommentToolbarButton } from './comment-toolbar-button';
import { InlineEquationToolbarButton } from './equation-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { SuggestionToolbarButton } from './suggestion-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';
import { useLanguage } from '@/lib/i18n/use-language';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();
  const { api } = useEditorPlugin(AIChatPlugin);
  const { t, language } = useLanguage();

  const aiCommandsLabel = React.useMemo(() => t('toolbar.aiCommands'), [t, language]);
  const askAiText = React.useMemo(() => t('toolbar.askAi'), [t, language]);
  const boldTooltip = React.useMemo(() => t('toolbar.bold'), [t, language]);
  const italicTooltip = React.useMemo(() => t('toolbar.italic'), [t, language]);
  const underlineTooltip = React.useMemo(() => t('toolbar.underline'), [t, language]);
  const strikethroughTooltip = React.useMemo(() => t('toolbar.strikethrough'), [t, language]);
  const inlineCodeTooltip = React.useMemo(() => t('toolbar.inlineCode'), [t, language]);

  return (
    <>
      {!readOnly && (
        <>
          <ToolbarGroup>
            <button
              type="button"
              onClick={() => api.aiChat.show()}
              onMouseDown={(e) => e.preventDefault()}
              className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-[color,box-shadow] hover:bg-muted hover:text-muted-foreground focus-visible:border-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-accent aria-checked:text-accent-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0 h-8 min-w-8 px-1.5 bg-transparent"
              aria-label={aiCommandsLabel}
            >
              <WandSparklesIcon />
              {askAiText}
            </button>
          </ToolbarGroup>

          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} tooltip={boldTooltip}>
              <BoldIcon />
            </MarkToolbarButton>

            <CitationToolbarButton />

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={italicTooltip}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip={underlineTooltip}
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip={strikethroughTooltip}
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip={inlineCodeTooltip}>
              <Code2Icon />
            </MarkToolbarButton>

            <InlineEquationToolbarButton />

            <LinkToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        <CommentToolbarButton />
        <SuggestionToolbarButton />

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  );
}
