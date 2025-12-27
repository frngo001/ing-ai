'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import {
  BLOCK_CONTEXT_MENU_ID,
  BlockMenuPlugin,
  BlockSelectionPlugin,
} from '@platejs/selection/react';
import { KEYS } from 'platejs';
import { useEditorPlugin, usePlateState, usePluginOption } from 'platejs/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowRightLeft,
  CopyPlus,
  CornerDownLeft,
  CornerDownRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Type,
  Trash2,
  Wand2,
} from 'lucide-react';

import { useCitationStore } from '@/lib/stores/citation-store';
import { prepareCitationInsertion } from '@/components/editor/utils/prepare-citation-insertion';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useIsTouchDevice } from '@/hooks/use-is-touch-device';

type Value = 'askAI' | null;

export function BlockContextMenu({ children }: { children: React.ReactNode }) {
  const { api, editor } = useEditorPlugin(BlockMenuPlugin);
  const [value, setValue] = React.useState<Value>(null);
  const isTouch = useIsTouchDevice();
  const [readOnly] = usePlateState('readOnly');
  const openId = usePluginOption(BlockMenuPlugin, 'openId');
  const isOpen = openId === BLOCK_CONTEXT_MENU_ID;
  const { openSearch } = useCitationStore();
  const contentClass =
    'w-64 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50';
  const subContentClass =
    'w-48 rounded-lg border border-gray-200 bg-white text-gray-900 shadow-md dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-50';
  const itemClass =
    'rounded-md text-gray-900 dark:text-neutral-50 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 data-[state=checked]:bg-gray-100 data-[state=checked]:text-gray-900 data-[state=open]:bg-gray-100 data-[state=open]:text-gray-900 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 dark:focus:text-neutral-50 dark:data-[state=checked]:bg-neutral-800 dark:data-[state=checked]:text-neutral-50 dark:data-[state=open]:bg-neutral-800 dark:data-[state=open]:text-neutral-50';
  const iconClass = 'mr-2 h-4 w-4 text-emerald-500 dark:text-emerald-400';

  const handleTurnInto = React.useCallback(
    (type: string) => {
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.getNodes()
        .forEach(([node, path]) => {
          if (node[KEYS.listType]) {
            editor.tf.unsetNodes([KEYS.listType, 'indent'], {
              at: path,
            });
          }

          editor.tf.toggleBlock(type, { at: path });
        });
    },
    [editor]
  );

  const handleAlign = React.useCallback(
    (align: 'center' | 'left' | 'right') => {
      editor
        .getTransforms(BlockSelectionPlugin)
        .blockSelection.setNodes({ align });
    },
    [editor]
  );

  const hasInlineEquation = React.useCallback(() => {
    const inlineEquationType = editor.getType(KEYS.inlineEquation);

    // Versuche zuerst Block-Selection
    const blockSelection = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes();
    if (blockSelection.length > 0) {
      for (const [blockNode, blockPath] of blockSelection) {
        const inlineEquations = Array.from(
          editor.api.nodes({
            at: blockPath,
            match: (node) => (node as any).type === inlineEquationType,
          })
        );
        if (inlineEquations.length > 0) return true;
      }
    }

    // Falls keine gefunden, suche in der Editor-Selection
    if (editor.selection) {
      const inlineEquations = Array.from(
        editor.api.nodes({
          at: editor.selection,
          match: (node) => (node as any).type === inlineEquationType,
        })
      );
      if (inlineEquations.length > 0) return true;
    }

    return false;
  }, [editor]);

  const hasBlockEquation = React.useCallback(() => {
    const equationType = editor.getType(KEYS.equation);

    // Versuche zuerst Block-Selection
    const blockSelection = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes();
    if (blockSelection.length > 0) {
      for (const [blockNode] of blockSelection) {
        if ((blockNode as any).type === equationType) {
          return true;
        }
      }
    }

    // Falls keine gefunden, suche in der Editor-Selection
    if (editor.selection) {
      const blockEntries = editor.api.blocks({ at: editor.selection });
      for (const [blockNode] of blockEntries) {
        if ((blockNode as any).type === equationType) {
          return true;
        }
      }
    }

    return false;
  }, [editor]);

  const handleInlineEquationToBlock = React.useCallback(() => {
    const inlineEquationType = editor.getType(KEYS.inlineEquation);
    const equationType = editor.getType(KEYS.equation);

    editor.tf.withoutNormalizing(() => {
      // Finde alle Inline-Formeln in der aktuellen Selection oder Block-Selection
      let inlineEquationEntries: Array<[any, any[]]> = [];

      // Versuche zuerst Block-Selection
      const blockSelection = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes();
      if (blockSelection.length > 0) {
        for (const [blockNode, blockPath] of blockSelection) {
          const inlineEquations = Array.from(
            editor.api.nodes({
              at: blockPath,
              match: (node) => (node as any).type === inlineEquationType,
            })
          );
          inlineEquationEntries.push(...inlineEquations);
        }
      }

      // Falls keine gefunden, suche in der Editor-Selection
      if (inlineEquationEntries.length === 0 && editor.selection) {
        const inlineEquations = Array.from(
          editor.api.nodes({
            at: editor.selection,
            match: (node) => (node as any).type === inlineEquationType,
          })
        );
        inlineEquationEntries.push(...inlineEquations);
      }

      if (!inlineEquationEntries.length) return;

      // Iteriere rückwärts, um Path-Probleme zu vermeiden
      for (let i = inlineEquationEntries.length - 1; i >= 0; i--) {
        const [inlineEquationNode, inlineEquationPath] = inlineEquationEntries[i];
        const texExpression = ((inlineEquationNode as any).texExpression ?? '').trim();

        if (!texExpression) continue;

        // Finde den Parent-Block
        const blockEntry = editor.api.block({ at: inlineEquationPath });
        if (!blockEntry) continue;

        const [blockNode, blockPath] = blockEntry;

        // Erstelle den neuen Block-Equation-Node
        const equationNode = {
          type: equationType,
          texExpression,
          children: [{ text: '' }],
        };

        // Wenn der Block nur die Inline-Formel enthält, ersetze den gesamten Block
        const blockChildren = (blockNode as any).children as any[] | undefined;
        const hasOnlyInlineEquation =
          blockChildren &&
          blockChildren.length === 1 &&
          blockChildren[0].type === inlineEquationType;

        if (hasOnlyInlineEquation) {
          editor.tf.removeNodes({ at: blockPath });
          editor.tf.insertNodes(equationNode as any, { at: blockPath, select: true });
        } else {
          // Entferne die Inline-Formel und füge Block-Formel nach dem Block ein
          editor.tf.removeNodes({ at: inlineEquationPath });
          const nextBlock = editor.api.next({ at: blockPath });
          const insertPath = nextBlock ? nextBlock[1] : (() => {
            // Fallback: Füge nach dem aktuellen Block ein
            const afterPath = [...blockPath];
            afterPath[afterPath.length - 1] = (afterPath[afterPath.length - 1] as number) + 1;
            return afterPath;
          })();
          editor.tf.insertNodes(equationNode as any, { at: insertPath, select: true });
        }
      }
    });

    editor.tf.focus();
  }, [editor]);

  const handleBlockEquationToInline = React.useCallback(() => {
    const inlineEquationType = editor.getType(KEYS.inlineEquation);
    const equationType = editor.getType(KEYS.equation);
    const paragraphType = editor.getType(KEYS.p);

    editor.tf.withoutNormalizing(() => {
      // Finde alle Block-Formeln in der aktuellen Selection oder Block-Selection
      let blockEquationEntries: Array<[any, any[]]> = [];

      // Versuche zuerst Block-Selection
      const blockSelection = editor.getApi(BlockSelectionPlugin).blockSelection.getNodes();
      if (blockSelection.length > 0) {
        for (const [blockNode, blockPath] of blockSelection) {
          if ((blockNode as any).type === equationType) {
            blockEquationEntries.push([blockNode, blockPath]);
          }
        }
      }

      // Falls keine gefunden, suche in der Editor-Selection
      if (blockEquationEntries.length === 0 && editor.selection) {
        const blockEntries = editor.api.blocks({ at: editor.selection });
        for (const [blockNode, blockPath] of blockEntries) {
          if ((blockNode as any).type === equationType) {
            blockEquationEntries.push([blockNode, blockPath]);
          }
        }
      }

      if (!blockEquationEntries.length) return;

      // Iteriere rückwärts, um Path-Probleme zu vermeiden
      for (let i = blockEquationEntries.length - 1; i >= 0; i--) {
        const [equationNode, equationPath] = blockEquationEntries[i];
        const texExpression = ((equationNode as any).texExpression ?? '').trim();

        if (!texExpression) continue;

        // Erstelle einen neuen Paragraph mit der Inline-Formel
        const paragraphNode = {
          type: paragraphType,
          children: [
            {
              type: inlineEquationType,
              texExpression,
              children: [{ text: '' }],
            },
          ],
        };

        // Entferne die Block-Formel und füge den Paragraph ein
        editor.tf.removeNodes({ at: equationPath });
        editor.tf.insertNodes(paragraphNode as any, { at: equationPath, select: true });
      }
    });

    editor.tf.focus();
  }, [editor]);

  const handleInsertCitation = React.useCallback(() => {
    prepareCitationInsertion(editor);
    openSearch();
  }, [editor, openSearch]);

  if (isTouch) {
    return children;
  }

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (!open) {
          api.blockMenu.hide();
        }
      }}
      modal={false}
    >
      <ContextMenuTrigger
        asChild
        onContextMenu={(event) => {
          const dataset = (event.target as HTMLElement).dataset;
          const slateNode = editor.api.toSlateNode(event.target as any);
          const path = slateNode ? editor.api.findPath(slateNode) : null;
          const isBibliography =
            path &&
            editor.api.some({
              at: path,
              match: (node) => (node as any).bibliography === true,
              mode: 'all',
            });
          const disabled =
            dataset?.slateEditor === 'true' ||
            readOnly ||
            dataset?.plateOpenContextMenu === 'false' ||
            isBibliography;

          if (disabled) return event.preventDefault();

          setTimeout(() => {
            api.blockMenu.show(BLOCK_CONTEXT_MENU_ID, {
              x: event.clientX,
              y: event.clientY,
            });
          }, 0);
        }}
      >
        <div className="w-full">{children}</div>
      </ContextMenuTrigger>
      {isOpen && (
        <ContextMenuContent
          className={contentClass}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            editor.getApi(BlockSelectionPlugin).blockSelection.focus();

            if (value === 'askAI') {
              editor.getApi(AIChatPlugin).aiChat.show();
            }

            setValue(null);
          }}
        >
          <ContextMenuGroup>
            <ContextMenuItem
              className={itemClass}
              onClick={() => {
                setValue('askAI');
              }}
            >
              <Wand2 className={iconClass} />
              KI fragen
            </ContextMenuItem>
            <ContextMenuItem
              className={itemClass}
              onClick={handleInsertCitation}
            >
              <Quote className={iconClass} />
              Zitat einfügen
            </ContextMenuItem>
            <ContextMenuItem
              className={itemClass}
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.removeNodes();
                editor.tf.focus();
              }}
            >
              <Trash2 className={iconClass} />
              Löschen
            </ContextMenuItem>
            <ContextMenuItem
              className={itemClass}
              onClick={() => {
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.duplicate();
              }}
            >
              <CopyPlus className={iconClass} />
              Duplizieren
              {/* <ContextMenuShortcut>⌘ + D</ContextMenuShortcut> */}
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className={itemClass}>
                <ArrowRightLeft className={iconClass} />
                Textformat ändern
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className={subContentClass}>
                <ContextMenuItem
                  className={itemClass}
                  onClick={() => handleTurnInto(KEYS.p)}
                >
                  <Type className={iconClass} />
                  Absatz
                </ContextMenuItem>

                <ContextMenuItem
                  className={itemClass}
                  onClick={() => handleTurnInto(KEYS.h1)}
                >
                  <Heading1 className={iconClass} />
                  Überschrift 1
                </ContextMenuItem>
                <ContextMenuItem
                  className={itemClass}
                  onClick={() => handleTurnInto(KEYS.h2)}
                >
                  <Heading2 className={iconClass} />
                  Überschrift 2
                </ContextMenuItem>
                <ContextMenuItem
                  className={itemClass}
                  onClick={() => handleTurnInto(KEYS.h3)}
                >
                  <Heading3 className={iconClass} />
                  Überschrift 3
                </ContextMenuItem>
                <ContextMenuItem
                  className={itemClass}
                  onClick={() => handleTurnInto(KEYS.blockquote)}
                >
                  <Quote className={iconClass} />
                  Zitatblock
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            {hasInlineEquation() && (
              <ContextMenuItem className={itemClass} onClick={handleInlineEquationToBlock}>
                <ArrowRightLeft className={iconClass} />
                Inline-Formel in Block umwandeln
              </ContextMenuItem>
            )}
            {hasBlockEquation() && (
              <ContextMenuItem className={itemClass} onClick={handleBlockEquationToInline}>
                <ArrowRightLeft className={iconClass} />
                Block-Formel in Inline umwandeln
              </ContextMenuItem>
            )}
          </ContextMenuGroup>

          <ContextMenuGroup>
            <ContextMenuItem
              className={itemClass}
              onClick={() =>
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.setIndent(1)
              }
            >
              <CornerDownRight className={iconClass} />
              Einzug vergrößern
            </ContextMenuItem>
            <ContextMenuItem
              className={itemClass}
              onClick={() =>
                editor
                  .getTransforms(BlockSelectionPlugin)
                  .blockSelection.setIndent(-1)
              }
            >
              <CornerDownLeft className={iconClass} />
              Einzug verkleinern
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger className={itemClass}>
                <AlignLeft className={iconClass} />
                Ausrichten
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className={subContentClass}>
                <ContextMenuItem
                  className={itemClass}
                  onClick={() => handleAlign('left')}
                >
                  <AlignLeft className={iconClass} />
                  Links
                </ContextMenuItem>
                <ContextMenuItem
                  className={itemClass}
                  onClick={() => handleAlign('center')}
                >
                  <AlignCenter className={iconClass} />
                  Zentriert
                </ContextMenuItem>
                <ContextMenuItem
                  className={itemClass}
                  onClick={() => handleAlign('right')}
                >
                  <AlignRight className={iconClass} />
                  Rechts
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
