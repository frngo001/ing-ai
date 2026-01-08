-- Migration: 013_migrate_data_to_projects.sql
-- Migrate existing data to default projects for each user

-- Create a function to migrate data for each user
CREATE OR REPLACE FUNCTION migrate_user_data_to_default_project()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  default_project_id UUID;
BEGIN
  -- Loop through all users who have documents, libraries, or agent states without project_id
  FOR user_record IN
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM public.documents WHERE project_id IS NULL AND user_id IS NOT NULL
      UNION
      SELECT user_id FROM public.citation_libraries WHERE project_id IS NULL AND user_id IS NOT NULL
      UNION
      SELECT user_id FROM public.agent_states WHERE project_id IS NULL AND user_id IS NOT NULL
      UNION
      SELECT user_id FROM public.chat_conversations WHERE project_id IS NULL AND user_id IS NOT NULL
    ) all_users
    WHERE user_id IS NOT NULL
  LOOP
    -- Check if user already has a default project
    SELECT id INTO default_project_id
    FROM public.projects
    WHERE user_id = user_record.user_id AND is_default = true;

    -- Create default project if it doesn't exist
    IF default_project_id IS NULL THEN
      INSERT INTO public.projects (user_id, name, description, is_default)
      VALUES (
        user_record.user_id,
        'Mein erstes Projekt',
        'Automatisch erstelltes Standardprojekt',
        true
      )
      RETURNING id INTO default_project_id;
    END IF;

    -- Migrate documents
    UPDATE public.documents
    SET project_id = default_project_id
    WHERE user_id = user_record.user_id AND project_id IS NULL;

    -- Migrate citation_libraries
    UPDATE public.citation_libraries
    SET project_id = default_project_id
    WHERE user_id = user_record.user_id AND project_id IS NULL;

    -- Migrate agent_states
    UPDATE public.agent_states
    SET project_id = default_project_id
    WHERE user_id = user_record.user_id AND project_id IS NULL;

    -- Migrate chat_conversations
    UPDATE public.chat_conversations
    SET project_id = default_project_id
    WHERE user_id = user_record.user_id AND project_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute migration
SELECT migrate_user_data_to_default_project();

-- Clean up the function
DROP FUNCTION migrate_user_data_to_default_project();
