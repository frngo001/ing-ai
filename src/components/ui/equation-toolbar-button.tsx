'use client';

import * as React from 'react';

import { insertEquation, insertInlineEquation } from '@platejs/math';
import { RadicalIcon, Pi} from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function BlockEquationToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertEquation(editor, { select: true });
      }}
      tooltip="Formelblock einfügen"
    >
      <Pi />
    </ToolbarButton>
  );
}

export function InlineEquationToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineEquation(editor);
      }}
      tooltip="Als Formel markieren"
    >
      <RadicalIcon />
    </ToolbarButton>
  );
}
