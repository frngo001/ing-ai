'use client';

import * as React from 'react';

import { usePlateState } from 'platejs/react';

import { FixedToolbar } from './fixed-toolbar';
import { FixedToolbarButtons } from './fixed-toolbar-buttons';

export function ConditionalFixedToolbar({
  toolbarRef,
}: {
  toolbarRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [readOnly] = usePlateState('readOnly');

  if (readOnly) return null;

  return (
    <div ref={toolbarRef}>
      <FixedToolbar className="top-0 z-30 min-h-10">
        <FixedToolbarButtons />
      </FixedToolbar>
    </div>
  );
}

