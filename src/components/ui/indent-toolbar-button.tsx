'use client';

import * as React from 'react';

import { useIndentButton, useOutdentButton } from '@platejs/indent/react';
import { IndentIcon, OutdentIcon } from 'lucide-react';

import { useLanguage } from '@/lib/i18n/use-language';
import { ToolbarButton } from './toolbar';

export function IndentToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { props: buttonProps } = useIndentButton();
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.indent'), [t, language]);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={tooltipText}>
      <IndentIcon />
    </ToolbarButton>
  );
}

export function OutdentToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { props: buttonProps } = useOutdentButton();
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.outdent'), [t, language]);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={tooltipText}>
      <OutdentIcon />
    </ToolbarButton>
  );
}
