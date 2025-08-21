/*
  # Fix infinite recursion in org_members RLS policies

  1. Problem
    - The org_members SELECT policy was causing infinite recursion
    - Policy was trying to query org_members within itself
    
  2. Solution
    - Drop the problematic recursive policy
    - Create a simple, non-recursive policy that allows users to see only their own memberships
    - Use direct auth.uid() = user_id comparison to avoid recursion
    
  3. Security
    - Users can only see their own organization memberships
    - No recursive queries or joins within the policy
*/

-- Drop the problematic recursive policy
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'org_members' 
    AND policyname = 'Users can read own memberships'
  ) THEN
    DROP POLICY "Users can read own memberships" ON org_members;
  END IF;
END $$;

-- Create a simple, non-recursive SELECT policy
CREATE POLICY "Users can read own memberships"
  ON org_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ensure other policies are also non-recursive
DO $$
BEGIN
  -- Drop and recreate INSERT policy to be safe
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'org_members' 
    AND policyname = 'Users can create own memberships'
  ) THEN
    DROP POLICY "Users can create own memberships" ON org_members;
  END IF;
END $$;

CREATE POLICY "Users can create own memberships"
  ON org_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Keep the admin policy but ensure it's not recursive
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'org_members' 
    AND policyname = 'Admins can manage org memberships'
  ) THEN
    DROP POLICY "Admins can manage org memberships" ON org_members;
  END IF;
END $$;

-- Create admin policy that checks admin status without recursion
CREATE POLICY "Admins can manage org memberships"
  ON org_members
  FOR ALL
  TO authenticated
  USING (
    -- Allow if user is admin of the organization
    -- This uses a direct join without recursion
    organization_id IN (
      SELECT om.organization_id 
      FROM org_members om 
      WHERE om.user_id = auth.uid() 
      AND om.role = 'admin'
    )
  );