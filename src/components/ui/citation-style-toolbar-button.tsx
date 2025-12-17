'use client';

import { ChevronDown, Loader2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { CitationStyle } from '@/lib/stores/citation-store';
import { useCitationStore } from '@/lib/stores/citation-store';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { searchCitationStyles, type BibifyStyle } from '@/lib/bibify';

const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: 'apa', label: 'APA' },
  { value: 'mla', label: 'MLA' },
  { value: 'chicago', label: 'Chicago' },
  { value: 'harvard', label: 'Harvard' },
  { value: 'ieee', label: 'IEEE' },
  { value: 'vancouver', label: 'Vancouver' },
];

export function CitationStyleToolbarButton() {
  const { citationStyle, setCitationStyle } = useCitationStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [remoteStyles, setRemoteStyles] = React.useState<BibifyStyle[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const menuItemClass =
    'focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground';

  const currentLabel =
    CITATION_STYLES.find((s) => s.value === citationStyle)?.label ||
    citationStyle?.replace('.csl', '') ||
    citationStyle;

  React.useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setRemoteStyles([]);
      return;
    }

    const handle = setTimeout(async () => {
      setIsLoading(true);
      try {
        const styles = await searchCitationStyles(searchTerm.trim());
        setRemoteStyles(styles);
      } catch (error) {
        setRemoteStyles([]);
        console.error('Bibify style search failed', error);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(handle);
  }, [searchTerm]);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              data-slot="citation-style-trigger"
            >
              <span className="flex items-center gap-1">
                {currentLabel}
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Zitierstil</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-64 p-0">
        <div className="sticky top-0 z-10 bg-popover/95 backdrop-blur border-b">
        <div className="px-2 pt-2 pb-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="CSL-Stil suchen (z. B. ieee, apa)"
            className="h-8 text-xs"
          />
        </div>
        </div>
        <div className="max-h-80 overflow-auto">
        <DropdownMenuRadioGroup
          value={citationStyle}
          onValueChange={(v) => setCitationStyle(v as CitationStyle)}
        >
          {CITATION_STYLES.map((style) => (
              <DropdownMenuRadioItem
                key={style.value}
                value={style.value}
                className={menuItemClass}
              >
              {style.label}
            </DropdownMenuRadioItem>
          ))}
          {isLoading && (
              <DropdownMenuRadioItem value="__loading" disabled className={menuItemClass}>
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Lädt Stile...
              </span>
            </DropdownMenuRadioItem>
          )}
          {!isLoading && remoteStyles.length > 0 && (
            <>
              <DropdownMenuRadioItem value="__separator" disabled>
                <span className="text-xs text-muted-foreground">Gefundene Zitierstile</span>
              </DropdownMenuRadioItem>
              {remoteStyles.map((style) => (
                <DropdownMenuRadioItem
                  key={style.citationFile}
                  value={style.citationFile}
                  onSelect={() => setCitationStyle(style.citationFile)}
                    className={menuItemClass}
                >
                  <span className="flex flex-col gap-0.5 flex-1">
                    <span className="text-sm">{style.citationName}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {style.citationFile}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </>
          )}
        </DropdownMenuRadioGroup>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

