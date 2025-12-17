'use client';

import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useCitationStore, type CitationNumberFormat } from '@/lib/stores/citation-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const NUMBER_FORMATS: { value: CitationNumberFormat; label: string; example: string }[] = [
  { value: 'bracket', label: 'Eckig', example: '[1]' },
  { value: 'parentheses', label: 'Rund', example: '(1)' },
  { value: 'superscript', label: 'Hochgestellt', example: '¹' },
  { value: 'plain', label: 'Plain', example: '1' },
  { value: 'dot', label: 'Mit Punkt', example: '1.' },
];

export function CitationNumberFormatToolbarButton() {
  const { citationNumberFormat, setCitationNumberFormat } = useCitationStore();
  const currentLabel =
    NUMBER_FORMATS.find((s) => s.value === citationNumberFormat)?.label || citationNumberFormat;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              data-slot="citation-number-format-trigger"
            >
              <span className="flex items-center gap-1">
                {currentLabel}
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Zahlenformat</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-56">
        <DropdownMenuRadioGroup
          value={citationNumberFormat}
          onValueChange={(v) => setCitationNumberFormat(v as CitationNumberFormat)}
        >
          {NUMBER_FORMATS.map((format) => (
            <DropdownMenuRadioItem key={format.value} value={format.value}>
              <span className="flex items-center gap-2">
                <span>{format.label}</span>
                <span className="text-[11px] text-muted-foreground">{format.example}</span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
