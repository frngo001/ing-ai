'use client';

import * as React from 'react';

import { BottomAutocompleteToggle } from './bottom-autocomplete-toggle';
import { BottomWordCount } from './bottom-word-count';
import { ImportToolbarButton } from './import-toolbar-button';
import { ExportToolbarButton } from './export-toolbar-button';
import { ArrowUpToLineIcon } from 'lucide-react';
import { ModeToolbarButton } from './mode-toolbar-button';
import { BottomCommentTocToggle, BottomSuggestionTocToggle, BottomTocToggle } from './bottom-toc-toggle';

export function FixedBottomToolbarButtons() {
  return (
    <div className="flex w-full justify-between gap-2">
       <div className="flex items-start"> 
        <BottomWordCount />
        <BottomAutocompleteToggle />
        <BottomTocToggle />
        <BottomCommentTocToggle />
        <BottomSuggestionTocToggle />
        </div>
      <div className="flex items-center"> 
      <ExportToolbarButton>
        <ArrowUpToLineIcon />
        </ExportToolbarButton>
        <ImportToolbarButton>
          <ArrowUpToLineIcon />
        </ImportToolbarButton>
      <ModeToolbarButton />
      </div>
    </div>
  );
}
