-- Migration: Add project_shares table for sharing projects with other users
-- This table stores share links with access modes (view, edit, suggest)

CREATE TABLE IF NOT EXISTS project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('view', 'edit', 'suggest')),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_shares_token ON project_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_project_shares_project ON project_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_project_shares_owner ON project_shares(owner_id);

-- RLS Policies for project_shares
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shares"
  ON project_shares FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create shares for their own projects"
  ON project_shares FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (SELECT 1 FROM projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update their own shares"
  ON project_shares FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own shares"
  ON project_shares FOR DELETE
  USING (auth.uid() = owner_id);

-- Allow authenticated users to read shares by token (for accessing shared projects)
CREATE POLICY "Authenticated users can access shares by token"
  ON project_shares FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    is_active = true AND
    (expires_at IS NULL OR expires_at > NOW())
  );
