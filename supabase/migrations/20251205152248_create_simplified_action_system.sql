/*
  # Simplified Action-Based System

  1. New Tables
    - `action_templates`
      - Pre-defined bundles of tasks (Initial Credentialing, Name Change, etc.)
      - Can be system-defined or custom per organization
      - Defines what tasks get created when action is assigned

    - `provider_actions`
      - Tracks each action taken for a provider (keeps history separate)
      - Links to action_template and creates tasks
      - Stores metadata specific to that action (old/new name, dates, etc.)

    - Enhanced `payers` table
      - Add action-specific requirements (name_change vs initial_credentialing)
      - Keep existing columns but add optional overrides

  2. Changes to Existing Tables
    - `tasks` table gets new `provider_action_id` column to group by action

  3. Security
    - Enable RLS on all new tables
    - Users can only access data in their organization

  4. Notes
    - This simplifies the system by removing workflows/subflows
    - Actions are assigned to providers and automatically create appropriate tasks
    - Different actions can have different requirements for the same payer
    - Maintains complete history of all provider changes
*/

-- Create action_templates table
CREATE TABLE IF NOT EXISTS action_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL CHECK (category IN ('credentialing', 'change', 'renewal', 'custom')),

  -- What payers does this apply to? Empty array = all payers
  applies_to_payer_ids uuid[] DEFAULT ARRAY[]::uuid[],

  -- Custom requirements for this action type
  required_documents text[] DEFAULT ARRAY[]::text[],
  required_fields text[] DEFAULT ARRAY[]::text[],

  -- Task template definitions (JSONB for flexibility)
  task_templates jsonb DEFAULT '[]'::jsonb,

  -- System vs custom
  is_system_template boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(organization_id, name)
);

-- Create provider_actions table
CREATE TABLE IF NOT EXISTS provider_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action_template_id uuid REFERENCES action_templates(id) ON DELETE SET NULL,

  -- Action details
  action_type text NOT NULL CHECK (action_type IN (
    'initial_credentialing',
    'name_change',
    'address_change',
    're_credentialing',
    'add_single_payer',
    'custom'
  )),
  action_name text NOT NULL,

  -- Context specific to this action (flexible JSON)
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Which payers are involved
  payer_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],

  -- Status
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started',
    'in_progress',
    'completed',
    'cancelled'
  )),

  started_at timestamptz,
  completed_at timestamptz,

  -- Progress tracking
  total_tasks integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add provider_action_id to tasks table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'provider_action_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN provider_action_id uuid REFERENCES provider_actions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enhance payers table with action-specific requirements
DO $$
BEGIN
  -- Name change requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'name_change_required_documents'
  ) THEN
    ALTER TABLE payers ADD COLUMN name_change_required_documents text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'name_change_required_fields'
  ) THEN
    ALTER TABLE payers ADD COLUMN name_change_required_fields text[] DEFAULT ARRAY[]::text[];
  END IF;

  -- Re-credentialing requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'reauth_required_documents'
  ) THEN
    ALTER TABLE payers ADD COLUMN reauth_required_documents text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'reauth_required_fields'
  ) THEN
    ALTER TABLE payers ADD COLUMN reauth_required_fields text[] DEFAULT ARRAY[]::text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'reauth_interval_months'
  ) THEN
    ALTER TABLE payers ADD COLUMN reauth_interval_months integer;
  END IF;

  -- Foundation payer flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'is_foundation_payer'
  ) THEN
    ALTER TABLE payers ADD COLUMN is_foundation_payer boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_action_templates_organization_id ON action_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_actions_provider_id ON provider_actions(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_actions_organization_id ON provider_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_actions_status ON provider_actions(status);
CREATE INDEX IF NOT EXISTS idx_tasks_provider_action_id ON tasks(provider_action_id);

-- Enable RLS
ALTER TABLE action_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for action_templates
CREATE POLICY "Users can view templates in their org"
  ON action_templates FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL
    OR EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = action_templates.organization_id
    )
  );

CREATE POLICY "Managers can create templates in their org"
  ON action_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = action_templates.organization_id
      AND om.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update templates in their org"
  ON action_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = action_templates.organization_id
      AND om.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = action_templates.organization_id
      AND om.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can delete custom templates in their org"
  ON action_templates FOR DELETE
  TO authenticated
  USING (
    is_system_template = false
    AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = action_templates.organization_id
      AND om.role IN ('admin', 'manager')
    )
  );

-- RLS Policies for provider_actions
CREATE POLICY "Users can view actions in their org"
  ON provider_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_actions.organization_id
    )
  );

CREATE POLICY "Users can create actions in their org"
  ON provider_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_actions.organization_id
    )
  );

CREATE POLICY "Users can update actions in their org"
  ON provider_actions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_actions.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_actions.organization_id
    )
  );

CREATE POLICY "Managers can delete actions in their org"
  ON provider_actions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_actions.organization_id
      AND om.role IN ('admin', 'manager')
    )
  );

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_action_templates_updated_at') THEN
    CREATE TRIGGER update_action_templates_updated_at
      BEFORE UPDATE ON action_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_provider_actions_updated_at') THEN
    CREATE TRIGGER update_provider_actions_updated_at
      BEFORE UPDATE ON provider_actions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert system action templates
DO $$
DECLARE
  org_id uuid;
BEGIN
  -- Get all organizations and create system templates for each
  FOR org_id IN SELECT id FROM organizations LOOP
    -- Initial Credentialing Template
    INSERT INTO action_templates (
      organization_id,
      name,
      description,
      category,
      is_system_template,
      task_templates
    ) VALUES (
      org_id,
      'Initial Credentialing',
      'Complete initial credentialing process for all selected payers',
      'credentialing',
      true,
      '[
        {"title": "Collect provider demographics", "type": "field", "priority": 1, "description": "Gather all required provider information"},
        {"title": "Obtain required documents", "type": "document", "priority": 1, "description": "Collect all payer-required documentation"},
        {"title": "Submit application", "type": "submission", "priority": 2, "description": "Submit completed application to payer"},
        {"title": "Track approval", "type": "approval", "priority": 3, "description": "Monitor application status and approval"}
      ]'::jsonb
    ) ON CONFLICT (organization_id, name) DO NOTHING;

    -- Provider Name Change Template
    INSERT INTO action_templates (
      organization_id,
      name,
      description,
      category,
      is_system_template,
      required_documents,
      required_fields,
      task_templates
    ) VALUES (
      org_id,
      'Provider Name Change',
      'Update provider name across all selected payers',
      'change',
      true,
      ARRAY['Marriage Certificate', 'Divorce Decree', 'Court Order', 'Updated License'],
      ARRAY['legal_name_change_date', 'previous_legal_name', 'name_change_reason'],
      '[
        {"title": "Obtain legal documentation", "type": "document", "priority": 1, "description": "Marriage certificate, divorce decree, or court order"},
        {"title": "Update provider profile", "type": "field", "priority": 1, "description": "Update name in system"},
        {"title": "Notify all payers", "type": "custom", "priority": 2, "description": "Submit name change notifications to all credentialed payers"},
        {"title": "Update applications", "type": "submission", "priority": 2, "description": "Submit updated applications with new name"},
        {"title": "Obtain updated credentials", "type": "document", "priority": 3, "description": "Get updated approval letters with new name"}
      ]'::jsonb
    ) ON CONFLICT (organization_id, name) DO NOTHING;

    -- Re-credentialing Template
    INSERT INTO action_templates (
      organization_id,
      name,
      description,
      category,
      is_system_template,
      task_templates
    ) VALUES (
      org_id,
      'Re-credentialing',
      'Renew credentialing for existing payers',
      'renewal',
      true,
      '[
        {"title": "Review and update information", "type": "field", "priority": 1, "description": "Verify all information is current"},
        {"title": "Renew expiring documents", "type": "document", "priority": 1, "description": "Update any expired licenses, certifications, etc."},
        {"title": "Submit re-credentialing application", "type": "submission", "priority": 2, "description": "Submit renewal application"}
      ]'::jsonb
    ) ON CONFLICT (organization_id, name) DO NOTHING;

    -- Add Single Payer Template
    INSERT INTO action_templates (
      organization_id,
      name,
      description,
      category,
      is_system_template,
      task_templates
    ) VALUES (
      org_id,
      'Add Single Payer',
      'Add one payer to already credentialed provider',
      'credentialing',
      true,
      '[
        {"title": "Verify existing information", "type": "field", "priority": 1, "description": "Confirm provider info is current"},
        {"title": "Obtain payer-specific documents", "type": "document", "priority": 1, "description": "Get any documents specific to this payer"},
        {"title": "Submit application", "type": "submission", "priority": 2, "description": "Submit to new payer"},
        {"title": "Track approval", "type": "approval", "priority": 3, "description": "Monitor application status"}
      ]'::jsonb
    ) ON CONFLICT (organization_id, name) DO NOTHING;
  END LOOP;
END $$;

-- Function to auto-update provider_action progress
CREATE OR REPLACE FUNCTION update_provider_action_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.provider_action_id IS NOT NULL THEN
    UPDATE provider_actions
    SET
      completed_tasks = (
        SELECT COUNT(*)
        FROM tasks
        WHERE provider_action_id = NEW.provider_action_id
        AND status = 'completed'
      ),
      updated_at = now()
    WHERE id = NEW.provider_action_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update action progress when tasks change
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_action_progress_on_task_change') THEN
    CREATE TRIGGER update_action_progress_on_task_change
      AFTER INSERT OR UPDATE OF status ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION update_provider_action_progress();
  END IF;
END $$;