'use client';

import * as React from 'react';

import { useEditorSelector } from 'platejs/react';
import { Node } from 'slate';

import { useLanguage } from '@/lib/i18n/use-language';
import { ToolbarButton, ToolbarGroup } from './toolbar';

export function BottomWordCount() {
  const text = useEditorSelector((editor) => Node.string(editor), []);
  const { t, language } = useLanguage();

  const wordCount = React.useMemo(() => {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [text]);

  const tooltipText = React.useMemo(() => t('toolbar.wordCount'), [t, language]);
  const wordCountLabel = React.useMemo(() => t('editor.wordCount'), [t, language]);

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip={tooltipText}
        disabled
        className="cursor-default select-text gap-2 text-xs"
      >
        <span className="font-medium text-foreground">{wordCountLabel}</span>
        <span className="tabular-nums text-foreground">{wordCount}</span>
      </ToolbarButton>
    </ToolbarGroup>
  );
}
