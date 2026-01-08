import * as React from 'react';

import type { OurFileRouter } from '@/lib/uploadthing';
import type {
  ClientUploadedFileData,
  UploadFilesOptions,
} from 'uploadthing/types';

import { generateReactHelpers } from '@uploadthing/react';
import { toast } from 'sonner';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/client';
import { uploadMediaToSupabase, type MediaUploadResult } from '@/lib/supabase/utils/media-storage';
import { devLog, devError } from '@/lib/utils/logger';

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>;

interface UseUploadFileProps
  extends Pick<
    UploadFilesOptions<OurFileRouter['editorUploader']>,
    'headers' | 'onUploadBegin' | 'onUploadProgress' | 'skipPolling'
  > {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
  /** Optional: Dokument-ID für Supabase-Zuordnung */
  documentId?: string;
  /** Optional: Projekt-ID für Supabase-Zuordnung */
  projectId?: string;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
  documentId,
  projectId,
  ...props
}: UseUploadFileProps = {}) {
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  /**
   * Versucht Upload zu Supabase Storage
   * Fallback: UploadThing wenn Supabase fehlschlägt
   */
  async function uploadToSupabase(file: File): Promise<UploadedFile | null> {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        devLog('[Upload] No authenticated user, skipping Supabase upload');
        return null;
      }

      devLog('[Upload] Uploading to Supabase Storage:', file.name);

      const result = await uploadMediaToSupabase(file, {
        userId: user.id,
        documentId,
        projectId,
        onProgress: (p) => setProgress(p),
      });

      // Konvertiere zu UploadedFile Format
      const uploadedFile: UploadedFile = {
        key: result.id,
        appUrl: result.url,
        name: result.name,
        size: result.size,
        type: result.type,
        url: result.url,
      } as UploadedFile;

      devLog('[Upload] Supabase upload successful:', result.url);
      return uploadedFile;
    } catch (error) {
      devError('[Upload] Supabase upload failed:', error);
      return null;
    }
  }

  async function uploadThing(file: File) {
    setIsUploading(true);
    setUploadingFile(file);

    try {
      // Versuche zuerst Supabase Storage
      const supabaseResult = await uploadToSupabase(file);

      if (supabaseResult) {
        setUploadedFile(supabaseResult);
        onUploadComplete?.(supabaseResult);
        return supabaseResult;
      }

      // Fallback: UploadThing
      devLog('[Upload] Trying UploadThing fallback');
      const res = await uploadFiles('editorUploader', {
        ...props,
        files: [file],
        onUploadProgress: ({ progress }) => {
          setProgress(Math.min(progress, 100));
        },
      });

      setUploadedFile(res[0]);
      onUploadComplete?.(res[0]);

      return res[0];
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      const message =
        errorMessage.length > 0
          ? errorMessage
          : 'Something went wrong, please try again later.';

      // Versuche nochmal Supabase als letzten Fallback
      devLog('[Upload] UploadThing failed, trying Supabase as final fallback');
      const supabaseResult = await uploadToSupabase(file);

      if (supabaseResult) {
        setUploadedFile(supabaseResult);
        onUploadComplete?.(supabaseResult);
        return supabaseResult;
      }

      toast.error(message);
      onUploadError?.(error);

      // Letzter Fallback: Lokale blob-URL (nur für Preview, nicht persistent!)
      devError('[Upload] All upload methods failed, using temporary blob URL');
      toast.warning('Bild wird nur temporär gespeichert. Bitte melden Sie sich an für permanente Speicherung.');

      const tempUploadedFile = {
        key: `temp-${Date.now()}`,
        appUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      } as UploadedFile;

      // Simulate upload progress
      let prog = 0;
      const simulateProgress = async () => {
        while (prog < 100) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          prog += 5;
          setProgress(Math.min(prog, 100));
        }
      };

      await simulateProgress();

      setUploadedFile(tempUploadedFile);
      onUploadComplete?.(tempUploadedFile);

      return tempUploadedFile;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadingFile,
  };
}

export const { uploadFiles, useUploadThing } =
  generateReactHelpers<OurFileRouter>();

export function getErrorMessage(err: unknown) {
  const unknownError = 'Something went wrong, please try again later.';

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => issue.message);

    return errors.join('\n');
  }
  if (err instanceof Error) {
    return err.message;
  }
  return unknownError;
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);

  return toast.error(errorMessage);
}
