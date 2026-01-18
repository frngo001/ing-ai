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

import { FilePenLine, Plus } from 'lucide-react';
import { createEditorKit } from '@/components/editor/editor-kit';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/use-language';
import { devError, devWarn, devLog } from '@/lib/utils/logger';
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
import { createClient } from '@/lib/supabase/client';
import * as documentsUtils from '@/lib/supabase/utils/documents';
import * as discussionsUtils from '@/lib/supabase/utils/discussions';
import {
  type TDiscussion,
  discussionPlugin,
} from '@/components/editor/plugins/discussion-kit';
import { commentPlugin } from '@/components/editor/plugins/comment-kit';
import { suggestionPlugin } from '@/components/editor/plugins/suggestion-kit';
import { useProjectStore } from '@/lib/stores/project-store';
import { useDocumentRealtime } from '../../hooks/use-document-realtime';
import { RemoteCursors } from '@/components/editor/remote-cursors';
import { useComments } from '@/hooks/use-comments';
import { CommentsContext } from '@/components/providers/comments-provider';
import { CollapsibleHeadingsManager, CollapsibleHeadingsStyles, CollapsibleHeadingsPlugin } from '@/components/editor/plugins/collapsible-headings-kit';

export function PlateEditor({
  showToc = true,
  showCommentToc = true,
  showSuggestionToc = true,
  storageId = 'default',
  hasDocuments = false,
}: {
  showToc?: boolean;
  showCommentToc?: boolean;
  showSuggestionToc?: boolean;
  storageId?: string;
  hasDocuments?: boolean;
}) {
  const { t, language } = useLanguage();
  const currentProject = useProjectStore((state) => state.getCurrentProject());
  const isSharedProject = currentProject?.isShared === true;
  const shareMode = currentProject?.shareMode;
  const isReadOnlyMode = isSharedProject && shareMode === 'view';
  const isSuggestingMode = isSharedProject && shareMode === 'suggest';
  const hasHydrated = React.useRef(false);
  const discussionsApplied = React.useRef(false);
  const [currentUser, setCurrentUser] = React.useState<{
    id: string;
    name: string;
    avatarUrl: string;
  } | null>(null);



  const comments = useComments(storageId);

  // Lade initialen Wert synchron aus localStorage für Hot Reload-Kompatibilität
  const initialValue = React.useMemo(() => getInitialValue(storageId), [storageId]);
  const latestContentRef = React.useRef<Value>(initialValue);
  const contentSaveTimeout = React.useRef<number | ReturnType<typeof setTimeout> | null>(null);
  const broadcastTimeout = React.useRef<number | ReturnType<typeof setTimeout> | null>(null);
  const BROADCAST_THROTTLE_MS = 150; // Throttle broadcasts to avoid flooding the channel
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

  const editorKitRef = React.useRef<ReturnType<typeof createEditorKit> | null>(null);
  if (!editorKitRef.current) {
    editorKitRef.current = createEditorKit(t('toolbar.placeholderWrite'));
  }

  const editor = usePlateEditor({
    plugins: editorKitRef.current,
    value: initialValue,
  });
  const addCitation = useCitationStore((state) => state.addCitation);
  const pendingCitation = useCitationStore((state) => state.pendingCitation);
  const setPendingCitation = useCitationStore((state) => state.setPendingCitation);
  const supabase = createClient();
  const isUpdatingFromRealtimeRef = React.useRef(false);

  const handleRealtimeUpdate = React.useCallback((newContent: Value) => {
    if (!editor || isUpdatingFromRealtimeRef.current) return;

    isUpdatingFromRealtimeRef.current = true;
    try {
      devLog('[PLATE EDITOR] Received realtime update, applying to editor');
      editor.tf.setValue(newContent);
      latestContentRef.current = newContent;
    } finally {
      setTimeout(() => {
        isUpdatingFromRealtimeRef.current = false;
      }, 30); // Reduced from 100ms to 30ms for faster response
    }
  }, [editor]);

  const handleDiscussionsUpdate = React.useCallback((newDiscussions: TDiscussion[]) => {
    if (!editor || isUpdatingFromRealtimeRef.current) return;

    devLog('[PLATE EDITOR] Received realtime discussions update');
    editor.setOption(discussionPlugin, 'discussions', newDiscussions);
    syncCommentPathMap(editor);
    syncSuggestionPathMap(editor);
    (editor as any).tf.redecorate?.();
  }, [editor]);

  const isUUIDDocument = storageId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storageId);

  const { broadcastContent, broadcastDiscussions, updatePresence, presence, sessionId } = useDocumentRealtime({
    documentId: isUUIDDocument ? storageId : null,
    onContentUpdate: handleRealtimeUpdate,
    onDiscussionsUpdate: handleDiscussionsUpdate,
    enabled: !!isUUIDDocument, // Enable for all DB-backed documents
  });

  // Lade aktuellen User und aktualisiere Plugin-Optionen
  React.useEffect(() => {
    if (typeof window === 'undefined' || !editor) return;

    const loadCurrentUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!userError && user) {
          const userId = user.id;
          const userName =
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'User';
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            `https://api.dicebear.com/9.x/glass/svg?seed=${userId}`;

          const userData = {
            id: userId,
            avatarUrl: avatarUrl,
            name: userName,
          };

          setCurrentUser(userData);

          const currentUsers = editor.getOption(discussionPlugin, 'users') || {};
          const updatedUsers = {
            ...currentUsers,
            [userId]: userData,
          };
          editor.setOption(discussionPlugin, 'currentUserId', userId);
          editor.setOption(discussionPlugin, 'users', updatedUsers);
          // Also update suggestionPlugin
          editor.setOption(suggestionPlugin, 'currentUserId', userId);
        }
      } catch (error) {
        devError('Fehler beim Laden des aktuellen Users:', error);
      }
    };

    loadCurrentUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const userId = session.user.id;
        const userName =
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'User';
        const avatarUrl =
          session.user.user_metadata?.avatar_url ||
          `https://api.dicebear.com/9.x/glass/svg?seed=${userId}`;

        const userData = {
          id: userId,
          avatarUrl: avatarUrl,
          name: userName,
        };

        setCurrentUser(userData);

        const currentUsers = editor.getOption(discussionPlugin, 'users') || {};
        const updatedUsers = {
          ...currentUsers,
          [userId]: userData,
        };

        editor.setOption(discussionPlugin, 'currentUserId', userId);
        editor.setOption(discussionPlugin, 'users', updatedUsers);
        // Also update suggestionPlugin
        editor.setOption(suggestionPlugin, 'currentUserId', userId);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [editor, supabase]);

  // Sync collapsible headings documentId
  React.useEffect(() => {
    if (editor && storageId) {
      editor.setOption(CollapsibleHeadingsPlugin, 'documentId', storageId);
    }
  }, [editor, storageId]);

  // Discussions Sync
  React.useEffect(() => {
    if (editor && comments.discussions) {
      editor.setOption(discussionPlugin, 'discussions', comments.discussions);

      // Collect users from comments to populate valid profiles for suggestions/comments
      const usersFromComments: Record<string, { id: string; name: string; avatarUrl: string }> = {};
      comments.discussions.forEach((d) => {
        d.comments.forEach((c) => {
          if (c.userId) {
            usersFromComments[c.userId] = {
              id: c.userId,
              name: c.userName || 'Unknown',
              avatarUrl: c.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${c.userId}`,
            };
          }
        });
      });

      const currentUsers = editor.getOption(discussionPlugin, 'users') || {};
      editor.setOption(discussionPlugin, 'users', { ...currentUsers, ...usersFromComments });
    }
  }, [editor, comments.discussions]);

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

  // Bereinige dunkle Textfarben und helle Hintergrundfarben nach dem Paste
  // Dies ist notwendig für Text aus DOCX/Word, der schwarze Schrift mitbringt
  React.useEffect(() => {
    if (typeof window === 'undefined' || !editor) return;

    const cleanupPastedColors = () => {
      // Kurze Verzögerung, damit der Paste-Vorgang abgeschlossen ist
      setTimeout(() => {
        try {
          // Durchlaufe alle Text-Nodes im Editor und entferne problematische Farben
          const nodes = editor.api.nodes({
            at: [],
            match: (n) => TextApi.isText(n) && (n.color !== undefined || n.backgroundColor !== undefined),
          });

          for (const [node, path] of nodes) {
            const textNode = node as TText & { color?: string; backgroundColor?: string };

            // Prüfe auf dunkle Textfarbe (schwarz/dunkelgrau)
            if (textNode.color) {
              const color = textNode.color.toLowerCase();
              const isDark =
                color === 'black' ||
                color === '#000' ||
                color === '#000000' ||
                color === 'windowtext' ||
                color.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)?.slice(1).every(v => parseInt(v) < 50);

              if (isDark) {
                editor.tf.setNodes({ color: undefined } as any, { at: path });
              }
            }

            // Prüfe auf helle Hintergrundfarbe (weiß/hellgrau)
            if (textNode.backgroundColor) {
              const bgColor = textNode.backgroundColor.toLowerCase();
              const isLight =
                bgColor === 'white' ||
                bgColor === '#fff' ||
                bgColor === '#ffffff' ||
                bgColor.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)?.slice(1).every(v => parseInt(v) > 220);

              if (isLight) {
                editor.tf.setNodes({ backgroundColor: undefined } as any, { at: path });
              }
            }
          }
        } catch (error) {
          devWarn('[PLATE EDITOR] Fehler beim Bereinigen der Paste-Farben:', error);
        }
      }, 50);
    };

    // Paste-Event auf dem Document-Level abfangen
    document.addEventListener('paste', cleanupPastedColors);

    return () => {
      document.removeEventListener('paste', cleanupPastedColors);
    };
  }, [editor]);

  // Focus editor at start when creating a new document
  React.useEffect(() => {
    if (typeof window === 'undefined' || !editor) return;

    const handleFocusStart = () => {
      setTimeout(() => {
        try {
          editor.tf.select({
            anchor: { path: [0, 0], offset: 0 },
            focus: { path: [0, 0], offset: 0 },
          });
          editor.tf.focus();
        } catch (error) {
          devWarn('[PLATE EDITOR] Could not focus editor:', error);
        }
      }, 100);
    };

    window.addEventListener('editor:focus-start', handleFocusStart);

    return () => {
      window.removeEventListener('editor:focus-start', handleFocusStart);
    };
  }, [editor]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !editor) return;

    const currentContent = JSON.stringify(editor.children);
    const initialContentStr = JSON.stringify(initialValue);
    const needsReload = currentContent !== initialContentStr || !hasHydrated.current;

    if (!needsReload && hasHydrated.current) {
      return;
    }
    hasHydrated.current = false;

    const loadContent = async () => {
      // Wenn storageId 'empty' ist, zeige leeren Editor
      if (storageId === 'empty') {
        (editor as any).tf.setValue?.(DEFAULT_VALUE);
        latestContentRef.current = DEFAULT_VALUE;
        (editor as any).tf.redecorate?.();
        hasHydrated.current = true;
        return;
      }

      // Versuche zuerst aus Supabase zu laden, wenn storageId eine UUID ist (Supabase-Dokument)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storageId);
      let content: Value | null = null;
      let discussions: TDiscussion[] | null = null;

      if (isUUID) {
        try {
          const userId = await getCurrentUserId();
          if (userId) {
            // For shared projects, skip user check to allow access to shared documents
            const doc = await documentsUtils.getDocumentById(storageId, userId, isSharedProject);
            if (doc && doc.content) {
              const normalizedContent = normalizeNodeId(doc.content as Value);
              content = normalizedContent;
            }
          }
        } catch (error) {
          devError('Fehler beim Laden des Dokuments aus Supabase:', error);
          const localData = loadPersistedState(storageKeys);
          content = localData.content;
          discussions = localData.discussions;
        }
      } else {
        const localData = loadPersistedState(storageKeys);
        discussions = localData.discussions;
        content = initialValue !== DEFAULT_VALUE ? initialValue : null;
      }

      // Wenn kein Content vorhanden ist, verwende den initialValue
      const finalContent = content || initialValue;

      // Setze nur wenn sich der Content geändert hat
      const currentContentStr = JSON.stringify(editor.children);
      const newContentStr = JSON.stringify(finalContent);
      if (currentContentStr !== newContentStr) {
        // Prevent broadcast during initial load
        isUpdatingFromRealtimeRef.current = true;
        (editor as any).tf.setValue?.(finalContent);
        // Reset broadcast block after a short delay
        setTimeout(() => {
          isUpdatingFromRealtimeRef.current = false;
        }, 30); // Reduced from 100ms to 30ms
      }

      latestContentRef.current = finalContent;
      (editor as any).tf.redecorate?.();
      syncCommentPathMap(editor);
      syncSuggestionPathMap(editor);

      if (discussions) {
        editor.setOption(discussionPlugin, 'discussions', discussions);
        syncCommentPathMap(editor);
        syncSuggestionPathMap(editor);
        (editor as any).tf.redecorate?.();
        discussionsApplied.current = true;
      }

      // Mark hydration as complete immediately after setting value
      hasHydrated.current = true;
    };

    loadContent();
  }, [editor, storageKeys, storageId, initialValue]);

  // Enforce editor mode for shared projects
  React.useEffect(() => {
    if (!editor || !isSharedProject || !shareMode) return;

    if (shareMode === 'view') {
      // isReadOnlyMode prop on Plate handles this, but syncing local state is good
      editor.setOption(SuggestionPlugin, 'isSuggesting', false);
    } else if (shareMode === 'suggest') {
      editor.setOption(SuggestionPlugin, 'isSuggesting', true);
    } else if (shareMode === 'edit') {
      editor.setOption(SuggestionPlugin, 'isSuggesting', false);
    }
  }, [editor, isSharedProject, shareMode]);

  const handleChange = React.useCallback(
    ({ value: nextValue }: { value: Value }) => {
      if (typeof window === 'undefined' || !hasHydrated.current) return;

      autoConvertLatexBlocks(editor);

      latestContentRef.current = nextValue;

      // Throttled broadcast to other users (prevents flooding the channel)
      if (isUUIDDocument && !isUpdatingFromRealtimeRef.current) {
        if (broadcastTimeout.current) {
          window.clearTimeout(broadcastTimeout.current);
        }
        broadcastTimeout.current = window.setTimeout(() => {
          broadcastContent(latestContentRef.current);
          broadcastTimeout.current = null;
        }, BROADCAST_THROTTLE_MS);
      }

      if (contentSaveTimeout.current) {
        window.clearTimeout(contentSaveTimeout.current);
      }

      try {
        contentSaveTimeout.current = window.setTimeout(() => {
          persistState(storageKeys, latestContentRef.current, null, storageId, t('documents.untitledDocument'), isSharedProject);
        }, SAVE_DEBOUNCE_MS);
      } catch (error) {
        devError('Editorinhalt konnte nicht gespeichert werden.', error);
      }
    },
    [editor, storageKeys, storageId, isSharedProject, isUUIDDocument, broadcastContent]
  );

  // Sync presence (cursor)
  React.useEffect(() => {
    if (!editor || !isUUIDDocument || !currentUser) return;

    const interval = setInterval(() => {
      if (!editor.selection) return;

      updatePresence({
        userId: currentUser.id,
        userName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        selection: editor.selection || null,
      });
    }, 100); // Send cursor update every 100ms (was 5ms - caused performance issues)

    return () => clearInterval(interval);
  }, [editor, isUUIDDocument, currentUser, updatePresence]);

  React.useEffect(() => {
    return () => {
      // Clean up broadcast timeout
      if (broadcastTimeout.current) {
        window.clearTimeout(broadcastTimeout.current);
      }
      if (contentSaveTimeout.current && hasHydrated.current) {
        window.clearTimeout(contentSaveTimeout.current);
        try {
          persistState(storageKeys, latestContentRef.current, null, storageId, t('documents.untitledDocument'), isSharedProject);
        } catch {
          // ignore on unmount
        }
      }
    };
  }, [storageKeys, storageId, isSharedProject]);

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
    <CommentsContext.Provider value={comments}>
      <Plate editor={editor} onChange={handleChange} readOnly={isReadOnlyMode}>
        <CollapsibleHeadingsManager documentId={storageId} />
        <CollapsibleHeadingsStyles />

        <div className="flex h-full items-start gap-6">
          <CommentTocSidebar visible={showCommentToc} className="overflow-auto max-h-[40vh]" />
          <SuggestionTocSidebar
            visible={showSuggestionToc}
            className="top-[45vh]"
          />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex h-full flex-col min-h-0">
              <ConditionalFixedToolbar toolbarRef={topToolbarRef} />
              <div className="flex-1 min-h-0 overflow-hidden relative">
                {/* Overlay wenn kein Dokument erstellt wurde und keine Dokumente existieren */}
                {storageId === 'empty' && hasDocuments === false && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center text-center space-y-4 p-8 max-w-md">
                      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted border-2 border-border">
                        <FilePenLine className="size-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {t('documents.welcomeDialogTitle')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t('documents.welcomeDialogDescription')}
                        </p>
                      </div>
                      <Button
                        variant="default"
                        size="default"
                        className="mt-2"
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new Event('documents:create-new'));
                          }
                        }}
                      >
                        <Plus className="size-4 mr-2" />
                        {t('documents.newDocument')}
                      </Button>
                    </div>
                  </div>
                )}
                <EditorContainer
                  className="overflow-y-auto h-full"
                  style={toolbarVars}
                  data-onboarding="editor-container"
                >
                  <RemoteCursors presence={presence} currentUserId={currentUser?.id} sessionId={sessionId} />
                  <Editor variant="demo" className="overflow-y-auto" data-onboarding="editor-content" />
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
              href: externalUrl || undefined,
              externalUrl,
              doi: validDoi || undefined,
              authors,
              abstract:
                (typeof (source as any).abstract === 'string' && (source as any).abstract) ||
                (typeof (source as any).description === 'string' && (source as any).description) ||
                undefined,
              type: source.type,
              imageUrl: source.thumbnail || source.image,
              isbn: source.isbn,
              publisher: source.publisher,
              edition: source.edition,
              publisherPlace: source.publisherPlace,
            })
          }}
        />
      </Plate>
    </CommentsContext.Provider>
  );
}

const LOCAL_STORAGE_KEY_PREFIX = 'plate-editor-content';
const LOCAL_STORAGE_DISCUSSIONS_KEY_PREFIX = 'plate-editor-discussions';
const LOCAL_STORAGE_STATE_PREFIX = 'plate-editor-state';
const LOCAL_STORAGE_KEY_LEGACY = 'plate-editor-content';
const LOCAL_STORAGE_DISCUSSIONS_KEY_LEGACY = 'plate-editor-discussions';
const SAVE_DEBOUNCE_MS = 50;
const DEFAULT_VALUE = normalizeNodeId([{ type: 'p', children: [{ text: '' }] }]);

/**
 * Lädt synchron den initialen Editor-Inhalt aus localStorage.
 * Wird beim Initialisieren des Editors verwendet, um Hot Reload-Probleme zu vermeiden.
 * @param storageId Die Storage-ID für das Dokument
 * @returns Der geladene Content oder DEFAULT_VALUE als Fallback
 */
function getInitialValue(storageId: string): Value {
  if (typeof window === 'undefined') {
    return DEFAULT_VALUE;
  }

  const storageKeys = {
    content: `${LOCAL_STORAGE_KEY_PREFIX}-${storageId}`,
    discussions: `${LOCAL_STORAGE_DISCUSSIONS_KEY_PREFIX}-${storageId}`,
    state: `${LOCAL_STORAGE_STATE_PREFIX}-${storageId}`,
    legacyContent: LOCAL_STORAGE_KEY_LEGACY,
    legacyDiscussions: LOCAL_STORAGE_DISCUSSIONS_KEY_LEGACY,
  };

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storageId);
  if (isUUID) {
    return DEFAULT_VALUE;
  }
  try {
    const tryParse = <T,>(raw: string | null, revive: (data: any) => T): T | null => {
      if (!raw) return null;
      try {
        return revive(JSON.parse(raw));
      } catch (error) {
        return null;
      }
    };

    const state = tryParse<{ content?: Value; discussions?: TDiscussion[] }>(
      window.localStorage.getItem(storageKeys.state),
      (data) => data
    );

    const contentFromState = state?.content ? normalizeNodeId(state.content) : null;

    const contentFallback =
      tryParse<Value>(
        window.localStorage.getItem(storageKeys.content),
        (data) => normalizeNodeId(data as Value)
      ) ??
      tryParse<Value>(
        window.localStorage.getItem(storageKeys.legacyContent),
        (data) => normalizeNodeId(data as Value)
      );

    const loadedContent = contentFromState ?? contentFallback;
    if (loadedContent) {
      const hasContent = extractTextFromNode(loadedContent).trim().length > 0;
      if (hasContent) {
        return loadedContent;
      }
    }
  } catch (error) {
    devWarn('[PLATE EDITOR] Fehler beim synchronen Laden des initialen Contents:', error);
  }

  return DEFAULT_VALUE;
}
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
      if (node.type === equationType) continue;
      if (node.type === inlineEquationType) continue;

      const inlineEquationTex = extractBlockTexFromInlineEquation(
        node as TElement,
        inlineEquationType
      );
      const text = editor.api.string(path as any);
      const blockFormulaTex = extractBlockFormulaFromDelimiters(text.trim());
      if (blockFormulaTex) {
        editor.tf.removeNodes({ at: path as any } as any);
        editor.tf.insertNodes(
          { type: equationType, texExpression: blockFormulaTex, children: [{ text: '' }] } as any,
          { at: path as any, select: false } as any
        );
        changed = true;
        continue;
      }

      if (inlineEquationTex) {
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
          const normalizedTex = normalizeMathFormula(segment.content);
          currentParagraphChildren.push({
            type: inlineEquationType,
            texExpression: normalizedTex,
            children: [{ text: '' }],
          });
        } else {
          if (!hasCurrentParagraph) {
            hasCurrentParagraph = true;
          }
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
      if (nodesToInsert.length > 0) {
        editor.tf.removeNodes({ at: path as any } as any);
        for (let j = 0; j < nodesToInsert.length; j++) {
          const insertPath = j === 0
            ? path
            : (() => {
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
  const mathPatterns = [
    /\^[0-9a-zA-Z()+\-]/,
    /_[0-9a-zA-Z()+\-]/,
    /(?:^|[^a-zäöü])([a-z])\s*[+\-×÷=<>≤≥≠≈]\s*([a-z0-9])(?![a-zäöü])/i,
    /\([^)]+\^[^)]+\)/,
    /Σ|∑|∫|√|∞|±|≤|≥|≠|≈|∈|∉|⊂|⊃|∪|∩|∀|∃/,
    /[0-9]+\s*[+\-×÷]\s*[0-9]+/,
    /[0-9]+\s*=\s*[0-9]+/,
    /[0-9]+\s*[<>≤≥≠≈]\s*[0-9]+/,
  ];
  const germanWordPattern = /\b(und|oder|sowie|aber|jedoch|denn|weil|da|wenn|falls|obwohl|trotz|für|gegen|mit|ohne|von|zu|auf|in|an|über|unter|vor|nach|bei|durch|seit|bis|während|innerhalb|außerhalb|vor|nachteile|vorteile|nachteil|vorteil)\b/i;
  if (germanWordPattern.test(text)) {
    return false;
  }
  const mathPatternCount = mathPatterns.filter((pattern) => pattern.test(text)).length;
  if (mathPatternCount >= 2) return true;
  if (mathPatternCount >= 1 && text.length < 200) {
    const whitespaceRatio = (text.match(/\s/g) || []).length / text.length;
    if (whitespaceRatio > 0.3) return false;

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
  normalized = normalized.replace(/\s*=\s*/g, ' = ');
  normalized = normalized.replace(/\s*\+\s*/g, ' + ');
  normalized = normalized.replace(/\s*-\s*/g, ' - ');

  if (normalized.includes('\\sum_{k_1+k_2+\\cdots+k_m=n}')) {
    normalized = normalized.replace(
      /\\sum_\{k_1\+k_2\+\\cdots\+k_m=n\}/g,
      '\\sum\\limits'
    );
  }
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
  let searchPos = 0;
  while (searchPos < text.length) {
    const dollarIndex = text.indexOf('$', searchPos);
    if (dollarIndex === -1) break;
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
  const trimmed = text.trim();
  if (!trimmed.startsWith('$$') || !trimmed.endsWith('$$')) return null;
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
    if (isMathInSquareBrackets(content)) {
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

  const inlineMatches: Array<{ start: number; end: number; content: string }> = [];
  let searchPos = 0;

  while (searchPos < text.length) {
    const dollarIndex = text.indexOf('$', searchPos);
    if (dollarIndex === -1) break;
    if (dollarIndex < text.length - 1 && text[dollarIndex + 1] === '$') {
      searchPos = dollarIndex + 2;
      continue;
    }
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
    const closingDollarIndex = text.indexOf('$', dollarIndex + 1);
    if (closingDollarIndex === -1) break;
    if (closingDollarIndex < text.length - 1 && text[closingDollarIndex + 1] === '$') {
      searchPos = closingDollarIndex + 1;
      continue;
    }
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
  const allMatches = [
    ...blockMatches.map((m) => ({ ...m, type: 'blockFormula' as const })),
    ...squareBracketMatches.map((m) => ({ ...m, type: 'blockFormula' as const })),
    ...inlineMatches.map((m) => ({ ...m, type: 'inlineFormula' as const })),
  ].sort((a, b) => a.start - b.start);
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
      devError('Persistierte Editor-Daten konnten nicht geladen werden.', error);
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
  documentId?: string,
  defaultTitle: string = "Unbenanntes Dokument",
  isSharedProject: boolean = false
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
    window.localStorage.setItem(keys.state, JSON.stringify(payload));

    if (documentId && (nextContent || nextDiscussions)) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(documentId);
      if (isUUID) {
        try {
          // Sync discussions if present
          if (nextDiscussions) {
            await discussionsUtils.syncDiscussions(documentId, nextDiscussions);
          }

          if (nextContent) {
            const extractedTitle = extractTitleFromContent(nextContent, defaultTitle);
            let shouldUpdateTitle = true;

            try {
              const currentUserId = await getCurrentUserId();
              // Check existing document metadata
              const existingDoc = await documentsUtils.getDocumentById(
                documentId,
                currentUserId ?? undefined,
                isSharedProject // skipUserCheck
              );

              if (existingDoc && (existingDoc.metadata as any)?.is_manually_named) {
                shouldUpdateTitle = false;
              }
            } catch (err) {
              devWarn('[PERSIST] Failed to check document metadata', err);
            }

            const updatePayload: any = {
              content: nextContent as any,
              updated_at: updatedAt,
            };

            if (shouldUpdateTitle) {
              updatePayload.title = extractedTitle;
            }

            if (isSharedProject) {
              devLog('[PERSIST] Saving shared document with skipUserCheck');
              await documentsUtils.updateDocument(
                documentId,
                updatePayload,
                undefined,
                true // skipUserCheck for shared projects
              );
            } else {
              const userId = await getCurrentUserId();
              if (userId) {
                await documentsUtils.updateDocument(
                  documentId,
                  updatePayload,
                  userId
                );
              }
            }
          }
        } catch (error: any) {
          if (error?.code === 'PGRST116') {
            devWarn('[PLATE EDITOR] Dokument existiert nicht in der Datenbank.');
          } else if (error?.code === '23505') {
            devWarn('[PLATE EDITOR] Dokument existiert bereits. Versuche Update erneut...');
            try {
              const extractedTitle = extractTitleFromContent(nextContent, defaultTitle);
              let shouldUpdateTitle = true;

              try {
                const currentUserId = await getCurrentUserId();
                const existingDoc = await documentsUtils.getDocumentById(
                  documentId,
                  currentUserId ?? undefined,
                  isSharedProject
                );

                if (existingDoc && (existingDoc.metadata as any)?.is_manually_named) {
                  shouldUpdateTitle = false;
                }
              } catch (err) {
                // ignore
              }

              const updatePayload: any = {
                content: nextContent as any,
                updated_at: updatedAt,
              };

              if (shouldUpdateTitle) {
                updatePayload.title = extractedTitle;
              }

              if (isSharedProject) {
                await documentsUtils.updateDocument(
                  documentId,
                  updatePayload,
                  undefined,
                  true // skipUserCheck for shared projects
                );
              } else {
                const userId = await getCurrentUserId();
                if (userId) {
                  await documentsUtils.updateDocument(
                    documentId,
                    updatePayload,
                    userId
                  );
                }
              }
              devLog('[PLATE EDITOR] Dokument erfolgreich aktualisiert nach Retry.');
            } catch (retryError) {
              devError('[PLATE EDITOR] Fehler beim Retry des Speicherns:', retryError);
            }
          } else if (error?.message?.includes('406')) {
            devError('[PLATE EDITOR] 406 Not Acceptable - Möglicherweise RLS-Problem:', error);
          } else {
            devError('[PLATE EDITOR] Fehler beim Speichern des Dokuments in Supabase:', {
              message: error?.message,
              code: error?.code,
              details: error?.details,
              hint: error?.hint,
              error: JSON.stringify(error),
            });
          }
        }
      }
    }

    window.dispatchEvent(new Event('documents:reload'));
  } catch (error) {
    devError('Persistierte Editor-Daten konnten nicht gespeichert werden.', error);
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
    devError('Kommentarpfade konnten nicht synchronisiert werden.', error);
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
    devError('Vorschlagspfade konnten nicht synchronisiert werden.', error);
  }
}
