/*
  # Payer-Centric Workflow System Schema Updates

  This migration transforms the system from workflow-centric to payer-centric by:

  1. Payer Enhancements
    - Adds timing fields (days_to_approve, days_to_load)
    - Adds requirement tracking (required_documents, required_provider_fields)
    - Adds priority system (priority_base, is_always_required)

  2. Many-to-Many Junction Tables
    - workflow_subflows: Links workflows to reusable subflow templates
    - payer_subflows: Links payers to their generated subflows
    - workflows_payers: Links workflows to included payers with ordering

  3. Subflows as Templates
    - Makes workflow_id nullable (subflows can be standalone)
    - Adds is_template flag for reusable subflows
    - Adds payer_id link for payer-generated subflows

  4. Task Template System
    - payer_task_templates: Template definitions for auto-generating tasks
    - Supports different task types and trigger conditions

  5. Task Priority System
    - Adds computed_priority, priority_reason, blocks_payers to tasks
    - Enables intelligent task ordering based on dependencies

  6. Admin Configuration
    - priority_rules: Customizable priority calculation rules
    - Allows admins to fine-tune task prioritization logic
*/

-- =====================================================
-- SECTION 1: EXTEND PAYERS TABLE
-- =====================================================

-- Add timing fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'days_to_approve'
  ) THEN
    ALTER TABLE payers ADD COLUMN days_to_approve integer DEFAULT 30;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'days_to_load'
  ) THEN
    ALTER TABLE payers ADD COLUMN days_to_load integer DEFAULT 60;
  END IF;
END $$;

-- Add requirement fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'required_documents'
  ) THEN
    ALTER TABLE payers ADD COLUMN required_documents jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'required_provider_fields'
  ) THEN
    ALTER TABLE payers ADD COLUMN required_provider_fields jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add priority fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'priority_base'
  ) THEN
    ALTER TABLE payers ADD COLUMN priority_base integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'is_always_required'
  ) THEN
    ALTER TABLE payers ADD COLUMN is_always_required boolean DEFAULT false;
  END IF;
END $$;

-- =====================================================
-- SECTION 2: CREATE JUNCTION TABLES
-- =====================================================

-- workflow_subflows: Links workflows to reusable subflow templates
CREATE TABLE IF NOT EXISTS workflow_subflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  subflow_id uuid NOT NULL REFERENCES subflows(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workflow_id, subflow_id)
);

-- payer_subflows: Links payers to their generated subflows
CREATE TABLE IF NOT EXISTS payer_subflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id uuid NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
  subflow_id uuid NOT NULL REFERENCES subflows(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(payer_id, subflow_id)
);

-- workflows_payers: Links workflows to included payers with ordering
CREATE TABLE IF NOT EXISTS workflows_payers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(workflow_id, payer_id)
);

-- =====================================================
-- SECTION 3: MODIFY SUBFLOWS FOR TEMPLATES
-- =====================================================

-- Make workflow_id nullable for standalone templates
DO $$
BEGIN
  ALTER TABLE subflows ALTER COLUMN workflow_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Add template-related fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'is_template'
  ) THEN
    ALTER TABLE subflows ADD COLUMN is_template boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'payer_id'
  ) THEN
    ALTER TABLE subflows ADD COLUMN payer_id uuid REFERENCES payers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- SECTION 4: CREATE TASK TEMPLATE SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS payer_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id uuid NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
  title_template text NOT NULL,
  description_template text DEFAULT '',
  task_type text NOT NULL CHECK (task_type IN ('document', 'info', 'submit', 'approval', 'loading')),
  trigger_condition text DEFAULT 'manual',
  priority_modifier integer DEFAULT 0,
  due_date_offset_days integer DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 5: ADD TASK PRIORITY FIELDS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'computed_priority'
  ) THEN
    ALTER TABLE tasks ADD COLUMN computed_priority integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority_reason'
  ) THEN
    ALTER TABLE tasks ADD COLUMN priority_reason text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'blocks_payers'
  ) THEN
    ALTER TABLE tasks ADD COLUMN blocks_payers jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- =====================================================
-- SECTION 6: CREATE PRIORITY RULES SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS priority_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('payer_base', 'dependency_count', 'due_date', 'task_type', 'custom')),
  rule_config jsonb DEFAULT '{}'::jsonb,
  weight numeric DEFAULT 1.0,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- SECTION 7: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workflow_subflows_workflow ON workflow_subflows(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_subflows_subflow ON workflow_subflows(subflow_id);
CREATE INDEX IF NOT EXISTS idx_payer_subflows_payer ON payer_subflows(payer_id);
CREATE INDEX IF NOT EXISTS idx_payer_subflows_subflow ON payer_subflows(subflow_id);
CREATE INDEX IF NOT EXISTS idx_workflows_payers_workflow ON workflows_payers(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflows_payers_payer ON workflows_payers(payer_id);
CREATE INDEX IF NOT EXISTS idx_subflows_payer ON subflows(payer_id);
CREATE INDEX IF NOT EXISTS idx_subflows_is_template ON subflows(is_template);
CREATE INDEX IF NOT EXISTS idx_payer_task_templates_payer ON payer_task_templates(payer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_computed_priority ON tasks(computed_priority);
CREATE INDEX IF NOT EXISTS idx_priority_rules_org ON priority_rules(organization_id);

-- =====================================================
-- SECTION 8: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE workflow_subflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE payer_subflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payer_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE priority_rules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SECTION 9: CREATE RLS POLICIES
-- =====================================================

-- workflow_subflows policies
CREATE POLICY "Users can view workflow_subflows in their org"
  ON workflow_subflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflow_subflows.workflow_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = w.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert workflow_subflows in their org"
  ON workflow_subflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflow_subflows.workflow_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = w.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update workflow_subflows in their org"
  ON workflow_subflows FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflow_subflows.workflow_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = w.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete workflow_subflows in their org"
  ON workflow_subflows FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflow_subflows.workflow_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = w.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

-- payer_subflows policies
CREATE POLICY "Users can view payer_subflows in their org"
  ON payer_subflows FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payers p
      WHERE p.id = payer_subflows.payer_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = p.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert payer_subflows in their org"
  ON payer_subflows FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payers p
      WHERE p.id = payer_subflows.payer_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = p.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update payer_subflows in their org"
  ON payer_subflows FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payers p
      WHERE p.id = payer_subflows.payer_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = p.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete payer_subflows in their org"
  ON payer_subflows FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payers p
      WHERE p.id = payer_subflows.payer_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = p.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

-- workflows_payers policies
CREATE POLICY "Users can view workflows_payers in their org"
  ON workflows_payers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflows_payers.workflow_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = w.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert workflows_payers in their org"
  ON workflows_payers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflows_payers.workflow_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = w.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update workflows_payers in their org"
  ON workflows_payers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflows_payers.workflow_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = w.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete workflows_payers in their org"
  ON workflows_payers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflows w
      WHERE w.id = workflows_payers.workflow_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = w.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

-- payer_task_templates policies
CREATE POLICY "Users can view payer_task_templates in their org"
  ON payer_task_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payers p
      WHERE p.id = payer_task_templates.payer_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = p.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert payer_task_templates in their org"
  ON payer_task_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM payers p
      WHERE p.id = payer_task_templates.payer_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = p.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update payer_task_templates in their org"
  ON payer_task_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payers p
      WHERE p.id = payer_task_templates.payer_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = p.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete payer_task_templates in their org"
  ON payer_task_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payers p
      WHERE p.id = payer_task_templates.payer_id
      AND EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.organization_id = p.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

-- priority_rules policies
CREATE POLICY "Users can view priority_rules in their org"
  ON priority_rules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = priority_rules.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert priority_rules in their org"
  ON priority_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = priority_rules.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can update priority_rules in their org"
  ON priority_rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = priority_rules.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete priority_rules in their org"
  ON priority_rules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = priority_rules.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    )
  );