-- Migration: Add notification settings to user_preferences
-- This migration adds columns for email, push, and desktop notifications

-- Add notification columns to user_preferences
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS desktop_notifications_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_summary_frequency TEXT DEFAULT 'daily'
    CHECK (notification_summary_frequency IN ('realtime', 'daily', 'weekly'));

-- Create activity_log table for tracking user activities (for summaries)
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'document_created',
    'document_edited',
    'project_created',
    'citation_added',
    'export_completed'
  )),
  entity_id UUID, -- ID of the document/project/citation
  entity_title TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_log
DO $$
BEGIN
  -- SELECT Policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_activity_log'
    AND policyname = 'Users can view own activity'
  ) THEN
    CREATE POLICY "Users can view own activity"
      ON public.user_activity_log FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- INSERT Policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_activity_log'
    AND policyname = 'Users can insert own activity'
  ) THEN
    CREATE POLICY "Users can insert own activity"
      ON public.user_activity_log FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- DELETE Policy (for cleanup)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'user_activity_log'
    AND policyname = 'Users can delete own activity'
  ) THEN
    CREATE POLICY "Users can delete own activity"
      ON public.user_activity_log FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Index for faster queries by user and date
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_created
  ON public.user_activity_log(user_id, created_at DESC);

-- Create email_notifications_queue table for sending emails
CREATE TABLE IF NOT EXISTS public.email_notifications_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'project_created',
    'daily_summary',
    'weekly_summary',
    'realtime_activity'
  )),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.email_notifications_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_notifications_queue (only system can access)
-- Users shouldn't directly access the queue

-- Index for processing pending emails
CREATE INDEX IF NOT EXISTS idx_email_notifications_queue_status
  ON public.email_notifications_queue(status, created_at);

-- Function to log activity and queue email if needed
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_entity_title TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
  v_email_enabled BOOLEAN;
  v_summary_frequency TEXT;
BEGIN
  -- Insert activity log
  INSERT INTO public.user_activity_log (user_id, activity_type, entity_id, entity_title, details)
  VALUES (p_user_id, p_activity_type, p_entity_id, p_entity_title, p_details)
  RETURNING id INTO v_activity_id;

  -- Check user's notification preferences
  SELECT email_notifications_enabled, notification_summary_frequency
  INTO v_email_enabled, v_summary_frequency
  FROM public.user_preferences
  WHERE user_id = p_user_id;

  -- If realtime notifications are enabled and email is enabled, queue the email
  IF v_email_enabled AND v_summary_frequency = 'realtime' THEN
    INSERT INTO public.email_notifications_queue (user_id, email_type, payload)
    VALUES (p_user_id, 'realtime_activity', jsonb_build_object(
      'activity_type', p_activity_type,
      'entity_title', p_entity_title,
      'details', p_details
    ));
  END IF;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
