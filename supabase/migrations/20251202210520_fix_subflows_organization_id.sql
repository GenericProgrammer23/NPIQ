/*
  # Add organization_id to subflows and update RLS policies

  ## Summary
  Adds organization_id column to the subflows table to support standalone reusable 
  subflows that aren't tied to a specific workflow, payer, or instance. Updates RLS 
  policies to allow users to create and view subflows within their organization.

  ## Changes Made

  ### 1. New Column
  - `organization_id` (uuid) - Links subflow to organization for standalone templates

  ### 2. Updated RLS Policies
  - Allow INSERT when user is member of subflow's organization
  - Allow SELECT when user is member of subflow's organization
  - Allow UPDATE when user is member of subflow's organization (admin/manager only)
  - Allow DELETE when user is member of subflow's organization (admin/manager only)

  ### 3. Index
  - Add index on organization_id for performance

  ### 4. Security
  - Maintains data isolation between organizations
  - Supports flexible subflow creation patterns
*/

-- Add organization_id column to subflows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE subflows ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subflows_organization_id ON subflows(organization_id) WHERE organization_id IS NOT NULL;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can insert subflows in their org" ON subflows;
DROP POLICY IF EXISTS "Users can view subflows in their org" ON subflows;
DROP POLICY IF EXISTS "Managers can update subflows" ON subflows;
DROP POLICY IF EXISTS "Managers can delete subflows" ON subflows;

-- Create new comprehensive INSERT policy
CREATE POLICY "Users can insert subflows in their org"
  ON subflows FOR INSERT
  TO authenticated
  WITH CHECK (
    -- For workflow-linked subflows
    (workflow_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workflows w
      INNER JOIN org_members om ON om.organization_id = w.organization_id
      WHERE w.id = workflow_id
      AND om.user_id = auth.uid()
    ))
    OR
    -- For payer-linked template subflows
    (payer_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM payers p
      INNER JOIN org_members om ON om.organization_id = p.organization_id
      WHERE p.id = payer_id
      AND om.user_id = auth.uid()
    ))
    OR
    -- For standalone organization subflows (new)
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = organization_id
      AND om.user_id = auth.uid()
    ))
  );

-- Create new comprehensive SELECT policy
CREATE POLICY "Users can view subflows in their org"
  ON subflows FOR SELECT
  TO authenticated
  USING (
    -- For workflow-linked subflows
    (workflow_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workflows w
      INNER JOIN org_members om ON om.organization_id = w.organization_id
      WHERE w.id = workflow_id
      AND om.user_id = auth.uid()
    ))
    OR
    -- For payer-linked template subflows
    (payer_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM payers p
      INNER JOIN org_members om ON om.organization_id = p.organization_id
      WHERE p.id = payer_id
      AND om.user_id = auth.uid()
    ))
    OR
    -- For instance-linked subflows
    (instance_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workflow_instances wi
      INNER JOIN org_members om ON om.organization_id = wi.organization_id
      WHERE wi.id = instance_id
      AND om.user_id = auth.uid()
    ))
    OR
    -- For standalone organization subflows (new)
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = organization_id
      AND om.user_id = auth.uid()
    ))
  );

-- Create UPDATE policy (managers/admins only)
CREATE POLICY "Managers can update subflows"
  ON subflows FOR UPDATE
  TO authenticated
  USING (
    -- For workflow-linked subflows
    (workflow_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workflows w
      INNER JOIN org_members om ON om.organization_id = w.organization_id
      WHERE w.id = workflow_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    ))
    OR
    -- For payer-linked template subflows
    (payer_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM payers p
      INNER JOIN org_members om ON om.organization_id = p.organization_id
      WHERE p.id = payer_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    ))
    OR
    -- For standalone organization subflows (new)
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    ))
  );

-- Create DELETE policy (managers/admins only)
CREATE POLICY "Managers can delete subflows"
  ON subflows FOR DELETE
  TO authenticated
  USING (
    -- For workflow-linked subflows
    (workflow_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM workflows w
      INNER JOIN org_members om ON om.organization_id = w.organization_id
      WHERE w.id = workflow_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    ))
    OR
    -- For payer-linked template subflows
    (payer_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM payers p
      INNER JOIN org_members om ON om.organization_id = p.organization_id
      WHERE p.id = payer_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    ))
    OR
    -- For standalone organization subflows (new)
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('admin', 'manager')
    ))
  );

-- Add comment
COMMENT ON COLUMN subflows.organization_id IS 'Organization ID for standalone reusable subflows not tied to specific workflow/payer';
