import { createClient } from '@/lib/supabase/client';
import { devLog, devError } from '@/lib/utils/logger';

/**
 * Chat Files Storage Utility
 *
 * Speichert Dateien, die im Chat verwendet werden, in Supabase Storage.
 * Struktur: chat-files/{user_id}/{conversation_id}/{filename}
 */

export interface ChatFileUploadResult {
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
  /** Extrahierter Textinhalt (für PDFs, DOCX, etc.) */
  extractedContent?: string;
  /** Message-ID der zugehörigen Nachricht */
  messageId?: string;
}

export interface ChatFileUploadOptions {
  /** Benutzer-ID */
  userId: string;
  /** Conversation-ID */
  conversationId: string;
  /** Message-ID */
  messageId?: string;
  /** Projekt-ID */
  projectId?: string;
  /** Extrahierter Textinhalt */
  extractedContent?: string;
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
 * Lädt eine Datei für den Chat zu Supabase Storage hoch
 */
export async function uploadChatFile(
  file: File,
  options: ChatFileUploadOptions
): Promise<ChatFileUploadResult> {
  const { userId, conversationId, messageId, projectId, extractedContent } = options;
  const supabase = createClient();

  // Generiere eindeutigen Dateinamen
  const uniqueFileName = generateUniqueFileName(file.name);

  // Erstelle Pfad: chat-files/user_id/conversation_id/filename
  const filePath = `chat-files/${userId}/${conversationId}/${uniqueFileName}`;

  devLog('[Chat File Upload] Starting upload:', { filePath, size: file.size, type: file.type });

  try {
    // Upload zu Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      devError('[Chat File Upload] Upload failed:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Hole öffentliche URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;

    // Speichere Metadaten in der Datenbank
    const { data: mediaRecord, error: dbError } = await supabase
      .from('media_files')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        message_id: messageId || null,
        project_id: projectId || null,
        file_name: file.name,
        file_path: data.path,
        file_size: file.size,
        mime_type: file.type,
        storage_url: publicUrl,
        extracted_content: extractedContent || null,
      })
      .select('id')
      .single();

    if (dbError) {
      devError('[Chat File Upload] Database insert failed:', dbError);
      // Lösche die hochgeladene Datei, wenn DB-Insert fehlschlägt
      await supabase.storage.from(BUCKET_NAME).remove([data.path]);
      throw new Error(`Database error: ${dbError.message}`);
    }

    devLog('[Chat File Upload] Upload successful:', { id: mediaRecord.id, url: publicUrl });

    return {
      id: mediaRecord.id,
      url: publicUrl,
      path: data.path,
      name: file.name,
      size: file.size,
      type: file.type,
      extractedContent,
      messageId,
    };
  } catch (error) {
    devError('[Chat File Upload] Error:', error);
    throw error;
  }
}

/**
 * Holt alle Chat-Dateien für eine Conversation
 */
export async function getChatFilesForConversation(conversationId: string): Promise<ChatFileUploadResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false });

  if (error) {
    devError('[Chat Files] Failed to get files:', error);
    throw new Error(`Failed to get files: ${error.message}`);
  }

  return data.map((record) => ({
    id: record.id,
    url: record.storage_url,
    path: record.file_path,
    name: record.file_name,
    size: record.file_size,
    type: record.mime_type,
    extractedContent: record.extracted_content || undefined,
    messageId: record.message_id || undefined,
  }));
}

/**
 * Holt Chat-Dateien für eine spezifische Nachricht
 */
export async function getChatFilesForMessage(messageId: string): Promise<ChatFileUploadResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('message_id', messageId)
    .order('created_at', { ascending: true });

  if (error) {
    devError('[Chat Files] Failed to get message files:', error);
    throw new Error(`Failed to get files: ${error.message}`);
  }

  return data.map((record) => ({
    id: record.id,
    url: record.storage_url,
    path: record.file_path,
    name: record.file_name,
    size: record.file_size,
    type: record.mime_type,
    extractedContent: record.extracted_content || undefined,
    messageId: record.message_id || undefined,
  }));
}

/**
 * Holt alle Chat-Dateien eines Benutzers (für Mentions)
 */
export async function getChatFilesForUser(userId: string, limit = 50): Promise<ChatFileUploadResult[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('user_id', userId)
    .not('conversation_id', 'is', null) // Nur Chat-Dateien
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    devError('[Chat Files] Failed to get user files:', error);
    throw new Error(`Failed to get files: ${error.message}`);
  }

  return data.map((record) => ({
    id: record.id,
    url: record.storage_url,
    path: record.file_path,
    name: record.file_name,
    size: record.file_size,
    type: record.mime_type,
    extractedContent: record.extracted_content || undefined,
    messageId: record.message_id || undefined,
  }));
}

/**
 * Holt eine Datei anhand ihrer ID
 */
export async function getChatFileById(fileId: string): Promise<ChatFileUploadResult | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('media_files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Nicht gefunden
    }
    devError('[Chat Files] Failed to get file:', error);
    throw new Error(`Failed to get file: ${error.message}`);
  }

  return {
    id: data.id,
    url: data.storage_url,
    path: data.file_path,
    name: data.file_name,
    size: data.file_size,
    type: data.mime_type,
    extractedContent: data.extracted_content || undefined,
    messageId: data.message_id || undefined,
  };
}

/**
 * Lädt den Dateiinhalt von einer Supabase Storage URL
 */
export async function downloadChatFile(fileUrl: string): Promise<Blob> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return response.blob();
}

/**
 * Erstellt ein File-Objekt aus einer gespeicherten Chat-Datei
 */
export async function createFileFromChatFile(chatFile: ChatFileUploadResult): Promise<File> {
  const blob = await downloadChatFile(chatFile.url);
  return new File([blob], chatFile.name, { type: chatFile.type });
}

/**
 * Löscht eine Chat-Datei
 */
export async function deleteChatFile(fileId: string): Promise<void> {
  const supabase = createClient();

  // Hole zuerst den Pfad
  const { data: fileData, error: fetchError } = await supabase
    .from('media_files')
    .select('file_path')
    .eq('id', fileId)
    .single();

  if (fetchError) {
    devError('[Chat Files] Failed to fetch file for deletion:', fetchError);
    throw new Error(`Failed to delete file: ${fetchError.message}`);
  }

  // Lösche aus Storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([fileData.file_path]);

  if (storageError) {
    devError('[Chat Files] Storage delete failed:', storageError);
    // Weiter mit DB-Löschung
  }

  // Lösche aus Datenbank
  const { error: dbError } = await supabase
    .from('media_files')
    .delete()
    .eq('id', fileId);

  if (dbError) {
    devError('[Chat Files] Database delete failed:', dbError);
    throw new Error(`Failed to delete file: ${dbError.message}`);
  }

  devLog('[Chat Files] Deleted:', fileId);
}
