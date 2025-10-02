/*
  # Fix Custom Fields RLS Policies

  1. Security Fix
    - Remove overly permissive RLS policies on custom_fields table
    - Current policies allow ALL authenticated users to read/write custom fields
    - This bypasses proper admin-only access controls
    
  2. Changes
    - Drop insecure policies that use USING (true) or WITH CHECK (true)
    - Keep only the proper admin-only policy
    - Custom fields should only be managed by organization admins
    
  3. Impact
    - Only organization admins can manage custom fields
    - Regular users and managers cannot modify custom fields
    - Maintains proper access control hierarchy
*/

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON custom_fields;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON custom_fields;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON custom_fields;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON custom_fields;

-- The "Admins can manage custom fields" policy already exists and is correct
-- It restricts access to users with admin role in org_members table
