'use client';

import * as React from 'react';

import type { TComboboxInputElement, TMentionElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { getMentionOnSelectItem } from '@platejs/mention';
import { IS_APPLE, KEYS } from 'platejs';
import {
  PlateElement,
  useFocused,
  useReadOnly,
  useSelected,
} from 'platejs/react';
import { BookOpenIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/use-mounted';
import { useCitationStore } from '@/lib/stores/citation-store';
import { useLanguage } from '@/lib/i18n/use-language';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

export function MentionElement(
  props: PlateElementProps<TMentionElement> & {
    prefix?: string;
  }
) {
  const element = props.element;

  const selected = useSelected();
  const focused = useFocused();
  const mounted = useMounted();
  const readOnly = useReadOnly();

  return (
    <PlateElement
      {...props}
      className={cn(
        'inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline font-medium text-sm',
        !readOnly && 'cursor-pointer',
        selected && focused && 'ring-2 ring-ring',
        element.children[0][KEYS.bold] === true && 'font-bold',
        element.children[0][KEYS.italic] === true && 'italic',
        element.children[0][KEYS.underline] === true && 'underline'
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false,
        'data-slate-value': element.value,
        draggable: true,
      }}
    >
      {mounted && IS_APPLE ? (
        // Mac OS IME https://github.com/ianstormtaylor/slate/issues/3490
        <>
          {props.children}
          {props.prefix}
          {element.value}
        </>
      ) : (
        // Others like Android https://github.com/ianstormtaylor/slate/pull/5360
        <>
          {props.prefix}
          {element.value}
          {props.children}
        </>
      )}
    </PlateElement>
  );
}

const onSelectItem = getMentionOnSelectItem();

export function MentionInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;
  const [search, setSearch] = React.useState('');
  const { openSearch } = useCitationStore();
  const { t, language } = useLanguage();

  // Memoize translations to update when language changes
  const translations = React.useMemo(() => ({
    noResults: t('mention.noResults'),
    citation: t('mention.citation'),
    searchSources: t('mention.searchSources'),
    mentions: t('mention.mentions'),
  }), [t, language]);

  const handleCiteSelect = React.useCallback(() => {
    editor.tf.delete({ unit: 'block' });
    openSearch();
  }, [editor, openSearch]);

  // Check if user is typing "cite"
  const isCiteSearch = search.toLowerCase().startsWith('cite') || 'cite'.startsWith(search.toLowerCase());

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox
        value={search}
        element={element}
        setValue={setSearch}
        showTrigger={false}
        trigger="@"
      >
        <span className="inline-block rounded-md bg-muted px-1.5 py-0.5 align-baseline text-sm ring-ring">
          <InlineComboboxInput />
        </span>

        <InlineComboboxContent className="my-1.5">
          <InlineComboboxEmpty>{translations.noResults}</InlineComboboxEmpty>

          {isCiteSearch && (
            <InlineComboboxGroup>
              <InlineComboboxGroupLabel>{translations.citation}</InlineComboboxGroupLabel>
              <InlineComboboxItem
                value="cite"
                onClick={handleCiteSelect}
                keywords={['citation', 'quelle', 'source', 'reference', 'zitat']}
              >
                <BookOpenIcon className="mr-2 size-4 text-muted-foreground" />
                {translations.searchSources}
              </InlineComboboxItem>
            </InlineComboboxGroup>
          )}

          <InlineComboboxGroup>
            <InlineComboboxGroupLabel>{translations.mentions}</InlineComboboxGroupLabel>
            {MENTIONABLES.map((item) => (
              <InlineComboboxItem
                key={item.key}
                value={item.text}
                onClick={() => onSelectItem(editor, item, search)}
              >
                {item.text}
              </InlineComboboxItem>
            ))}
          </InlineComboboxGroup>
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}

const MENTIONABLES = [
  { key: '0', text: 'Franc' },
  
];
