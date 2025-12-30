'use client';

import * as React from 'react';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import { MarkdownPlugin } from '@platejs/markdown';
import { BaseBasicBlocksKit } from '@/components/editor/plugins/basic-blocks-base-kit';
import { BaseBasicMarksKit } from '@/components/editor/plugins/basic-marks-base-kit';
import { MarkdownKit } from '@/components/editor/plugins/markdown-kit';
import { cn } from '@/lib/utils';

// Minimales Plugin-Set für Chat-Nachrichten
const ChatMarkdownKit = [
  ...BaseBasicBlocksKit,
  ...BaseBasicMarksKit,
  ...MarkdownKit,
];

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
  });

  React.useEffect(() => {
    if (!children) {
      editor.tf.reset();
      return;
    }

    try {
      const deserialized = editor.getApi(MarkdownPlugin).markdown.deserialize(children);
      // setValue nur wenn sich der Inhalt wirklich geändert hat
      if (JSON.stringify(editor.children) !== JSON.stringify(deserialized)) {
        editor.tf.setValue(deserialized);
      }
    } catch (error) {
      console.error('Fehler beim Deserialisieren von Markdown:', error);
      editor.tf.reset();
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

