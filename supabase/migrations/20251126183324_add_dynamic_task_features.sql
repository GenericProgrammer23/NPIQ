/*
  # Add Dynamic Task Features

  Adds support for dynamic task updates and completion-triggered task generation.

  1. Changes to tasks table:
    - Add task_template_id to link tasks back to their templates
    - Add auto_generated flag to distinguish system vs manual tasks
    - Add last_updated_by_system timestamp for tracking dynamic updates

  2. Changes to payer_task_templates table:
    - Extend trigger_condition to support more trigger types
    - Add prevents_duplication flag
    - Add completion_triggers_template_ids for chaining tasks

  3. Changes to providers table:
    - Add credentialing_loaded_date for EMR loading tracking

  4. Security:
    - All changes maintain existing RLS policies
*/

-- =====================================================
-- SECTION 1: ADD FIELDS TO TASKS TABLE
-- =====================================================

DO $$
BEGIN
  -- Add task_template_id to link tasks to their generating templates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'task_template_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN task_template_id uuid REFERENCES payer_task_templates(id) ON DELETE SET NULL;
  END IF;

  -- Add auto_generated flag to distinguish system vs manual tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'auto_generated'
  ) THEN
    ALTER TABLE tasks ADD COLUMN auto_generated boolean DEFAULT true;
  END IF;

  -- Add last_updated_by_system for tracking dynamic updates
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'last_updated_by_system'
  ) THEN
    ALTER TABLE tasks ADD COLUMN last_updated_by_system timestamptz DEFAULT NULL;
  END IF;

  -- Add payer_id for easier querying
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'payer_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN payer_id uuid REFERENCES payers(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- SECTION 2: ADD FIELDS TO PAYER_TASK_TEMPLATES TABLE
-- =====================================================

DO $$
BEGIN
  -- Add prevents_duplication flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payer_task_templates' AND column_name = 'prevents_duplication'
  ) THEN
    ALTER TABLE payer_task_templates ADD COLUMN prevents_duplication boolean DEFAULT true;
  END IF;

  -- Add completion_triggers_template_ids for task chaining
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payer_task_templates' AND column_name = 'completion_triggers_template_ids'
  ) THEN
    ALTER TABLE payer_task_templates ADD COLUMN completion_triggers_template_ids jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Add parent_task_type for identifying which task completion triggers this
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payer_task_templates' AND column_name = 'parent_task_type'
  ) THEN
    ALTER TABLE payer_task_templates ADD COLUMN parent_task_type text DEFAULT NULL;
  END IF;
END $$;

-- =====================================================
-- SECTION 3: ADD FIELDS TO PROVIDERS TABLE
-- =====================================================

DO $$
BEGIN
  -- Add credentialing_loaded_date for EMR loading tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'providers' AND column_name = 'credentialing_loaded_date'
  ) THEN
    ALTER TABLE providers ADD COLUMN credentialing_loaded_date date DEFAULT NULL;
  END IF;
END $$;

-- =====================================================
-- SECTION 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tasks_template_id ON tasks(task_template_id);
CREATE INDEX IF NOT EXISTS idx_tasks_payer_id ON tasks(payer_id);
CREATE INDEX IF NOT EXISTS idx_tasks_auto_generated ON tasks(auto_generated);
CREATE INDEX IF NOT EXISTS idx_tasks_provider_payer ON tasks(provider_id, payer_id);

-- =====================================================
-- SECTION 5: UPDATE TRIGGER_CONDITION CHECK CONSTRAINT
-- =====================================================

-- Drop old constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'payer_task_templates'
    AND constraint_name LIKE '%trigger_condition%'
  ) THEN
    ALTER TABLE payer_task_templates DROP CONSTRAINT IF EXISTS payer_task_templates_trigger_condition_check;
  END IF;
END $$;

-- Add new constraint with extended trigger conditions
ALTER TABLE payer_task_templates ADD CONSTRAINT payer_task_templates_trigger_condition_check
  CHECK (trigger_condition IN (
    'on_provider_assign',
    'prerequisites_met',
    'on_submission',
    'on_approval',
    'on_task_complete:submit',
    'on_task_complete:approval',
    'on_task_complete:document',
    'on_task_complete:info',
    'on_date_entry:application_submission_date',
    'on_date_entry:application_approved_date',
    'manual'
  ));