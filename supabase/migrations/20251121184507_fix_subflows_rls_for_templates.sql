/*
  # Fix Subflows RLS Policies for Template Creation

  Updates the RLS policies for subflows table to allow creation of template subflows
  (where workflow_id is null) by checking payer organization membership instead.

  1. Changes
    - Drop existing INSERT policy
    - Create new INSERT policy that handles both workflow-linked and payer-linked subflows
    - Allow inserts when user is member of workflow's org OR payer's org
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert subflows in their org" ON subflows;

-- Create new insert policy that handles templates
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
  );

-- Also update SELECT policy to allow viewing template subflows
DROP POLICY IF EXISTS "Users can view subflows in their org" ON subflows;

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
  );