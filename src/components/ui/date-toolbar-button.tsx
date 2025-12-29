'use client';

import * as React from 'react';

import { KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { Calendar } from 'lucide-react';

import { insertInlineElement } from '@/components/editor/transforms';
import { useLanguage } from '@/lib/i18n/use-language';
import { ToolbarButton } from './toolbar';

export function DateToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const { t, language } = useLanguage();

  const defaultTooltip = React.useMemo(() => t('toolbar.insertDate'), [t, language]);

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineElement(editor, KEYS.date);
        editor.tf.focus();
      }}
      tooltip={props.tooltip || defaultTooltip}
    >
      {props.children || <Calendar className="h-4 w-4" />}
    </ToolbarButton>
  );
}

