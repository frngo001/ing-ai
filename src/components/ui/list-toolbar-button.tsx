'use client';

import * as React from 'react';

import { ListStyleType, someList, toggleList } from '@platejs/list';
import {
  useIndentTodoToolBarButton,
  useIndentTodoToolBarButtonState,
} from '@platejs/list/react';
import { List, ListOrdered, ListTodoIcon } from 'lucide-react';
import { useEditorRef, useEditorSelector } from 'platejs/react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import {
  ToolbarButton,
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';
import { useLanguage } from '@/lib/i18n/use-language';

export function BulletedListToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const { t, language } = useLanguage();

  const pressed = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Disc,
        ListStyleType.Circle,
        ListStyleType.Square,
      ]),
    []
  );

  const tooltipText = React.useMemo(() => t('toolbar.bulletList'), [t, language]);
  const listDefaultText = React.useMemo(() => t('toolbar.listDefault'), [t, language]);
  const listCircleText = React.useMemo(() => t('toolbar.listCircle'), [t, language]);
  const listSquareText = React.useMemo(() => t('toolbar.listSquare'), [t, language]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToolbarSplitButton pressed={open}>
          <ToolbarSplitButtonPrimary
            className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            onClick={() => {
              toggleList(editor, {
                listStyleType: ListStyleType.Disc,
              });
            }}
            data-state={pressed ? 'on' : 'off'}
          >
            <List className="size-4" />
          </ToolbarSplitButtonPrimary>

          <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <ToolbarSplitButtonSecondary />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" alignOffset={-32}>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() =>
                    toggleList(editor, {
                      listStyleType: ListStyleType.Disc,
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full border border-current bg-current" />
                    {listDefaultText}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toggleList(editor, {
                      listStyleType: ListStyleType.Circle,
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full border border-current" />
                    {listCircleText}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toggleList(editor, {
                      listStyleType: ListStyleType.Square,
                    })
                  }
                >
                  <div className="flex items-center gap-2">
                    <div className="size-2 border border-current bg-current" />
                    {listSquareText}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolbarSplitButton>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

export function NumberedListToolbarButton() {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const { t, language } = useLanguage();

  const pressed = useEditorSelector(
    (editor) =>
      someList(editor, [
        ListStyleType.Decimal,
        ListStyleType.LowerAlpha,
        ListStyleType.UpperAlpha,
        ListStyleType.LowerRoman,
        ListStyleType.UpperRoman,
      ]),
    []
  );

  const tooltipText = React.useMemo(() => t('toolbar.numberedList'), [t, language]);
  const listDecimalText = React.useMemo(() => t('toolbar.listDecimal'), [t, language]);
  const listLowerAlphaText = React.useMemo(() => t('toolbar.listLowerAlpha'), [t, language]);
  const listUpperAlphaText = React.useMemo(() => t('toolbar.listUpperAlpha'), [t, language]);
  const listLowerRomanText = React.useMemo(() => t('toolbar.listLowerRoman'), [t, language]);
  const listUpperRomanText = React.useMemo(() => t('toolbar.listUpperRoman'), [t, language]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ToolbarSplitButton pressed={open}>
          <ToolbarSplitButtonPrimary
            className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
            onClick={() =>
              toggleList(editor, {
                listStyleType: ListStyleType.Decimal,
              })
            }
            data-state={pressed ? 'on' : 'off'}
          >
            <ListOrdered className="size-4" />
          </ToolbarSplitButtonPrimary>

          <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
            <DropdownMenuTrigger asChild>
              <ToolbarSplitButtonSecondary />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" alignOffset={-32}>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() =>
                    toggleList(editor, {
                      listStyleType: ListStyleType.Decimal,
                    })
                  }
                >
                  {listDecimalText}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    toggleList(editor, {
                      listStyleType: ListStyleType.LowerAlpha,
                    })
                  }
                >
                  {listLowerAlphaText}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    toggleList(editor, {
                      listStyleType: ListStyleType.UpperAlpha,
                    })
                  }
                >
                  {listUpperAlphaText}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    toggleList(editor, {
                      listStyleType: ListStyleType.LowerRoman,
                    })
                  }
                >
                  {listLowerRomanText}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    toggleList(editor, {
                      listStyleType: ListStyleType.UpperRoman,
                    })
                  }
                >
                  {listUpperRomanText}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </ToolbarSplitButton>
      </TooltipTrigger>
      <TooltipContent>{tooltipText}</TooltipContent>
    </Tooltip>
  );
}

export function TodoListToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const state = useIndentTodoToolBarButtonState({ nodeType: 'todo' });
  const { props: buttonProps } = useIndentTodoToolBarButton(state);
  const { t, language } = useLanguage();

  const tooltipText = React.useMemo(() => t('toolbar.todoList'), [t, language]);

  return (
    <ToolbarButton {...props} {...buttonProps} tooltip={tooltipText}>
      <ListTodoIcon />
    </ToolbarButton>
  );
}
