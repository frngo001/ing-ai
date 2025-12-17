'use client';

import * as React from 'react';

import { insertCodeBlock } from '@platejs/code-block';
import { useEditorRef } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function CodeBlockToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertCodeBlock(editor, { select: true });
      }}
      tooltip={props.tooltip || "Codeblock einfügen"}
    >
      {props.children}
    </ToolbarButton>
  );
}

