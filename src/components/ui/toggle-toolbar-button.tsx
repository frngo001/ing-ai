'use client';

import * as React from 'react';

import {
  useToggleToolbarButton,
  useToggleToolbarButtonState,
} from '@platejs/toggle/react';
import { ListCollapseIcon } from 'lucide-react';

import { useLanguage } from '@/lib/i18n/use-language';
import { ToolbarButton } from './toolbar';

export function ToggleToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useToggleToolbarButtonState();
  const { props: buttonProps } = useToggleToolbarButton(state);
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.toggle'), [t, language]);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={tooltipText}>
      <ListCollapseIcon />
    </ToolbarButton>
  );
}
