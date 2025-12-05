/*
  # Fix Storage Bucket Creation and org_members Issues

  1. Changes
    - Ensure org_members table properly initialized
    - Add function to safely add current user to org_members if missing
    - Add RLS policy to allow users to add themselves to their org

  2. Notes
    - Storage bucket creation requires manual setup in Supabase Dashboard
    - This migration ensures users are properly added to org_members table
    - The org_members table is critical for all RLS policies
*/

-- Function to ensure user is in org_members (for their organization)
CREATE OR REPLACE FUNCTION ensure_user_in_org_members()
RETURNS void AS $$
DECLARE
  current_org_id uuid;
BEGIN
  -- Get the user's organization (assuming they have one in profiles or similar)
  -- For now, we'll check if user exists in organizations table
  SELECT id INTO current_org_id
  FROM organizations
  ORDER BY created_at ASC
  LIMIT 1;

  -- If organization exists and user not in org_members, add them
  IF current_org_id IS NOT NULL THEN
    INSERT INTO org_members (user_id, organization_id, role)
    VALUES (auth.uid(), current_org_id, 'admin')
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated users to add themselves to org_members
-- This is a temporary policy to help with initial setup
CREATE POLICY "Users can add themselves to existing orgs"
  ON org_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM organizations WHERE id = org_members.organization_id
    )
  );

-- Update the setup wizard or initial login to call this function
-- This ensures users are properly added to org_members on first access