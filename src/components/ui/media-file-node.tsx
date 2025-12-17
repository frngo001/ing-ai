'use client';

import * as React from 'react';

import type { TFileElement } from 'platejs';
import type { PlateElementProps } from 'platejs/react';

import { useMediaState } from '@platejs/media/react';
import { ResizableProvider } from '@platejs/resizable';
import { Eye, FileUp } from 'lucide-react';
import { PlateElement, useReadOnly, withHOC } from 'platejs/react';

import { Caption, CaptionTextarea } from './caption';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './dialog';

export const FileElement = withHOC(
  ResizableProvider,
  function FileElement(props: PlateElementProps<TFileElement>) {
    const readOnly = useReadOnly();
    const { name, unsafeUrl } = useMediaState();
    const [previewOpen, setPreviewOpen] = React.useState(false);

    const fileExtension = name?.split('.').pop()?.toLowerCase() || '';
    const isPdf = fileExtension === 'pdf';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension);
    const isText = ['txt', 'md', 'json', 'xml', 'csv'].includes(fileExtension);

    const handlePreview = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setPreviewOpen(true);
    };

    return (
      <>
        <PlateElement className="my-px rounded-sm" {...props}>
          <div className="group relative m-0 flex items-center rounded px-0.5 py-[3px]">
            <a
              className="flex flex-1 cursor-pointer items-center gap-1 p-1 hover:bg-muted"
              contentEditable={false}
              download={name}
              href={unsafeUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              <FileUp className="size-5" />
              <div className="flex-1 truncate">{name}</div>
            </a>
            
            {(isPdf || isImage || isText) && (
              <button
                className="ml-1 flex items-center justify-center rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                contentEditable={false}
                onClick={handlePreview}
                title="Vorschau anzeigen"
                type="button"
              >
                <Eye className="size-4 text-muted-foreground" />
              </button>
            )}

            <Caption align="left">
              <CaptionTextarea
                className="text-left"
                readOnly={readOnly}
                placeholder="Write a caption..."
              />
            </Caption>
          </div>
          {props.children}
        </PlateElement>

        <Dialog onOpenChange={setPreviewOpen} open={previewOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>{name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {isPdf && (
                <iframe
                  className="h-full w-full min-h-[600px] rounded-md border"
                  src={unsafeUrl}
                  title={name}
                />
              )}
              {isImage && (
                <img
                  alt={name}
                  className="mx-auto max-h-full w-full object-contain rounded-md"
                  src={unsafeUrl}
                />
              )}
              {isText && (
                <DocumentTextPreview url={unsafeUrl} />
              )}
              {!isPdf && !isImage && !isText && (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FileUp className="mb-4 size-12 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Vorschau für diesen Dateityp nicht verfügbar
                  </p>
                  <a
                    className="mt-4 text-primary hover:underline"
                    download={name}
                    href={unsafeUrl}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Datei herunterladen
                  </a>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

function DocumentTextPreview({ url }: { url: string }) {
  const [content, setContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Fehler beim Laden der Datei');
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Lade Datei...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <a
          className="text-primary hover:underline"
          download
          href={url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Datei herunterladen
        </a>
      </div>
    );
  }

  return (
    <pre className="max-h-[70vh] overflow-auto rounded-md border bg-muted p-4 text-sm">
      <code>{content}</code>
    </pre>
  );
}
