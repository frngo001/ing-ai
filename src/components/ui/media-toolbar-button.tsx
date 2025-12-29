'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { PlaceholderPlugin } from '@platejs/media/react';
import {
  AudioLinesIcon,
  FileUpIcon,
  FilmIcon,
  ImageIcon,
  LinkIcon,
} from 'lucide-react';
import { isUrl, KEYS } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { toast } from 'sonner';
import { useFilePicker } from 'use-file-picker';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/lib/i18n/use-language';

import {
  ToolbarSplitButton,
  ToolbarSplitButtonPrimary,
  ToolbarSplitButtonSecondary,
} from './toolbar';

const MEDIA_ICONS: Record<string, React.ReactNode> = {
  [KEYS.audio]: <AudioLinesIcon className="size-4" />,
  [KEYS.file]: <FileUpIcon className="size-4" />,
  [KEYS.img]: <ImageIcon className="size-4" />,
  [KEYS.video]: <FilmIcon className="size-4" />,
};

const MEDIA_ACCEPT: Record<string, string[]> = {
  [KEYS.audio]: ['audio/*'],
  [KEYS.file]: ['*'],
  [KEYS.img]: ['image/*'],
  [KEYS.video]: ['video/*'],
};

const MEDIA_TITLE_KEYS: Record<string, string> = {
  [KEYS.audio]: 'toolbar.insertAudio',
  [KEYS.file]: 'toolbar.insertFile',
  [KEYS.img]: 'toolbar.insertImage',
  [KEYS.video]: 'toolbar.insertVideo',
};

const MEDIA_TOOLTIP_KEYS: Record<string, string> = {
  [KEYS.audio]: 'toolbar.audio',
  [KEYS.file]: 'toolbar.file',
  [KEYS.img]: 'toolbar.imageMedia',
  [KEYS.video]: 'toolbar.video',
};

export function MediaToolbarButton({
  nodeType,
  ...props
}: DropdownMenuProps & { nodeType: string }) {
  const { t, language } = useLanguage();

  const currentIcon = MEDIA_ICONS[nodeType];
  const currentAccept = MEDIA_ACCEPT[nodeType];
  const currentTitle = React.useMemo(() => t(MEDIA_TITLE_KEYS[nodeType]), [t, language, nodeType]);
  const currentTooltip = React.useMemo(() => t(MEDIA_TOOLTIP_KEYS[nodeType]), [t, language, nodeType]);
  const uploadText = React.useMemo(() => t('toolbar.uploadFromComputer'), [t, language]);
  const insertViaUrlText = React.useMemo(() => t('toolbar.insertViaUrl'), [t, language]);

  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const { openFilePicker } = useFilePicker({
    accept: currentAccept,
    multiple: true,
    onFilesSelected: ({ plainFiles: updatedFiles }) => {
      editor.getTransforms(PlaceholderPlugin).insert.media(updatedFiles);
    },
  });

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <ToolbarSplitButton
            onClick={() => {
              openFilePicker();
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setOpen(true);
              }
            }}
            pressed={open}
          >
            <ToolbarSplitButtonPrimary>
              {currentIcon}
            </ToolbarSplitButtonPrimary>

            <DropdownMenu
              open={open}
              onOpenChange={setOpen}
              modal={false}
              {...props}
            >
              <DropdownMenuTrigger asChild>
                <ToolbarSplitButtonSecondary />
              </DropdownMenuTrigger>

              <DropdownMenuContent
                onClick={(e) => e.stopPropagation()}
                align="start"
                alignOffset={-32}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => openFilePicker()}>
                    {currentIcon}
                    {uploadText}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                    <LinkIcon />
                    {insertViaUrlText}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ToolbarSplitButton>
        </TooltipTrigger>
        <TooltipContent>{currentTooltip}</TooltipContent>
      </Tooltip>

      <AlertDialog
        open={dialogOpen}
        onOpenChange={(value) => {
          setDialogOpen(value);
        }}
      >
        <AlertDialogContent className="gap-6">
          <MediaUrlDialogContent
            title={currentTitle}
            nodeType={nodeType}
            setOpen={setDialogOpen}
          />
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MediaUrlDialogContent({
  title,
  nodeType,
  setOpen,
}: {
  title: string;
  nodeType: string;
  setOpen: (value: boolean) => void;
}) {
  const editor = useEditorRef();
  const { t, language } = useLanguage();
  const [url, setUrl] = React.useState('');

  const invalidUrlText = React.useMemo(() => t('toolbar.invalidUrl'), [t, language]);
  const cancelText = React.useMemo(() => t('toolbar.dialogCancel'), [t, language]);
  const acceptText = React.useMemo(() => t('toolbar.dialogAccept'), [t, language]);

  const embedMedia = React.useCallback(() => {
    if (!isUrl(url)) return toast.error(invalidUrlText);

    setOpen(false);
    editor.tf.insertNodes({
      children: [{ text: '' }],
      name: nodeType === KEYS.file ? url.split('/').pop() : undefined,
      type: nodeType,
      url,
    });
  }, [url, editor, nodeType, setOpen, invalidUrlText]);

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <label
          className="-translate-y-1/2 absolute top-1/2 block cursor-text px-1 text-muted-foreground/70 text-sm transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:font-medium group-focus-within:text-foreground group-focus-within:text-xs has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground has-[+input:not(:placeholder-shown)]:text-xs"
          htmlFor="url"
        >
          <span className="inline-flex bg-background px-2">URL</span>
        </label>
        <Input
          id="url"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') embedMedia();
          }}
          placeholder=""
          type="url"
          autoFocus
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>{cancelText}</AlertDialogCancel>
        <AlertDialogAction
          onClick={(e) => {
            e.preventDefault();
            embedMedia();
          }}
        >
          {acceptText}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}
