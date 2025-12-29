'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  CalendarIcon,
  ChevronRightIcon,
  Columns3Icon,
  FileCodeIcon,
  FilmIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PenToolIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  RadicalIcon,
  SquareIcon,
  TableIcon,
  TableOfContentsIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { type PlateEditor, useEditorRef } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  insertBlock,
  insertInlineElement,
} from '@/components/editor/transforms';

import { ToolbarButton, ToolbarMenuGroup } from './toolbar';
import { useLanguage } from '@/lib/i18n/use-language';

type Group = {
  group: string;
  items: Item[];
};

type Item = {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  focusEditor?: boolean;
  label?: string;
};

export function InsertToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const { t, language } = useLanguage();

  const groups: Group[] = React.useMemo(() => [
  {
      group: t('toolbar.basicBlocks'),
    items: [
      {
        icon: <PilcrowIcon />,
          label: t('toolbar.paragraphLabel'),
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
          label: t('toolbar.heading1'),
        value: 'h1',
      },
      {
        icon: <Heading2Icon />,
          label: t('toolbar.heading2'),
        value: 'h2',
      },
      {
        icon: <Heading3Icon />,
          label: t('toolbar.heading3'),
        value: 'h3',
      },
      {
        icon: <TableIcon />,
          label: t('toolbar.table'),
        value: KEYS.table,
      },
      {
        icon: <FileCodeIcon />,
          label: t('toolbar.code'),
        value: KEYS.codeBlock,
      },
      {
        icon: <QuoteIcon />,
          label: t('toolbar.quoteLabel'),
        value: KEYS.blockquote,
      },
      {
        icon: <MinusIcon />,
          label: t('toolbar.separator'),
        value: KEYS.hr,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
      group: t('toolbar.lists'),
    items: [
      {
        icon: <ListIcon />,
          label: t('toolbar.bulletListLabel'),
        value: KEYS.ul,
      },
      {
        icon: <ListOrderedIcon />,
          label: t('toolbar.numberedListLabel'),
        value: KEYS.ol,
      },
      {
        icon: <SquareIcon />,
          label: t('toolbar.todoList'),
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
          label: t('toolbar.toggleList'),
        value: KEYS.toggle,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
      group: t('toolbar.media'),
    items: [
      {
        icon: <ImageIcon />,
          label: t('toolbar.image'),
        value: KEYS.img,
      },
      {
        icon: <FilmIcon />,
          label: t('toolbar.embed'),
        value: KEYS.mediaEmbed,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
      group: t('toolbar.advancedBlocks'),
    items: [
      {
        icon: <TableOfContentsIcon />,
          label: t('toolbar.tableOfContents'),
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
          label: t('toolbar.threeColumns'),
        value: 'action_three_columns',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
          label: t('toolbar.equation'),
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
          label: t('toolbar.excalidraw'),
        value: KEYS.excalidraw,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
      group: t('toolbar.inline'),
    items: [
      {
        icon: <Link2Icon />,
          label: t('toolbar.link'),
        value: KEYS.link,
      },
      {
        focusEditor: true,
        icon: <CalendarIcon />,
          label: t('toolbar.date'),
        value: KEYS.date,
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
          label: t('toolbar.inlineEquation'),
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
  ], [t, language]);

  const tooltipText = React.useMemo(() => t('toolbar.insertElements'), [t, language]);
  const newElementsText = React.useMemo(() => t('toolbar.newElements'), [t, language]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={tooltipText} isDropdown>
          {newElementsText} <PlusIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex max-h-[500px] min-w-0 flex-col overflow-y-auto"
        align="start"
      >
        {groups.map(({ group, items: nestedItems }) => (
          <ToolbarMenuGroup key={group} label={group}>
            {nestedItems.map(({ icon, label, value, onSelect }) => (
              <DropdownMenuItem
                key={value}
                className="min-w-[180px]"
                onSelect={() => {
                  onSelect(editor, value);
                  editor.tf.focus();
                }}
              >
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </ToolbarMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
