'use client';

import * as React from 'react';

import {
  useLinkToolbarButton,
  useLinkToolbarButtonState,
} from '@platejs/link/react';
import { Link } from 'lucide-react';

import { useLanguage } from '@/lib/i18n/use-language';
import { ToolbarButton } from './toolbar';

export function LinkToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useLinkToolbarButtonState();
  const { props: buttonProps } = useLinkToolbarButton(state);
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.insertLink'), [t, language]);

  return (
    <ToolbarButton
      {...props}
      {...buttonProps}
      data-plate-focus
      tooltip={tooltipText}
    >
      <Link />
    </ToolbarButton>
  );
}
