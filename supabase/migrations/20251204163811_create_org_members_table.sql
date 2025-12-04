/*
  # Create Organization Members Table

  1. New Tables
    - `org_members`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `organization_id` (uuid, references organizations)
      - `role` (text, default 'user')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `org_members` table
    - Add policies for authenticated users to view and manage org members
    - Users can view members of organizations they belong to
    - Admins can add/remove members

  3. Notes
    - This table tracks which users belong to which organizations
    - Required for document management and other org-scoped features
*/

-- Create org_members table
CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_org UNIQUE (user_id, organization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON org_members(organization_id);

-- Enable RLS
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view members in their org"
  ON org_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = org_members.organization_id
    )
  );

CREATE POLICY "Admins can add members to their org"
  ON org_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = org_members.organization_id
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Admins can update members in their org"
  ON org_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = org_members.organization_id
      AND om.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = org_members.organization_id
      AND om.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete members from their org"
  ON org_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = org_members.organization_id
      AND om.role = 'admin'
    )
  );

-- Function to automatically add user to organization after setup
CREATE OR REPLACE FUNCTION add_user_to_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new organization is created, add the creator as an admin
  IF NEW.created_at IS NOT NULL AND auth.uid() IS NOT NULL THEN
    INSERT INTO org_members (user_id, organization_id, role)
    VALUES (auth.uid(), NEW.id, 'admin')
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-add creator to organization
DROP TRIGGER IF EXISTS on_organization_created ON organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_organization();
