'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement } from 'platejs/react';

import { cn } from '@/lib/utils';

export function ParagraphElement(props: PlateElementProps) {
  const isBibliography = (props.element as any)?.bibliography;
  const isBibliographyEntry = (props.element as any)?.bibliographyEntry;

  const isFigureList = (props.element as any)?.figureList;
  const isFigureListEntry = (props.element as any)?.figureListEntry;

  const isTableList = (props.element as any)?.tableList;
  const isTableListEntry = (props.element as any)?.tableListEntry;

  const isReadOnly = isBibliography || isBibliographyEntry || isFigureList || isFigureListEntry || isTableList || isTableListEntry;

  return (
    <PlateElement
      {...props}
      className={cn(
        'm-0 px-0 py-1',
        isBibliographyEntry && 'bibliography-entry',
        isBibliography && 'bibliography-block',
        isFigureListEntry && 'figure-list-entry',
        isFigureList && 'figure-list-block',
        isTableListEntry && 'table-list-entry',
        isTableList && 'table-list-block'
      )}
      data-bibliography={isBibliography || undefined}
      data-bibliography-entry={isBibliographyEntry || undefined}
      data-figure-list={isFigureList || undefined}
      data-figure-list-entry={isFigureListEntry || undefined}
      data-table-list={isTableList || undefined}
      data-table-list-entry={isTableListEntry || undefined}
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
