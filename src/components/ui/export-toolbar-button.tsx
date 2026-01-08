'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { MarkdownPlugin } from '@platejs/markdown';
import { ArrowDownToLineIcon } from 'lucide-react';
import { createSlateEditor } from 'platejs';
import { useEditorRef } from 'platejs/react';
import { serializeHtml } from 'platejs/static';
import { exportToDocxAndDownload } from '@/lib/export/docx-exporter';
import { useCitationStore } from '@/lib/stores/citation-store';
import { extractTextFromNode, extractTitleFromContent } from '@/lib/supabase/utils/document-title';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BaseEditorKit } from '@/components/editor/editor-base-kit';

import { EditorStatic } from './editor-static';
import { ToolbarButton } from './toolbar';
import { useLanguage } from '@/lib/i18n/use-language';

const siteUrl = 'https://platejs.org';

/**
 * Extrahiert den Dokumenttitel aus dem Editor-Inhalt.
 * Verwendet die gemeinsame Utility-Funktion für Konsistenz.
 */
const extractDocumentTitle = (editorValue: any[]): string => {
  return extractTitleFromContent(editorValue);
};

// Sanitized einen Dateinamen (entfernt ungültige Zeichen)
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9\s-]/gi, '_')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '') || 'dokument';
};

export function ExportToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const { t, language } = useLanguage();

  // Check if onboarding is showing export step
  const { isOpen: isOnboardingOpen, getCurrentSubStep } = useOnboardingStore();
  const currentSubStep = getCurrentSubStep();
  const shouldForceOpen = isOnboardingOpen && currentSubStep?.id === 'open-export';

  // Effect to open dropdown when onboarding reaches export step
  React.useEffect(() => {
    if (shouldForceOpen && !open) {
      setOpen(true);
    }
  }, [shouldForceOpen, open]);

  // Handle open change - prevent closing during onboarding
  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (shouldForceOpen && !newOpen) {
      return; // Prevent closing during onboarding
    }
    setOpen(newOpen);
  }, [shouldForceOpen]);

  const tooltipText = React.useMemo(() => t('toolbar.export'), [t, language]);
  const exportingText = React.useMemo(() => t('toolbar.exporting'), [t, language]);
  const exportAsDocxText = React.useMemo(() => t('toolbar.exportAsDocx'), [t, language]);
  const exportAsPdfText = React.useMemo(() => t('toolbar.exportAsPdf'), [t, language]);
  const exportAsHtmlText = React.useMemo(() => t('toolbar.exportAsHtml'), [t, language]);
  const exportAsMarkdownText = React.useMemo(() => t('toolbar.exportAsMarkdown'), [t, language]);
  const exportAsImageText = React.useMemo(() => t('toolbar.exportAsImage'), [t, language]);

  // Extrahiere den Dokumentnamen aus dem Editor-Inhalt
  const getDocumentName = React.useCallback(() => {
    const title = extractDocumentTitle(editor.children);
    return sanitizeFilename(title);
  }, [editor.children]);

  const getCanvas = async () => {
    const { default: html2canvas } = await import('html2canvas-pro');

    const editorNode = editor.api.toDOMNode(editor)!;
    
    // Warte, bis alle Formeln vollständig gerendert sind
    // Prüfe auf KaTeX SVG-Elemente und warte, bis sie geladen sind
    const waitForFormulas = async () => {
      const katexElements = editorNode.querySelectorAll('.katex svg, .katex-mathml');
      const promises: Promise<void>[] = [];
      
      katexElements.forEach((element) => {
        // Warte, bis SVG vollständig geladen ist
        if (element.tagName === 'svg') {
          const svg = element as SVGSVGElement;
          const promise = new Promise<void>((resolve) => {
            // Prüfe ob SVG bereits Inhalt hat
            if (svg.children.length > 0) {
              // Versuche getBBox zu verwenden, um zu prüfen ob SVG gerendert ist
              try {
                if (svg.getBBox) {
                  svg.getBBox();
                }
                resolve();
              } catch {
                // SVG ist noch nicht vollständig gerendert
                const checkInterval = setInterval(() => {
                  try {
                    if (svg.children.length > 0) {
                      if (svg.getBBox) {
                        svg.getBBox();
                      }
                      clearInterval(checkInterval);
                      resolve();
                    }
                  } catch {
                    // Noch nicht bereit
                  }
                }, 50);
                
                // Timeout nach 2 Sekunden
                setTimeout(() => {
                  clearInterval(checkInterval);
                  resolve();
                }, 2000);
              }
            } else {
              const checkInterval = setInterval(() => {
                if (svg.children.length > 0) {
                  try {
                    if (svg.getBBox) {
                      svg.getBBox();
                    }
                  } catch {
                    // Ignoriere Fehler
                  }
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 50);
              
              // Timeout nach 2 Sekunden
              setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
              }, 2000);
            }
          });
          promises.push(promise);
        }
      });
      
      await Promise.all(promises);
      
      // Zusätzliche Wartezeit, um sicherzustellen, dass alles gerendert ist
      await new Promise(resolve => setTimeout(resolve, 200));
    };

    await waitForFormulas();

    const style = document.createElement('style');
    document.head.append(style);

    const canvas = await html2canvas(editorNode, {
      backgroundColor: '#ffffff',
      scale: 2, // Höhere Auflösung für bessere Formel-Qualität
      useCORS: true,
      allowTaint: false,
      logging: false,
      onclone: (clonedDoc: Document) => {
        const editorElement = clonedDoc.querySelector(
          '[contenteditable="true"]'
        );
        if (editorElement) {
          // Setze Hintergrundfarbe auf weiß für den Editor-Container
          const existingEditorStyle = editorElement.getAttribute('style') || '';
          editorElement.setAttribute(
            'style',
            `${existingEditorStyle}; background-color: #ffffff !important; color: #000000 !important;`
          );

          // Stelle sicher, dass KaTeX-Styles korrekt angewendet werden
          const katexElements = editorElement.querySelectorAll('.katex, .katex *');
          katexElements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            // Stelle sicher, dass SVG-Elemente sichtbar sind
            if (htmlElement.tagName === 'svg') {
              htmlElement.setAttribute('style', 'display: block !important;');
            }
            // Stelle sicher, dass Text-Elemente in SVG schwarz sind
            const textElements = htmlElement.querySelectorAll('text, tspan');
            textElements.forEach((textEl) => {
              textEl.setAttribute('fill', '#000000');
            });
          });

          // Setze Hintergrundfarbe für alle Kindelemente
          Array.from(editorElement.querySelectorAll('*')).forEach((element) => {
            const existingStyle = element.getAttribute('style') || '';
            const elementTag = (element as HTMLElement).tagName.toLowerCase();
            
            // Überspringe KaTeX-Elemente (werden oben behandelt)
            if (element.classList.contains('katex') || element.closest('.katex')) {
              return;
            }
            
            // Überspringe Elemente, die bereits einen eigenen Hintergrund haben sollten
            // (z.B. Code-Blöcke, Callouts, etc.)
            const shouldKeepBackground = ['pre', 'code', 'blockquote'].includes(elementTag);
            
            if (!shouldKeepBackground) {
              element.setAttribute(
                'style',
                `${existingStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important; background-color: transparent !important;`
              );
            } else {
              element.setAttribute(
                'style',
                `${existingStyle}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important`
              );
            }
          });
        }
      },
    });
    style.remove();

    return canvas;
  };

  const downloadFile = async (url: string, filename: string) => {
    const response = await fetch(url);

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();

    // Clean up the blob URL
    window.URL.revokeObjectURL(blobUrl);
  };

  const exportToPdf = async () => {
    const canvas = await getCanvas();

    const PDFLib = await import('pdf-lib');
    const pdfDoc = await PDFLib.PDFDocument.create();
    
    // A4-Format in points (72 DPI)
    const a4Width = 595.28;
    const a4Height = 841.89;
    
    // Margin für jede Seite (in points)
    const margin = 40;
    const contentWidth = a4Width - (margin * 2);
    const contentHeight = a4Height - (margin * 2);
    
    // Skaliere das Canvas-Bild auf die verfügbare Breite
    // Berücksichtige, dass canvas mit scale: 2 erstellt wurde
    const scaleFactor = contentWidth / canvas.width;
    const scaledCanvasHeight = canvas.height * scaleFactor;
    
    // Berechne die Anzahl der benötigten Seiten
    const numberOfPages = Math.ceil(scaledCanvasHeight / contentHeight);
    
    // Höhe einer Seite im Canvas-Koordinatensystem (unskaliert)
    const pageHeightInCanvas = contentHeight / scaleFactor;
    
    // Erstelle Seiten und fülle sie mit Inhalt
    for (let pageIndex = 0; pageIndex < numberOfPages; pageIndex++) {
      const page = pdfDoc.addPage([a4Width, a4Height]);
      
      // Berechne den Y-Offset für diese Seite im Canvas (unskaliert)
      // Verwende exakte Multiplikation, um Rundungsfehler zu vermeiden
      const sourceY = pageIndex * pageHeightInCanvas;
      
      // Berechne die tatsächliche Höhe für diese Seite
      // Für alle Seiten außer der letzten: exakt pageHeightInCanvas
      // Für die letzte Seite: verbleibende Höhe
      const isLastPage = pageIndex === numberOfPages - 1;
      const sourceHeight = isLastPage
        ? canvas.height - sourceY
        : pageHeightInCanvas;
      
      // Erstelle temporäres Canvas für diese Seite mit exakter Höhe
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = Math.ceil(sourceHeight); // Aufrunden für saubere Pixel
      const tempCtx = tempCanvas.getContext('2d');
      
      if (!tempCtx) {
        throw new Error('Konnte Canvas-Kontext nicht erstellen');
      }
      
      // Setze weißen Hintergrund
      tempCtx.fillStyle = '#ffffff';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Kopiere den entsprechenden Teil des Original-Canvas
      tempCtx.drawImage(
        canvas,
        0, // sourceX
        Math.floor(sourceY), // sourceY - abrunden für saubere Pixel
        canvas.width, // sourceWidth
        sourceHeight, // sourceHeight
        0, // destX
        0, // destY
        canvas.width, // destWidth
        sourceHeight // destHeight
      );
      
      // Konvertiere temporäres Canvas zu PNG
      const pageImageData = tempCanvas.toDataURL('PNG', 1.0);
      const pageImageEmbed = await pdfDoc.embedPng(pageImageData);
      
      // Für alle Seiten außer der letzten: verwende exakt contentHeight
      // Für die letzte Seite: berechne die tatsächliche skalierte Höhe
      const scaledHeight = isLastPage
        ? sourceHeight * scaleFactor
        : contentHeight;
      
      // Zeichne das Bild auf die PDF-Seite
      // In PDF-Lib wird Y von unten gemessen, daher: a4Height - margin - scaledHeight
      // Das platziert das Bild oben auf der Seite (margin vom oberen Rand)
      page.drawImage(pageImageEmbed, {
        x: margin,
        y: a4Height - margin - scaledHeight,
        width: contentWidth,
        height: scaledHeight,
      });
    }
    
    const pdfBase64 = await pdfDoc.saveAsBase64({ dataUri: true });

    const filename = `${getDocumentName()}.pdf`;
    await downloadFile(pdfBase64, filename);
  };

  const exportToImage = async () => {
    const canvas = await getCanvas();
    const filename = `${getDocumentName()}.png`;
    await downloadFile(canvas.toDataURL('image/png'), filename);
  };

  const exportToHtml = async () => {
    const editorStatic = createSlateEditor({
      plugins: BaseEditorKit,
      value: editor.children,
    });

    const editorHtml = await serializeHtml(editorStatic, {
      editorComponent: EditorStatic,
      props: { style: { padding: '0 calc(50% - 350px)', paddingBottom: '' } },
    });

    const tailwindCss = `<link rel="stylesheet" href="${siteUrl}/tailwind.css">`;
    const katexCss = `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.18/dist/katex.css" integrity="sha384-9PvLvaiSKCPkFKB1ZsEoTjgnJn+O3KvEwtsz37/XrkYft3DTk2gHdYvd9oWgW3tV" crossorigin="anonymous">`;

    const html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&family=JetBrains+Mono:wght@400..700&display=swap"
          rel="stylesheet"
        />
        ${tailwindCss}
        ${katexCss}
        <style>
          :root {
            --font-sans: 'Inter', 'Inter Fallback';
            --font-mono: 'JetBrains Mono', 'JetBrains Mono Fallback';
          }
        </style>
      </head>
      <body>
        ${editorHtml}
      </body>
    </html>`;

    const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

    const filename = `${getDocumentName()}.html`;
    await downloadFile(url, filename);
  };

  const exportToMarkdown = async () => {
    const md = editor.getApi(MarkdownPlugin).markdown.serialize();
    const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(md)}`;
    const filename = `${getDocumentName()}.md`;
    await downloadFile(url, filename);
  };

  const exportToDocx = async () => {
    if (isExporting) return;
    
    try {
      setIsExporting(true);
      setOpen(false);
      const citationStore = useCitationStore.getState();
      const filename = getDocumentName();
      await exportToDocxAndDownload(editor.children, filename, citationStore);
    } catch (error) {
      console.error('Fehler beim DOCX-Export:', error);
      // Optional: Toast-Benachrichtigung anzeigen
      alert('Fehler beim Export: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip={tooltipText} isDropdown data-onboarding="export-btn">
        <ArrowDownToLineIcon className="size-4" />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" data-onboarding="export-dropdown">
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={exportToDocx} disabled={isExporting}>
            {isExporting ? exportingText : exportAsDocxText}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToPdf}>
            {exportAsPdfText}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToHtml}>
            {exportAsHtmlText}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToMarkdown}>
            {exportAsMarkdownText}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={exportToImage}>
            {exportAsImageText}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
