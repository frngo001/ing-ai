'use client';

import * as React from 'react';

import { Quote } from 'lucide-react';
import { useEditorRef } from 'platejs/react';

import { useCitationStore } from '@/lib/stores/citation-store';
import { prepareCitationInsertion } from '@/components/editor/utils/prepare-citation-insertion';

import { ToolbarButton } from './toolbar';

export function CitationToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef();
  const { openSearch } = useCitationStore();

  return (
    <ToolbarButton
      {...props}
      onClick={() => {
        prepareCitationInsertion(editor);
        openSearch();
      }}
      tooltip="Zitat einfügen"
    >
      <Quote />
    </ToolbarButton>
  );
}

