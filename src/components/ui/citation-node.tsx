'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { PlateElement, useEditorRef, useSelected } from 'platejs/react';

import { cn } from '@/lib/utils';
import {
  useCitationStore,
  formatCitation,
} from '@/lib/stores/citation-store';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { citeWithBibify } from '@/lib/bibify';
import { ExternalLink, Trash2, Unlink } from 'lucide-react';
import { getNormalizedDoi } from '@/lib/citations/link-utils';

export function CitationElement(
  props: PlateElementProps<TCitationElement & Record<string, unknown>>
) {
  const { element, children } = props;
  const selected = useSelected();
  const {
    citationStyle,
    citationFormat,
    citationNumberFormat,
    citationAuthorDateVariant,
    citationAuthorVariant,
    citationLabelVariant,
    citationNoteVariant,
    citationRenderVersion,
    bumpCitationRenderVersion,
  } = useCitationStore();
  const editor = useEditorRef();
  const [externalLabel, setExternalLabel] = React.useState<string | null>(null);

  // Ensure title is a string
  const title = typeof element.title === 'string' ? element.title : String(element.title || '');
  const doi = getNormalizedDoi(element.doi);
  const url = typeof element.url === 'string' ? element.url : undefined;

  const citationData = {
    sourceId: element.sourceId || '',
    authors: Array.isArray(element.authors) ? element.authors : [],
    year: element.year,
    title,
    doi,
    url,
  };

  const buildOrderMap = () => {
    if (!editor) return new Map<string, number>();
    const order = new Map<string, number>();
    let counter = 0;
    const nodes = editor.api.nodes({
      at: [],
      match: (node) => (node as any).type === 'citation',
    }) as any as Array<[any, any]>;
    for (const [, path] of nodes) {
      // Nummeriere jede Vorkommens-Position (nicht pro sourceId), damit zusammengefasste Zitate sauber neu gezählt werden
      const key = Array.isArray(path) ? path.join('-') : undefined;
      if (!key) continue;
      if (!order.has(key)) {
        counter += 1;
        order.set(key, counter);
      }
    }
    return order;
  };

  const orderMap = React.useMemo(buildOrderMap, [
    editor,
    editor?.children,
    citationRenderVersion,
  ]);

  const inlineNumber = (() => {
    if (!orderMap.size || !editor) return undefined;
    const path = editor.api.findPath(element);
    const key = Array.isArray(path) ? path.join('-') : undefined;
    return key ? orderMap.get(key) : undefined;
  })();

  const runInfo = (() => {
    if (!editor) return null;
    if (citationFormat !== 'numeric') return null;
    const path = editor.api.findPath(element);
    if (!path) return null;

    const parentPath = path.slice(0, -1);

    const citations = Array.from(
      editor.api.nodes({
        at: [],
        match: (node) => (node as any).type === 'citation',
      }) as any as Array<[any, any]>
    ).map(([node, p]) => ({ node, path: p as number[] }));

    const siblings = citations
      .filter((c) => {
        const parent = c.path.slice(0, -1);
        return parent.length === parentPath.length && parent.every((v, i) => v === parentPath[i]);
      })
      .sort((a, b) => (a.path[a.path.length - 1] ?? 0) - (b.path[b.path.length - 1] ?? 0));

    const currentIdx = siblings.findIndex((c) => c.path.join(',') === path.join(','));
    if (currentIdx === -1) return null;

    const numbers = siblings.map((c) => {
      const key = c.path.join('-');
      return orderMap.get(key) ?? undefined;
    });

    return {
      isFirst: currentIdx === 0,
      numbers,
      entries: siblings.map((c) => ({
        node: c.node as TCitationElement,
        path: c.path,
      })),
    };
  })();

  // Render text for external CSL styles via Bibify
  React.useEffect(() => {
    let cancelled = false;
    if (!citationStyle || !citationStyle.endsWith('.csl')) {
      setExternalLabel(null);
      return;
    }

    const run = async () => {
      try {
        const authorPersons =
          citationData.authors?.map((a) => {
            const family = a.lastName || a.fullName?.split(' ')?.slice(-1)?.[0];
            const given = a.firstName || a.fullName?.split(' ')?.slice(0, -1)?.join(' ');
            if (!family && a.fullName) return { literal: a.fullName };
            return { family, given };
          }) ?? [];

        const cslType =
          url && !doi ? 'webpage' : 'article-journal';

        const req: any = {
          style: citationStyle,
          id: element.sourceId || citationData.title || 'source',
          type: cslType,
          title: citationData.title,
          issued: citationData.year ? { 'date-parts': [[citationData.year]] } : undefined,
          URL: url,
          DOI: doi,
          author: authorPersons,
        };

        const res = await citeWithBibify(req);
        const stripHtml = (html: string) =>
          html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        if (!cancelled) {
          setExternalLabel(stripHtml(res?.[0] ?? ''));
        }
      } catch (error) {
        console.error('Bibify inline render failed', error);
        if (!cancelled) setExternalLabel(null);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [citationStyle, citationData.title, citationData.year, citationData.authors, url, doi]);

  const toSuperscript = (n: number | undefined) => {
    if (!n && n !== 0) return '?';
    const map: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n)
      .split('')
      .map((d) => map[d] ?? d)
      .join('');
  };

  const formatNumeric = (num?: number) => {
    const val = num ?? 1; // Fallback: immer mindestens 1 anzeigen
    switch (citationNumberFormat) {
      case 'parentheses':
        return `(${val})`;
      case 'superscript':
        return toSuperscript(val);
      case 'plain':
        return String(val);
      case 'dot':
        return `${val}.`;
      case 'bracket':
      default:
        return `[${val}]`;
    }
  };

  const formatAuthorsShort = () => {
    const names =
      citationData.authors
        ?.map((a) => a.lastName || a.fullName || a.firstName)
        .filter(Boolean) || [];
    if (!names.length) return '';
    if (names.length === 1) return names[0] as string;
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    return `${names[0]} et al.`;
  };

  const formatAuthorDate = () => {
    const authorText = formatAuthorsShort();
    const yearText = citationData.year ? String(citationData.year) : 'n.d.';
    const comma = citationAuthorDateVariant === 'comma' ? ', ' : ' ';
    return authorText ? `(${authorText}${comma}${yearText})` : `(${yearText})`;
  };

  const formatAuthorOnly = () => {
    const authorText = formatAuthorsShort() || 'ohne Autor';
    if (citationAuthorVariant === 'with-parens') return `(${authorText})`;
    return authorText;
  };

  const formatLabel = () => {
    const name = citationData.authors?.[0];
    const last = name?.lastName || name?.fullName || 'src';
    const year = citationData.year ? String(citationData.year).slice(-2) : '';
    const base = `${last.slice(0, 3)}${year}`.replace(/\s+/g, '');
    switch (citationLabelVariant) {
      case 'parentheses':
        return `(${base})`;
      case 'plain':
        return base;
      case 'bracket':
      default:
        return `[${base}]`;
    }
  };

  const formatNote = () => {
    // Für Note nutzen wir das Inline-Numeric, wahlweise superscript.
    if (citationNoteVariant === 'superscript') {
      return toSuperscript(inlineNumber ?? 1);
    }
    return formatNumeric(inlineNumber ?? 1);
  };

  const formatNumericRun = () => {
    const numsRaw = runInfo?.numbers ?? [];
    const filled = numsRaw.map((n, idx) => (n === undefined ? idx + 1 : n));
    const parts = filled.length ? filled : [inlineNumber ?? 1];
    const join = parts.join(',');
    switch (citationNumberFormat) {
      case 'parentheses':
        return `(${join})`;
      case 'superscript':
        return parts.map((n) => toSuperscript(n)).join(',');
      case 'plain':
        return join;
      case 'dot':
        return parts.map((n) => `${n}.`).join(',');
      case 'bracket':
      default:
        return `[${join}]`;
    }
  };

  const displayText = React.useMemo(() => {
    if (citationFormat === 'numeric') {
      if (runInfo && !runInfo.isFirst) return '';
      return formatNumericRun();
    }
    if (citationFormat === 'author-date') return formatAuthorDate();
    if (citationFormat === 'author') return formatAuthorOnly();
    if (citationFormat === 'label') return formatLabel();
    if (citationFormat === 'note') return formatNote();
    if (externalLabel) return externalLabel;
    return formatCitation(citationData, citationStyle);
  }, [
    citationStyle,
    citationFormat,
    citationNumberFormat,
    citationAuthorDateVariant,
    citationAuthorVariant,
    citationLabelVariant,
    citationNoteVariant,
    inlineNumber,
    externalLabel,
    citationData,
    runInfo,
  ]);

  const removeCitationAt = React.useCallback(
    (path?: number[] | null) => {
      if (!editor || !path) return;
      editor.tf.withoutNormalizing(() => {
        editor.tf.removeNodes({
          at: path,
          match: (n) => (n as any)?.type === 'citation',
          voids: true,
        });
      });
      editor.tf.normalize({ force: true });
      bumpCitationRenderVersion();
    },
    [editor, bumpCitationRenderVersion]
  );

  const handleDeleteCurrent = React.useCallback(() => {
    const path = editor?.api.findPath(element);
    removeCitationAt(path as number[] | null | undefined);
  }, [editor, element, removeCitationAt]);

  const handleDeleteEntry = React.useCallback(
    (node?: TCitationElement, path?: number[]) => {
      const freshPath = node
        ? (editor?.api.findPath(node as any) as number[] | null | undefined)
        : null;
      const fallbackPath = editor?.api.findPath(element) as number[] | null | undefined;
      const atPath = freshPath ?? path ?? fallbackPath ?? null;
      removeCitationAt(atPath);
    },
    [editor, element, removeCitationAt]
  );

  return (
    <PlateElement {...props} as="span">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <span
            className={cn(
              'inline cursor-pointer rounded px-0.5 text-primary underline decoration-primary/30 underline-offset-2 transition-colors',
              'hover:bg-primary/10 hover:decoration-primary/50',
              selected && 'bg-primary/20'
            )}
            contentEditable={false}
          >
            {displayText}
          </span>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-96 max-h-72 overflow-auto">
          <div className="space-y-3">
            {(runInfo?.entries?.length ?? 0) > 1 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">Gemergte Zitate</span>
                  <span className="text-[11px] rounded bg-muted px-2 py-0.5">
                    {runInfo?.entries?.length ?? 0} Einträge
                  </span>
                </div>
                {runInfo?.entries?.map((entry, idx) => {
                  const entryTitle =
                    typeof entry.node.title === 'string'
                      ? entry.node.title
                      : String(entry.node.title || '');
                  const entryType =
                    (entry.node as any)?.type ||
                    (entry.node as any)?.sourceType ||
                    (entry.node as any)?.kind ||
                    undefined;
                  const entryVenue =
                    (entry.node as any)?.journal ||
                    (entry.node as any)?.publisher ||
                    (entry.node as any)?.containerTitle ||
                    undefined;
                  const entryYear = entry.node.year;
                  const entryVolume = (entry.node as any)?.volume;
                  const entryIssue = (entry.node as any)?.issue;
                  const entryPages =
                    (entry.node as any)?.pages || (entry.node as any)?.page;
                  const entryLanguage = (entry.node as any)?.language;
                  const entryIsbn = (entry.node as any)?.isbn;
                  const entryIssn = (entry.node as any)?.issn;
                  const entryDoi = getNormalizedDoi(entry.node.doi);
                  const entryUrl =
                    typeof entry.node.url === 'string' ? entry.node.url : undefined;
                  const entryAuthors =
                    Array.isArray(entry.node.authors) ? entry.node.authors : [];
                  const authorsFull = entryAuthors
                    .map((a) => a.fullName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim())
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <div
                      key={idx}
                      className="group rounded-md border border-border/60 bg-muted/30 hover:bg-muted/50 px-3 py-2.5 transition space-y-1.5"
                    >
                      <div className="flex items-start gap-2 text-sm leading-snug text-foreground">
                        <span className="text-xs font-semibold text-primary shrink-0">{`[${runInfo?.numbers?.[idx] ?? idx + 1}]`}</span>
                        <div className="space-y-1.5">
                          <div className="text-sm font-semibold leading-tight line-clamp-2">
                            {entryTitle}
                          </div>
                          <div className="text-xs text-muted-foreground space-x-1">
                            {entryVenue && <span>{entryVenue}</span>}
                            {entryYear && <span>• {entryYear}</span>}
                            {entryType && <span>• {entryType}</span>}
                          </div>
                      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                        {[
                          authorsFull,
                          entryVolume && `Vol. ${entryVolume}`,
                          entryIssue && `Nr. ${entryIssue}`,
                          entryPages && `S. ${entryPages}`,
                          entryLanguage,
                          entryIsbn && `ISBN ${entryIsbn}`,
                          entryIssn && `ISSN ${entryIssn}`,
                          entryDoi && `DOI ${entryDoi}`,
                        ]
                          .filter(Boolean)
                          .map((part, idx, arr) => (
                            <span key={idx} className="flex items-center gap-1">
                              {part}
                              {idx !== arr.length - 1 && '•'}
                            </span>
                          ))}
                        {entryUrl && (
                          <span className="flex items-center gap-1">
                            • <span className="text-emerald-600">{entryUrl}</span>
                          </span>
                        )}
                      </div>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-0">
                        <div className="flex items-center gap-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                            className="h-8 w-8 cursor-pointer text-emerald-600"
                                onClick={() => window.open(entryUrl ?? url, '_blank')}
                                aria-label="Link öffnen"
                              >
                            <ExternalLink className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Link öffnen</TooltipContent>
                          </Tooltip>
                          {entryDoi && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 cursor-pointer"
                                  onClick={() => window.open(`https://doi.org/${entryDoi}`, '_blank')}
                                  aria-label="DOI öffnen"
                                >
                                  <Unlink className="size-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">DOI öffnen</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                              onClick={() => handleDeleteEntry(entry.node, entry.path)}
                                aria-label="Zitat löschen"
                              >
                                <Trash2 className="size-3 text-destructive hover:text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Zitat löschen</TooltipContent>
                          </Tooltip>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap"></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
                <h4 className="text-sm font-semibold leading-tight line-clamp-2">
                  {title}
                </h4>
                {citationData.authors?.length ? (
                  <p className="text-xs text-muted-foreground">
                    Autoren:{' '}
                    {citationData.authors
                      .map((a) => a.fullName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim())
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                ) : null}
                {element.type && (
                  <p className="text-[11px] text-muted-foreground">Typ: {String(element.type)}</p>
                )}
                {(element as any)?.journal && (
                  <p className="text-[11px] text-muted-foreground break-words">
                    Journal/Verlag: {(element as any).journal as string}
                  </p>
                )}
                {(element as any)?.pages && (
                  <p className="text-[11px] text-muted-foreground">
                    Seiten: {(element as any).pages as string}
                  </p>
                )}
                {(element as any)?.volume && (
                  <p className="text-[11px] text-muted-foreground">
                    Vol.: {(element as any).volume as string}
                  </p>
                )}
                {(element as any)?.issue && (
                  <p className="text-[11px] text-muted-foreground">
                    Nr.: {(element as any).issue as string}
                  </p>
                )}
                {(element as any)?.language && (
                  <p className="text-[11px] text-muted-foreground">
                    Sprache: {(element as any).language as string}
                  </p>
                )}
                {element.year && (
                  <p className="text-xs text-muted-foreground">Jahr: {element.year}</p>
                )}
                {element.sourceId && (
                  <p className="text-xs text-muted-foreground break-words">
                    Quelle-ID: {element.sourceId}
                  </p>
                )}
                {url && (
                  <p className="text-xs text-emerald-600 break-words">URL: {url}</p>
                )}
                {doi && (
                  <p className="text-xs text-muted-foreground break-words">DOI: {doi}</p>
                )}
                {((element as any)?.isbn || (element as any)?.issn) && (
                  <p className="text-[11px] text-muted-foreground break-words">
                    {(element as any)?.isbn ? `ISBN: ${(element as any).isbn}` : ''}
                    {(element as any)?.issn
                      ? `${(element as any)?.isbn ? ' • ' : ''}ISSN: ${(element as any).issn}`
                      : ''}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between gap-0">
                  <div className="flex items-center gap-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 cursor-pointer text-emerald-600"
                          onClick={() => url && window.open(url, '_blank')}
                          aria-label="Link öffnen"
                        >
                          <ExternalLink className="size-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Link öffnen</TooltipContent>
                    </Tooltip>
                    {doi && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 cursor-pointer"
                            onClick={() => window.open(`https://doi.org/${doi}`, '_blank')}
                            aria-label="DOI öffnen"
                          >
                            <Unlink className="size-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">DOI öffnen</TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 cursor-pointer text-destructive hover:text-destructive"
                          onClick={handleDeleteCurrent}
                          aria-label="Zitat löschen"
                        >
                          <Trash2 className="size-3 text-destructive hover:text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">Zitat löschen</TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap"></span>
                </div>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
      {children}
    </PlateElement>
  );
}
