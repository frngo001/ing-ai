'use client';

import * as React from 'react';

import { KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { Calendar } from 'lucide-react';

import { insertInlineElement } from '@/components/editor/transforms';
import { ToolbarButton } from './toolbar';

export function DateToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        insertInlineElement(editor, KEYS.date);
        editor.tf.focus();
      }}
      tooltip={props.tooltip || "Datum einfügen"}
    >
      {props.children || <Calendar className="h-4 w-4" />}
    </ToolbarButton>
  );
}

