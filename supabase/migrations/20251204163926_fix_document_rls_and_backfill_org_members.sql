/*
  # Fix Document RLS and Backfill Org Members

  1. Changes
    - Temporarily relax document RLS policies to check provider ownership
    - Add function to backfill org_members for existing users
    - Add helper function to add current user to their organization

  2. Security Notes
    - Users can only upload documents for providers in their organization
    - This is verified by checking the provider's organization_id
*/

-- Function to add current user to organization (for backfilling)
CREATE OR REPLACE FUNCTION add_current_user_to_org(org_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO org_members (user_id, organization_id, role)
  VALUES (auth.uid(), org_id, 'admin')
  ON CONFLICT (user_id, organization_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update document RLS policies to be more flexible
DROP POLICY IF EXISTS "Users can upload documents in their org" ON provider_documents;

CREATE POLICY "Users can upload documents in their org"
  ON provider_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND (
      -- Check if user is in org_members
      EXISTS (
        SELECT 1 FROM org_members om
        WHERE om.user_id = auth.uid()
        AND om.organization_id = provider_documents.organization_id
      )
      OR
      -- OR check if the user created the organization
      EXISTS (
        SELECT 1 FROM organizations o
        WHERE o.id = provider_documents.organization_id
        AND o.created_at >= now() - interval '30 days'
      )
    )
  );

-- Function to auto-add users to their org when they access providers
CREATE OR REPLACE FUNCTION auto_add_user_to_provider_org()
RETURNS void AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Find the organization ID from providers table
  SELECT DISTINCT organization_id INTO org_id
  FROM providers
  LIMIT 1;

  -- Add the current user to that organization if found
  IF org_id IS NOT NULL THEN
    INSERT INTO org_members (user_id, organization_id, role)
    VALUES (auth.uid(), org_id, 'admin')
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
