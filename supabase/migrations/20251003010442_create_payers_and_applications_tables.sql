/*
  # Create Payers and Application Tracking Tables

  ## Overview
  This migration creates the payer management system and application tracking tables
  for managing provider and location credentialing with various payers.

  ## New Tables

  ### payers
  - `id` (uuid, primary key) - Unique payer identifier
  - `organization_id` (uuid, foreign key) - Organization this payer belongs to
  - `name` (text) - Payer name (e.g., CAQH, AHCCCS, Medicare)
  - `type` (text) - Payer type (insurance, credentialing, government)
  - `workflow_state` (text) - State-specific workflow (AZ, TX, or ALL)
  - `application_fields` (jsonb) - Configurable fields for this payer
  - `status` (text) - Active or inactive status
  - `description` (text) - Optional description
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### provider_payer_applications
  - `id` (uuid, primary key) - Unique application identifier
  - `provider_id` (uuid, foreign key) - Provider associated with application
  - `payer_id` (uuid, foreign key) - Payer associated with application
  - `application_submission_date` (date) - Date application was submitted
  - `application_approved_date` (date) - Date application was approved
  - `provider_loaded_date` (date) - Date provider was loaded/activated
  - `status` (text) - not_started, submitted, approved, loaded, rejected
  - `notes` (text) - Optional notes about the application
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### location_payer_applications
  - `id` (uuid, primary key) - Unique application identifier
  - `location_id` (uuid, foreign key) - Location associated with application
  - `payer_id` (uuid, foreign key) - Payer associated with application
  - `application_submission_date` (date) - Date application was submitted
  - `application_approved_date` (date) - Date application was approved
  - `location_loaded_date` (date) - Date location was loaded/activated
  - `status` (text) - not_started, submitted, approved, loaded, rejected
  - `notes` (text) - Optional notes about the application
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on all new tables
  - Add policies for organization-scoped access
  - Authenticated users can read data from their organization
  - Managers and admins can create, update, and delete records
*/

-- Create payers table
CREATE TABLE IF NOT EXISTS payers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'insurance' CHECK (type IN ('insurance', 'credentialing', 'government', 'other')),
  workflow_state text NOT NULL DEFAULT 'ALL' CHECK (workflow_state IN ('AZ', 'TX', 'ALL')),
  application_fields jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create provider_payer_applications table
CREATE TABLE IF NOT EXISTS provider_payer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
  application_submission_date date,
  application_approved_date date,
  provider_loaded_date date,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'submitted', 'approved', 'loaded', 'rejected')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, payer_id)
);

-- Create location_payer_applications table
CREATE TABLE IF NOT EXISTS location_payer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES payers(id) ON DELETE CASCADE,
  application_submission_date date,
  application_approved_date date,
  location_loaded_date date,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'submitted', 'approved', 'loaded', 'rejected')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(location_id, payer_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payers_organization_id ON payers(organization_id);
CREATE INDEX IF NOT EXISTS idx_payers_status ON payers(status);
CREATE INDEX IF NOT EXISTS idx_payers_workflow_state ON payers(workflow_state);

CREATE INDEX IF NOT EXISTS idx_provider_payer_applications_provider_id ON provider_payer_applications(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_payer_applications_payer_id ON provider_payer_applications(payer_id);
CREATE INDEX IF NOT EXISTS idx_provider_payer_applications_status ON provider_payer_applications(status);

CREATE INDEX IF NOT EXISTS idx_location_payer_applications_location_id ON location_payer_applications(location_id);
CREATE INDEX IF NOT EXISTS idx_location_payer_applications_payer_id ON location_payer_applications(payer_id);
CREATE INDEX IF NOT EXISTS idx_location_payer_applications_status ON location_payer_applications(status);

-- Enable RLS
ALTER TABLE payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_payer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_payer_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payers
CREATE POLICY "Users can read org payers" ON payers
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can create payers" ON payers
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update payers" ON payers
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete payers" ON payers
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for provider_payer_applications
CREATE POLICY "Users can read org provider applications" ON provider_payer_applications
  FOR SELECT TO authenticated
  USING (
    provider_id IN (
      SELECT p.id FROM providers p
      JOIN org_members om ON p.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create provider applications" ON provider_payer_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    provider_id IN (
      SELECT p.id FROM providers p
      JOIN org_members om ON p.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update provider applications" ON provider_payer_applications
  FOR UPDATE TO authenticated
  USING (
    provider_id IN (
      SELECT p.id FROM providers p
      JOIN org_members om ON p.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT p.id FROM providers p
      JOIN org_members om ON p.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete provider applications" ON provider_payer_applications
  FOR DELETE TO authenticated
  USING (
    provider_id IN (
      SELECT p.id FROM providers p
      JOIN org_members om ON p.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
    )
  );

-- RLS Policies for location_payer_applications
CREATE POLICY "Users can read org location applications" ON location_payer_applications
  FOR SELECT TO authenticated
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN org_members om ON l.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create location applications" ON location_payer_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN org_members om ON l.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update location applications" ON location_payer_applications
  FOR UPDATE TO authenticated
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN org_members om ON l.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN org_members om ON l.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can delete location applications" ON location_payer_applications
  FOR DELETE TO authenticated
  USING (
    location_id IN (
      SELECT l.id FROM locations l
      JOIN org_members om ON l.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.role IN ('admin', 'manager')
    )
  );

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payers_updated_at') THEN
    CREATE TRIGGER update_payers_updated_at
      BEFORE UPDATE ON payers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_provider_payer_applications_updated_at') THEN
    CREATE TRIGGER update_provider_payer_applications_updated_at
      BEFORE UPDATE ON provider_payer_applications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_location_payer_applications_updated_at') THEN
    CREATE TRIGGER update_location_payer_applications_updated_at
      BEFORE UPDATE ON location_payer_applications
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;