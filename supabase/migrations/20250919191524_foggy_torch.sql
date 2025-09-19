/*
  # Add Subflows to Workflow System

  1. New Tables
    - `subflows`
      - `id` (uuid, primary key)
      - `workflow_id` (uuid, foreign key to workflows)
      - `name` (text)
      - `purpose` (text)
      - `prerequisites` (text)
      - `dependencies` (text)
      - `exit_condition` (text)
      - `status` (text: not_started, in_progress, complete)
      - `order_index` (integer for ordering)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Table Updates
    - Add `subflow_id` to `tasks` table to group tasks under subflows

  3. Security
    - Enable RLS on `subflows` table
    - Add policies for organization-scoped access
*/

-- Create subflows table
CREATE TABLE IF NOT EXISTS subflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name text NOT NULL,
  purpose text,
  prerequisites text DEFAULT '',
  dependencies text DEFAULT '',
  exit_condition text DEFAULT '',
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'complete')),
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add subflow_id to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'subflow_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN subflow_id uuid REFERENCES subflows(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subflows_workflow_id ON subflows(workflow_id);
CREATE INDEX IF NOT EXISTS idx_subflows_status ON subflows(status);
CREATE INDEX IF NOT EXISTS idx_tasks_subflow_id ON tasks(subflow_id);

-- Enable RLS
ALTER TABLE subflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subflows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subflows' 
    AND policyname = 'Users can read org subflows'
  ) THEN
    CREATE POLICY "Users can read org subflows" ON subflows
      FOR SELECT TO authenticated
      USING (workflow_id IN (
        SELECT w.id FROM workflows w
        JOIN org_members om ON w.organization_id = om.organization_id
        WHERE om.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subflows' 
    AND policyname = 'Managers can create subflows'
  ) THEN
    CREATE POLICY "Managers can create subflows" ON subflows
      FOR INSERT TO authenticated
      WITH CHECK (workflow_id IN (
        SELECT w.id FROM workflows w
        JOIN org_members om ON w.organization_id = om.organization_id
        WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subflows' 
    AND policyname = 'Managers can update subflows'
  ) THEN
    CREATE POLICY "Managers can update subflows" ON subflows
      FOR UPDATE TO authenticated
      USING (workflow_id IN (
        SELECT w.id FROM workflows w
        JOIN org_members om ON w.organization_id = om.organization_id
        WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
      ));
  END IF;
END $$;

-- Create trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_subflows_updated_at'
  ) THEN
    CREATE TRIGGER update_subflows_updated_at
      BEFORE UPDATE ON subflows
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default subflows for existing workflows
INSERT INTO subflows (workflow_id, name, purpose, prerequisites, dependencies, exit_condition, order_index)
SELECT 
  w.id,
  'Provider Baseline',
  'Collect and verify basic provider information and credentials',
  'Provider first_name, last_name, and specialty must be present',
  '',
  'All baseline tasks completed and provider information verified',
  1
FROM workflows w
WHERE w.type = 'credentialing'
ON CONFLICT DO NOTHING;

INSERT INTO subflows (workflow_id, name, purpose, prerequisites, dependencies, exit_condition, order_index)
SELECT 
  w.id,
  'Medicare Enrollment',
  'Complete Medicare provider enrollment process',
  'Provider Baseline subflow must be complete',
  'Provider Baseline Complete',
  'Medicare enrollment approved and NPI verified',
  2
FROM workflows w
WHERE w.type = 'credentialing'
ON CONFLICT DO NOTHING;

INSERT INTO subflows (workflow_id, name, purpose, prerequisites, dependencies, exit_condition, order_index)
SELECT 
  w.id,
  'AHCCCS Enrollment',
  'Complete AHCCCS (Arizona Medicaid) provider enrollment',
  'Provider Baseline subflow must be complete',
  'Provider Baseline Complete',
  'AHCCCS enrollment approved and provider ID assigned',
  3
FROM workflows w
WHERE w.type = 'credentialing'
ON CONFLICT DO NOTHING;

INSERT INTO subflows (workflow_id, name, purpose, prerequisites, dependencies, exit_condition, order_index)
SELECT 
  w.id,
  'PTPN Application',
  'Submit PTPN (Provider Training and Practice Network) application',
  'Required provider information present',
  'If location.state == AZ then depends on AHCCCS Complete',
  'PTPN approval captured and documented',
  4
FROM workflows w
WHERE w.type = 'credentialing'
ON CONFLICT DO NOTHING;