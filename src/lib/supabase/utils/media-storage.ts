import { createClient } from '@/lib/supabase/client';
import { devLog, devError } from '@/lib/utils/logger';

/**
 * Supabase Media Storage Utility
 *
 * Speichert Bilder und andere Medien permanent in Supabase Storage.
 * Struktur: media/{user_id}/{document_id?}/{filename}
 */

export interface MediaUploadResult {
  /** Eindeutige ID der Datei */
  id: string;
  /** Öffentliche URL der Datei */
  url: string;
  /** Pfad in Supabase Storage */
  path: string;
  /** Original-Dateiname */
  name: string;
  /** Dateigröße in Bytes */
  size: number;
  /** MIME-Type */
  type: string;
  /** Bildbreite (nur bei Bildern) */
  width?: number;
  /** Bildhöhe (nur bei Bildern) */
  height?: number;
}

export interface MediaUploadOptions {
  /** Benutzer-ID (muss authentifiziert sein) */
  userId: string;
  /** Optional: Dokument-ID für Zuordnung */
  documentId?: string;
  /** Optional: Projekt-ID für Zuordnung */
  projectId?: string;
  /** Optional: Custom-Dateiname (sonst wird Original verwendet) */
  fileName?: string;
  /** Optional: Fortschritts-Callback */
  onProgress?: (progress: number) => void;
}

const BUCKET_NAME = 'media';

/**
 * Generiert einen eindeutigen Dateinamen
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || '';
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${baseName}_${timestamp}_${random}.${extension}`;
}

/**
 * Ermittelt die Bildabmessungen
 */
async function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith('image/')) {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Lädt eine Datei zu Supabase Storage hoch
 */
export async function uploadMediaToSupabase(
  file: File,
  options: MediaUploadOptions
): Promise<MediaUploadResult> {
  const { userId, documentId, projectId, fileName, onProgress } = options;
  const supabase = createClient();

  // Generiere eindeutigen Dateinamen
  const uniqueFileName = fileName || generateUniqueFileName(file.name);

  // Erstelle Pfad: user_id/[document_id/]filename
  const pathParts = [userId];
  if (documentId) {
    pathParts.push(documentId);
  }
  pathParts.push(uniqueFileName);
  const filePath = pathParts.join('/');

  devLog('[Media Upload] Starting upload:', { filePath, size: file.size, type: file.type });

  // Simuliere Fortschritt (Supabase SDK unterstützt kein Progress-Tracking direkt)
  let progressInterval: NodeJS.Timeout | null = null;
  if (onProgress) {
    let simulatedProgress = 0;
    progressInterval = setInterval(() => {
      simulatedProgress = Math.min(simulatedProgress + 10, 90);
      onProgress(simulatedProgress);
    }, 100);
  }

  try {
    // Upload zu Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (progressInterval) {
      clearInterval(progressInterval);
    }

    if (error) {
      devError('[Media Upload] Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Hole öffentliche URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Ermittle Bildabmessungen
    const dimensions = await getImageDimensions(file);

    // Speichere Metadaten in der Datenbank
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: userId,
        document_id: documentId || null,
        project_id: projectId || null,
        file_name: file.name,
        file_path: data.path,
        file_size: file.size,
        mime_type: file.type,
        width: dimensions?.width || null,
        height: dimensions?.height || null,
        storage_url: publicUrl,
      })
      .select('id')
      .single();

    if (dbError) {
      devError('[Media Upload] Database insert failed:', dbError);
      // Lösche die hochgeladene Datei, wenn DB-Insert fehlschlägt
      await supabase.storage.from(BUCKET_NAME).remove([data.path]);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (onProgress) {
      onProgress(100);
    }

    devLog('[Media Upload] Upload successful:', { id: mediaRecord.id, url: publicUrl });

    return {
      id: mediaRecord.id,
      url: publicUrl,
      path: data.path,
      name: file.name,
      size: file.size,
      type: file.type,
      width: dimensions?.width,
      height: dimensions?.height,
    };
  } catch (error) {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    throw error;
  }
}

/**
 * Lädt eine Datei von einer blob:-URL zu Supabase hoch
 */
export async function uploadBlobUrlToSupabase(
  blobUrl: string,
  fileName: string,
  mimeType: string,
  options: Omit<MediaUploadOptions, 'fileName'>
): Promise<MediaUploadResult> {
  // Hole Blob von der URL
  const response = await fetch(blobUrl);
  const blob = await response.blob();

  // Erstelle File aus Blob
  const file = new File([blob], fileName, { type: mimeType });

  // Upload mit normalem Verfahren
  return uploadMediaToSupabase(file, { ...options, fileName });
}

/**
 * Löscht eine Datei aus Supabase Storage
 */
export async function deleteMediaFromSupabase(filePath: string): Promise<void> {
  const supabase = createClient();

  // Lösche aus Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (storageError) {
    devError('[Media Delete] Storage delete failed:', storageError);
    throw new Error(`Delete failed: ${storageError.message}`);
  }

  // Lösche Metadaten aus Datenbank
  const { error: dbError } = await supabase
    .from('media_files')
    .delete()
    .eq('file_path', filePath);

  if (dbError) {
    devError('[Media Delete] Database delete failed:', dbError);
    // Kein Throw, da Datei bereits gelöscht wurde
  }

  devLog('[Media Delete] Deleted:', filePath);
}

/**
 * Holt alle Medien für ein Dokument
 */
export async function getMediaForDocument(documentId: string): Promise<MediaUploadResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  if (error) {
    devError('[Media Get] Failed to get media:', error);
    throw new Error(`Failed to get media: ${error.message}`);
  }

  return data.map((record) => ({
    id: record.id,
    url: record.storage_url,
    path: record.file_path,
    name: record.file_name,
    size: record.file_size,
    type: record.mime_type,
    width: record.width || undefined,
    height: record.height || undefined,
  }));
}

/**
 * Holt alle Medien für einen Benutzer
 */
export async function getMediaForUser(userId: string): Promise<MediaUploadResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    devError('[Media Get] Failed to get user media:', error);
    throw new Error(`Failed to get media: ${error.message}`);
  }

  return data.map((record) => ({
    id: record.id,
    url: record.storage_url,
    path: record.file_path,
    name: record.file_name,
    size: record.file_size,
    type: record.mime_type,
    width: record.width || undefined,
    height: record.height || undefined,
  }));
}

/**
 * Prüft ob eine URL eine blob:-URL ist
 */
export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Prüft ob eine URL eine Supabase Storage URL ist
 */
export function isSupabaseStorageUrl(url: string): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  return url.includes(supabaseUrl) && url.includes('/storage/');
}
