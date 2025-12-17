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

export function MoreToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Einfügen">
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
            Hervorheben
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.toggleMark(KEYS.kbd);
              editor.tf.collapse({ edge: 'end' });
              editor.tf.focus();
            }}
          >
            <KeyboardIcon />
            Tastatureingabe
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
            Hochgestellt
            {/* (⌘+,) */}
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
            Tiefgestellt
            {/* (⌘+.) */}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              toggleList(editor, { listStyleType: ListStyleType.Disc });
              editor.tf.focus();
            }}
          >
            <ListIcon />
            Aufzählungsliste
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              toggleList(editor, { listStyleType: ListStyleType.Decimal });
              editor.tf.focus();
            }}
          >
            <ListOrderedIcon />
            Nummerierte Liste
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.setNodes({ type: KEYS.blockquote });
              editor.tf.focus();
            }}
          >
            <QuoteIcon />
            Zitat
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              editor.tf.setNodes({ type: KEYS.p });
              editor.tf.focus();
            }}
          >
            <PilcrowIcon />
            Absatz
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
