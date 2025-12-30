'use client';

import * as React from 'react';

import { KEYS, type Path } from 'platejs';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import { useCitationStore } from '@/lib/stores/citation-store';
import type { TCitationElement } from '@/components/editor/plugins/citation-kit';
import { citeWithBibify } from '@/lib/bibify';
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils';
import { useLanguage } from '@/lib/i18n/use-language';

type BibliographyItem = {
  path: Path;
  data: TCitationElement;
};

export function EditorBibliography({ className: _className }: { className?: string }) {
  const editor = useEditorRef();
  const { citationStyle } = useCitationStore();
  const prevSignature = React.useRef<string | null>(null);
  const [externalEntries, setExternalEntries] = React.useState<string[] | null>(null);
  const isExternalStyle = React.useMemo(() => citationStyle?.includes('.csl'), [citationStyle]);
  const { t, language } = useLanguage();

  // Memoized translations that update on language change
  const translations = React.useMemo(() => ({
    noAuthor: t('bibliography.noAuthor'),
    untitled: t('bibliography.untitled'),
    noDate: t('bibliography.noDate'),
    volume: t('bibliography.volume'),
    issue: t('bibliography.issue'),
    pages: t('bibliography.pages'),
    accessedOn: t('bibliography.accessedOn'),
    in: t('bibliography.in'),
    bibliography: t('bibliography.bibliography'),
  }), [t, language]);

  // Get locale based on current language
  const locale = React.useMemo(() => {
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
    };
    return localeMap[language] || 'en-US';
  }, [language]);

  const normalizeTitle = React.useCallback((title: TCitationElement['title']) => {
    if (typeof title === 'string') return title.trim();
    if (title && typeof (title as any).title === 'string') return String((title as any).title).trim();
    const identifiers = (title as any)?.identifiers;
    if (Array.isArray(identifiers)) {
      const candidate = identifiers.find((i) => i?.title);
      if (candidate?.title) return String(candidate.title).trim();
    }
    return '';
  }, []);

  const formatAuthors = React.useCallback((authors: TCitationElement['authors']) => {
    if (!Array.isArray(authors) || authors.length === 0) return translations.noAuthor;

    const formatAuthor = (a: TCitationElement['authors'][number]) => {
      const lastRaw =
        a?.lastName ||
        (a?.fullName ? a.fullName.split(' ').slice(-1)[0] : '') ||
        '';
      const last = lastRaw ? lastRaw.toUpperCase() : '';
      const first =
        a?.firstName ||
        (a?.fullName ? a.fullName.split(' ')[0] : '') ||
        '';
      const initial = first ? `${first[0].toUpperCase()}.` : '';
      return [last, initial].filter(Boolean).join(', ');
    };

    const names = authors.map(formatAuthor).filter(Boolean);
    if (names.length === 0) return translations.noAuthor;
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    if (names.length <= 6) {
      const head = names.slice(0, -1).join(', ');
      return `${head} & ${names[names.length - 1]}`;
    }
    return `${names.slice(0, 6).join(', ')}, ET AL.`;
  }, [translations.noAuthor]);

  const formatAccessDate = React.useCallback(
    (accessedAt?: string, accessParts?: number[]) => {
      const fromParts = () => {
        if (!accessParts || accessParts.length === 0) return undefined;
        const [y, m, d] = accessParts;
        if (!y) return undefined;
        return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
      };

      const date =
        accessedAt && !Number.isNaN(new Date(accessedAt).getTime())
          ? new Date(accessedAt)
          : fromParts();

      if (!date || Number.isNaN(date.getTime())) return undefined;

      return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date);
    },
    [locale]
  );

  const formatReferenceEntry = React.useCallback(
    (item: TCitationElement): { authors: string; rest: string; link?: string } => {
      const title = normalizeTitle(item.title) || translations.untitled;
      const authors = formatAuthors(item.authors || []);
      const year = item.year ?? translations.noDate;

      // Verwende die gemeinsame Utility-Funktion für Link-Generierung
      // Priorität: direkter URL-Link > DOI-Link
      const link = getCitationLink({
        url: item.url,
        doi: item.doi,
        pdfUrl: (item as any).pdfUrl,
      });

      const doiValue = getNormalizedDoi(item.doi);
      const url = item.url || '';

      const accessDate = formatAccessDate(
        item.accessedAt,
        item.accessed?.['date-parts']?.[0]
      );

      const venue =
        item.containerTitle || item.journal || item.collectionTitle || '';
      const publisher = item.publisher || '';
      const volumeIssue = (() => {
        if (!item.volume && !item.issue) return '';
        if (item.volume && item.issue) return `${translations.volume} ${item.volume} (${translations.issue} ${item.issue})`;
        if (item.volume) return `${translations.volume} ${item.volume}`;
        return `${translations.issue} ${item.issue}`;
      })();
      const pages = item.pages || (item as any)?.page || '';
      const identifiers = [
        item.isbn ? `ISBN ${item.isbn}` : '',
        item.issn ? `ISSN ${item.issn}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      const idSegment = doiValue
        ? `DOI: ${doiValue}`
        : url
          ? `URL: ${url}`
          : '';

      const accessSegment =
        url && accessDate ? `${translations.accessedOn} ${accessDate}` : '';

      const detailSegments = [
        venue ? (item.sourceType === 'conference' ? `${translations.in} ${venue}` : venue) : '',
        publisher,
        volumeIssue,
        pages ? `${translations.pages} ${pages}` : '',
        identifiers,
      ]
        .filter(Boolean)
        .join('; ');

      const trailingSegments = [detailSegments, idSegment, accessSegment]
        .filter(Boolean)
        .join('; ');

      const build = (rest: string) => ({
        authors,
        rest: rest.trim(),
        link,
      });

      let baseRest: string;

      switch (citationStyle) {
        case 'mla':
          baseRest = `. "${title}." ${year}.`;
          break;
        case 'chicago':
          baseRest = `. (${year}). ${title}.`;
          break;
        case 'harvard':
          baseRest = ` (${year}). ${title}.`;
          break;
        case 'ieee':
          baseRest = `, "${title}," ${year}`;
          break;
        case 'vancouver': {
          const parts = ['.', `${title}.`, `${year}.`].filter(Boolean);
          baseRest = parts.join(' ');
          break;
        }
        case 'apa':
        default:
          baseRest = ` (${year}). ${title}.`;
      }

      const normalizedBase = baseRest.trim().replace(/\s+/g, ' ');
      const baseWithPeriod = normalizedBase.endsWith('.')
        ? normalizedBase
        : `${normalizedBase}.`;
      const fullRest = trailingSegments
        ? `${baseWithPeriod} ${trailingSegments}${trailingSegments.endsWith('.') ? '' : '.'}`
        : baseWithPeriod;
      return build(fullRest);
    },
    [citationStyle, formatAuthors, formatAccessDate, normalizeTitle, translations]
  );

  const sortKey = React.useCallback(
    (item: TCitationElement) => {
      const authors = item.authors || [];
      const firstAuthor =
        authors[0]?.lastName ||
        authors[0]?.fullName ||
        authors[0]?.firstName ||
        '';
      const title = normalizeTitle(item.title);
      return `${firstAuthor} ${item.year ?? ''} ${title}`.toLowerCase();
    },
    [normalizeTitle]
  );

  const items = useEditorSelector(
    (ed) => {
      const nodes = Array.from(
        ed.api.nodes({
          at: [],
          match: (node) => (node as any).type === 'citation',
        }) as any as Array<[any, Path]>
      );

      const bySource = new Map<string, BibliographyItem>();

      for (const [rawNode, path] of nodes) {
        const candidate = rawNode as any;
        if (!candidate || candidate.type !== 'citation') continue;
        const citation: TCitationElement = {
          type: candidate.type,
          sourceId: candidate.sourceId,
          authors: candidate.authors ?? [],
          year: candidate.year,
          title: candidate.title,
          doi: candidate.doi,
          url: candidate.url,
          sourceType: (candidate as any).sourceType || (candidate as any).kind,
          journal: (candidate as any).journal,
          containerTitle: (candidate as any).containerTitle,
          collectionTitle: (candidate as any).collectionTitle,
          publisher: (candidate as any).publisher,
          volume: (candidate as any).volume,
          issue: (candidate as any).issue,
          pages: (candidate as any).pages || (candidate as any).page,
          isbn: (candidate as any).isbn,
          issn: (candidate as any).issn,
          note: (candidate as any).note,
          accessedAt: (candidate as any).accessedAt,
          accessed: (candidate as any).accessed,
          issued: (candidate as any).issued,
          children: candidate.children ?? [{ text: '' }],
        };
        const sourceId = citation.sourceId || path.join('-');
        if (!bySource.has(sourceId)) {
          bySource.set(sourceId, { data: citation, path });
        }
      }

      return Array.from(bySource.values());
    },
    [citationStyle]
  );

  const bibliographyEntries = React.useMemo(() => {
    if (isExternalStyle && externalEntries) {
      // Nur Reihenfolge beibehalten, Text aus externem Renderer
      return items.map((item, index) => {
        // Verwende die gemeinsame Utility-Funktion für Link-Generierung
        const link = getCitationLink({
          url: item.data.url,
          doi: item.data.doi,
          pdfUrl: (item.data as any).pdfUrl,
        });
        const doiValue = getNormalizedDoi(item.data.doi);
        const url = item.data.url || '';
        const accessDate = formatAccessDate(
          item.data.accessedAt,
          item.data.accessed?.['date-parts']?.[0]
        );
        const baseRest = externalEntries[index] || '';
        const accessAddition =
          url && accessDate ? `${translations.accessedOn} ${accessDate}.` : '';
        const rest = [baseRest, accessAddition]
          .map((part) => part?.trim())
          .filter(Boolean)
          .join(baseRest ? ' ' : '')
          .trim();

        return {
        ...item,
        entry: {
          authors: '',
            rest,
            link,
        },
        sortKey: `${index}`,
        orderIndex: index,
        };
      });
    }

    const base = items.map((item, index) => ({
      ...item,
      entry: formatReferenceEntry(item.data),
      sortKey: sortKey(item.data),
      orderIndex: index,
    }));

    if (citationStyle === 'vancouver') {
      // Vancouver: Reihenfolge der Erwähnung im Text beibehalten
      return base;
    }

    return base.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [
    citationStyle,
    externalEntries,
    formatAccessDate,
    formatReferenceEntry,
    isExternalStyle,
    items,
    sortKey,
    translations,
  ]);

  const signature = React.useMemo(() => {
    if (isExternalStyle && externalEntries) {
      return `${citationStyle}::${externalEntries.join('|')}`;
    }
    return bibliographyEntries
      .map((e, idx) => {
        const prefix = citationStyle === 'vancouver' ? `[${idx + 1}] ` : '';
        const link = e.entry.link ? `::${e.entry.link}` : '';
        return `${e.data.sourceId || e.path.join('-')}::${prefix}${e.entry.authors}${e.entry.rest}${link}`;
      })
      .join('|');
  }, [bibliographyEntries, citationStyle, externalEntries, isExternalStyle]);

  // Externe CSL-Styles via Bibify rendern
  React.useEffect(() => {
    if (!isExternalStyle) {
      setExternalEntries(null);
      return;
    }
    if (items.length === 0) {
      setExternalEntries([]);
      return;
    }

    const run = async () => {
      try {
        const rendered: string[] = [];
        for (const item of items) {
          const authorPersons =
            item.data.authors?.map((a) => ({
              type: 'Person' as const,
              first: a.firstName || a.fullName?.split(' ')?.[0],
              last: a.lastName || a.fullName?.split(' ')?.slice(-1)?.[0],
            })) ?? [];

          const req = {
            style: citationStyle,
            type: 'article-journal',
            title: item.data.title,
            issued: item.data.year ? { 'date-parts': [[item.data.year]] } : undefined,
            date: item.data.year ? String(item.data.year) : undefined,
            URL: item.data.url,
            DOI: item.data.doi,
            authors: authorPersons,
          } as any;

          const res = await citeWithBibify(req);
          rendered.push(res?.[0] ?? '');
        }
        // HTML zu Text vereinfachen
        const stripHtml = (html: string) =>
          html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        setExternalEntries(rendered.map(stripHtml));
      } catch (error) {
        console.error('Bibify render failed', error);
        setExternalEntries([]);
      }
    };

    run();
  }, [citationStyle, isExternalStyle, items]);

  React.useEffect(() => {
    if (prevSignature.current === signature) return;
    prevSignature.current = signature;

    const headingType = editor.getType(KEYS.h1);
    const paragraphType = editor.getType(KEYS.p);

    editor.tf.withoutNormalizing(() => {
      // Entferne bestehende Bibliographie-Blöcke
      const existing = Array.from(
        editor.api.nodes({
          at: [],
          match: (node) => (node as any).bibliography === true,
        })
      ).reverse();

      existing.forEach(([, path]) => {
        editor.tf.removeNodes({ at: path });
      });

      if (items.length === 0) return;

      const bibliographyBlocks = [
        {
          type: headingType,
          bibliography: true,
          bibliographyHeading: true,
          children: [{ text: translations.bibliography }],
        },
        ...bibliographyEntries.map((item, index) => {
          const prefix = citationStyle === 'vancouver' ? `[${index + 1}] ` : '';
          const children: any[] = [
            {
              text: `${prefix}${item.entry.authors}`,
              bold: true,
            },
          ];

          if (item.entry.rest) {
            children.push({
              text: `${item.entry.rest}`,
              bold: false,
            });
          }

          if (item.entry.link) {
            children.push({
              text: ` ${item.entry.link}`,
              italic: true,
              underline: true,
              bold: false,
            });
          }

          return {
            type: paragraphType,
            bibliography: true,
            bibliographyEntry: true,
            children,
          };
        }),
      ];

      editor.tf.insertNodes(bibliographyBlocks, {
        at: [editor.children.length],
        select: false,
      });

      // Cursor ans Dokumentende bewegen, falls wir am Ende waren
    });
  }, [editor, bibliographyEntries, items, signature, translations]);

  // Die sichtbare Ausgabe bleibt leer; die Inhalte werden in den Editor eingefügt.
  return null;
}

