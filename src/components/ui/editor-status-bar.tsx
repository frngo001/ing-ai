'use client';

import { FixedToolbar } from './fixed-toolbar';
import { FixedBottomToolbarButtons } from './fixed-bottom-toolbar-buttons';

export function EditorStatusBar() {
  return (
    <FixedToolbar
      position="bottom"
      className="mt-auto justify-end gap-4 border-t border-b-0 bg-background/90 min-h-10"
      aria-label="Editor-Statusleiste"
    >
      <FixedBottomToolbarButtons />
    </FixedToolbar>
  );
}

