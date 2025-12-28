'use client';

import * as React from 'react';

import {
  normalizeNodeId,
  type Path,
  type TElement,
  type TText,
  type Value,
  KEYS,
  PathApi,
  TextApi,
} from 'platejs';
import type { TEquationElement } from '@platejs/utils';
import { SuggestionPlugin } from '@platejs/suggestion/react';
import { Plate, type PlateEditor, usePlateEditor, usePluginOption, usePlateState } from 'platejs/react';

import { EditorKit } from '@/components/editor/editor-kit';
import { SourceSearchDialog, type Source } from '@/components/citations/source-search-dialog';
import { EditorBibliography } from '@/components/ui/editor-bibliography';
import { CommentTocSidebar } from '@/components/ui/comment-toc';
import { EditorTocSidebar } from '@/components/ui/editor-toc';
import { SuggestionTocSidebar } from '@/components/ui/suggestion-toc';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { EditorStatusBar } from '@/components/ui/editor-status-bar';
import { ConditionalFixedToolbar } from '@/components/ui/conditional-fixed-toolbar';
import { useCitationStore } from '@/lib/stores/citation-store';
import { insertCitationWithMerge } from '@/components/editor/utils/insert-citation-with-merge';
import { getCitationLink, getNormalizedDoi } from '@/lib/citations/link-utils';
import { extractTitleFromContent, extractTextFromNode } from '@/lib/supabase/utils/document-title';
import { getCurrentUserId } from '@/lib/supabase/utils/auth';
import * as documentsUtils from '@/lib/supabase/utils/documents';
import {
  type TDiscussion,
  discussionPlugin,
} from '@/components/editor/plugins/discussion-kit';
import { commentPlugin } from '@/components/editor/plugins/comment-kit';
import { suggestionPlugin } from '@/components/editor/plugins/suggestion-kit';

export function PlateEditor({
  showToc = true,
  showCommentToc = true,
  showSuggestionToc = true,
  storageId = 'default',
}: {
  showToc?: boolean;
  showCommentToc?: boolean;
  showSuggestionToc?: boolean;
  storageId?: string;
}) {
  const hasHydrated = React.useRef(false);
  const discussionsApplied = React.useRef(false);
  const latestContentRef = React.useRef<Value>(DEFAULT_VALUE);
  const contentSaveTimeout = React.useRef<number | ReturnType<typeof setTimeout> | null>(null);
  const discussionsSaveTimeout = React.useRef<number | ReturnType<typeof setTimeout> | null>(null);
  const topToolbarRef = React.useRef<HTMLDivElement | null>(null);
  const bottomToolbarRef = React.useRef<HTMLDivElement | null>(null);
  const [toolbarHeights, setToolbarHeights] = React.useState({ top: 0, bottom: 0 });
  const storageKeys = React.useMemo(
    () => ({
      content: `${LOCAL_STORAGE_KEY_PREFIX}-${storageId}`,
      discussions: `${LOCAL_STORAGE_DISCUSSIONS_KEY_PREFIX}-${storageId}`,
      state: `${LOCAL_STORAGE_STATE_PREFIX}-${storageId}`,
      legacyContent: LOCAL_STORAGE_KEY_LEGACY,
      legacyDiscussions: LOCAL_STORAGE_DISCUSSIONS_KEY_LEGACY,
    }),
    [storageId]
  );
  const editor = usePlateEditor({
    plugins: EditorKit,
    value: DEFAULT_VALUE,
  });
  const addCitation = useCitationStore((state) => state.addCitation);
  const pendingCitation = useCitationStore((state) => state.pendingCitation);
  const setPendingCitation = useCitationStore((state) => state.setPendingCitation);

  // Editor-Instance für Text-Einfügung verfügbar machen
  React.useEffect(() => {
    if (typeof window === 'undefined' || !editor) return;

    const handleGetEditorInstance = (event: CustomEvent) => {
      const callback = event.detail?.callback;
      if (typeof callback === 'function') {
        callback(editor);
      }
    };

    window.addEventListener('get-editor-instance', handleGetEditorInstance as EventListener);

    return () => {
      window.removeEventListener('get-editor-instance', handleGetEditorInstance as EventListener);
    };
  }, [editor]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !editor || hasHydrated.current) return;

    const loadContent = async () => {
      // Versuche zuerst aus Supabase zu laden, wenn storageId eine UUID ist (Supabase-Dokument)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storageId);
      let content: Value | null = null;
      let discussions: TDiscussion[] | null = null;

      if (isUUID) {
        try {
          const userId = await getCurrentUserId();
          if (userId) {
            const doc = await documentsUtils.getDocumentById(storageId, userId);
            if (doc && doc.content) {
              const normalizedContent = normalizeNodeId(doc.content as Value);
              // Prüfe ob Content tatsächlich Text enthält
              const hasContent = extractTextFromNode(normalizedContent).trim().length > 0;
              if (hasContent) {
                content = normalizedContent;
                // Discussions werden aktuell nicht in Supabase gespeichert, daher aus localStorage laden
                const localData = loadPersistedState(storageKeys);
                discussions = localData.discussions;
              }
            }
          }
        } catch (error) {
          console.error('Fehler beim Laden des Dokuments aus Supabase:', error);
          // Fallback auf localStorage
          const localData = loadPersistedState(storageKeys);
          content = localData.content;
          discussions = localData.discussions;
        }
      }

      // Wenn kein Content aus Supabase geladen wurde, lade aus localStorage
      if (!content) {
        const localData = loadPersistedState(storageKeys);
        content = localData.content;
        discussions = localData.discussions;
        
        // Prüfe ob localStorage-Content tatsächlich Text enthält
        if (content) {
          const hasContent = extractTextFromNode(content).trim().length > 0;
          if (!hasContent) {
            content = null; // Verwende DEFAULT_VALUE wenn kein Content vorhanden
          }
        }
      }

      // Verwende Content oder DEFAULT_VALUE
      const finalContent = content || DEFAULT_VALUE;
      (editor as any).tf.setValue?.(finalContent);
      latestContentRef.current = finalContent;
      (editor as any).tf.redecorate?.();
      // stelle Anker für Kommentare/Vorschläge sofort wieder her
      syncCommentPathMap(editor);
      syncSuggestionPathMap(editor);

      if (discussions) {
        editor.setOption(discussionPlugin, 'discussions', discussions);
        syncCommentPathMap(editor);
        syncSuggestionPathMap(editor);
        (editor as any).tf.redecorate?.();
        discussionsApplied.current = true;
      }

      hasHydrated.current = true;
    };

    loadContent();
  }, [editor, storageKeys, storageId]);

  const handleChange = React.useCallback(
    ({ value: nextValue }: { value: Value }) => {
      if (typeof window === 'undefined' || !hasHydrated.current) return;

      autoConvertLatexBlocks(editor);

      latestContentRef.current = nextValue;
      if (contentSaveTimeout.current) {
        window.clearTimeout(contentSaveTimeout.current);
      }

      try {
        contentSaveTimeout.current = window.setTimeout(() => {
          persistState(storageKeys, latestContentRef.current, null, storageId);
        }, SAVE_DEBOUNCE_MS);
      } catch (error) {
        console.error('Editorinhalt konnte nicht gespeichert werden.', error);
      }
    },
    [editor, storageKeys, storageId]
  );

  React.useEffect(() => {
    return () => {
      if (contentSaveTimeout.current && hasHydrated.current) {
        window.clearTimeout(contentSaveTimeout.current);
        try {
          persistState(storageKeys, latestContentRef.current, null, storageId);
        } catch {
          // ignore on unmount
        }
      }
    };
  }, [storageKeys, storageId]);

  React.useEffect(() => {
    if (!pendingCitation || !editor) return;

    const authors =
      pendingCitation.authors?.map((name) => ({ fullName: name })) ?? [];

    insertCitationWithMerge(editor, {
      sourceId: pendingCitation.id,
      authors,
      year: pendingCitation.year
        ? Number.isNaN(Number(pendingCitation.year))
          ? undefined
          : Number(pendingCitation.year)
        : undefined,
      title: pendingCitation.title,
      doi: pendingCitation.doi,
      url: pendingCitation.externalUrl,
      accessedAt: pendingCitation.externalUrl
        ? new Date().toISOString()
        : undefined,
      children: [{ text: '' }],
    });

    setPendingCitation(undefined);
  }, [pendingCitation, editor, setPendingCitation]);

  React.useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    const measure = () => {
      const top = topToolbarRef.current?.getBoundingClientRect().height ?? 0;
      const bottom = bottomToolbarRef.current?.getBoundingClientRect().height ?? 0;
      setToolbarHeights({ top, bottom });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const toolbarVars = React.useMemo(
    () =>
      ({
        '--top-toolbar-height': `${toolbarHeights.top}px`,
        '--bottom-toolbar-height': `${toolbarHeights.bottom}px`,
      }) as React.CSSProperties,
    [toolbarHeights.bottom, toolbarHeights.top]
  );

  return (
    <Plate editor={editor} onChange={handleChange}>
      <DiscussionPersistence
        discussionsSaveTimeout={discussionsSaveTimeout}
        storageKeys={storageKeys}
        storageId={storageId}
      />
      <div className="flex h-full items-start gap-6">
        <CommentTocSidebar visible={showCommentToc}  className="overflow-auto max-h-[40vh]" />
        <SuggestionTocSidebar
          visible={showSuggestionToc}
          className="top-[45vh]"
        />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="flex h-full flex-col min-h-0">
            <ConditionalFixedToolbar toolbarRef={topToolbarRef} />
            <div className="flex-1 min-h-0 overflow-hidden">
              <EditorContainer
                className="overflow-y-auto h-full"
                style={toolbarVars}
              >
                <Editor variant="demo" className="overflow-y-auto"/>
                <EditorBibliography />
              </EditorContainer>
            </div>
            <div ref={bottomToolbarRef}>
              <EditorStatusBar />
            </div>
          </div>
        </div>

        <EditorTocSidebar visible={showToc} />
      </div>

      <SourceSearchDialog
        showTrigger={false}
        onImport={(source: Source) => {
          const title =
            typeof source.title === 'string'
              ? source.title
              : source.title?.title || 'Unbenanntes Zitat'

          const sourceLabel =
            (typeof source.journal === 'string' && source.journal) ||
            (typeof source.publisher === 'string' && source.publisher) ||
            source.sourceApi ||
            'Quelle'

          // Verwende die gemeinsame Utility-Funktion für Link-Generierung
          // Priorität: direkter URL-Link > PDF-URL > DOI-Link
          const externalUrl = getCitationLink({
            url: source.url,
            doi: source.doi,
            pdfUrl: source.pdfUrl,
          });
          const validDoi = getNormalizedDoi(source.doi);

          const authors =
            source.authors?.map((a) => a.fullName || [a.firstName, a.lastName].filter(Boolean).join(' ')).filter(Boolean) ?? []

          const timestamp =
            typeof window !== 'undefined'
              ? `hinzugefügt am ${new Date().toLocaleDateString('de-DE', { dateStyle: 'short' })}`
              : 'soeben'

          addCitation({
            id: source.id || `${Date.now()}`,
            title,
            source: sourceLabel,
            year: source.publicationYear,
            lastEdited: timestamp,
            href: externalUrl || '/editor',
            externalUrl,
            doi: validDoi || undefined,
            authors,
            abstract:
              (typeof (source as any).abstract === 'string' && (source as any).abstract) ||
              (typeof (source as any).description === 'string' && (source as any).description) ||
              undefined,
          })
        }}
      />
    </Plate>
  );
}

const LOCAL_STORAGE_KEY_PREFIX = 'plate-editor-content';
const LOCAL_STORAGE_DISCUSSIONS_KEY_PREFIX = 'plate-editor-discussions';
const LOCAL_STORAGE_STATE_PREFIX = 'plate-editor-state';
const LOCAL_STORAGE_KEY_LEGACY = 'plate-editor-content';
const LOCAL_STORAGE_DISCUSSIONS_KEY_LEGACY = 'plate-editor-discussions';
const SAVE_DEBOUNCE_MS = 400;
const DEFAULT_VALUE = normalizeNodeId([{ type: 'p', children: [{ text: '' }] }]);
const LATEX_MARKERS = [
  '\\frac',
  '\\hat',
  '\\bar',
  '\\vec',
  '\\sum',
  '\\int',
  '\\beta',
  '\\alpha',
  '\\gamma',
  '\\delta',
  '\\varepsilon',
  '\\epsilon',
  '\\lambda',
  '\\mu',
  '\\pi',
  '\\sigma',
  '\\phi',
  '\\psi',
  '\\omega',
  '\\top',
  '\\binom',
  '\\choose',
  '\\sqrt',
  '\\cdot',
  '\\times',
  '\\div',
  '\\pm',
  '\\mp',
  '\\leq',
  '\\geq',
  '\\neq',
  '\\approx',
  '\\equiv',
  '\\in',
  '\\notin',
  '\\subset',
  '\\supset',
  '\\cup',
  '\\cap',
  '\\forall',
  '\\exists',
  '\\infty',
  '\\partial',
  '\\nabla',
  '\\prod',
  '\\lim',
  '^',
  '_',
  // Unicode mathematische Symbole
  'Σ', // Summe
  '∑', // Summe (alternativ)
  'Π', // Produkt
  '∏', // Produkt (alternativ)
  '∫', // Integral
  '√', // Wurzel
  '∞', // Unendlich
  '±', // Plus-Minus
  '≤', // Kleiner-gleich
  '≥', // Größer-gleich
  '≠', // Ungleich
  '≈', // Ungefähr gleich
  '∈', // Element von
  '∉', // Nicht Element von
  '⊂', // Teilmenge
  '⊃', // Obermenge
  '∪', // Vereinigung
  '∩', // Schnitt
  '∀', // Für alle
  '∃', // Existiert
  '∂', // Partielle Ableitung
  '∇', // Nabla
  'α', // Alpha
  'β', // Beta
  'γ', // Gamma
  'δ', // Delta
  'ε', // Epsilon
  'λ', // Lambda
  'μ', // Mu
  'π', // Pi
  'σ', // Sigma
  'φ', // Phi
  'ψ', // Psi
  'ω', // Omega
];

/**
 * Konvertiert automatisch LaTeX-Formeln im Editor zu Equation-Elementen.
 * 
 * Diese Funktion erkennt:
 * - Formeln mit $$ Delimitern
 * - Formeln mit LaTeX-Markern (z.B. \sum, \int, etc.)
 * - Formeln mit mathematischen Mustern (Exponenten, Indizes, etc.)
 * - Unicode-Mathematik-Symbole (Σ, ∫, √, etc.)
 * - Deutsche Begriffe wie "(n über k)" oder "für k = 0 bis n"
 * 
 * Die erkannten Formeln werden automatisch normalisiert und als Equation-Elemente eingefügt,
 * die dann mit MathLive oder der LaTeX-Textarea bearbeitet werden können.
 */
function autoConvertLatexBlocks(editor: PlateEditor | null) {
  if (!editor) return;

  const paragraphType = editor.getType(KEYS.p);
  const equationType = editor.getType(KEYS.equation);
  const inlineEquationType = editor.getType(KEYS.inlineEquation);
  const codeBlockType = editor.getType(KEYS.codeBlock);

  const entries = editor.api.blocks({ mode: 'lowest' });

  let changed = false;

  editor.tf.withoutNormalizing(() => {
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const [node, path] = entries[i];

      if (node.type === codeBlockType) continue;
      if (node.type === equationType) continue; // Bereits eine Formel, überspringen
      if (node.type === inlineEquationType) continue; // Bereits eine Inline-Formel, überspringen

      const inlineEquationTex = extractBlockTexFromInlineEquation(
        node as TElement,
        inlineEquationType
      );
      const text = editor.api.string(path as any);
      
      // Prüfe zuerst, ob der gesamte Block eine Block-Formel ist ($$...$$ am Anfang und Ende)
      const blockFormulaTex = extractBlockFormulaFromDelimiters(text.trim());
      
      if (blockFormulaTex) {
        // Gesamter Block ist eine Block-Formel
        editor.tf.removeNodes({ at: path as any } as any);
        editor.tf.insertNodes(
          { type: equationType, texExpression: blockFormulaTex, children: [{ text: '' }] } as any,
          { at: path as any, select: false } as any
        );
        changed = true;
        continue;
      }

      if (inlineEquationTex) {
        // Alte Logik für Inline-Formeln die zu Block-Formeln konvertiert werden sollen
        editor.tf.removeNodes({ at: path as any } as any);
        editor.tf.insertNodes(
          { type: equationType, texExpression: inlineEquationTex, children: [{ text: '' }] } as any,
          { at: path as any, select: false } as any
        );
        changed = true;
        continue;
      }

      // Teile den Text in Segmente auf (Text, Inline-Formeln, Block-Formeln)
      const segments = splitBlockIntoSegments(text);
      
      // Prüfe ob überhaupt Formeln gefunden wurden
      const hasFormulas = segments.some(
        (seg) => seg.type === 'inlineFormula' || seg.type === 'blockFormula'
      );

      if (!hasFormulas) {
        // Keine Formeln mit Delimitern oder eckigen Klammern gefunden
        // Prüfe auf mathematische Muster ohne Delimiter, aber nur wenn eindeutige mathematische Symbole vorhanden sind
        const trimmedText = text.trim();
        const hasLatexMarkers = containsLatexMarkers(trimmedText);
        const hasUnicodeMathSymbols = /[Σ∑Π∏∫√∞±≤≥≠≈∈∉⊂⊃∪∩∀∃∂∇αβγδελμπσφψω]/.test(trimmedText);
        const hasLatexCommands = /\\[a-zA-Z]+/.test(trimmedText);
        const hasSubSuperscripts = /[^_]\^|_[^_]/.test(trimmedText);
        
        // Nur konvertieren wenn eindeutige mathematische Indikatoren vorhanden sind
        // (LaTeX-Befehle, Unicode-Mathematik-Symbole, oder Sub/Superscripts)
        // UND keine deutschen Wörter enthalten sind
        const hasGermanWords = /\b(und|oder|sowie|aber|jedoch|denn|weil|da|wenn|falls|obwohl|trotz|für|gegen|mit|ohne|von|zu|auf|in|an|über|unter|vor|nach|bei|durch|seit|bis|während|innerhalb|außerhalb|vor|nachteile|vorteile|nachteil|vorteil)\b/i.test(trimmedText);
        
        if ((hasLatexMarkers || hasUnicodeMathSymbols || hasLatexCommands || hasSubSuperscripts) && !hasGermanWords) {
          // Zusätzliche Prüfung: Sollte wirklich wie eine Formel aussehen
          const looksLikeMath = looksLikeMathFormula(trimmedText);
          
          if (looksLikeMath) {
            let tex = stripOuterSquareBrackets(trimmedText);
            if (!tex) tex = trimmedText;
            
            const normalizedTex = normalizeMathFormula(tex);
            editor.tf.removeNodes({ at: path as any } as any);
            editor.tf.insertNodes(
              { type: equationType, texExpression: normalizedTex, children: [{ text: '' }] } as any,
              { at: path as any, select: false } as any
            );
            changed = true;
          }
        }
        continue;
      }

      // Formeln gefunden - erstelle Nodes basierend auf Segmenten
      const nodesToInsert: any[] = [];
      let currentParagraphChildren: any[] = [];
      let hasCurrentParagraph = false;

      for (const segment of segments) {
        if (segment.type === 'blockFormula') {
          // Block-Formel: Beende aktuellen Paragraph (falls vorhanden) und füge Block-Formel ein
          if (hasCurrentParagraph && currentParagraphChildren.length > 0) {
            nodesToInsert.push({
              type: paragraphType,
              children: currentParagraphChildren,
            });
            currentParagraphChildren = [];
            hasCurrentParagraph = false;
          }
          
          // Normalisiere die Formel
          const normalizedTex = normalizeMathFormula(segment.content);
          nodesToInsert.push({
            type: equationType,
            texExpression: normalizedTex,
            children: [{ text: '' }],
          });
        } else if (segment.type === 'inlineFormula') {
          // Inline-Formel: Füge zu aktuellen Paragraph-Children hinzu
          if (!hasCurrentParagraph) {
            hasCurrentParagraph = true;
          }
          
          // Die Inline-Formel selbst
          const normalizedTex = normalizeMathFormula(segment.content);
          currentParagraphChildren.push({
            type: inlineEquationType,
            texExpression: normalizedTex,
            children: [{ text: '' }],
          });
        } else {
          // Text-Segment: Füge zu aktuellen Paragraph-Children hinzu
          if (!hasCurrentParagraph) {
            hasCurrentParagraph = true;
          }
          
          // Füge Text hinzu (auch wenn leer, um Struktur zu erhalten)
          if (segment.content.length > 0) {
            currentParagraphChildren.push({ text: segment.content });
          }
        }
      }

      // Füge letzten Paragraph hinzu (falls vorhanden)
      if (hasCurrentParagraph && currentParagraphChildren.length > 0) {
        nodesToInsert.push({
          type: paragraphType,
          children: currentParagraphChildren,
        });
      }

      // Ersetze den alten Block durch die neuen Nodes
      if (nodesToInsert.length > 0) {
        editor.tf.removeNodes({ at: path as any } as any);
        
        // Füge alle Nodes in der richtigen Reihenfolge ein
        // Plate passt die Paths automatisch an
        for (let j = 0; j < nodesToInsert.length; j++) {
          const insertPath = j === 0 
            ? path 
            : (() => {
                // Berechne Path für nachfolgende Nodes
                const basePath = [...path];
                const baseIndex = basePath[basePath.length - 1] as number;
                basePath[basePath.length - 1] = baseIndex + j;
                return basePath;
              })();
          
          editor.tf.insertNodes(nodesToInsert[j] as any, { 
            at: insertPath as any, 
            select: false 
          } as any);
        }
        
        changed = true;
      }
    }
  });

  if (changed && typeof (editor as any).tf?.redecorate === 'function') {
    (editor as any).tf.redecorate();
    if (editor.selection) {
      (editor as any).tf.setSelection(editor.selection);
    }
  }
}

function containsLatexMarkers(text: string) {
  return LATEX_MARKERS.some((marker) => text.includes(marker));
}

/**
 * Erkennt mathematische Formeln anhand von Mustern wie Exponenten, Indizes, etc.
 * Auch wenn sie deutschen Text enthalten.
 * 
 * WICHTIG: Diese Funktion muss sehr präzise sein, um falsch-positive Erkennungen
 * bei normalem Text (z.B. Inhaltsverzeichnisse, Listen) zu vermeiden.
 */
function looksLikeMathFormula(text: string): boolean {
  // Ausschlusskriterien: Wenn der Text diese Muster enthält, ist es KEINE Formel
  const exclusionPatterns = [
    /^\d+\.\s*[A-ZÄÖÜ]/, // Nummerierte Listen wie "9. Anhang", "1. Einleitung"
    /\n\d+\.\d+\./, // Mehrstufige Nummerierungen wie "9.1. Mapping"
    /\n\d+\.\d+\.\d+\./, // Dreistufige Nummerierungen
    /^[A-ZÄÖÜ][a-zäöüß]+\s*$/, // Einzelne Wörter (Titel, Überschriften)
    /^[A-ZÄÖÜ][a-zäöüß]+\s*\n/, // Überschriften mit Zeilenumbruch
    /\d+\.\s*[A-ZÄÖÜ][a-zäöüß]+\s*\n/, // Nummerierte Überschriften
    /[A-ZÄÖÜ][a-zäöüß]+\s*-\s*[A-ZÄÖÜ][a-zäöüß]+/, // Bindestrich-Titel wie "Mapping - Tabelle"
    /[A-ZÄÖÜ][a-zäöüß]+\s*-\s*und\s+[A-ZÄÖÜ][a-zäöüß]+/i, // "Vor - und Nachteile" Pattern
    /\b(und|oder|sowie|sowie auch|aber|jedoch|denn|weil|da|wenn|falls|obwohl|trotz|für|gegen|mit|ohne|von|zu|auf|in|an|über|unter|vor|nach|bei|durch|seit|bis|während|innerhalb|außerhalb)\b/i, // Deutsche Konjunktionen/Präpositionen
    /\n.*\n.*\n/, // Mehrere Zeilen (wahrscheinlich strukturierter Text, keine Formel)
  ];

  // Wenn ein Ausschlussmuster zutrifft, ist es definitiv keine Formel
  if (exclusionPatterns.some((pattern) => pattern.test(text))) {
    return false;
  }

  // Prüfe auf echte mathematische Muster (präziser als vorher)
  // WICHTIG: Diese Muster werden nur verwendet, wenn der Text bereits als potenzielle Formel markiert ist
  // (z.B. in eckigen Klammern). Für normale Texte ohne Delimiter werden sie NICHT verwendet.
  const mathPatterns = [
    /\^[0-9a-zA-Z()+\-]/, // Exponenten wie x^2, (x+y)^n
    /_[0-9a-zA-Z()+\-]/, // Indizes wie x_1, a_n
    // Verbesserte Variablen-Operator-Erkennung: Ignoriere deutsche Wörter
    /(?:^|[^a-zäöü])([a-z])\s*[+\-×÷=<>≤≥≠≈]\s*([a-z0-9])(?![a-zäöü])/i, // Variablen mit Operatoren, aber nicht deutsche Wörter
    /\([^)]+\^[^)]+\)/, // Klammern mit Exponenten
    /Σ|∑|∫|√|∞|±|≤|≥|≠|≈|∈|∉|⊂|⊃|∪|∩|∀|∃/, // Unicode mathematische Symbole
    // Präzisere Zahl-Operator-Muster: nur wenn es wirklich wie eine Formel aussieht
    /[0-9]+\s*[+\-×÷]\s*[0-9]+/, // Zahlen mit Operatoren dazwischen (z.B. "2 + 3", nicht "9. Anhang")
    /[0-9]+\s*=\s*[0-9]+/, // Gleichungen wie "x = 5"
    /[0-9]+\s*[<>≤≥≠≈]\s*[0-9]+/, // Ungleichungen
  ];
  
  // Zusätzliche Prüfung: Wenn der Text deutsche Wörter enthält, ist es wahrscheinlich kein mathematischer Ausdruck
  const germanWordPattern = /\b(und|oder|sowie|aber|jedoch|denn|weil|da|wenn|falls|obwohl|trotz|für|gegen|mit|ohne|von|zu|auf|in|an|über|unter|vor|nach|bei|durch|seit|bis|während|innerhalb|außerhalb|vor|nachteile|vorteile|nachteil|vorteil)\b/i;
  if (germanWordPattern.test(text)) {
    return false; // Enthält deutsche Wörter = wahrscheinlich kein mathematischer Ausdruck
  }

  // Zähle mathematische Muster
  const mathPatternCount = mathPatterns.filter((pattern) => pattern.test(text)).length;
  
  // Wenn mindestens 2 mathematische Muster gefunden wurden, ist es wahrscheinlich eine Formel
  if (mathPatternCount >= 2) return true;
  
  // Wenn ein mathematisches Muster gefunden wurde UND der Text relativ kurz ist
  // UND keine typischen Textstrukturen enthält, ist es wahrscheinlich eine Formel
  if (mathPatternCount >= 1 && text.length < 200) {
    // Zusätzliche Prüfung: Wenn der Text viele Leerzeichen oder Zeilenumbrüche hat,
    // ist es wahrscheinlich strukturierter Text, keine Formel
    const whitespaceRatio = (text.match(/\s/g) || []).length / text.length;
    if (whitespaceRatio > 0.3) return false; // Zu viele Leerzeichen = wahrscheinlich Text
    
    return true;
  }
  
  return false;
}

/**
 * Konvertiert mathematische Formeln mit Unicode-Symbolen oder deutschen Begriffen zu korrektem LaTeX.
 * Beispiel: "Σ (n über k)" wird zu "\sum_{k=0}^{n} \binom{n}{k}"
 * 
 * Diese Funktion wird verwendet, um Formeln automatisch zu normalisieren, die im Editor eingegeben werden.
 * MathLive (verfügbar im Equation-Editor) generiert bereits korrektes LaTeX, aber diese Funktion
 * hilft bei der Konvertierung von manuell eingegebenen Formeln mit Unicode-Symbolen oder deutschen Begriffen.
 */
function normalizeMathFormula(text: string): string {
  let normalized = text;
  
  // Entferne deutschen Text am Ende (z.B. "für k = 0 bis n")
  normalized = normalized.replace(/\s+für\s+[^.]*\.?$/i, '');
  normalized = normalized.replace(/\s+where\s+[^.]*\.?$/i, '');
  
  // Konvertiere Unicode-Symbole zu LaTeX
  const unicodeToLatex: Record<string, string> = {
    'Σ': '\\sum',
    '∑': '\\sum',
    'Π': '\\prod',
    '∏': '\\prod',
    '∫': '\\int',
    '√': '\\sqrt',
    '∞': '\\infty',
    '±': '\\pm',
    '≤': '\\leq',
    '≥': '\\geq',
    '≠': '\\neq',
    '≈': '\\approx',
    '∈': '\\in',
    '∉': '\\notin',
    '⊂': '\\subset',
    '⊃': '\\supset',
    '∪': '\\cup',
    '∩': '\\cap',
    '∀': '\\forall',
    '∃': '\\exists',
    '∂': '\\partial',
    '∇': '\\nabla',
  };
  
  // Ersetze Unicode-Symbole
  for (const [unicode, latex] of Object.entries(unicodeToLatex)) {
    normalized = normalized.replace(new RegExp(unicode, 'g'), latex);
  }
  
  // Konvertiere "(n über k)" zu "\binom{n}{k}"
  normalized = normalized.replace(/\((\w+)\s+über\s+(\w+)\)/gi, '\\binom{$1}{$2}');
  normalized = normalized.replace(/\((\w+)\s+choose\s+(\w+)\)/gi, '\\binom{$1}{$2}');
  
  // Konvertiere "für k = 0 bis n" zu Summationsgrenzen
  // Suche nach "für k = 0 bis n" im Originaltext
  const rangeMatch = text.match(/für\s+(\w+)\s*=\s*(\d+)\s+bis\s+(\w+)/i);
  if (rangeMatch) {
    const [, varName, start, end] = rangeMatch;
    // Ersetze "\sum" oder "Σ" gefolgt von optionalen Leerzeichen und Klammern
    // durch "\sum_{varName=start}^{end}"
    normalized = normalized.replace(
      /(\\sum|Σ|∑)\s*(\([^)]*\))?/g,
      `\\sum_{${varName}=${start}}^{${end}}`
    );
  } else {
    // Wenn keine expliziten Grenzen vorhanden sind, aber "\sum" vorhanden ist,
    // füge Standard-Grenzen hinzu (falls noch nicht vorhanden)
    if (normalized.includes('\\sum') && !normalized.includes('\\sum_{')) {
      // Versuche, Grenzen aus dem Kontext zu extrahieren
      const defaultRangeMatch = text.match(/k\s*=\s*(\d+)\s+bis\s+(\w+)/i);
      if (defaultRangeMatch) {
        const [, start, end] = defaultRangeMatch;
        normalized = normalized.replace(/\\sum\s*/g, `\\sum_{k=${start}}^{${end}} `);
      }
    }
  }
  
  // Verbessere Exponenten- und Index-Formatierung
  // Ersetze Leerzeichen in Exponenten/Indizes und füge geschweifte Klammern hinzu
  normalized = normalized.replace(/\^(\s*)([^\s^{}]+)(\s*)/g, (match, before, content, after) => {
    // Wenn bereits geschweifte Klammern vorhanden sind, belasse sie
    if (content.includes('{') && content.includes('}')) return match;
    return `^{${content.trim()}}`;
  });
  normalized = normalized.replace(/_(\s*)([^\s_{}]+)(\s*)/g, (match, before, content, after) => {
    // Wenn bereits geschweifte Klammern vorhanden sind, belasse sie
    if (content.includes('{') && content.includes('}')) return match;
    return `_{${content.trim()}}`;
  });
  
  // Entferne überflüssige Leerzeichen um Operatoren
  normalized = normalized.replace(/\s*=\s*/g, ' = ');
  normalized = normalized.replace(/\s*\+\s*/g, ' + ');
  normalized = normalized.replace(/\s*-\s*/g, ' - ');
  
  // Korrigiere komplexe Summationsbedingungen für Multinomial-Formeln
  // KaTeX hat Probleme mit Summationsbedingungen wie k_1+k_2+\cdots+k_m=n
  // Lösung: Verwende \underset für die Bedingung oder entferne sie und verwende eine kompaktere Notation
  // Für Multinomial-Formeln: Ersetze durch eine funktionierende Alternative
  if (normalized.includes('\\sum_{k_1+k_2+\\cdots+k_m=n}')) {
    // Verwende \underset um die Bedingung unter die Summe zu setzen
    // Format: \sum\underset{k_1+k_2+\cdots+k_m=n}{\sum}
    // Oder einfacher: Entferne die komplexe Bedingung und verwende \sum\limits
    normalized = normalized.replace(
      /\\sum_\{k_1\+k_2\+\\cdots\+k_m=n\}/g,
      '\\sum\\limits'
    );
    // Füge die Bedingung als Text unter der Summe hinzu (optional)
    // normalized = normalized.replace(/\\sum\\limits/g, '\\sum\\limits_{\\text{über alle }k_1+\\cdots+k_m=n}');
  }
  
  // Allgemeinere Korrektur: Ersetze komplexe Summationsbedingungen durch \sum\limits
  normalized = normalized.replace(
    /\\sum_\{[a-z_]\d+\+[a-z_]\d+\+\\cdots\+[a-z_]\d+=[a-z0-9]+\}/g,
    '\\sum\\limits'
  );
  
  return normalized.trim();
}

function extractBlockTexFromInlineEquation(node: TElement, inlineEquationType: string) {
  const children = (node as any).children as (TElement | TText)[] | undefined;
  if (!children || children.length !== 1) return null;

  const child = children[0] as TElement & Partial<TEquationElement>;
  if (child.type !== inlineEquationType) return null;

  const tex = (child.texExpression ?? '').trim();
  if (!tex) return null;

  return extractBlockTexFromDelimiters(tex);
}

/**
 * Erkennt `$...$` Delimiter und extrahiert Inline-Formel-Content.
 * Die Funktion sucht nach einzelnen Dollar-Zeichen, die nicht Teil von `$$` sind.
 */
function extractInlineFormulaFromDelimiters(text: string): string | null {
  // Suche nach $...$ Pattern, aber nicht $$...$$
  // Verwende einen einfacheren Ansatz ohne Lookbehinds für bessere Kompatibilität
  let searchPos = 0;
  
  while (searchPos < text.length) {
    const dollarIndex = text.indexOf('$', searchPos);
    if (dollarIndex === -1) break;
    
    // Prüfe ob es Teil von $$ ist
    if (dollarIndex < text.length - 1 && text[dollarIndex + 1] === '$') {
      searchPos = dollarIndex + 2;
      continue;
    }
    
    // Finde das schließende $
    const closingDollarIndex = text.indexOf('$', dollarIndex + 1);
    if (closingDollarIndex === -1) break;
    
    // Prüfe ob das schließende $ nicht Teil von $$ ist
    if (closingDollarIndex < text.length - 1 && text[closingDollarIndex + 1] === '$') {
      searchPos = closingDollarIndex + 1;
      continue;
    }
    
    // Wir haben eine gültige $...$ Inline-Formel gefunden
    const inner = text.slice(dollarIndex + 1, closingDollarIndex).trim();
    if (inner.length > 0) {
      return inner;
    }
    
    searchPos = closingDollarIndex + 1;
  }
  
  return null;
}

/**
 * Erkennt `$$...$$` Delimiter und extrahiert Block-Formel-Content.
 * Ersetzt die alte `extractBlockTexFromDelimiters` Funktion.
 */
function extractBlockFormulaFromDelimiters(text: string): string | null {
  // Prüfe ob der gesamte Text mit $$ beginnt und endet
  const trimmed = text.trim();
  if (!trimmed.startsWith('$$') || !trimmed.endsWith('$$')) return null;
  
  // Stelle sicher, dass es nicht nur $$ ist
  if (trimmed.length <= 4) return null;
  
  const inner = trimmed.slice(2, -2).trim();
  return inner.length > 0 ? inner : null;
}

/**
 * Alte Funktion für Rückwärtskompatibilität - verwendet jetzt extractBlockFormulaFromDelimiters
 * @deprecated Verwende extractBlockFormulaFromDelimiters
 */
function extractBlockTexFromDelimiters(text: string) {
  return extractBlockFormulaFromDelimiters(text);
}

type FormulaSegment = {
  type: 'text' | 'inlineFormula' | 'blockFormula';
  content: string;
  start: number;
  end: number;
};

/**
 * Prüft ob ein Text in eckigen Klammern mathematische Inhalte enthält.
 */
function isMathInSquareBrackets(content: string): boolean {
  const trimmed = content.trim();
  if (trimmed.length === 0) return false;
  
  // Prüfe auf LaTeX-Marker oder mathematische Symbole
  const hasLatexMarkers = containsLatexMarkers(trimmed);
  const hasMathSymbols = /[Σ∑Π∏∫√∞±≤≥≠≈∈∉⊂⊃∪∩∀∃∂∇αβγδελμπσφψω]/.test(trimmed);
  const hasLatexCommands = /\\[a-zA-Z]+/.test(trimmed);
  const hasMathOperators = /[+\-×÷=<>≤≥≠≈]/.test(trimmed);
  const hasSubSuperscripts = /[^_]\^|_[^_]/.test(trimmed);
  
  // Wenn mindestens 2 mathematische Indikatoren vorhanden sind, ist es wahrscheinlich eine Formel
  const indicators = [hasLatexMarkers, hasMathSymbols, hasLatexCommands, hasMathOperators, hasSubSuperscripts].filter(Boolean).length;
  
  return indicators >= 2 || (hasLatexCommands && hasMathOperators);
}

/**
 * Findet alle Formel-Teile im Text (sowohl `$...$`, `$$...$$` als auch `[...]` mit mathematischen Inhalten).
 * Gibt ein Array von Segmenten zurück mit Typ, Inhalt und Positionen.
 */
function extractFormulaSegments(text: string): FormulaSegment[] {
  const segments: FormulaSegment[] = [];
  let currentPos = 0;
  
  // Suche nach allen $$...$$ Block-Formeln zuerst (müssen vor $...$ behandelt werden)
  const blockPattern = /\$\$([^$]+?)\$\$/g;
  let blockMatch: RegExpExecArray | null;
  const blockMatches: Array<{ start: number; end: number; content: string }> = [];
  
  while ((blockMatch = blockPattern.exec(text)) !== null) {
    blockMatches.push({
      start: blockMatch.index,
      end: blockMatch.index + blockMatch[0].length,
      content: blockMatch[1].trim(),
    });
  }
  
  // Suche nach eckigen Klammern [...] mit mathematischen Inhalten
  const squareBracketMatches: Array<{ start: number; end: number; content: string }> = [];
  const squareBracketPattern = /\[([^\]]+?)\]/g;
  let squareMatch: RegExpExecArray | null;
  
  while ((squareMatch = squareBracketPattern.exec(text)) !== null) {
    const content = squareMatch[1].trim();
    // Prüfe ob der Inhalt mathematisch ist
    if (isMathInSquareBrackets(content)) {
      // Prüfe ob es nicht innerhalb einer bereits gefundenen Formel liegt
      const isInsideOtherFormula = blockMatches.some(
        (bm) => squareMatch!.index >= bm.start && squareMatch!.index < bm.end
      );
      
      if (!isInsideOtherFormula) {
        squareBracketMatches.push({
          start: squareMatch.index,
          end: squareMatch.index + squareMatch[0].length,
          content: content,
        });
      }
    }
  }
  
  // Suche nach allen $...$ Inline-Formeln
  // Wichtig: Ignoriere $ die Teil von $$ sind
  // Verwende einen einfacheren Ansatz ohne Lookbehinds für bessere Kompatibilität
  const inlineMatches: Array<{ start: number; end: number; content: string }> = [];
  let searchPos = 0;
  
  while (searchPos < text.length) {
    // Finde das nächste $ Zeichen
    const dollarIndex = text.indexOf('$', searchPos);
    if (dollarIndex === -1) break;
    
    // Prüfe ob es Teil von $$ ist
    if (dollarIndex < text.length - 1 && text[dollarIndex + 1] === '$') {
      // Es ist $$, überspringe beide Zeichen
      searchPos = dollarIndex + 2;
      continue;
    }
    
    // Prüfe ob es innerhalb einer Block-Formel oder eckigen Klammern liegt
    const isInsideBlock = blockMatches.some(
      (bm) => dollarIndex >= bm.start && dollarIndex < bm.end
    );
    const isInsideSquareBracket = squareBracketMatches.some(
      (sb) => dollarIndex >= sb.start && dollarIndex < sb.end
    );
    
    if (isInsideBlock || isInsideSquareBracket) {
      searchPos = dollarIndex + 1;
      continue;
    }
    
    // Finde das schließende $
    const closingDollarIndex = text.indexOf('$', dollarIndex + 1);
    if (closingDollarIndex === -1) break;
    
    // Prüfe ob das schließende $ nicht Teil von $$ ist
    if (closingDollarIndex < text.length - 1 && text[closingDollarIndex + 1] === '$') {
      // Das schließende $ ist Teil von $$, überspringe
      searchPos = closingDollarIndex + 1;
      continue;
    }
    
    // Prüfe ob das schließende $ innerhalb einer Block-Formel oder eckigen Klammern liegt
    const closingIsInsideBlock = blockMatches.some(
      (bm) => closingDollarIndex >= bm.start && closingDollarIndex < bm.end
    );
    const closingIsInsideSquareBracket = squareBracketMatches.some(
      (sb) => closingDollarIndex >= sb.start && closingDollarIndex < sb.end
    );
    
    if (closingIsInsideBlock || closingIsInsideSquareBracket) {
      searchPos = closingDollarIndex + 1;
      continue;
    }
    
    // Wir haben eine gültige $...$ Inline-Formel gefunden
    const content = text.slice(dollarIndex + 1, closingDollarIndex).trim();
    if (content.length > 0) {
      inlineMatches.push({
        start: dollarIndex,
        end: closingDollarIndex + 1,
        content: content,
      });
    }
    
    searchPos = closingDollarIndex + 1;
  }
  
  // Kombiniere alle Matches und sortiere nach Position
  const allMatches = [
    ...blockMatches.map((m) => ({ ...m, type: 'blockFormula' as const })),
    ...squareBracketMatches.map((m) => ({ ...m, type: 'blockFormula' as const })),
    ...inlineMatches.map((m) => ({ ...m, type: 'inlineFormula' as const })),
  ].sort((a, b) => a.start - b.start);
  
  // Entferne überlappende Matches (eckige Klammern haben niedrigere Priorität als Dollar-Delimiter)
  const filteredMatches: Array<{ start: number; end: number; content: string; type: 'blockFormula' | 'inlineFormula' }> = [];
  for (const match of allMatches) {
    const overlaps = filteredMatches.some(
      (fm) => (match.start >= fm.start && match.start < fm.end) || 
              (match.end > fm.start && match.end <= fm.end) ||
              (match.start <= fm.start && match.end >= fm.end)
    );
    
    if (!overlaps) {
      filteredMatches.push(match);
    }
  }
  
  const finalMatches = filteredMatches.sort((a, b) => a.start - b.start);
  
  // Erstelle Segmente
  for (const match of finalMatches) {
    // Text-Segment vor der Formel
    if (match.start > currentPos) {
      const textContent = text.slice(currentPos, match.start);
      if (textContent.trim().length > 0 || textContent.length > 0) {
        segments.push({
          type: 'text',
          content: textContent,
          start: currentPos,
          end: match.start,
        });
      }
    }
    
    // Formel-Segment
    if (match.content.length > 0) {
      segments.push({
        type: match.type,
        content: match.content,
        start: match.start,
        end: match.end,
      });
    }
    
    currentPos = match.end;
  }
  
  // Text-Segment nach der letzten Formel
  if (currentPos < text.length) {
    const textContent = text.slice(currentPos);
    if (textContent.trim().length > 0 || textContent.length > 0) {
      segments.push({
        type: 'text',
        content: textContent,
        start: currentPos,
        end: text.length,
      });
    }
  }
  
  // Wenn keine Formeln gefunden wurden, gibt es nur ein Text-Segment
  if (segments.length === 0) {
    segments.push({
      type: 'text',
      content: text,
      start: 0,
      end: text.length,
    });
  }
  
  return segments;
}

/**
 * Teilt Text in Segmente auf (Text, Inline-Formeln, Block-Formeln).
 * Verwendet extractFormulaSegments um Formeln zu finden.
 */
function splitBlockIntoSegments(text: string): FormulaSegment[] {
  return extractFormulaSegments(text);
}

function stripOuterSquareBrackets(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).trim();
  }
  return text;
}

// Prüft, ob eine ID eine gültige UUID ist (nicht Mock-Daten wie "discussion1")
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function reviveDiscussions(data: TDiscussion[]): TDiscussion[] {
  // Filtere Mock-Discussions heraus (IDs wie "discussion1", "discussion2" sind keine UUIDs)
  const validDiscussions = data.filter((discussion) => isValidUUID(discussion.id));
  
  return validDiscussions.map((discussion) => ({
    ...discussion,
    createdAt: new Date(discussion.createdAt),
    comments: discussion.comments.map((comment) => ({
      ...comment,
      createdAt: new Date(comment.createdAt),
      updatedAt: comment.updatedAt ? new Date(comment.updatedAt) : undefined,
      contentRich: normalizeNodeId(comment.contentRich),
    })),
  }));
}

function DiscussionPersistence({
  storageKeys,
  discussionsSaveTimeout,
  storageId,
}: {
  storageKeys: {
    content: string;
    discussions: string;
    state: string;
    legacyContent: string;
    legacyDiscussions: string;
  };
  discussionsSaveTimeout: React.MutableRefObject<number | ReturnType<typeof setTimeout> | null>;
  storageId: string;
}) {
  const discussions = usePluginOption(discussionPlugin, 'discussions');
  const latestDiscussions = React.useRef<TDiscussion[] | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !discussions) return;

    latestDiscussions.current = discussions;
    if (discussionsSaveTimeout.current) {
      window.clearTimeout(discussionsSaveTimeout.current);
    }

    try {
      discussionsSaveTimeout.current = window.setTimeout(() => {
        if (!latestDiscussions.current) return;
        persistState(storageKeys, null, latestDiscussions.current, storageId);
      }, SAVE_DEBOUNCE_MS);
    } catch (error) {
      console.error('Diskussionen konnten nicht gespeichert werden.', error);
    }
  }, [discussions, storageKeys, discussionsSaveTimeout, storageId]);

  React.useEffect(() => {
    return () => {
      if (discussionsSaveTimeout.current && latestDiscussions.current) {
        window.clearTimeout(discussionsSaveTimeout.current);
        try {
          persistState(storageKeys, null, latestDiscussions.current, storageId);
        } catch {
          // ignore on unmount
        }
      }
    };
  }, [storageKeys, storageId]);

  return null;
}

function loadPersistedState(keys: {
  content: string;
  discussions: string;
  state: string;
  legacyContent: string;
  legacyDiscussions: string;
}): { content: Value | null; discussions: TDiscussion[] | null } {
  if (typeof window === 'undefined') {
    return { content: null, discussions: null };
  }

  const tryParse = <T,>(raw: string | null, revive: (data: any) => T): T | null => {
    if (!raw) return null;
    try {
      return revive(JSON.parse(raw));
    } catch (error) {
      console.error('Persistierte Editor-Daten konnten nicht geladen werden.', error);
      return null;
    }
  };

  const state = tryParse<{ content?: Value; discussions?: TDiscussion[] }>(
    window.localStorage.getItem(keys.state),
    (data) => data
  );

  const contentFromState = state?.content ? normalizeNodeId(state.content) : null;
  const discussionsFromState = state?.discussions
    ? reviveDiscussions(state.discussions)
    : null;

  const contentFallback =
    tryParse<Value>(
      window.localStorage.getItem(keys.content),
      (data) => normalizeNodeId(data as Value)
    ) ??
    tryParse<Value>(
      window.localStorage.getItem(keys.legacyContent),
      (data) => normalizeNodeId(data as Value)
    );

  const discussionsFallback =
    tryParse<TDiscussion[]>(
      window.localStorage.getItem(keys.discussions),
      reviveDiscussions
    ) ??
    tryParse<TDiscussion[]>(
      window.localStorage.getItem(keys.legacyDiscussions),
      reviveDiscussions
    );

  return {
    content: contentFromState ?? contentFallback,
    discussions: discussionsFromState ?? discussionsFallback,
  };
}

async function persistState(
  keys: {
    content: string;
    discussions: string;
    state: string;
    legacyContent: string;
    legacyDiscussions: string;
  },
  content: Value | null,
  discussions: TDiscussion[] | null,
  documentId?: string
) {
  if (typeof window === 'undefined') return;

  let existingState: { content?: Value; discussions?: TDiscussion[] } | null = null;
  try {
    const raw = window.localStorage.getItem(keys.state);
    existingState = raw ? JSON.parse(raw) : null;
  } catch {
    existingState = null;
  }

  const nextContent = content ?? existingState?.content ?? null;
  const nextDiscussions = discussions ?? existingState?.discussions ?? null;
  const updatedAt = new Date().toISOString();

  const payload = {
    content: nextContent ?? undefined,
    discussions: nextDiscussions ?? undefined,
    updatedAt,
  };

  try {
    // Speichere nur in keys.state (enthält bereits content und discussions)
    window.localStorage.setItem(keys.state, JSON.stringify(payload));
    
    // Speichere in Supabase, wenn documentId vorhanden ist (UUID-Format) und User eingeloggt
    if (documentId && nextContent) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId);
      if (isUUID) {
        try {
          const userId = await getCurrentUserId();
          if (userId) {
            const extractedTitle = extractTitleFromContent(nextContent);
            await documentsUtils.updateDocument(
              documentId,
              {
                title: extractedTitle || "Unbenanntes Dokument",
                content: nextContent as any,
                updated_at: updatedAt,
              },
              userId
            );
            // Cache wurde bereits in updateDocument invalidiert
          }
        } catch (error: any) {
          // Spezifische Fehlerbehandlung für verschiedene Fehlertypen
          if (error?.code === 'PGRST116') {
            console.warn('[PLATE EDITOR] Dokument existiert nicht in der Datenbank. Wird beim nächsten Speichern erstellt.');
          } else if (error?.code === '23505') {
            // Unique Constraint Violation - Dokument existiert bereits
            // Versuche erneut mit Update (kann bei Race Conditions auftreten)
            console.warn('[PLATE EDITOR] Dokument existiert bereits. Versuche Update erneut...');
            try {
              const userId = await getCurrentUserId();
              if (userId) {
                const extractedTitle = extractTitleFromContent(nextContent);
                await documentsUtils.updateDocument(
                  documentId,
                  {
                    title: extractedTitle || "Unbenanntes Dokument",
                    content: nextContent as any,
                    updated_at: updatedAt,
                  },
                  userId
                );
                console.log('[PLATE EDITOR] Dokument erfolgreich aktualisiert nach Retry.');
              }
            } catch (retryError) {
              console.error('[PLATE EDITOR] Fehler beim Retry des Speicherns:', retryError);
            }
          } else if (error?.message?.includes('406')) {
            console.error('[PLATE EDITOR] 406 Not Acceptable - Möglicherweise RLS-Problem oder fehlerhafter Accept-Header:', error);
          } else {
            console.error('[PLATE EDITOR] Fehler beim Speichern des Dokuments in Supabase:', error);
          }
          // Weiterhin localStorage verwenden als Fallback
        }
      }
    }
    
    window.dispatchEvent(new Event('documents:reload'));
  } catch (error) {
    console.error('Persistierte Editor-Daten konnten nicht gespeichert werden.', error);
  }
}

function syncCommentPathMap(editor: PlateEditor) {
  try {
    const api = editor.getApi(commentPlugin);
    const map = new Map<string, Path>();

    for (const [node, path] of api.comment.nodes({ at: [] })) {
      const id = api.comment.nodeId(node);
      if (!id) continue;
      map.set(id, path.slice(0, 1));
    }

    if (map.size > 0) {
      editor.setOption(commentPlugin, 'uniquePathMap', map);
    }
  } catch (error) {
    console.error('Kommentarpfade konnten nicht synchronisiert werden.', error);
  }
}

function syncSuggestionPathMap(editor: PlateEditor) {
  try {
    const api = editor.getApi(SuggestionPlugin).suggestion;
    const map = new Map<string, Path>();

    for (const [node, path] of api.nodes({ at: [] })) {
      const id = api.nodeId(node);
      if (!id) continue;
      map.set(id, path.slice(0, 1));
    }

    if (map.size > 0) {
      editor.setOption(suggestionPlugin, 'uniquePathMap', map);
    }
  } catch (error) {
    console.error('Vorschlagspfade konnten nicht synchronisiert werden.', error);
  }
}
