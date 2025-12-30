-- Migration: Füge files Feld zu chat_messages hinzu
-- Speichert Datei-Metadaten (name, size, type) als JSONB

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;

-- Kommentar hinzufügen
COMMENT ON COLUMN public.chat_messages.files IS 'Array von Datei-Metadaten: [{name: string, size: number, type: string}]';

