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

const groups: Group[] = [
  {
    group: 'KI',
    items: [
      {
        focusEditor: false,
        icon: <SparklesIcon />,
        value: 'AI',
        label: 'KI',
        onSelect: (editor) => {
          editor.getApi(AIChatPlugin).aiChat.show();
        },
      },
    ],
  },
  {
    group: 'Zitation',
    items: [
      {
        focusEditor: false,
        icon: <BookOpenIcon />,
        value: 'cite',
        label: 'Zitat einfügen',
        keywords: ['citation', 'cite', 'quelle', 'source', 'reference', 'zitat'],
        onSelect: () => {
          useCitationStore.getState().openSearch();
        },
      },
    ],
  },
  {
    group: 'Grundblöcke',
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph', 'text', 'absatz', 'p'],
        label: 'Text',
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ['title', 'h1', 'heading 1', 'überschrift 1', 'hauptüberschrift'],
        label: 'Überschrift 1',
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2', 'heading 2', 'überschrift 2'],
        label: 'Überschrift 2',
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3', 'heading 3', 'überschrift 3'],
        label: 'Überschrift 3',
        value: KEYS.h3,
      },
      {
        icon: <Heading4Icon />,
        keywords: ['subtitle', 'h4', 'heading 4', 'überschrift 4'],
        label: 'Überschrift 4',
        value: KEYS.h4,
      },
      {
        icon: <Heading5Icon />,
        keywords: ['subtitle', 'h5', 'heading 5', 'überschrift 5'],
        label: 'Überschrift 5',
        value: KEYS.h5,
      },
      {
        icon: <Heading6Icon />,
        keywords: ['subtitle', 'h6', 'heading 6', 'überschrift 6'],
        label: 'Überschrift 6',
        value: KEYS.h6,
      },
      {
        icon: <MinusIcon />,
        keywords: ['hr', 'horizontal', 'rule', 'separator', 'divider'],
        label: 'Trenner',
        value: KEYS.hr,
      },
      {
        icon: <ListIcon />,
        keywords: ['unordered', 'ul', '-', 'bullet', 'list', 'aufzählung'],
        label: 'Aufzählung',
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ['ordered', 'ol', '1', 'numbered', 'nummeriert', 'liste'],
        label: 'Nummerierte Liste',
        value: KEYS.ol,
      },
      {
        icon: <Square />,
        keywords: ['checklist', 'task', 'checkbox', '[]', 'todo', 'aufgabe'],
        label: 'To-do-Liste',
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ['collapsible', 'expandable', 'toggle', 'fold', 'ausklappbar'],
        label: 'Toggle',
        value: KEYS.toggle,
      },
      {
        icon: <Code2 />,
        keywords: ['```', 'code', 'programming', 'syntax', 'codeblock'],
        label: 'Code-Block',
        value: KEYS.codeBlock,
      },
      {
        icon: <Table />,
        keywords: ['table', 'grid', 'tabelle', 'spreadsheet'],
        label: 'Tabelle',
        value: KEYS.table,
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>', 'zitat', 'zitatblock'],
        label: 'Zitatblock',
        value: KEYS.blockquote,
      },
      {
        description: 'Hervorgehobenen Block einfügen.',
        icon: <LightbulbIcon />,
        keywords: ['note', 'callout', 'tip', 'hinweis', 'info', 'warning'],
        label: 'Hinweis',
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: 'Medien',
    items: [
      {
        icon: <ImageIcon />,
        keywords: ['image', 'img', 'picture', 'photo', 'bild'],
        label: 'Bild',
        value: KEYS.img,
      },
      {
        icon: <VideoIcon />,
        keywords: ['video', 'movie', 'film'],
        label: 'Video',
        value: KEYS.video,
      },
      {
        icon: <MusicIcon />,
        keywords: ['audio', 'sound', 'music', 'mp3'],
        label: 'Audio',
        value: KEYS.audio,
      },
      {
        icon: <FileIcon />,
        keywords: ['file', 'document', 'pdf', 'download'],
        label: 'Datei',
        value: KEYS.file,
      },
      {
        icon: <FilmIcon />,
        keywords: ['embed', 'iframe', 'media', 'youtube', 'vimeo'],
        label: 'Einbetten',
        value: KEYS.mediaEmbed,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: 'Erweiterte Blöcke',
    items: [
      {
        icon: <TableOfContentsIcon />,
        keywords: ['toc', 'table of contents', 'inhaltsverzeichnis'],
        label: 'Inhaltsverzeichnis',
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        keywords: ['columns', 'spalten', 'layout'],
        label: '3 Spalten',
        value: 'action_three_columns',
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        keywords: ['equation', 'formula', 'math', 'latex', 'gleichung', 'block equation', 'block-gleichung', 'blockformel'],
        label: 'Block-Gleichung',
        value: KEYS.equation,
      },
      {
        icon: <PenToolIcon />,
        keywords: ['excalidraw', 'draw', 'sketch', 'diagram'],
        label: 'Excalidraw',
        value: KEYS.excalidraw,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value, { upsert: true });
      },
    })),
  },
  {
    group: 'Inline',
    items: [
      {
        focusEditor: false,
        icon: <Link2Icon />,
        keywords: ['link', 'url', 'href', 'hyperlink'],
        label: 'Link',
        value: KEYS.link,
      },
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        keywords: ['date', 'time', 'calendar', 'datum'],
        label: 'Datum',
        value: KEYS.date,
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        keywords: ['inline equation', 'inline formula', 'inline math', 'inline latex'],
        label: 'Inline-Gleichung',
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>Keine Ergebnisse</InlineComboboxEmpty>

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
