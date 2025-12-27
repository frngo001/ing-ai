'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';
import type { TElement, Path } from 'platejs';

import { type VariantProps, cva } from 'class-variance-authority';
import { PlateElement, useEditorRef, useEditorSelector } from 'platejs/react';
import { KEYS } from 'platejs';

const headingVariants = cva('relative mb-1', {
  variants: {
    variant: {
      h1: 'mt-[1.6em] pb-1 font-bold font-heading text-4xl',
      h2: 'mt-[1.4em] pb-px font-heading font-semibold text-2xl tracking-tight',
      h3: 'mt-[1em] pb-px font-heading font-semibold text-xl tracking-tight',
      h4: 'mt-[0.75em] font-heading font-semibold text-lg tracking-tight',
      h5: 'mt-[0.75em] font-semibold text-lg tracking-tight',
      h6: 'mt-[0.75em] font-semibold text-base tracking-tight',
    },
  },
});

/**
 * Berechnet die Nummerierung für eine Überschrift basierend auf ihrer Position im Dokument.
 * Unterstützt alle Ebenen von H1 bis H6:
 * H1: 1, 2, 3, ...
 * H2: 1.1, 1.2, 2.1, 2.2, ...
 * H3: 1.1.1, 1.1.2, 1.2.1, ...
 * H4: 1.1.1.1, 1.1.1.2, 1.1.2.1, ...
 * H5: 1.1.1.1.1, 1.1.1.1.2, 1.1.1.2.1, ...
 * H6: 1.1.1.1.1.1, 1.1.1.1.1.2, 1.1.1.1.2.1, ...
 */
function calculateHeadingNumber(
  editor: any,
  currentPath: Path,
  currentLevel: number,
  headingTypes: string[]
): string {
  const allHeadings: Array<{ node: TElement; path: Path; level: number }> = [];
  
  // Sammle alle Überschriften im Dokument
  const headingNodes = editor.api.nodes({
    at: [],
    match: (node: any) => {
      const asAny = node as any;
      if (asAny.bibliographyHeading === true || asAny.bibliography === true) {
        return false;
      }
      return headingTypes.includes((node as TElement).type);
    },
  });

  for (const [node, path] of headingNodes) {
    const level = Math.max(1, headingTypes.indexOf((node as TElement).type) + 1);
    allHeadings.push({ node: node as TElement, path: path as Path, level });
  }

  // Sortiere nach Position im Dokument (Path-Vergleich)
  allHeadings.sort((a, b) => {
    const pathA = a.path;
    const pathB = b.path;
    const minLength = Math.min(pathA.length, pathB.length);
    
    for (let i = 0; i < minLength; i++) {
      if (pathA[i] !== pathB[i]) {
        return (pathA[i] ?? 0) - (pathB[i] ?? 0);
      }
    }
    return pathA.length - pathB.length;
  });

  // Finde die aktuelle Überschrift
  const currentIndex = allHeadings.findIndex(
    (h) => h.path.join(',') === currentPath.join(',')
  );

  if (currentIndex === -1) return '';

  // Berechne die Nummerierung für jede Ebene
  const numbers: number[] = [];

  // Für jede Ebene von 1 bis currentLevel berechnen wir die Nummer
  for (let level = 1; level <= currentLevel; level++) {
    let count = 0;
    let startIndex = 0;

    if (level === 1) {
      // Für Level 1: Zähle alle H1 bis zur aktuellen Position
      // Wenn die aktuelle Überschrift eine H1 ist, zähle bis zu ihr
      // Wenn die aktuelle Überschrift eine H2/H3/etc. ist, zähle bis zur letzten H1 vor ihr
      let searchIndex = currentIndex;
      if (allHeadings[currentIndex].level > 1) {
        // Suche die letzte H1 vor der aktuellen Überschrift
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (allHeadings[i].level === 1) {
            searchIndex = i;
            break;
          }
        }
      }
      
      // Zähle alle H1 bis searchIndex
      for (let i = 0; i <= searchIndex; i++) {
        if (allHeadings[i].level === 1) {
          count++;
        }
      }
      numbers.push(count);
    } else {
      // Für Ebenen > 1: Finde die letzte Überschrift der direkt übergeordneten Ebene (level - 1)
      let foundParent = false;
      let parentIndex = -1;
      
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (allHeadings[i].level === level - 1) {
          parentIndex = i;
          startIndex = i + 1;
          foundParent = true;
          break;
        }
        // Wenn wir eine Überschrift mit niedrigerem Level finden, stoppe die Suche
        if (allHeadings[i].level < level - 1) {
          break;
        }
      }
      
      // Wenn keine direkt übergeordnete Überschrift gefunden wurde, können wir nicht nummerieren
      if (!foundParent) {
        return numbers.join('.');
      }

      // Zähle Überschriften dieser Ebene von startIndex bis zur aktuellen
      // Wenn die aktuelle Überschrift diese Ebene ist, zähle bis zu ihr
      // Wenn die aktuelle Überschrift eine tiefere Ebene ist, zähle bis zur letzten Überschrift dieser Ebene vor der aktuellen
      let searchIndex = currentIndex;
      if (allHeadings[currentIndex].level > level) {
        // Die aktuelle Überschrift ist tiefer, finde die letzte Überschrift dieser Ebene vor ihr
        for (let i = currentIndex - 1; i >= startIndex; i--) {
          if (allHeadings[i].level === level) {
            searchIndex = i;
            break;
          }
          // Wenn wir eine Überschrift mit niedrigerem Level finden, stoppe die Suche
          if (allHeadings[i].level < level) {
            break;
          }
        }
      }

      // Zähle Überschriften dieser Ebene von startIndex bis searchIndex
      for (let i = startIndex; i <= searchIndex; i++) {
        const heading = allHeadings[i];
        
        // Überspringe Überschriften mit niedrigerem Level (neue Hierarchie-Ebene)
        if (heading.level < level) {
          break;
        }
        
        // Zähle nur Überschriften mit genau diesem Level
        if (heading.level === level) {
          count++;
        }
      }
      
      numbers.push(count);
    }
  }

  return numbers.join('.');
}

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  const editor = useEditorRef();
  const isBibliography = (props.element as any)?.bibliography;
  const isBibliographyHeading = (props.element as any)?.bibliographyHeading;
  const isReadOnly = isBibliography || isBibliographyHeading;

  const headingTypes = React.useMemo(
    () => [KEYS.h1, KEYS.h2, KEYS.h3, KEYS.h4, KEYS.h5, KEYS.h6].map((key) => editor.getType(key)),
    [editor]
  );

  // Berechne die Nummerierung für diese Überschrift
  const headingNumber = useEditorSelector(
    (ed) => {
      if (isBibliography || isBibliographyHeading) return '';
      
      const path = ed.api.findPath(props.element);
      if (!path) return '';

      const currentLevel = Math.max(
        1,
        headingTypes.indexOf((props.element as TElement).type) + 1
      );

      return calculateHeadingNumber(ed, path, currentLevel, headingTypes);
    },
    [props.element, headingTypes, isBibliography, isBibliographyHeading]
  );

  return (
    <PlateElement
      as={variant!}
      className={headingVariants({ variant })}
      data-bibliography={isBibliography || undefined}
      data-bibliography-heading={isBibliographyHeading || undefined}
      {...props}
    >
      {headingNumber && (
        <span 
          className="mr-2 select-none text-muted-foreground"
          contentEditable={false}
          suppressContentEditableWarning
        >
          {headingNumber}
        </span>
      )}
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

export function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />;
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />;
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />;
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />;
}
