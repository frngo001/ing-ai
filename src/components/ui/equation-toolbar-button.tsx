'use client';

import * as React from 'react';

import { insertEquation, insertInlineEquation } from '@platejs/math';
import { RadicalIcon, Pi} from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { useLanguage } from '@/lib/i18n/use-language';
import { ToolbarButton } from './toolbar';

export function BlockEquationToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const { t, language } = useLanguage();

  const defaultTooltip = React.useMemo(() => t('toolbar.blockEquation'), [t, language]);

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertEquation(editor, { select: true });
      }}
      tooltip={props.tooltip || defaultTooltip}
    >
      <Pi />
    </ToolbarButton>
  );
}

export function InlineEquationToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const { t, language } = useLanguage();

  const defaultTooltip = React.useMemo(() => t('toolbar.insertEquation'), [t, language]);

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineEquation(editor);
      }}
      tooltip={props.tooltip || defaultTooltip}
    >
      <RadicalIcon />
    </ToolbarButton>
  );
}
