'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  useCitationStore,
  type CitationFormat,
  type CitationNumberFormat,
  type CitationAuthorDateVariant,
  type CitationAuthorVariant,
  type CitationLabelVariant,
  type CitationNoteVariant,
} from '@/lib/stores/citation-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const FORMATS: { value: CitationFormat; label: string }[] = [
  { value: 'author', label: 'Author' },
  { value: 'author-date', label: 'Author-Date' },
  { value: 'label', label: 'Label' },
  { value: 'note', label: 'Note' },
  { value: 'numeric', label: 'Numeric' },
];

const NUMERIC_VARIANTS: { value: CitationNumberFormat; label: string }[] = [
  { value: 'bracket', label: '[1]' },
  { value: 'parentheses', label: '(1)' },
  { value: 'superscript', label: '¹' },
  { value: 'plain', label: '1' },
  { value: 'dot', label: '1.' },
];

const AUTHOR_DATE_VARIANTS = [
  { value: 'comma', label: '(Müller, 2020)' },
  { value: 'no-comma', label: '(Müller 2020)' },
]

const AUTHOR_VARIANTS = [
  { value: 'with-parens', label: '(Müller)' },
  { value: 'bare', label: 'Müller' },
]

const LABEL_VARIANTS = [
  { value: 'bracket', label: '[Mue20]' },
  { value: 'parentheses', label: '(Mue20)' },
  { value: 'plain', label: 'Mue20' },
]

const NOTE_VARIANTS = [
  { value: 'superscript', label: '¹ Fußnote' },
  { value: 'inline', label: '(Fußnote)' },
]

export function CitationFormatToolbarButton() {
  const {
    citationFormat,
    setCitationFormat,
    citationNumberFormat,
    setCitationNumberFormat,
    setCitationAuthorDateVariant,
    setCitationAuthorVariant,
    setCitationLabelVariant,
    setCitationNoteVariant,
  } = useCitationStore();
  
  const currentLabel = React.useMemo(() => {
    if (citationFormat === 'numeric') {
      const variant = NUMERIC_VARIANTS.find((v) => v.value === citationNumberFormat);
      return variant?.label || '[1]';
    }
    return FORMATS.find((s) => s.value === citationFormat)?.label || citationFormat;
  }, [citationFormat, citationNumberFormat]);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              data-slot="citation-format-trigger"
            >
              <span className="flex items-center gap-1">
                {currentLabel}
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Zitierformat</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-48">
        <DropdownMenuRadioGroup
          value={citationFormat}
          onValueChange={(v) => setCitationFormat(v as CitationFormat)}
        >
          {FORMATS.map((format) => {
            if (format.value === 'numeric') {
              return (
                <DropdownMenuSub key={format.value}>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 w-full">
                    {format.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={citationNumberFormat}
                      onValueChange={(v) => {
                        setCitationFormat('numeric');
                        setCitationNumberFormat(v as CitationNumberFormat);
                      }}
                    >
                      {NUMERIC_VARIANTS.map((variant) => (
                        <DropdownMenuRadioItem key={variant.value} value={variant.value}>
                          {variant.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            }
            if (format.value === 'author-date') {
              return (
                <DropdownMenuSub key={format.value}>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 w-full">
                    {format.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      onValueChange={(v) => {
                        setCitationFormat('author-date');
                        setCitationAuthorDateVariant(v as CitationAuthorDateVariant);
                      }}
                    >
                      {AUTHOR_DATE_VARIANTS.map((variant) => (
                        <DropdownMenuRadioItem key={variant.value} value={variant.value}>
                          {variant.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            }
            if (format.value === 'author') {
              return (
                <DropdownMenuSub key={format.value}>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 w-full">
                    {format.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      onValueChange={(v) => {
                        setCitationFormat('author');
                        setCitationAuthorVariant(v as CitationAuthorVariant);
                      }}
                    >
                      {AUTHOR_VARIANTS.map((variant) => (
                        <DropdownMenuRadioItem key={variant.value} value={variant.value}>
                          {variant.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            }
            if (format.value === 'label') {
              return (
                <DropdownMenuSub key={format.value}>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 w-full">
                    {format.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      onValueChange={(v) => {
                        setCitationFormat('label');
                        setCitationLabelVariant(v as CitationLabelVariant);
                      }}
                    >
                      {LABEL_VARIANTS.map((variant) => (
                        <DropdownMenuRadioItem key={variant.value} value={variant.value}>
                          {variant.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            }
            if (format.value === 'note') {
              return (
                <DropdownMenuSub key={format.value}>
                  <DropdownMenuSubTrigger className="flex items-center gap-2 w-full">
                    {format.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      onValueChange={(v) => {
                        setCitationFormat('note');
                        setCitationNoteVariant(v as CitationNoteVariant);
                      }}
                    >
                      {NOTE_VARIANTS.map((variant) => (
                        <DropdownMenuRadioItem key={variant.value} value={variant.value}>
                          {variant.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              );
            }
            return (
              <DropdownMenuRadioItem key={format.value} value={format.value}>
                {format.label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
