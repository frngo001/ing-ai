'use client';

import * as React from 'react';

import type { Path, TElement } from 'platejs';
import { KEYS } from 'platejs';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/use-language';

type TocItem = {
  id: string;
  prefix: string;
  text: string;
  level: number;
  path: Path;
};

type EditorTocSidebarProps = {
  className?: string;
  visible?: boolean;
};

export function EditorTocSidebar({ className, visible = true }: EditorTocSidebarProps) {
  const editor = useEditorRef();
  const { t, language } = useLanguage();

  const headingTypes = React.useMemo(
    () => [KEYS.h1, KEYS.h2, KEYS.h3, KEYS.h4, KEYS.h5, KEYS.h6].map((key) => editor.getType(key)),
    [editor]
  );

  const bibliographyText = React.useMemo(() => t('toolbar.bibliography'), [t, language]);
  const tocTitle = React.useMemo(() => t('toolbar.tocTitle'), [t, language]);

  const items = useEditorSelector(
    (ed) => {
      const nodes = ed.api.nodes<TElement>({
        at: [],
        match: (node) => {
          const asAny = node as any;
          if (asAny.bibliographyHeading === true) return true;
          return (
            headingTypes.includes((node as TElement).type) &&
            asAny.bibliography !== true
          );
        },
      });

      const allHeadings: Array<{ node: TElement; path: Path; level: number }> = [];
      const baseItems: TocItem[] = [];

      // Sammle alle Überschriften und erstelle baseItems
      Array.from(nodes).forEach(([node, path]) => {
        const isBibliographyHeading = (node as any).bibliographyHeading === true;
        const level = isBibliographyHeading
          ? 1
          : Math.max(1, headingTypes.indexOf((node as TElement).type) + 1);
        const raw = ed.api.string(path) as string | string[] | null | undefined;
        const text = Array.isArray(raw)
          ? raw.join(' ').trim()
          : (raw ?? '').toString().trim();

        if (!text || typeof text !== 'string') return;

        if (!isBibliographyHeading) {
          allHeadings.push({ node: node as TElement, path: path as Path, level });
        }

        baseItems.push({
          id: ((node as TElement).id as string) ?? path.join('-'),
          level,
          prefix: '',
          path,
          text: isBibliographyHeading ? bibliographyText : text,
        });
      });

      // Sortiere alle Überschriften nach Position im Dokument
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

      // Berechne Nummerierung für jedes Element
      return baseItems.map((item) => {
        // Überspringe Nummerierung für Bibliography-Überschriften
        if (item.text === bibliographyText) {
          return { ...item, prefix: '' };
        }

        // Finde den Index dieser Überschrift in allHeadings
        const currentIndex = allHeadings.findIndex(
          (h) => h.path.join(',') === item.path.join(',')
        );

        if (currentIndex === -1) {
          return { ...item, prefix: '' };
        }

        // Berechne die Nummerierung für jede Ebene
        const numbers: number[] = [];
        const currentLevel = item.level;

        for (let level = 1; level <= currentLevel; level++) {
          let count = 0;
          let startIndex = 0;

          if (level === 1) {
            // Für Level 1: Zähle alle H1 bis zur aktuellen Position
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
            
            for (let i = currentIndex - 1; i >= 0; i--) {
              if (allHeadings[i].level === level - 1) {
                startIndex = i + 1;
                foundParent = true;
                break;
              }
              if (allHeadings[i].level < level - 1) {
                break;
              }
            }
            
            if (!foundParent) {
              return { ...item, prefix: numbers.join('.') };
            }

            // Zähle Überschriften dieser Ebene von startIndex bis zur aktuellen
            let searchIndex = currentIndex;
            if (allHeadings[currentIndex].level > level) {
              // Die aktuelle Überschrift ist tiefer, finde die letzte Überschrift dieser Ebene vor ihr
              for (let i = currentIndex - 1; i >= startIndex; i--) {
                if (allHeadings[i].level === level) {
                  searchIndex = i;
                  break;
                }
                if (allHeadings[i].level < level) {
                  break;
                }
              }
            }

            // Zähle Überschriften dieser Ebene von startIndex bis searchIndex
            for (let i = startIndex; i <= searchIndex; i++) {
              const heading = allHeadings[i];
              
              if (heading.level < level) {
                break;
              }
              
              if (heading.level === level) {
                count++;
              }
            }
            
            numbers.push(count);
          }
        }

        return {
          ...item,
          prefix: numbers.join('.'),
        };
      });
    },
    [headingTypes, bibliographyText]
  );

  const showContent = visible && items.length > 0;
  const [shouldRender, setShouldRender] = React.useState(showContent);
  const TRANSITION_MS = 200;

  React.useEffect(() => {
    if (showContent) {
      setShouldRender(true);
      return;
    }

    const timeout = window.setTimeout(() => setShouldRender(false), TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [showContent]);

  const handleNavigate = React.useCallback(
    (path: Path) => {
      const start = editor.api.start(path);
      if (start) {
        editor.tf.select(start);
        editor.tf.focus();
      }

      const entry = editor.api.node(path);
      if (entry) {
        const dom = editor.api.toDOMNode(entry[0]);
        dom?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [editor]
  );

  if (!shouldRender) return null;

  return (
    <aside
      data-state={showContent ? 'open' : 'closed'}
      className={cn(
        'fixed right-4 top-12 hidden h-fit min-w-[180px] max-w-xs rounded-lg border-none px-0 py-2 xl:block',
        'transition-[opacity,transform] duration-200 ease-out',
        'data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2 data-[state=closed]:pointer-events-none',
        className
      )}
    >
      <div className="mb-2 text-sm font-semibold text-muted-foreground ml-12">
        {tocTitle}
      </div>

      <nav className="flex flex-col gap-1 text-sm max-h-[80vh] overflow-auto pr-0 ml-12">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cn(
              'text-left text-muted-foreground hover:text-foreground cursor-pointer',
              'rounded px-2 py-1 transition',
              item.level === 1 && 'font-semibold',
              item.level === 2 && 'pl-4',
              item.level >= 3 && 'pl-6'
            )}
            onClick={() => handleNavigate(item.path)}
          >
            {item.prefix && (
              <span className="mr-2 text-muted-foreground select-none">
                {item.prefix}
              </span>
            )}
            <span className="text-sm leading-snug">{item.text}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

