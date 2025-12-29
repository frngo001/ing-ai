'use client';

import * as React from 'react';

import { MessageSquareTextIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { commentPlugin } from '@/components/editor/plugins/comment-kit';
import { useLanguage } from '@/lib/i18n/use-language';

import { ToolbarButton } from './toolbar';

export function CommentToolbarButton() {
  const editor = useEditorRef();
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.commentTooltip'), [t, language]);

  return (
    <ToolbarButton
      onClick={() => {
        editor.getTransforms(commentPlugin).comment.setDraft();
      }}
      data-plate-prevent-overlay
      tooltip={tooltipText}
    >
      <MessageSquareTextIcon />
    </ToolbarButton>
  );
}
