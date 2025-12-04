/*
  # Fix Infinite Recursion in org_members RLS Policies

  ## Problem
  The "Users can view members in their org" policy causes infinite recursion because
  it queries org_members from within the org_members RLS policy check.

  ## Solution
  Drop the recursive policies and keep only the simple, non-recursive ones:
  - Users can read their own membership (no recursion)
  - Admins can manage members (uses a helper function to avoid recursion)

  ## Changes
  1. Drop all existing SELECT policies on org_members
  2. Create a single, simple SELECT policy that only checks user_id
  3. Keep admin policies that use the has_org_role helper function
*/

-- Drop all existing SELECT policies on org_members that might cause recursion
DROP POLICY IF EXISTS "Users can read own memberships" ON org_members;
DROP POLICY IF EXISTS "Users can view members in their org" ON org_members;

-- Create a simple, non-recursive SELECT policy
-- Users can only see their own membership records
CREATE POLICY "Users can view own membership"
  ON org_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- If we need users to see other members in their org, we'll need to add that
-- through a function or by denormalizing the data, but for now, users can only
-- see their own membership which is sufficient for the hasUserOrganizations check
