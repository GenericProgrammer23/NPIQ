/*
  # Add Workflow Instances System

  This migration transforms the workflow system from a flat structure to a template-instance architecture.

  ## New Tables
    - `workflow_instances`
      - `id` (uuid, primary key)
      - `workflow_template_id` (uuid, references workflows table)
      - `entity_type` (enum: 'provider' or 'location')
      - `entity_id` (uuid, provider_id or location_id)
      - `status` (enum: 'active', 'completed', 'cancelled')
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `progress_percentage` (integer, 0-100)
      - `organization_id` (uuid, for RLS)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## Table Updates
    - Add `is_template` column to workflows table (defaults to true)
    - Add `trigger_conditions` jsonb column to workflows for automatic triggering
    - Add `instance_id` column to subflows table to track which instance a subflow belongs to
    - Add `location_id` column to tasks table for location-based workflows
    - Add `instance_id` column to tasks table for instance tracking

  ## Security
    - Enable RLS on workflow_instances
    - Create policies for organization-scoped access
*/

-- Create workflow_instances table
CREATE TABLE IF NOT EXISTS workflow_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('provider', 'location')),
  entity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add is_template column to workflows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'is_template'
  ) THEN
    ALTER TABLE workflows ADD COLUMN is_template boolean DEFAULT true;
  END IF;
END $$;

-- Add trigger_conditions column to workflows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflows' AND column_name = 'trigger_conditions'
  ) THEN
    ALTER TABLE workflows ADD COLUMN trigger_conditions jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add instance_id column to subflows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subflows' AND column_name = 'instance_id'
  ) THEN
    ALTER TABLE subflows ADD COLUMN instance_id uuid REFERENCES workflow_instances(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add location_id column to tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN location_id uuid REFERENCES locations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add instance_id column to tasks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'instance_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN instance_id uuid REFERENCES workflow_instances(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_instances_template_id ON workflow_instances(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_entity ON workflow_instances(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_organization_id ON workflow_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_subflows_instance_id ON subflows(instance_id);
CREATE INDEX IF NOT EXISTS idx_tasks_instance_id ON tasks(instance_id);
CREATE INDEX IF NOT EXISTS idx_tasks_location_id ON tasks(location_id);

-- Enable RLS on workflow_instances
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_instances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workflow_instances' 
    AND policyname = 'Users can read org workflow instances'
  ) THEN
    CREATE POLICY "Users can read org workflow instances" ON workflow_instances
      FOR SELECT TO authenticated
      USING (organization_id IN (
        SELECT om.organization_id FROM org_members om
        WHERE om.user_id = auth.uid()
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workflow_instances' 
    AND policyname = 'Managers can create workflow instances'
  ) THEN
    CREATE POLICY "Managers can create workflow instances" ON workflow_instances
      FOR INSERT TO authenticated
      WITH CHECK (organization_id IN (
        SELECT om.organization_id FROM org_members om
        WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workflow_instances' 
    AND policyname = 'Managers can update workflow instances'
  ) THEN
    CREATE POLICY "Managers can update workflow instances" ON workflow_instances
      FOR UPDATE TO authenticated
      USING (organization_id IN (
        SELECT om.organization_id FROM org_members om
        WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
      ))
      WITH CHECK (organization_id IN (
        SELECT om.organization_id FROM org_members om
        WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
      ));
  END IF;
END $$;

-- Create trigger for updated_at on workflow_instances
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_workflow_instances_updated_at'
  ) THEN
    CREATE TRIGGER update_workflow_instances_updated_at
      BEFORE UPDATE ON workflow_instances
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Update existing workflows to be templates
UPDATE workflows SET is_template = true WHERE is_template IS NULL;
