-- Migration: Füge context Feld zu chat_messages hinzu
-- Speichert Kontext-Informationen (z.B. selektierter Text aus anderen Nachrichten) als JSONB

ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS context JSONB DEFAULT '[]'::jsonb;

-- Kommentar hinzufügen
COMMENT ON COLUMN public.chat_messages.context IS 'Array von Kontext-Informationen: [{text: string, addedAt: timestamp, sourceMessageId?: string}]';

