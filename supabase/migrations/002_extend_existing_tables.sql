-- Migration: Erweitere bestehende Tabellen
-- Run this in your Supabase SQL editor

-- Documents Tabelle erweitern
ALTER TABLE public.documents 
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Citations Tabelle erweitern - alle SavedCitation Felder hinzufügen
ALTER TABLE public.citations 
  ADD COLUMN IF NOT EXISTS library_id UUID REFERENCES public.citation_libraries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS last_edited TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS href TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS authors TEXT[],
  ADD COLUMN IF NOT EXISTS abstract TEXT,
  ADD COLUMN IF NOT EXISTS doi TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Migriere user_id für bestehende Citations aus document_id
UPDATE public.citations c
SET user_id = d.user_id
FROM public.documents d
WHERE c.document_id = d.id AND c.user_id IS NULL;

-- Sources Tabelle erweitern - fehlende Felder aus NormalizedSource
ALTER TABLE public.sources
  ADD COLUMN IF NOT EXISTS pmid TEXT,
  ADD COLUMN IF NOT EXISTS pmcid TEXT,
  ADD COLUMN IF NOT EXISTS arxiv_id TEXT,
  ADD COLUMN IF NOT EXISTS isbn TEXT,
  ADD COLUMN IF NOT EXISTS issn TEXT,
  ADD COLUMN IF NOT EXISTS journal TEXT,
  ADD COLUMN IF NOT EXISTS volume TEXT,
  ADD COLUMN IF NOT EXISTS issue TEXT,
  ADD COLUMN IF NOT EXISTS pages TEXT,
  ADD COLUMN IF NOT EXISTS publisher TEXT,
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS is_open_access BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  ADD COLUMN IF NOT EXISTS citation_count INTEGER,
  ADD COLUMN IF NOT EXISTS impact_factor NUMERIC,
  ADD COLUMN IF NOT EXISTS completeness NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_api TEXT,
  ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMP WITH TIME ZONE;

-- Triggers für updated_at auf neuen Tabellen
CREATE TRIGGER update_citation_libraries_updated_at BEFORE UPDATE ON public.citation_libraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slash_commands_updated_at BEFORE UPDATE ON public.slash_commands
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_states_updated_at BEFORE UPDATE ON public.agent_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussions_updated_at BEFORE UPDATE ON public.discussions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

