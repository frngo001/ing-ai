-- Migration: Fix Missing RLS Policies for Monitoring Tables
-- Description: Adds INSERT and UPDATE policies for user_daily_stats and ai_usage_logs
-- Issue: Server-side aggregation was failing due to missing INSERT/UPDATE policies

-- ============================================================================
-- 1. FIX: user_daily_stats - Add INSERT and UPDATE policies
-- ============================================================================

-- Drop existing policies if they exist (safe re-run)
DROP POLICY IF EXISTS "Users can insert own stats" ON public.user_daily_stats;
DROP POLICY IF EXISTS "Users can update own stats" ON public.user_daily_stats;

-- Allow users to insert their own stats
CREATE POLICY "Users can insert own stats"
  ON public.user_daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own stats
CREATE POLICY "Users can update own stats"
  ON public.user_daily_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. FIX: ai_usage_logs - Add INSERT policy
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own usage logs" ON public.ai_usage_logs;

-- Allow users to insert their own usage logs
CREATE POLICY "Users can insert own usage logs"
  ON public.ai_usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 3. FIX: agent_execution_logs - Add INSERT policy
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own agent logs" ON public.agent_execution_logs;

-- Allow users to insert their own agent execution logs
CREATE POLICY "Users can insert own agent logs"
  ON public.agent_execution_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Fixed:
--   - user_daily_stats: Added INSERT and UPDATE policies
--   - ai_usage_logs: Added INSERT policy
--   - agent_execution_logs: Added INSERT policy
-- ============================================================================
