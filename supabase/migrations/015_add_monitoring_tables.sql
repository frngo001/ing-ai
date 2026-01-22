-- Migration: Add User Monitoring & AI Usage Tracking System
-- Description: Implements comprehensive monitoring for AI requests, token usage, user sessions, and daily stats
-- Retention: 90 days with automatic cleanup

-- ============================================================================
-- 1. TABLE: ai_usage_logs
-- Purpose: Central logging for all AI requests with token tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Request Info
  endpoint TEXT NOT NULL,  -- 'ask', 'command', 'outline', 'agent/bachelorarbeit', etc.
  model TEXT NOT NULL,     -- 'deepseek-chat', 'deepseek-reasoner'

  -- Token Tracking
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Metadata
  request_metadata JSONB DEFAULT '{}'::jsonb,  -- {selection: bool, toolName: string, documentContextEnabled: bool, etc.}
  response_status TEXT,  -- 'success', 'error', 'rate_limited'
  error_message TEXT,

  -- Timing
  duration_ms INTEGER,  -- Request duration in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_endpoint ON public.ai_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_date ON public.ai_usage_logs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own logs
CREATE POLICY "Users can view own usage logs"
  ON public.ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. TABLE: agent_execution_logs
-- Purpose: Detailed logs for agent executions (tool calls, steps)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_execution_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  usage_log_id UUID REFERENCES public.ai_usage_logs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Agent Info
  agent_type TEXT NOT NULL,  -- 'bachelorarbeit', 'general', 'websearch'
  step_number INTEGER,

  -- Tool Tracking
  tool_calls JSONB DEFAULT '[]'::jsonb,  -- [{toolName: 'webSearch', duration: 1234, timestamp: ...}]
  tool_count INTEGER DEFAULT 0,

  -- Step Results
  text_output TEXT,
  reasoning TEXT,

  -- Timing
  step_duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_usage_log ON public.agent_execution_logs(usage_log_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_user ON public.agent_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_logs_agent_type ON public.agent_execution_logs(agent_type);

-- Enable Row Level Security
ALTER TABLE public.agent_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view own agent logs"
  ON public.agent_execution_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. TABLE: user_activity_sessions
-- Purpose: Session tracking for activity analysis and inactivity detection
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_activity_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Session Info
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  session_duration_minutes INTEGER,  -- Calculated when session ends

  -- Activity Metrics
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  endpoints_used TEXT[] DEFAULT '{}',  -- Array of used endpoints

  -- Device/Browser Info (optional)
  user_agent TEXT,
  ip_address TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_sessions_user_id ON public.user_activity_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_sessions_active ON public.user_activity_sessions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_activity_sessions_dates ON public.user_activity_sessions(session_start DESC);

-- Enable Row Level Security
ALTER TABLE public.user_activity_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sessions"
  ON public.user_activity_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON public.user_activity_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.user_activity_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_activity_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_activity_sessions_updated_at ON public.user_activity_sessions;
CREATE TRIGGER trigger_update_user_activity_sessions_updated_at
  BEFORE UPDATE ON public.user_activity_sessions
  FOR EACH ROW EXECUTE FUNCTION update_user_activity_sessions_updated_at();

-- ============================================================================
-- 4. TABLE: user_daily_stats
-- Purpose: Aggregated daily statistics for fast dashboard queries
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_daily_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Usage Metrics
  total_requests INTEGER DEFAULT 0,
  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Endpoint Breakdown
  ask_requests INTEGER DEFAULT 0,
  command_requests INTEGER DEFAULT 0,
  outline_requests INTEGER DEFAULT 0,
  transcribe_requests INTEGER DEFAULT 0,
  agent_requests INTEGER DEFAULT 0,

  -- Activity Metrics
  active_minutes INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_date ON public.user_daily_stats(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_daily_stats_date ON public.user_daily_stats(date DESC);

-- Enable Row Level Security
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view own stats"
  ON public.user_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_user_daily_stats_updated_at ON public.user_daily_stats;
CREATE TRIGGER trigger_update_user_daily_stats_updated_at
  BEFORE UPDATE ON public.user_daily_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. VIEW: user_usage_summary
-- Purpose: Convenient view for dashboard queries
-- ============================================================================

CREATE OR REPLACE VIEW public.user_usage_summary AS
SELECT
  u.user_id,
  COUNT(DISTINCT DATE(u.created_at)) as active_days,
  COUNT(*) as total_requests,
  SUM(u.input_tokens) as total_input_tokens,
  SUM(u.output_tokens) as total_output_tokens,
  SUM(u.total_tokens) as total_tokens,
  AVG(u.duration_ms) as avg_duration_ms,
  MAX(u.created_at) as last_activity,
  -- Cost calculation (DeepSeek pricing)
  ROUND((SUM(u.input_tokens)::numeric / 1000000 * 0.14)::numeric, 6) as estimated_input_cost,
  ROUND((SUM(u.output_tokens)::numeric / 1000000 * 0.28)::numeric, 6) as estimated_output_cost,
  ROUND(
    ((SUM(u.input_tokens)::numeric / 1000000 * 0.14) +
     (SUM(u.output_tokens)::numeric / 1000000 * 0.28))::numeric,
    6
  ) as estimated_total_cost
FROM public.ai_usage_logs u
WHERE u.response_status = 'success'
GROUP BY u.user_id;

-- ============================================================================
-- 6. RETENTION: 90-Day Auto-Cleanup Function
-- Purpose: Automatically delete logs older than 90 days
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_monitoring_logs()
RETURNS void AS $$
BEGIN
  -- Delete old logs (cascades to agent_execution_logs via FK)
  DELETE FROM public.ai_usage_logs
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Delete old sessions
  DELETE FROM public.user_activity_sessions
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Delete old daily stats
  DELETE FROM public.user_daily_stats
  WHERE date < CURRENT_DATE - INTERVAL '90 days';

  RAISE NOTICE 'Cleaned up monitoring logs older than 90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To enable automatic cleanup via cron, use pg_cron extension:
-- SELECT cron.schedule('cleanup-monitoring-logs', '0 2 * * *', 'SELECT cleanup_old_monitoring_logs()');
-- This requires pg_cron to be enabled in your Supabase project

-- ============================================================================
-- 7. HELPER FUNCTION: Get User Stats for Period
-- Purpose: Query helper for dashboard APIs
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_stats_for_period(
  p_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_requests BIGINT,
  total_input_tokens BIGINT,
  total_output_tokens BIGINT,
  total_tokens BIGINT,
  avg_tokens_per_request NUMERIC,
  endpoint_breakdown JSONB,
  daily_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH period_logs AS (
    SELECT *
    FROM public.ai_usage_logs
    WHERE user_id = p_user_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND response_status = 'success'
  ),
  totals AS (
    SELECT
      COUNT(*)::BIGINT as req_count,
      COALESCE(SUM(input_tokens), 0)::BIGINT as in_tokens,
      COALESCE(SUM(output_tokens), 0)::BIGINT as out_tokens,
      COALESCE(SUM(total_tokens), 0)::BIGINT as tot_tokens
    FROM period_logs
  ),
  endpoints AS (
    SELECT jsonb_object_agg(
      endpoint,
      cnt
    ) as breakdown
    FROM (
      SELECT endpoint, COUNT(*)::INTEGER as cnt
      FROM period_logs
      GROUP BY endpoint
    ) e
  ),
  daily AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'date', day::TEXT,
        'requests', req_count,
        'tokens', tok_count
      )
      ORDER BY day DESC
    ) as breakdown
    FROM (
      SELECT
        DATE(created_at) as day,
        COUNT(*)::INTEGER as req_count,
        COALESCE(SUM(total_tokens), 0)::INTEGER as tok_count
      FROM period_logs
      GROUP BY DATE(created_at)
    ) d
  )
  SELECT
    t.req_count,
    t.in_tokens,
    t.out_tokens,
    t.tot_tokens,
    CASE
      WHEN t.req_count > 0 THEN ROUND(t.tot_tokens::NUMERIC / t.req_count::NUMERIC, 2)
      ELSE 0
    END,
    COALESCE(e.breakdown, '{}'::jsonb),
    COALESCE(d.breakdown, '[]'::jsonb)
  FROM totals t
  CROSS JOIN endpoints e
  CROSS JOIN daily d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Tables created:
--   - ai_usage_logs (with 4 indexes)
--   - agent_execution_logs (with 3 indexes)
--   - user_activity_sessions (with 3 indexes)
--   - user_daily_stats (with 2 indexes)
-- Views created:
--   - user_usage_summary
-- Functions created:
--   - cleanup_old_monitoring_logs()
--   - get_user_stats_for_period(user_id, days)
-- ============================================================================
