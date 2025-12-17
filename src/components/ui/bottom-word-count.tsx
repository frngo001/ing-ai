'use client';

import * as React from 'react';

import { useEditorSelector } from 'platejs/react';
import { Node } from 'slate';

import { ToolbarButton, ToolbarGroup } from './toolbar';

export function BottomWordCount() {
  const text = useEditorSelector((editor) => Node.string(editor), []);

  const wordCount = React.useMemo(() => {
    if (!text) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [text]);

  return (
    <ToolbarGroup className="flex">
      <ToolbarButton
        tooltip="Aktuelle Wortanzahl im Dokument"
        disabled
        className="cursor-default select-text gap-2 text-xs"
      >
        <span className="font-medium text-foreground">Wörter</span>
        <span className="tabular-nums text-foreground">{wordCount}</span>
      </ToolbarButton>
    </ToolbarGroup>
  );
}
