'use client';

import * as React from 'react';

import { useEditorReadOnly } from 'platejs/react';

import { BottomAutocompleteToggle } from './bottom-autocomplete-toggle';
import { BottomWordCount } from './bottom-word-count';
import { ImportToolbarButton } from './import-toolbar-button';
import { ExportToolbarButton } from './export-toolbar-button';
import { ArrowUpToLineIcon } from 'lucide-react';
import { ModeToolbarButton } from './mode-toolbar-button';
import { BottomCommentTocToggle, BottomSuggestionTocToggle, BottomTocToggle } from './bottom-toc-toggle';
import { ToolbarGroup } from './toolbar';

export function FixedBottomToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <div className="flex w-full justify-between gap-2">
       <div className="flex items-start"> 
        <BottomWordCount />
        {!readOnly && <BottomAutocompleteToggle />}
        <BottomTocToggle />
        <BottomCommentTocToggle />
        <BottomSuggestionTocToggle />
        </div>
      <div className="flex items-center"> 
      <ToolbarGroup>
        <ExportToolbarButton>
          <ArrowUpToLineIcon />
        </ExportToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup>
        {!readOnly && (
          <ImportToolbarButton>
            <ArrowUpToLineIcon />
          </ImportToolbarButton>
        )}
      </ToolbarGroup>
      <ToolbarGroup>  
        <ModeToolbarButton />
      </ToolbarGroup>
      </div>
    </div>
  );
}
