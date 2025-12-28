-- Migration: Füge doi Spalte zur citations Tabelle hinzu
-- Run this in your Supabase SQL editor

ALTER TABLE public.citations 
  ADD COLUMN IF NOT EXISTS doi TEXT;

-- Erstelle Index für bessere Performance bei DOI-Suchen
CREATE INDEX IF NOT EXISTS citations_doi_idx ON public.citations(doi) WHERE doi IS NOT NULL;

