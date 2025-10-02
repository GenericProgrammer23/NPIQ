/*
  # Remove Insecure RLS Policies

  1. Security Fix
    - Remove overly permissive RLS policies that allow ALL authenticated users to read data
    - These policies bypass organization-based access controls
    - Policies removed:
      - locations_select_auth (allows all users to read all locations)
      - providers_select_auth (allows all users to read all providers)
      - tasks_select_auth (allows all users to read all tasks)
      - workflows_select_auth (allows all users to read all workflows)
    
  2. Impact
    - After removal, only the proper organization-based policies will apply
    - Users can only read data from organizations they belong to
    - Maintains proper data isolation between organizations
    
  3. Important Notes
    - This is a CRITICAL SECURITY FIX
    - These policies were creating a security vulnerability
    - Proper policies already exist for organization-based access
*/

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "locations_select_auth" ON locations;
DROP POLICY IF EXISTS "providers_select_auth" ON providers;
DROP POLICY IF EXISTS "tasks_select_auth" ON tasks;
DROP POLICY IF EXISTS "workflows_select_auth" ON workflows;
