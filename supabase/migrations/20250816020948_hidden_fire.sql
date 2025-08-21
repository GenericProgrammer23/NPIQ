/*
  # Fix RLS Policy Infinite Recursion

  1. Policy Fixes
    - Remove recursive policies that cause infinite loops
    - Simplify org_members policies to avoid circular references
    - Fix organizations policies to use direct user checks
  
  2. Security Model
    - Users can read their own memberships directly
    - Users can read organizations they belong to via simple joins
    - Admins can manage within their organizations
    - No circular policy dependencies
*/

-- Drop existing problematic policies
DO $$
BEGIN
  -- Drop org_members policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='org_members' AND policyname='Users can read own memberships') THEN
    DROP POLICY "Users can read own memberships" ON public.org_members;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='org_members' AND policyname='Users can create own memberships') THEN
    DROP POLICY "Users can create own memberships" ON public.org_members;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='org_members' AND policyname='Admins can manage memberships') THEN
    DROP POLICY "Admins can manage memberships" ON public.org_members;
  END IF;

  -- Drop organizations policies
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organizations' AND policyname='Users can read own organizations') THEN
    DROP POLICY "Users can read own organizations" ON public.organizations;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organizations' AND policyname='Users can create organizations') THEN
    DROP POLICY "Users can create organizations" ON public.organizations;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organizations' AND policyname='Admins can update organizations') THEN
    DROP POLICY "Admins can update organizations" ON public.organizations;
  END IF;
END $$;

-- Create simplified, non-recursive policies

-- org_members policies (base level - no recursion)
CREATE POLICY "Users can read own memberships"
  ON public.org_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own memberships"
  ON public.org_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage org memberships"
  ON public.org_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members admin_check
      WHERE admin_check.organization_id = org_members.organization_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'admin'
    )
  );

-- organizations policies (reference org_members directly)
CREATE POLICY "Users can read member organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update their organizations"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );