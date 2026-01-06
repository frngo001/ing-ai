'use client';

import * as React from 'react';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import { MarkdownPlugin } from '@platejs/markdown';
import { normalizeNodeId } from 'platejs';
import { BaseBasicBlocksKit } from '@/components/editor/plugins/basic-blocks-base-kit';
import { BaseBasicMarksKit } from '@/components/editor/plugins/basic-marks-base-kit';
import { MarkdownKit } from '@/components/editor/plugins/markdown-kit';
import { ListChatKit } from '@/components/editor/plugins/list-chat-kit';
import { BaseTableKit } from '@/components/editor/plugins/table-base-kit';
import { BaseCodeBlockKit } from '@/components/editor/plugins/code-block-base-kit';
import { BaseLinkKit } from '@/components/editor/plugins/link-base-kit';
import { BaseMediaKit } from '@/components/editor/plugins/media-base-kit';
import { BaseMathKit } from '@/components/editor/plugins/math-base-kit';
import { BaseCalloutKit } from '@/components/editor/plugins/callout-base-kit';
import { BaseToggleKit } from '@/components/editor/plugins/toggle-base-kit';
import { BaseColumnKit } from '@/components/editor/plugins/column-base-kit';
import { BaseDateKit } from '@/components/editor/plugins/date-base-kit';
import { BaseMentionKit } from '@/components/editor/plugins/mention-base-kit';
import { BaseTocKit } from '@/components/editor/plugins/toc-base-kit';
import { BaseAlignKit } from '@/components/editor/plugins/align-base-kit';
import { BaseLineHeightKit } from '@/components/editor/plugins/line-height-base-kit';
import { BaseFontKit } from '@/components/editor/plugins/font-base-kit';
import { cn } from '@/lib/utils';


const ChatMarkdownKit = [
  ...BaseBasicBlocksKit,
  ...BaseBasicMarksKit,
  ...BaseCodeBlockKit,
  ...BaseLinkKit,
  ...BaseMediaKit,
  ...BaseMathKit,
  ...BaseCalloutKit,
  ...BaseToggleKit,
  ...BaseColumnKit,
  ...BaseDateKit,
  ...BaseMentionKit,
  ...BaseTocKit,
  ...BaseAlignKit,
  ...BaseLineHeightKit,
  ...BaseFontKit,
  ...ListChatKit,
  ...BaseTableKit,
  ...MarkdownKit,
];

// Initialer leerer Wert für den Editor
const INITIAL_VALUE = normalizeNodeId([{ type: 'p', children: [{ text: '' }] }]);

export interface PlateMarkdownProps {
  children: string;
  className?: string;
  id?: string; // Eindeutige ID für den Editor-Status
}

export function PlateMarkdown({
  children,
  className,
  id,
}: PlateMarkdownProps) {
  const editor = usePlateEditor({
    id: id, // Wichtig für Stabilität in Listen
    plugins: ChatMarkdownKit,
    value: INITIAL_VALUE,
  });

  React.useEffect(() => {
    if (!children || !editor) {
      if (editor) {
      editor.tf.reset();
      }
      return;
    }

    try {
      const deserialized = editor.getApi(MarkdownPlugin).markdown.deserialize(children);
      if (deserialized && deserialized.length > 0) {
      // setValue nur wenn sich der Inhalt wirklich geändert hat
        const currentValue = JSON.stringify(editor.children);
        const newValue = JSON.stringify(deserialized);
        if (currentValue !== newValue) {
        editor.tf.setValue(deserialized);
        }
      } else {
        editor.tf.reset();
      }
    } catch (error) {
      console.error('Fehler beim Deserialisieren von Markdown:', error);
      if (editor) {
      editor.tf.reset();
      }
    }
  }, [children, editor]);

  return (
    <div onMouseDown={(e) => e.stopPropagation()}>
      <Plate editor={editor}>
        <PlateContent
          readOnly
          className={cn(
            'prose prose-sm max-w-none focus-visible:outline-none',
            'prose-pre:bg-muted/70 prose-pre:text-foreground',
            'prose-code:before:content-none prose-code:after:content-none',
            'dark:prose-invert',
            className
          )}
        />
      </Plate>
    </div>
  );
}

