-- Migration: RLS Policies für neue Tabellen
-- Run this in your Supabase SQL editor

-- RLS Policies for citation_libraries
CREATE POLICY "Users can view own citation libraries"
  ON public.citation_libraries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own citation libraries"
  ON public.citation_libraries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own citation libraries"
  ON public.citation_libraries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own citation libraries"
  ON public.citation_libraries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view own chat conversations"
  ON public.chat_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat conversations"
  ON public.chat_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat conversations"
  ON public.chat_conversations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.chat_conversations WHERE id = conversation_id));

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.chat_conversations WHERE id = conversation_id));

CREATE POLICY "Users can update own chat messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.chat_conversations WHERE id = conversation_id));

CREATE POLICY "Users can delete own chat messages"
  ON public.chat_messages FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.chat_conversations WHERE id = conversation_id));

-- RLS Policies for saved_messages
CREATE POLICY "Users can view own saved messages"
  ON public.saved_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved messages"
  ON public.saved_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved messages"
  ON public.saved_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved messages"
  ON public.saved_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for slash_commands
CREATE POLICY "Users can view own slash commands"
  ON public.slash_commands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own slash commands"
  ON public.slash_commands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own slash commands"
  ON public.slash_commands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own slash commands"
  ON public.slash_commands FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for agent_states
CREATE POLICY "Users can view own agent states"
  ON public.agent_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent states"
  ON public.agent_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent states"
  ON public.agent_states FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent states"
  ON public.agent_states FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for discussions
CREATE POLICY "Users can view own discussions"
  ON public.discussions FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id));

CREATE POLICY "Users can insert own discussions"
  ON public.discussions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id));

CREATE POLICY "Users can update own discussions"
  ON public.discussions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discussions"
  ON public.discussions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Users can view own comments"
  ON public.comments FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM public.discussions WHERE id = discussion_id));

CREATE POLICY "Users can insert own comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for citations (erweitert für library_id)
-- Zusätzliche Policy für Citations in Libraries
CREATE POLICY "Users can view own citations in libraries"
  ON public.citations FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id) OR
    auth.uid() = (SELECT user_id FROM public.citation_libraries WHERE id = library_id)
  );

CREATE POLICY "Users can insert own citations in libraries"
  ON public.citations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    (library_id IS NULL OR auth.uid() = (SELECT user_id FROM public.citation_libraries WHERE id = library_id)) AND
    (document_id IS NULL OR auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id))
  );

CREATE POLICY "Users can update own citations in libraries"
  ON public.citations FOR UPDATE
  USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id) OR
    (library_id IS NOT NULL AND auth.uid() = (SELECT user_id FROM public.citation_libraries WHERE id = library_id))
  );

CREATE POLICY "Users can delete own citations in libraries"
  ON public.citations FOR DELETE
  USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT user_id FROM public.documents WHERE id = document_id) OR
    (library_id IS NOT NULL AND auth.uid() = (SELECT user_id FROM public.citation_libraries WHERE id = library_id))
  );

