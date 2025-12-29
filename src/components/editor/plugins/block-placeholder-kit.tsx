'use client';

import { KEYS } from 'platejs';
import { BlockPlaceholderPlugin } from 'platejs/react';
import { useLanguage } from '@/lib/i18n/use-language';

export const createBlockPlaceholderKit = (placeholderText: string) => [
  BlockPlaceholderPlugin.configure({
    options: {
      className:
        'before:absolute before:cursor-text before:text-muted-foreground/80 before:content-[attr(placeholder)]',
      placeholders: {
        [KEYS.p]: placeholderText,
      },
      query: ({ path }) => path.length === 1,
    },
  }),
];

// Hook for dynamic placeholder based on language
export const useBlockPlaceholderKit = () => {
  const { t } = useLanguage();
  return createBlockPlaceholderKit(t('toolbar.placeholderWrite'));
};

// Default export for static usage (German default)
export const BlockPlaceholderKit = createBlockPlaceholderKit('Schreibe etwas...');
