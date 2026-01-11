'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function ParagraphElement(props: PlateElementProps) {
  const isBibliography = (props.element as any)?.bibliography;
  const isBibliographyEntry = (props.element as any)?.bibliographyEntry;
  const isReadOnly = isBibliography || isBibliographyEntry;

  return (
    <PlateElement
      {...props}
      className={cn(
        'm-0 px-0 py-1',
        isBibliographyEntry && 'bibliography-entry',
        isBibliography && 'bibliography-block'
      )}
      data-bibliography={isBibliography || undefined}
      data-bibliography-entry={isBibliographyEntry || undefined}
    >
      {isReadOnly ? (
        <div contentEditable={false} suppressContentEditableWarning>
          {props.children}
        </div>
      ) : (
        props.children
      )}
    </PlateElement>
  );
}
