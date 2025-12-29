'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  DropletsIcon,
  HighlighterIcon,
  KeyboardIcon,
  ListIcon,
  ListOrderedIcon,
  MoreHorizontalIcon,
  PaintBucketIcon,
  PilcrowIcon,
  QuoteIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TypeIcon,
  Heading2Icon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { ListStyleType, toggleList } from '@platejs/list';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ToolbarButton } from './toolbar';
import { useLanguage } from '@/lib/i18n/use-language';

export function MoreToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.more'), [t, language]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={tooltipText}>
          <MoreHorizontalIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar flex max-h-[300px] min-w-[200px] flex-col overflow-y-scroll scrollbar-thin scrollbar-thumb-muted scrollbar-track-muted/40 hover:scrollbar-thumb-muted hover:scrollbar-track-muted/60"
        align="start"
        style={{ scrollbarGutter: 'stable both-edges', overflowY: 'scroll' }}
      >
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.highlight);
              editor.tf.focus();
            }}
          >
            <HighlighterIcon />
            {t('toolbar.highlightText')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.kbd);
              editor.tf.collapse({ edge: 'end' });
              editor.tf.focus();
            }}
          >
            <KeyboardIcon />
            {t('toolbar.keyboardInput')}
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.sup, {
                remove: KEYS.sub,
              });
              editor.tf.focus();
            }}
          >
            <SuperscriptIcon />
            {t('toolbar.superscript')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.sub, {
                remove: KEYS.sup,
              });
              editor.tf.focus();
            }}
          >
            <SubscriptIcon />
            {t('toolbar.subscript')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              toggleList(editor, { listStyleType: ListStyleType.Disc });
              editor.tf.focus();
            }}
          >
            <ListIcon />
            {t('toolbar.bulletList')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              toggleList(editor, { listStyleType: ListStyleType.Decimal });
              editor.tf.focus();
            }}
          >
            <ListOrderedIcon />
            {t('toolbar.numberedList')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.setNodes({ type: KEYS.blockquote });
              editor.tf.focus();
            }}
          >
            <QuoteIcon />
            {t('toolbar.quote')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.setNodes({ type: KEYS.p });
              editor.tf.focus();
            }}
          >
            <PilcrowIcon />
            {t('toolbar.paragraph')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
