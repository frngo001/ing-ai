'use client';

import * as React from 'react';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import { MarkdownPlugin } from '@platejs/markdown';
import { BaseEditorKit } from '@/components/editor/editor-base-kit';
import { cn } from '@/lib/utils';

export interface PlateMarkdownProps {
  children: string;
  className?: string;
}

export function PlateMarkdown({
  children,
  className,
}: PlateMarkdownProps) {
  const editor = usePlateEditor({
    plugins: BaseEditorKit,
  });

  React.useEffect(() => {
    if (!children) {
      editor.tf.reset();
      return;
    }

    try {
      const deserialized = editor.getApi(MarkdownPlugin).markdown.deserialize(children);
      editor.tf.setValue(deserialized);
    } catch (error) {
      console.error('Fehler beim Deserialisieren von Markdown:', error);
      editor.tf.reset();
    }
  }, [children, editor]);

  return (
    <Plate editor={editor}>
      <PlateContent
        readOnly
        className={cn(
          'prose prose-sm max-w-none',
          'prose-pre:bg-muted/70 prose-pre:text-foreground',
          'prose-code:before:content-none prose-code:after:content-none',
          'dark:prose-invert',
          className
        )}
      />
    </Plate>
  );
}

