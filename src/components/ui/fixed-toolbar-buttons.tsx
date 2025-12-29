'use client';

import * as React from 'react';

import {
  BaselineIcon,
  BoldIcon,
  CalendarIcon,
  Code2Icon,
  FileCode2Icon,
  HighlighterIcon,
  ItalicIcon,
  PaintBucketIcon,
  StrikethroughIcon,
  UnderlineIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly } from 'platejs/react';
import { useLanguage } from '@/lib/i18n/use-language';

import { AIToolbarButton } from './ai-toolbar-button';
import { AlignToolbarButton } from './align-toolbar-button';
import { CitationToolbarButton } from './citation-toolbar-button';
import { CommentToolbarButton } from './comment-toolbar-button';
import { EmojiToolbarButton } from './emoji-toolbar-button';
import { FontColorToolbarButton } from './font-color-toolbar-button';
import { FontSizeToolbarButton } from './font-size-toolbar-button';
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button';
import {
  IndentToolbarButton,
  OutdentToolbarButton,
} from './indent-toolbar-button';
import { InsertToolbarButton } from './insert-toolbar-button';
import { LineHeightToolbarButton } from './line-height-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from './list-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { CitationStyleToolbarButton } from './citation-style-toolbar-button';
import { CitationFormatToolbarButton } from './citation-format-toolbar-button';
import {
  BlockEquationToolbarButton,
  InlineEquationToolbarButton,
} from './equation-toolbar-button';
import { CodeBlockToolbarButton } from './code-block-toolbar-button';
import { DateToolbarButton } from './date-toolbar-button';
import { TableToolbarButton } from './table-toolbar-button';
import { ToggleToolbarButton } from './toggle-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';
export function FixedToolbarButtons() {
  const readOnly = useEditorReadOnly();
  const { t, language } = useLanguage();

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <AIToolbarButton tooltip={t('toolbar.aiAsk')}>
              <WandSparklesIcon />
            </AIToolbarButton>
          </ToolbarGroup>
          <ToolbarGroup>
          <CitationToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertToolbarButton />
            <TurnIntoToolbarButton />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip={t('toolbar.bold')}>
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip={t('toolbar.italic')}>
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip={t('toolbar.underline')}
            >
              <UnderlineIcon />
            </MarkToolbarButton>
            <MarkToolbarButton  nodeType={KEYS.strikethrough} tooltip={t('toolbar.strikethrough')}>
              <StrikethroughIcon />
            </MarkToolbarButton>
            <FontColorToolbarButton nodeType={KEYS.color} tooltip={t('toolbar.textColor')}>
              <BaselineIcon />
            </FontColorToolbarButton>
            <FontColorToolbarButton
              nodeType={KEYS.backgroundColor}
              tooltip={t('toolbar.backgroundColor')}
            >
            <PaintBucketIcon />
            </FontColorToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.code} tooltip={t('toolbar.inlineCode')}>
              <Code2Icon />
            </MarkToolbarButton>
            <CodeBlockToolbarButton tooltip={t('toolbar.codeBlock')}>
              <FileCode2Icon />
            </CodeBlockToolbarButton>
            <InlineEquationToolbarButton />
            <BlockEquationToolbarButton tooltip={t('toolbar.blockEquation')} />
          </ToolbarGroup>
          <ToolbarGroup>
            <AlignToolbarButton />
            <NumberedListToolbarButton />
            <BulletedListToolbarButton />
            <TodoListToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
            <DateToolbarButton>
              <CalendarIcon />
            </DateToolbarButton>
            <TableToolbarButton />
            <EmojiToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MediaToolbarButton nodeType={KEYS.img} />
            <MediaToolbarButton nodeType={KEYS.video} />
            <MediaToolbarButton nodeType={KEYS.audio} />
            <MediaToolbarButton nodeType={KEYS.file} />
          </ToolbarGroup>

          <ToolbarGroup>
            <LineHeightToolbarButton />
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MoreToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <div className="w-4 flex-shrink-0" />

      <ToolbarGroup>
        <CitationStyleToolbarButton />
        <CitationFormatToolbarButton />
      </ToolbarGroup>

      <ToolbarGroup>
        <MarkToolbarButton nodeType={KEYS.highlight} tooltip={t('toolbar.highlight')}>
          <HighlighterIcon />
        </MarkToolbarButton>
        <CommentToolbarButton />
      </ToolbarGroup>
    </div>
  );
}
