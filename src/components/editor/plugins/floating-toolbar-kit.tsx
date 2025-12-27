'use client';

import { createPlatePlugin } from 'platejs/react';
import { usePlateState } from 'platejs/react';

import { FloatingToolbar } from '@/components/ui/floating-toolbar';
import { FloatingToolbarButtons } from '@/components/ui/floating-toolbar-buttons';

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: 'floating-toolbar',
    render: {
      afterEditable: () => {
        const [readOnly] = usePlateState('readOnly');
        if (readOnly) return null;
        return (
          <FloatingToolbar>
            <FloatingToolbarButtons />
          </FloatingToolbar>
        );
      },
    },
  }),
];
