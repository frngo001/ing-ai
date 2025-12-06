-- Jenni AI Clone Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  default_citation_style TEXT DEFAULT 'apa',
  default_document_type TEXT DEFAULT 'essay',
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'light',
  ai_autocomplete_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Documents
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}'::jsonb, -- Tiptap JSON format
  document_type TEXT DEFAULT 'essay',
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document history for version control
CREATE TABLE IF NOT EXISTS public.document_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research sources
CREATE TABLE IF NOT EXISTS public.sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  authors TEXT[],
  publication_year INTEGER,
  publication_type TEXT, -- 'journal', 'book', 'website', 'pdf', etc.
  url TEXT,
  doi TEXT,
  abstract TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PDF uploads
CREATE TABLE IF NOT EXISTS public.pdf_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_id UUID REFERENCES public.sources(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Supabase storage path
  file_size INTEGER,
  extracted_text TEXT,
  page_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citations
CREATE TABLE IF NOT EXISTS public.citations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  citation_style TEXT NOT NULL, -- 'apa', 'mla', 'chicago', 'ieee', etc.
  in_text_citation TEXT NOT NULL,
  full_citation TEXT NOT NULL,
  page_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pdf_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for documents
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for document_history
CREATE POLICY "Users can view own document history"
  ON public.document_history FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id));

CREATE POLICY "Users can insert own document history"
  ON public.document_history FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id));

-- RLS Policies for sources
CREATE POLICY "Users can view own sources"
  ON public.sources FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sources"
  ON public.sources FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sources"
  ON public.sources FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sources"
  ON public.sources FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for pdf_uploads
CREATE POLICY "Users can view own PDFs"
  ON public.pdf_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PDFs"
  ON public.pdf_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own PDFs"
  ON public.pdf_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for citations
CREATE POLICY "Users can view own citations"
  ON public.citations FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id));

CREATE POLICY "Users can insert own citations"
  ON public.citations FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id));

CREATE POLICY "Users can update own citations"
  ON public.citations FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id));

CREATE POLICY "Users can delete own citations"
  ON public.citations FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id));

-- Create indexes for performance
CREATE INDEX documents_user_id_idx ON public.documents(user_id);
CREATE INDEX documents_created_at_idx ON public.documents(created_at DESC);
CREATE INDEX sources_user_id_idx ON public.sources(user_id);
CREATE INDEX pdf_uploads_user_id_idx ON public.pdf_uploads(user_id);
CREATE INDEX citations_document_id_idx ON public.citations(document_id);
CREATE INDEX document_history_document_id_idx ON public.document_history(document_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON public.sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for PDFs (run this separately or via Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pdfs', 'pdfs', false);

-- Storage policies for PDFs
-- CREATE POLICY "Users can upload own PDFs"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can view own PDFs"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete own PDFs"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
