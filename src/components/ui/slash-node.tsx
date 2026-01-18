'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  BookOpenIcon,
  CalendarIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileIcon,
  FilmIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ImageIcon,
  LightbulbIcon,
  Link2Icon,
  ListIcon,
  ListOrdered,
  MinusIcon,
  MusicIcon,
  PenToolIcon,
  PilcrowIcon,
  Quote,
  RadicalIcon,
  SparklesIcon,
  Square,
  Table,
  TableOfContentsIcon,
  VideoIcon,
} from 'lucide-react';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';

import { useCitationStore } from '@/lib/stores/citation-store';
import { useLanguage } from '@/lib/i18n/use-language';

import {
  insertBlock,
  insertInlineElement,
} from '@/components/editor/transforms';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    className?: string;
    focusEditor?: boolean;
    keywords?: string[];
    label?: string;
  }[];
};

const createGroups = (t: (key: string) => string): Group[] => [
  {
    group: t('slash.groupAI'),
    items: [
      {
        focusEditor: false,
        icon: <SparklesIcon />,
        value: 'AI',
        label: t('slash.ai'),
        onSelect: (editor) => {
          editor.getApi(AIChatPlugin).aiChat.show();
        },
      },
    ],
  },
  {
    group: t('slash.groupCitation'),
    items: [
      {
        focusEditor: false,
        icon: <BookOpenIcon />,
        value: 'cite',
        label: t('slash.insertCitation'),
        keywords: ['citation', 'cite', 'quelle', 'source', 'reference', 'zitat'],
        onSelect: () => {
          useCitationStore.getState().openSearch();
        },
      },
    ],
  },
  {
    group: t('slash.groupBasicBlocks'),
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph', 'text', 'absatz', 'p'],
        label: t('slash.text'),
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ['title', 'h1', 'heading 1', 'überschrift 1', 'hauptüberschrift'],
        label: t('slash.heading1'),
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2', 'heading 2', 'überschrift 2'],
        label: t('slash.heading2'),
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3', 'heading 3', 'überschrift 3'],
        label: t('slash.heading3'),
        value: KEYS.h3,
      },
      {
        icon: <Heading4Icon />,
        keywords: ['subtitle', 'h4', 'heading 4', 'überschrift 4'],
        label: t('slash.heading4'),
        value: KEYS.h4,
      },
      {
        icon: <Heading5Icon />,
        keywords: ['subtitle', 'h5', 'heading 5', 'überschrift 5'],
        label: t('slash.heading5'),
        value: KEYS.h5,
      },
      {
        icon: <Heading6Icon />,
        keywords: ['subtitle', 'h6', 'heading 6', 'überschrift 6'],
        label: t('slash.heading6'),
        value: KEYS.h6,
      },
      {
        icon: <MinusIcon />,
        keywords: ['hr', 'horizontal', 'rule', 'separator', 'divider'],
        label: t('slash.separator'),
        value: KEYS.hr,
      },
      {
        icon: <ListIcon />,
        keywords: ['unordered', 'ul', '-', 'bullet', 'list', 'aufzählung'],
        label: t('slash.bulletList'),
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ['ordered', 'ol', '1', 'numbered', 'nummeriert', 'liste'],
        label: t('slash.numberedList'),
        value: KEYS.ol,
      },
      {
        icon: <Square />,
        keywords: ['checklist', 'task', 'checkbox', '[]', 'todo', 'aufgabe'],
        label: t('slash.todoList'),
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ['collapsible', 'expandable', 'toggle', 'fold', 'ausklappbar'],
        label: t('slash.toggle'),
        value: KEYS.toggle,
      },
      {
        icon: <Code2 />,
        keywords: ['```', 'code', 'programming', 'syntax', 'codeblock'],
        label: t('slash.codeBlock'),
        value: KEYS.codeBlock,
      },
      {
        icon: <Table />,
        keywords: ['table', 'grid', 'tabelle', 'spreadsheet'],
        label: t('slash.table'),
        value: KEYS.table,
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>', 'zitat', 'zitatblock'],
        label: t('slash.quoteBlock'),
        value: KEYS.blockquote,
      },
      {
        icon: <LightbulbIcon />,
        keywords: ['note', 'callout', 'tip', 'hinweis', 'info', 'warning'],
        label: t('slash.callout'),
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor: PlateEditor, value: string) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: t('slash.groupMedia'),
    items: [
      {
        icon: <ImageIcon />,
        keywords: ['image', 'img', 'picture', 'photo', 'bild'],
        label: t('slash.image'),
        value: KEYS.img,
      },
      {
        icon: <VideoIcon />,
        keywords: ['video', 'movie', 'film'],
        label: t('slash.video'),
        value: KEYS.video,
      },
      {
        icon: <MusicIcon />,
        keywords: ['audio', 'sound', 'music', 'mp3'],
        label: t('slash.audio'),
        value: KEYS.audio,
      },
      {
        icon: <FileIcon />,
        keywords: ['file', 'document', 'pdf', 'download'],
        label: t('slash.file'),
        value: KEYS.file,
      },
      {
        icon: <FilmIcon />,
        keywords: ['embed', 'iframe', 'media', 'youtube', 'vimeo'],
        label: t('slash.embed'),
        value: KEYS.mediaEmbed,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor: PlateEditor, value: string) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: t('slash.groupAdvancedBlocks'),
    items: [
      {
        icon: <TableOfContentsIcon />,
        keywords: ['toc', 'table of contents', 'inhaltsverzeichnis'],
        label: t('slash.tableOfContents'),
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        keywords: ['columns', 'spalten', 'layout'],
        label: t('slash.threeColumns'),
        value: 'action_three_columns',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        keywords: ['equation', 'formula', 'math', 'latex', 'gleichung', 'block equation', 'block-gleichung', 'blockformel'],
        label: t('slash.blockEquation'),
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
        keywords: ['excalidraw', 'draw', 'sketch', 'diagram'],
        label: t('slash.excalidraw'),
        value: KEYS.excalidraw,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor: PlateEditor, value: string) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: t('slash.groupInline'),
    items: [
      {
        focusEditor: false,
        icon: <Link2Icon />,
        keywords: ['link', 'url', 'href', 'hyperlink'],
        label: t('slash.link'),
        value: KEYS.link,
      },
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        keywords: ['date', 'time', 'calendar', 'datum'],
        label: t('slash.date'),
        value: KEYS.date,
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        keywords: ['inline equation', 'inline formula', 'inline math', 'inline latex'],
        label: t('slash.inlineEquation'),
        value: KEYS.inlineEquation,
      },
      {
        focusEditor: true,
        icon: <Link2Icon className="size-4" />,
        keywords: ['reference', 'verweis', 'cross reference', 'querverweis', 'figure', 'table', 'heading', 'abbildung', 'tabelle', 'kapitel', 'internal link'],
        label: t('reference.insertReference') || 'Referenz einfügen',
        value: 'internal_reference_input',
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor: PlateEditor, value: string) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const { t, language } = useLanguage();

  const groups = React.useMemo(() => createGroups(t), [t, language]);
  const noResultsText = React.useMemo(() => t('slash.noResults'), [t, language]);

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>{noResultsText}</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                )
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
