import * as React from 'react';

import type { RenderStaticNodeWrapper, TListElement } from 'platejs';
import type { SlateRenderElementProps } from 'platejs/static';

import { isOrderedList } from '@platejs/list';
import { CheckIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const config: Record<
  string,
  {
    Li: React.FC<SlateRenderElementProps>;
    Marker: React.FC<SlateRenderElementProps>;
  }
> = {
  todo: {
    Li: TodoLiStatic,
    Marker: TodoMarkerStatic,
  },
};

/**
 * Konvertiert Plate listStyleType Werte zu gültigen CSS list-style-type Werten
 * Speziell für das Chat-Panel, um Nummerierungen korrekt zu rendern
 */
function getCssListStyleType(listStyleType: string | undefined, isOrdered: boolean): string | undefined {
  if (!listStyleType) {
    // Wenn keine listStyleType gesetzt ist, verwende Standard-Werte
    return isOrdered ? 'decimal' : 'disc';
  }

  // Wenn listStyleType bereits ein gültiger CSS-Wert ist, verwende ihn
  const validCssValues = [
    'decimal', 'decimal-leading-zero',
    'lower-alpha', 'upper-alpha',
    'lower-roman', 'upper-roman',
    'disc', 'circle', 'square',
    'none'
  ];
  
  if (validCssValues.includes(listStyleType)) {
    return listStyleType;
  }

  // Konvertiere Plate-Schlüssel zu CSS-Werten
  if (listStyleType === 'ol' || listStyleType === 'ordered-list') {
    return 'decimal';
  }
  
  if (listStyleType === 'ul' || listStyleType === 'unordered-list') {
    return 'disc';
  }

  // Fallback basierend auf isOrdered
  return isOrdered ? 'decimal' : 'disc';
}

export const BlockListChat: RenderStaticNodeWrapper = (props) => {
  if (!props.element.listStyleType) return;

  return (props) => <List {...props} />;
};

function List(props: SlateRenderElementProps) {
  const { listStart, listStyleType } = props.element as TListElement;
  const { Li, Marker } = config[listStyleType] ?? {};
  const List = isOrderedList(props.element) ? 'ol' : 'ul';
  const isOrdered = isOrderedList(props.element);
  const cssListStyleType = getCssListStyleType(listStyleType, isOrdered);

  return (
    <List
      className="relative m-0 p-0"
      style={{ listStyleType: cssListStyleType }}
      start={listStart}
    >
      {Marker && <Marker {...props} />}
      {Li ? <Li {...props} /> : <li>{props.children}</li>}
    </List>
  );
}

function TodoMarkerStatic(props: SlateRenderElementProps) {
  const checked = props.element.checked as boolean;

  return (
    <div contentEditable={false}>
      <button
        className={cn(
          'peer -left-6 pointer-events-none absolute top-1 size-4 shrink-0 rounded-sm border border-primary bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
          props.className
        )}
        data-state={checked ? 'checked' : 'unchecked'}
        type="button"
      >
        <div className={cn('flex items-center justify-center text-current')}>
          {checked && <CheckIcon className="size-4" />}
        </div>
      </button>
    </div>
  );
}

function TodoLiStatic(props: SlateRenderElementProps) {
  return (
    <li
      className={cn(
        'list-none',
        (props.element.checked as boolean) &&
          'text-muted-foreground line-through'
      )}
    >
      {props.children}
    </li>
  );
}

