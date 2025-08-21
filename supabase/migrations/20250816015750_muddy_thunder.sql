/*
  # Initial NPIQ Schema

  1. New Tables
    - `organizations` - Healthcare organizations
    - `org_members` - User membership in organizations with roles
    - `locations` - Facilities within organizations
    - `providers` - Healthcare providers with credentials
    - `workflows` - Credentialing process workflows
    - `tasks` - Individual workflow tasks and assignments

  2. Security
    - Enable RLS on all tables
    - Policies scope access to user's organizations via org_members
    - Users only see data from organizations they belong to

  3. Features
    - Automatic timestamp tracking with triggers
    - UUID primary keys with proper extensions
    - Foreign key relationships for data integrity
    - Performance indexes on frequently queried columns
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization membership table
CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'user')) DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  departments integer DEFAULT 1,
  status text NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Providers table
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  specialty text,
  license_number text,
  license_expiry date,
  status text NOT NULL CHECK (status IN ('active', 'pending', 'expired', 'suspended')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('credentialing', 'renewal', 'compliance')) DEFAULT 'credentialing',
  status text NOT NULL CHECK (status IN ('active', 'draft', 'archived')) DEFAULT 'draft',
  steps jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflows(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')) DEFAULT 'pending',
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  due_date timestamptz,
  assigned_to uuid REFERENCES auth.users(id),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_organization_id ON org_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id);
CREATE INDEX IF NOT EXISTS idx_providers_organization_id ON providers(organization_id);
CREATE INDEX IF NOT EXISTS idx_providers_location_id ON providers(location_id);
CREATE INDEX IF NOT EXISTS idx_workflows_organization_id ON workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow_id ON tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_provider_id ON tasks(provider_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'organizations' AND t.tgname = 'update_organizations_updated_at'
  ) THEN
    CREATE TRIGGER update_organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'org_members' AND t.tgname = 'update_org_members_updated_at'
  ) THEN
    CREATE TRIGGER update_org_members_updated_at
      BEFORE UPDATE ON org_members
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'locations' AND t.tgname = 'update_locations_updated_at'
  ) THEN
    CREATE TRIGGER update_locations_updated_at
      BEFORE UPDATE ON locations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'providers' AND t.tgname = 'update_providers_updated_at'
  ) THEN
    CREATE TRIGGER update_providers_updated_at
      BEFORE UPDATE ON providers
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'workflows' AND t.tgname = 'update_workflows_updated_at'
  ) THEN
    CREATE TRIGGER update_workflows_updated_at
      BEFORE UPDATE ON workflows
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'tasks' AND t.tgname = 'update_tasks_updated_at'
  ) THEN
    CREATE TRIGGER update_tasks_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'Users can read own organizations'
  ) THEN
    CREATE POLICY "Users can read own organizations"
      ON organizations FOR SELECT
      TO authenticated
      USING (
        id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'Users can create organizations'
  ) THEN
    CREATE POLICY "Users can create organizations"
      ON organizations FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'organizations' AND policyname = 'Admins can update organizations'
  ) THEN
    CREATE POLICY "Admins can update organizations"
      ON organizations FOR UPDATE
      TO authenticated
      USING (
        id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- RLS Policies for org_members (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'org_members' AND policyname = 'Users can read own memberships'
  ) THEN
    CREATE POLICY "Users can read own memberships"
      ON org_members FOR SELECT
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'org_members' AND policyname = 'Users can create own memberships'
  ) THEN
    CREATE POLICY "Users can create own memberships"
      ON org_members FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'org_members' AND policyname = 'Admins can manage memberships'
  ) THEN
    CREATE POLICY "Admins can manage memberships"
      ON org_members FOR ALL
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- RLS Policies for locations (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'Users can read org locations'
  ) THEN
    CREATE POLICY "Users can read org locations"
      ON locations FOR SELECT
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'Managers can create locations'
  ) THEN
    CREATE POLICY "Managers can create locations"
      ON locations FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'locations' AND policyname = 'Managers can update locations'
  ) THEN
    CREATE POLICY "Managers can update locations"
      ON locations FOR UPDATE
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

-- RLS Policies for providers (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'Users can read org providers'
  ) THEN
    CREATE POLICY "Users can read org providers"
      ON providers FOR SELECT
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'Managers can create providers'
  ) THEN
    CREATE POLICY "Managers can create providers"
      ON providers FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'providers' AND policyname = 'Managers can update providers'
  ) THEN
    CREATE POLICY "Managers can update providers"
      ON providers FOR UPDATE
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

-- RLS Policies for workflows (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'workflows' AND policyname = 'Users can read org workflows'
  ) THEN
    CREATE POLICY "Users can read org workflows"
      ON workflows FOR SELECT
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'workflows' AND policyname = 'Managers can create workflows'
  ) THEN
    CREATE POLICY "Managers can create workflows"
      ON workflows FOR INSERT
      TO authenticated
      WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'workflows' AND policyname = 'Managers can update workflows'
  ) THEN
    CREATE POLICY "Managers can update workflows"
      ON workflows FOR UPDATE
      TO authenticated
      USING (
        organization_id IN (
          SELECT organization_id FROM org_members 
          WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
        )
      );
  END IF;
END $$;

-- RLS Policies for tasks (guarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Users can read org tasks'
  ) THEN
    CREATE POLICY "Users can read org tasks"
      ON tasks FOR SELECT
      TO authenticated
      USING (
        CASE 
          WHEN workflow_id IS NOT NULL THEN
            workflow_id IN (
              SELECT w.id FROM workflows w
              JOIN org_members om ON w.organization_id = om.organization_id
              WHERE om.user_id = auth.uid()
            )
          WHEN provider_id IS NOT NULL THEN
            provider_id IN (
              SELECT p.id FROM providers p
              JOIN org_members om ON p.organization_id = om.organization_id
              WHERE om.user_id = auth.uid()
            )
          ELSE false
        END
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Users can create tasks'
  ) THEN
    CREATE POLICY "Users can create tasks"
      ON tasks FOR INSERT
      TO authenticated
      WITH CHECK (
        CASE 
          WHEN workflow_id IS NOT NULL THEN
            workflow_id IN (
              SELECT w.id FROM workflows w
              JOIN org_members om ON w.organization_id = om.organization_id
              WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
            )
          WHEN provider_id IS NOT NULL THEN
            provider_id IN (
              SELECT p.id FROM providers p
              JOIN org_members om ON p.organization_id = om.organization_id
              WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
            )
          ELSE false
        END
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'Users can update assigned tasks'
  ) THEN
    CREATE POLICY "Users can update assigned tasks"
      ON tasks FOR UPDATE
      TO authenticated
      USING (
        assigned_to = auth.uid() OR
        CASE 
          WHEN workflow_id IS NOT NULL THEN
            workflow_id IN (
              SELECT w.id FROM workflows w
              JOIN org_members om ON w.organization_id = om.organization_id
              WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
            )
          WHEN provider_id IS NOT NULL THEN
            provider_id IN (
              SELECT p.id FROM providers p
              JOIN org_members om ON p.organization_id = om.organization_id
              WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
            )
          ELSE false
        END
      );
  END IF;
END $$;