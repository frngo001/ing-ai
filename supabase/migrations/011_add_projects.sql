-- Migration: 011_add_projects.sql
-- Creates the projects table and adds project_id to related tables

-- Step 1: Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Step 2: Add project_id to documents (nullable for migration)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Step 3: Add project_id to citation_libraries (nullable for migration)
ALTER TABLE public.citation_libraries
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Step 4: Add project_id to agent_states (nullable for migration)
ALTER TABLE public.agent_states
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Step 5: Add project_id to chat_conversations (nullable for migration)
ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- Step 6: Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_default ON public.projects(user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_citation_libraries_project_id ON public.citation_libraries(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_states_project_id ON public.agent_states(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_project_id ON public.chat_conversations(project_id);

-- Step 7: Unique constraint - only one default project per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_unique_default
  ON public.projects(user_id) WHERE is_default = true;
