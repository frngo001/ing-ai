import type { Value, TElement } from 'platejs';
import { createClient } from '@/lib/supabase/client';
import {
  uploadBlobUrlToSupabase,
  isBlobUrl,
  isSupabaseStorageUrl,
} from '@/lib/supabase/utils/media-storage';
import { devLog, devError, devWarn } from '@/lib/utils/logger';

/**
 * Konvertiert alle blob:-URLs im Editor-Content zu permanenten Supabase Storage URLs
 *
 * Diese Funktion sollte aufgerufen werden:
 * 1. Beim Speichern des Dokuments
 * 2. Vor dem Export in DOCX/PDF
 * 3. Periodisch im Hintergrund
 */

export interface ConvertBlobUrlsOptions {
  /** Dokument-ID für die Zuordnung */
  documentId?: string;
  /** Projekt-ID für die Zuordnung */
  projectId?: string;
  /** Callback für Fortschritt (0-100) */
  onProgress?: (progress: number, converted: number, total: number) => void;
}

export interface ConvertBlobUrlsResult {
  /** Anzahl der konvertierten URLs */
  converted: number;
  /** Anzahl der fehlgeschlagenen Konvertierungen */
  failed: number;
  /** Der aktualisierte Content */
  content: Value;
  /** Fehlerdetails */
  errors: Array<{ url: string; error: string }>;
}

/**
 * Findet alle Elemente mit blob:-URLs im Editor-Content
 */
function findBlobUrls(content: Value): Array<{ path: number[]; element: TElement; url: string; urlField: string }> {
  const results: Array<{ path: number[]; element: TElement; url: string; urlField: string }> = [];

  function traverse(nodes: any[], currentPath: number[] = []) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodePath = [...currentPath, i];

      if (node && typeof node === 'object') {
        // Prüfe verschiedene URL-Felder
        const urlFields = ['url', 'src', 'href'];
        for (const field of urlFields) {
          if (typeof node[field] === 'string' && isBlobUrl(node[field])) {
            results.push({
              path: nodePath,
              element: node as TElement,
              url: node[field],
              urlField: field,
            });
          }
        }

        // Rekursiv durch Kinder
        if (Array.isArray(node.children)) {
          traverse(node.children, nodePath);
        }
      }
    }
  }

  traverse(content);
  return results;
}

/**
 * Ersetzt eine URL in einem Element
 */
function replaceUrlInElement(element: TElement, urlField: string, newUrl: string): TElement {
  return {
    ...element,
    [urlField]: newUrl,
  } as TElement;
}

/**
 * Aktualisiert den Content mit der neuen URL an einem bestimmten Pfad
 */
function updateContentAtPath(content: Value, path: number[], urlField: string, newUrl: string): Value {
  const newContent = JSON.parse(JSON.stringify(content)) as Value;

  let current: any = newContent;
  for (let i = 0; i < path.length - 1; i++) {
    if (Array.isArray(current)) {
      current = current[path[i]];
    } else if (current.children) {
      current = current.children[path[i]];
    }
  }

  const lastIndex = path[path.length - 1];
  if (Array.isArray(current)) {
    current[lastIndex] = {
      ...current[lastIndex],
      [urlField]: newUrl,
    };
  } else if (current.children) {
    current.children[lastIndex] = {
      ...current.children[lastIndex],
      [urlField]: newUrl,
    };
  }

  return newContent;
}

/**
 * Extrahiert Dateiname und MIME-Type aus einer blob-URL
 */
async function getBlobInfo(blobUrl: string): Promise<{ fileName: string; mimeType: string }> {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const mimeType = blob.type || 'application/octet-stream';

    // Generiere Dateiname basierend auf MIME-Type
    const extensionMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'application/pdf': 'pdf',
    };

    const extension = extensionMap[mimeType] || 'bin';
    const fileName = `media_${Date.now()}.${extension}`;

    return { fileName, mimeType };
  } catch (error) {
    devError('[ConvertBlobUrls] Failed to get blob info:', error);
    return { fileName: `media_${Date.now()}.bin`, mimeType: 'application/octet-stream' };
  }
}

/**
 * Konvertiert alle blob:-URLs im Editor-Content zu permanenten URLs
 */
export async function convertBlobUrlsToSupabase(
  content: Value,
  options: ConvertBlobUrlsOptions = {}
): Promise<ConvertBlobUrlsResult> {
  const { documentId, projectId, onProgress } = options;

  // Hole authentifizierten Benutzer
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    devWarn('[ConvertBlobUrls] No authenticated user, cannot convert blob URLs');
    return {
      converted: 0,
      failed: 0,
      content,
      errors: [],
    };
  }

  // Finde alle blob-URLs
  const blobUrls = findBlobUrls(content);

  if (blobUrls.length === 0) {
    devLog('[ConvertBlobUrls] No blob URLs found');
    return {
      converted: 0,
      failed: 0,
      content,
      errors: [],
    };
  }

  devLog(`[ConvertBlobUrls] Found ${blobUrls.length} blob URLs to convert`);

  let converted = 0;
  let failed = 0;
  const errors: Array<{ url: string; error: string }> = [];
  let updatedContent = content;

  for (let i = 0; i < blobUrls.length; i++) {
    const { path, url, urlField } = blobUrls[i];

    try {
      // Prüfe ob die URL noch gültig ist
      const { fileName, mimeType } = await getBlobInfo(url);

      devLog(`[ConvertBlobUrls] Converting ${i + 1}/${blobUrls.length}: ${url}`);

      // Lade zu Supabase hoch
      const result = await uploadBlobUrlToSupabase(url, fileName, mimeType, {
        userId: user.id,
        documentId,
        projectId,
      });

      // Aktualisiere Content
      updatedContent = updateContentAtPath(updatedContent, path, urlField, result.url);
      converted++;

      devLog(`[ConvertBlobUrls] Converted: ${url} -> ${result.url}`);
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ url, error: errorMessage });
      devError(`[ConvertBlobUrls] Failed to convert ${url}:`, error);
    }

    // Fortschritts-Callback
    if (onProgress) {
      const progress = Math.round(((i + 1) / blobUrls.length) * 100);
      onProgress(progress, converted, blobUrls.length);
    }
  }

  devLog(`[ConvertBlobUrls] Completed: ${converted} converted, ${failed} failed`);

  return {
    converted,
    failed,
    content: updatedContent,
    errors,
  };
}

/**
 * Prüft ob Content blob-URLs enthält
 */
export function hasBlobUrls(content: Value): boolean {
  return findBlobUrls(content).length > 0;
}

/**
 * Zählt die Anzahl der blob-URLs im Content
 */
export function countBlobUrls(content: Value): number {
  return findBlobUrls(content).length;
}

/**
 * Hook für automatische Konvertierung beim Speichern
 */
export async function ensurePermanentUrls(
  content: Value,
  documentId?: string,
  projectId?: string
): Promise<Value> {
  if (!hasBlobUrls(content)) {
    return content;
  }

  const result = await convertBlobUrlsToSupabase(content, {
    documentId,
    projectId,
  });

  if (result.failed > 0) {
    devWarn(`[EnsurePermanentUrls] ${result.failed} URLs could not be converted`);
  }

  return result.content;
}
