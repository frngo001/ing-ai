'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import type { Path } from 'platejs';
import { PlateElement, useEditorRef, useSelected } from 'platejs/react';
import { ExternalLink, Trash2, Unlink } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCitationStore, formatCitation } from '@/lib/stores/citation-store';
import { citeWithBibify } from '@/lib/bibify';
import { getNormalizedDoi } from '@/lib/citations/link-utils';
import { useLanguage } from '@/lib/i18n/use-language';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { CITATION_KEY } from '@/components/editor/plugins/citation-kit';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ============================================================================
// Types
// ============================================================================

interface CitationRunInfo {
  isFirst: boolean;
  numbers: (number | undefined)[];
  entries: Array<{ node: TCitationElement; path: Path }>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Compare two paths for sorting */
const comparePaths = (path1: Path, path2: Path): number => {
  const minLength = Math.min(path1.length, path2.length);
  for (let i = 0; i < minLength; i++) {
    if (path1[i] !== path2[i]) {
      return (path1[i] ?? 0) - (path2[i] ?? 0);
    }
  }
  return path1.length - path2.length;
};

/** Convert number to superscript */
const toSuperscript = (n: number | undefined): string => {
  if (n === undefined) return '?';
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  };
  return String(n).split('').map((d) => map[d] ?? d).join('');
};

// ============================================================================
// Component
// ============================================================================

export function CitationElement(
  props: PlateElementProps<TCitationElement & Record<string, unknown>>
) {
  const { element, children } = props;
  const selected = useSelected();
  const editor = useEditorRef();
  const { t, language } = useLanguage();
  const [externalLabel, setExternalLabel] = React.useState<string | null>(null);

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

  // --------------------------------------------------------------------------
  // Translations
  // --------------------------------------------------------------------------

  const translations = React.useMemo(() => ({
    mergedCitations: t('citationNode.mergedCitations'),
    entries: t('citationNode.entries'),
    noAuthor: t('citationNode.noAuthor'),
    volume: t('citationNode.volume'),
    issue: t('citationNode.issue'),
    pages: t('citationNode.pages'),
    authors: t('citationNode.authors'),
    type: t('citationNode.type'),
    journalPublisher: t('citationNode.journalPublisher'),
    pagesLabel: t('citationNode.pagesLabel'),
    volumeLabel: t('citationNode.volumeLabel'),
    issueLabel: t('citationNode.issueLabel'),
    languageLabel: t('citationNode.languageLabel'),
    year: t('citationNode.year'),
    sourceId: t('citationNode.sourceId'),
    openLink: t('citationNode.openLink'),
    openDoi: t('citationNode.openDoi'),
    deleteCitation: t('citationNode.deleteCitation'),
  }), [t, language]);

  // --------------------------------------------------------------------------
  // Citation Data
  // --------------------------------------------------------------------------

  const title = typeof element.title === 'string' ? element.title : String(element.title || '');
  const doi = getNormalizedDoi(element.doi);
  const url = typeof element.url === 'string' ? element.url : undefined;

  const citationData = React.useMemo(() => ({
    sourceId: element.sourceId || '',
    authors: Array.isArray(element.authors) ? element.authors : [],
    year: element.year,
    title,
    doi,
    url,
    sourceType: typeof element.sourceType === 'string' ? element.sourceType : undefined,
    journal: typeof element.journal === 'string' ? element.journal : undefined,
    containerTitle: typeof element.containerTitle === 'string' ? element.containerTitle : undefined,
    publisher: typeof element.publisher === 'string' ? element.publisher : undefined,
    volume: typeof element.volume === 'string' ? element.volume : undefined,
    issue: typeof element.issue === 'string' ? element.issue : undefined,
    pages: typeof element.pages === 'string' ? element.pages : undefined,
    isbn: typeof element.isbn === 'string' ? element.isbn : undefined,
    issn: typeof element.issn === 'string' ? element.issn : undefined,
    note: typeof element.note === 'string' ? element.note : undefined,
    accessedAt: typeof element.accessedAt === 'string' ? element.accessedAt : undefined,
  }), [element, title, doi, url]);

  // --------------------------------------------------------------------------
  // Order Map (citation numbering)
  // --------------------------------------------------------------------------

  const orderMap = React.useMemo(() => {
    if (!editor) return new Map<string, number>();

    const order = new Map<string, number>();
    const citations: Array<{ node: TCitationElement; path: number[] }> = [];

    const nodes = editor.api.nodes({
      at: [],
      match: (node) => (node as any).type === 'citation',
    }) as any as Array<[TCitationElement, number[]]>;

    for (const [node, path] of nodes) {
      if (Array.isArray(path)) {
        citations.push({ node, path });
      }
    }

    // Sort by document position
    citations.sort((a, b) => comparePaths(a.path, b.path));

    // Assign numbers based on sourceId (each unique source gets a number)
    const sourceIdToNumber = new Map<string, number>();
    let counter = 0;

    for (const { node, path } of citations) {
      const sourceId = node.sourceId;
      if (!sourceId) continue;

      if (!sourceIdToNumber.has(sourceId)) {
        counter += 1;
        sourceIdToNumber.set(sourceId, counter);
      }

      const key = path.join('-');
      const number = sourceIdToNumber.get(sourceId);
      if (number !== undefined) {
        order.set(key, number);
      }
    }

    return order;
  }, [editor, editor?.children, citationRenderVersion]);

  const inlineNumber = React.useMemo(() => {
    if (!orderMap.size || !editor) return undefined;
    const path = editor.api.findPath(element);
    const key = Array.isArray(path) ? path.join('-') : undefined;
    return key ? orderMap.get(key) : undefined;
  }, [orderMap, editor, element]);

  // --------------------------------------------------------------------------
  // Run Info (for merging adjacent citations)
  // --------------------------------------------------------------------------

  const runInfo = React.useMemo((): CitationRunInfo | null => {
    if (!editor || citationFormat !== 'numeric') return null;

    const path = editor.api.findPath(element);
    if (!path) return null;

    // Find all citations in the editor
    const allCitations = Array.from(
      editor.api.nodes({
        at: [],
        match: (node) => (node as any).type === 'citation' || (node as any).type === CITATION_KEY,
      }) as any as Array<[TCitationElement, Path]>
    );

    // Filter citations in the same parent
    const parentPath = path.slice(0, -1);
    const citationsInSameParent = allCitations
      .filter(([, citationPath]) => {
        const citationParentPath = citationPath.slice(0, -1);
        if (citationParentPath.length !== parentPath.length) return false;
        return parentPath.every((p, i) => citationParentPath[i] === p);
      })
      .map(([node, citationPath]) => ({ path: citationPath, node }));

    citationsInSameParent.sort((a, b) => comparePaths(a.path, b.path));

    // Find current citation index
    const currentCitationIdx = citationsInSameParent.findIndex((c) =>
      c.path.length === path.length && c.path.every((p, i) => p === path[i])
    );

    if (currentCitationIdx === -1) return null;

    // Check if two citations are adjacent (only empty text between them)
    const areAdjacent = (path1: Path, path2: Path): boolean => {
      const parentPath1 = path1.slice(0, -1);
      const parentPath2 = path2.slice(0, -1);

      if (parentPath1.length !== parentPath2.length) return false;
      if (!parentPath1.every((p, i) => parentPath2[i] === p)) return false;

      const idx1 = path1[path1.length - 1] ?? 0;
      const idx2 = path2[path2.length - 1] ?? 0;
      const startIdx = Math.min(idx1, idx2);
      const endIdx = Math.max(idx1, idx2);

      // Directly adjacent
      if (endIdx - startIdx === 1) return true;

      // Navigate to parent node manually
      let parentNode: any = { children: editor.children };
      for (const idx of parentPath1) {
        if (!parentNode?.children?.[idx]) return false;
        parentNode = parentNode.children[idx];
      }

      const parentChildren = Array.isArray(parentNode?.children) ? parentNode.children : [];

      // Check nodes between citations
      for (let i = startIdx + 1; i < endIdx; i++) {
        if (i < 0 || i >= parentChildren.length) return false;

        const node = parentChildren[i];

        // Citations or block elements prevent merging
        if ((node as any)?.type === 'citation' || (node as any)?.type === CITATION_KEY) return false;
        if ((node as any)?.type && typeof (node as any).type === 'string') return false;

        // Text nodes: only allow empty or whitespace/punctuation
        if (typeof (node as any)?.text === 'string') {
          const text = (node as any).text;
          if (text !== '' && !/^[\s,;:.\-]*$/.test(text)) return false;
        }
      }

      return true;
    };

    // Expand run left and right
    let start = currentCitationIdx;
    let end = currentCitationIdx;

    for (let i = currentCitationIdx - 1; i >= 0; i--) {
      if (areAdjacent(citationsInSameParent[i].path, citationsInSameParent[start].path)) {
        start = i;
      } else {
        break;
      }
    }

    for (let i = currentCitationIdx + 1; i < citationsInSameParent.length; i++) {
      if (areAdjacent(citationsInSameParent[end].path, citationsInSameParent[i].path)) {
        end = i;
      } else {
        break;
      }
    }

    const run = citationsInSameParent.slice(start, end + 1);
    const numbers = run.map((c) => orderMap.get(c.path.join('-')));

    return {
      isFirst: currentCitationIdx === start,
      numbers,
      entries: run.map((c) => ({ node: c.node as TCitationElement, path: c.path })),
    };
  }, [editor, element, citationFormat, orderMap, citationRenderVersion]);

  // --------------------------------------------------------------------------
  // External Label (CSL styles via Bibify)
  // --------------------------------------------------------------------------

  React.useEffect(() => {
    let cancelled = false;

    if (!citationStyle || !citationStyle.endsWith('.csl')) {
      setExternalLabel(null);
      return;
    }

    const run = async () => {
      try {
        const authorPersons = citationData.authors?.map((a) => {
          const family = a.lastName || a.fullName?.split(' ')?.slice(-1)?.[0];
          const given = a.firstName || a.fullName?.split(' ')?.slice(0, -1)?.join(' ');
          if (!family && a.fullName) return { literal: a.fullName };
          return { family, given };
        }) ?? [];

        const cslType = url && !doi ? 'webpage' : 'article-journal';

        const req = {
          style: citationStyle,
          id: element.sourceId || citationData.title || 'source',
          type: cslType,
          title: citationData.title,
          issued: citationData.year ? { 'date-parts': [[citationData.year]] } : undefined,
          URL: url,
          DOI: doi,
          author: authorPersons,
        };

        const res = await citeWithBibify(req as any);
        const stripHtml = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

        if (!cancelled) {
          setExternalLabel(stripHtml(res?.[0] ?? ''));
        }
      } catch {
        if (!cancelled) setExternalLabel(null);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [citationStyle, citationData.title, citationData.year, citationData.authors, url, doi, element.sourceId]);

  // --------------------------------------------------------------------------
  // Formatting Functions
  // --------------------------------------------------------------------------

  const formatNumeric = (num?: number) => {
    const val = num ?? 1;
    switch (citationNumberFormat) {
      case 'parentheses': return `(${val})`;
      case 'superscript': return toSuperscript(val);
      case 'plain': return String(val);
      case 'dot': return `${val}.`;
      case 'bracket':
      default: return `[${val}]`;
    }
  };

  const formatAuthorsShort = () => {
    const names = citationData.authors
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
    const authorText = formatAuthorsShort() || translations.noAuthor;
    return citationAuthorVariant === 'with-parens' ? `(${authorText})` : authorText;
  };

  const formatLabel = () => {
    const name = citationData.authors?.[0];
    const last = name?.lastName || name?.fullName || 'src';
    const year = citationData.year ? String(citationData.year).slice(-2) : '';
    const base = `${last.slice(0, 3)}${year}`.replace(/\s+/g, '');
    switch (citationLabelVariant) {
      case 'parentheses': return `(${base})`;
      case 'plain': return base;
      case 'bracket':
      default: return `[${base}]`;
    }
  };

  const formatNote = () => {
    if (citationNoteVariant === 'superscript') {
      return toSuperscript(inlineNumber ?? 1);
    }
    return formatNumeric(inlineNumber ?? 1);
  };

  const formatNumericRun = () => {
    const numsRaw = runInfo?.numbers ?? [];
    const filled = numsRaw.map((n, idx) => (n === undefined ? idx + 1 : n));
    const unique = [...new Set(filled)].sort((a, b) => a - b);
    const parts = unique.length ? unique : [inlineNumber ?? 1];
    const join = parts.join(',');

    switch (citationNumberFormat) {
      case 'parentheses': return `(${join})`;
      case 'superscript': return parts.map(toSuperscript).join(',');
      case 'plain': return join;
      case 'dot': return parts.map((n) => `${n}.`).join(',');
      case 'bracket':
      default: return `[${join}]`;
    }
  };

  // --------------------------------------------------------------------------
  // Deduplicated Entries for HoverCard (must be before early return to maintain hooks order)
  // --------------------------------------------------------------------------

  const { uniqueEntries, uniqueNumbers } = React.useMemo(() => {
    if (!runInfo?.entries || !runInfo?.numbers) {
      return { uniqueEntries: [], uniqueNumbers: [] };
    }

    const seen = new Set<string>();
    const pairs: Array<{ entry: typeof runInfo.entries[0]; number: number }> = [];

    for (let i = 0; i < runInfo.entries.length; i++) {
      const entry = runInfo.entries[i];
      const number = runInfo.numbers[i] ?? i + 1;
      const sourceId = entry.node.sourceId;

      if (sourceId && !seen.has(sourceId)) {
        seen.add(sourceId);
        pairs.push({ entry, number });
      }
    }

    pairs.sort((a, b) => a.number - b.number);

    return {
      uniqueEntries: pairs.map((p) => p.entry),
      uniqueNumbers: pairs.map((p) => p.number),
    };
  }, [runInfo?.entries, runInfo?.numbers]);

  // --------------------------------------------------------------------------
  // Display Text
  // --------------------------------------------------------------------------

  const displayText = React.useMemo(() => {
    if (citationFormat === 'numeric') {
      if (runInfo && !runInfo.isFirst) return '';
      const numericText = formatNumericRun();
      return numericText?.trim() || formatNumeric(inlineNumber ?? 1);
    }
    if (citationFormat === 'author-date') return formatAuthorDate() || `(${citationData.year || 'n.d.'})`;
    if (citationFormat === 'author') return formatAuthorOnly() || translations.noAuthor;
    if (citationFormat === 'label') return formatLabel() || '[cite]';
    if (citationFormat === 'note') return formatNote() || formatNumeric(inlineNumber ?? 1);
    if (externalLabel) return externalLabel;
    return formatCitation(citationData, citationStyle) || `[${title}]`;
  }, [
    citationStyle, citationFormat, citationNumberFormat, citationAuthorDateVariant,
    citationAuthorVariant, citationLabelVariant, citationNoteVariant, inlineNumber,
    externalLabel, citationData, runInfo, title, translations,
  ]);

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------

  const removeCitationAt = React.useCallback((path?: number[] | null) => {
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
  }, [editor, bumpCitationRenderVersion]);

  const handleDeleteCurrent = React.useCallback(() => {
    const path = editor?.api.findPath(element);
    removeCitationAt(path as number[] | null | undefined);
  }, [editor, element, removeCitationAt]);

  const handleDeleteEntry = React.useCallback((node?: TCitationElement, path?: number[]) => {
    const freshPath = node ? (editor?.api.findPath(node as any) as number[] | null | undefined) : null;
    const fallbackPath = editor?.api.findPath(element) as number[] | null | undefined;
    removeCitationAt(freshPath ?? path ?? fallbackPath ?? null);
  }, [editor, element, removeCitationAt]);

  // --------------------------------------------------------------------------
  // Early Return for Hidden Citations
  // --------------------------------------------------------------------------

  if (!displayText) {
    return (
      <PlateElement {...props} as="span" style={{ display: 'none' }}>
        {children}
      </PlateElement>
    );
  }

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

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
            suppressContentEditableWarning
          >
            {displayText}
          </span>
        </HoverCardTrigger>

        <HoverCardContent align="start" className="w-96 max-h-72 overflow-auto">
          <div className="space-y-3">
            {uniqueEntries.length > 1 ? (
              <MergedCitationsView
                entries={uniqueEntries}
                numbers={uniqueNumbers}
                translations={translations}
                url={url}
                onDeleteEntry={handleDeleteEntry}
              />
            ) : (
              <SingleCitationView
                title={title}
                citationData={citationData}
                element={element}
                translations={translations}
                url={url}
                doi={doi}
                onDelete={handleDeleteCurrent}
              />
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
      {children}
    </PlateElement>
  );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface MergedCitationsViewProps {
  entries: Array<{ node: TCitationElement; path: Path }>;
  numbers: number[];
  translations: Record<string, string>;
  url?: string;
  onDeleteEntry: (node?: TCitationElement, path?: number[]) => void;
}

function MergedCitationsView({ entries, numbers, translations, url, onDeleteEntry }: MergedCitationsViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{translations.mergedCitations}</span>
        <span className="text-[11px] rounded bg-muted px-2 py-0.5">
          {entries.length} {translations.entries}
        </span>
      </div>

      {entries.map((entry, idx) => (
        <CitationEntryCard
          key={idx}
          entry={entry}
          number={numbers[idx] ?? idx + 1}
          translations={translations}
          fallbackUrl={url}
          onDelete={() => onDeleteEntry(entry.node, entry.path as number[])}
        />
      ))}
    </div>
  );
}

interface CitationEntryCardProps {
  entry: { node: TCitationElement; path: Path };
  number: number;
  translations: Record<string, string>;
  fallbackUrl?: string;
  onDelete: () => void;
}

function CitationEntryCard({ entry, number, translations, fallbackUrl, onDelete }: CitationEntryCardProps) {
  const { node } = entry;

  const entryTitle = typeof node.title === 'string' ? node.title : String(node.title || '');
  const entryVenue = (node as any)?.journal || (node as any)?.publisher || (node as any)?.containerTitle;
  const entryYear = node.year;
  const entryDoi = getNormalizedDoi(node.doi);
  const entryUrl = typeof node.url === 'string' ? node.url : undefined;
  const entryAuthors = Array.isArray(node.authors) ? node.authors : [];

  const authorsFull = entryAuthors
    .map((a) => a.fullName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim())
    .filter(Boolean)
    .join(', ');

  const metadata = [
    authorsFull,
    (node as any)?.volume && `${translations.volume} ${(node as any).volume}`,
    (node as any)?.issue && `${translations.issue} ${(node as any).issue}`,
    (node as any)?.pages && `${translations.pages} ${(node as any).pages}`,
    (node as any)?.language,
    (node as any)?.isbn && `ISBN ${(node as any).isbn}`,
    (node as any)?.issn && `ISSN ${(node as any).issn}`,
    entryDoi && `DOI ${entryDoi}`,
  ].filter(Boolean);

  return (
    <div className="group rounded-md border border-border/60 bg-muted/30 hover:bg-muted/50 px-3 py-2.5 transition space-y-1.5">
      <div className="flex items-start gap-2 text-sm leading-snug text-foreground">
        <span className="text-xs font-semibold text-primary shrink-0">[{number}]</span>
        <div className="space-y-1.5">
          <div className="text-sm font-semibold leading-tight line-clamp-2">{entryTitle}</div>
          <div className="text-xs text-muted-foreground space-x-1">
            {entryVenue && <span>{entryVenue}</span>}
            {entryYear && <span>• {entryYear}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {metadata.map((part, i, arr) => (
              <span key={i} className="flex items-center gap-1">
                {part}{i !== arr.length - 1 && ' •'}
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

      <div className="mt-2 flex items-center gap-0">
        <ActionButton
          icon={<ExternalLink className="size-3" />}
          label={translations.openLink}
          onClick={() => window.open(entryUrl ?? fallbackUrl, '_blank')}
          className="text-emerald-600"
        />
        {entryDoi && (
          <ActionButton
            icon={<Unlink className="size-3" />}
            label={translations.openDoi}
            onClick={() => window.open(`https://doi.org/${entryDoi}`, '_blank')}
          />
        )}
        <ActionButton
          icon={<Trash2 className="size-3" />}
          label={translations.deleteCitation}
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        />
      </div>
    </div>
  );
}

interface SingleCitationViewProps {
  title: string;
  citationData: any;
  element: TCitationElement & Record<string, unknown>;
  translations: Record<string, string>;
  url?: string;
  doi?: string;
  onDelete: () => void;
}

function SingleCitationView({ title, citationData, element, translations, url, doi, onDelete }: SingleCitationViewProps) {
  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2.5">
      <h4 className="text-sm font-semibold leading-tight line-clamp-2">{title}</h4>

      {citationData.authors?.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {translations.authors}{' '}
          {citationData.authors
            .map((a: any) => a.fullName || `${a.firstName ?? ''} ${a.lastName ?? ''}`.trim())
            .filter(Boolean)
            .join(', ')}
        </p>
      )}

      {(element as any)?.journal && (
        <p className="text-[11px] text-muted-foreground break-words">
          {translations.journalPublisher} {(element as any).journal}
        </p>
      )}
      {(element as any)?.pages && (
        <p className="text-[11px] text-muted-foreground">{translations.pagesLabel} {(element as any).pages}</p>
      )}
      {(element as any)?.volume && (
        <p className="text-[11px] text-muted-foreground">{translations.volumeLabel} {(element as any).volume}</p>
      )}
      {(element as any)?.issue && (
        <p className="text-[11px] text-muted-foreground">{translations.issueLabel} {(element as any).issue}</p>
      )}
      {element.year && (
        <p className="text-xs text-muted-foreground">{translations.year} {element.year}</p>
      )}
      {url && <p className="text-xs text-emerald-600 break-words">URL: {url}</p>}
      {doi && <p className="text-xs text-muted-foreground break-words">DOI: {doi}</p>}

      <div className="mt-2 flex items-center gap-0">
        <ActionButton
          icon={<ExternalLink className="size-3" />}
          label={translations.openLink}
          onClick={() => url && window.open(url, '_blank')}
          className="text-emerald-600"
        />
        {doi && (
          <ActionButton
            icon={<Unlink className="size-3" />}
            label={translations.openDoi}
            onClick={() => window.open(`https://doi.org/${doi}`, '_blank')}
          />
        )}
        <ActionButton
          icon={<Trash2 className="size-3" />}
          label={translations.deleteCitation}
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        />
      </div>
    </div>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

function ActionButton({ icon, label, onClick, className }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className={cn('h-8 w-8 cursor-pointer', className)}
          onClick={onClick}
          aria-label={label}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
