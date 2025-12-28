-- Migration: Performance-Indizes für neue Tabellen
-- Run this in your Supabase SQL editor

-- Citation Libraries Indizes
CREATE INDEX IF NOT EXISTS citation_libraries_user_id_idx ON public.citation_libraries(user_id);
CREATE INDEX IF NOT EXISTS citation_libraries_is_default_idx ON public.citation_libraries(user_id, is_default) WHERE is_default = true;

-- Citations Indizes (erweitert)
CREATE INDEX IF NOT EXISTS citations_library_id_idx ON public.citations(library_id);
CREATE INDEX IF NOT EXISTS citations_user_id_idx ON public.citations(user_id);
CREATE INDEX IF NOT EXISTS citations_document_id_library_id_idx ON public.citations(document_id, library_id);

-- Chat Conversations Indizes
CREATE INDEX IF NOT EXISTS chat_conversations_user_id_idx ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS chat_conversations_user_updated_idx ON public.chat_conversations(user_id, updated_at DESC);

-- Chat Messages Indizes
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_created_idx ON public.chat_messages(conversation_id, created_at);

-- Saved Messages Indizes
CREATE INDEX IF NOT EXISTS saved_messages_user_id_idx ON public.saved_messages(user_id);
CREATE INDEX IF NOT EXISTS saved_messages_user_created_idx ON public.saved_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_messages_message_id_idx ON public.saved_messages(message_id);

-- Slash Commands Indizes
CREATE INDEX IF NOT EXISTS slash_commands_user_id_idx ON public.slash_commands(user_id);

-- Agent States Indizes
CREATE INDEX IF NOT EXISTS agent_states_user_id_idx ON public.agent_states(user_id);
CREATE INDEX IF NOT EXISTS agent_states_user_active_idx ON public.agent_states(user_id, is_active) WHERE is_active = true;

-- Discussions Indizes
CREATE INDEX IF NOT EXISTS discussions_document_id_idx ON public.discussions(document_id);
CREATE INDEX IF NOT EXISTS discussions_user_id_idx ON public.discussions(user_id);
CREATE INDEX IF NOT EXISTS discussions_document_user_idx ON public.discussions(document_id, user_id);
CREATE INDEX IF NOT EXISTS discussions_resolved_idx ON public.discussions(document_id, is_resolved) WHERE is_resolved = false;

-- Comments Indizes
CREATE INDEX IF NOT EXISTS comments_discussion_id_idx ON public.comments(discussion_id);
CREATE INDEX IF NOT EXISTS comments_discussion_created_idx ON public.comments(discussion_id, created_at);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);

