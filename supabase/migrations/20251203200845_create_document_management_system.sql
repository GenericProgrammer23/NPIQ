/*
  # Document Management System for Provider Profiles

  1. New Tables
    - `provider_documents`
      - `id` (uuid, primary key) - Unique document identifier
      - `provider_id` (uuid, foreign key) - References providers table
      - `organization_id` (uuid, foreign key) - References organizations table
      - `file_name` (text) - Original file name
      - `file_path` (text) - Storage path in Supabase Storage
      - `file_size` (bigint) - File size in bytes
      - `file_type` (text) - MIME type of the file
      - `category` (text) - Document category (license, certification, insurance, etc.)
      - `description` (text) - Optional description
      - `expiry_date` (date) - Optional expiry date for time-sensitive documents
      - `uploaded_by` (uuid) - User who uploaded the document
      - `created_at` (timestamptz) - Upload timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `document_categories`
      - `id` (uuid, primary key) - Category identifier
      - `organization_id` (uuid, foreign key) - References organizations table
      - `name` (text) - Category name
      - `description` (text) - Category description
      - `is_default` (boolean) - Whether this is a default system category
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage
    - Requires a Supabase Storage bucket named 'provider-documents'
    - Files will be organized by organization_id/provider_id/filename

  3. Security
    - Enable RLS on both tables
    - Users can only access documents in their organization
    - Documents are linked to specific providers for access control

  4. Indexes
    - Index on provider_id for fast document lookups
    - Index on organization_id for organization-wide queries
    - Index on category for filtering by document type
    - Index on expiry_date for tracking expiring documents

  5. Notes
    - Document categories can be customized per organization
    - Default categories include: license, certification, insurance, identification, education, references
    - Files are stored in Supabase Storage with metadata in the database
    - Expiry dates enable automatic tracking of documents that need renewal
*/

-- Create provider_documents table
CREATE TABLE IF NOT EXISTS provider_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  description text DEFAULT '',
  expiry_date date,
  uploaded_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_categories table
CREATE TABLE IF NOT EXISTS document_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON provider_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_organization_id ON provider_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_category ON provider_documents(category);
CREATE INDEX IF NOT EXISTS idx_provider_documents_expiry_date ON provider_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_document_categories_organization_id ON document_categories(organization_id);

-- Enable RLS
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_documents
CREATE POLICY "Users can view documents in their org"
  ON provider_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_documents.organization_id
    )
  );

CREATE POLICY "Users can upload documents in their org"
  ON provider_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_documents.organization_id
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update documents in their org"
  ON provider_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_documents.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_documents.organization_id
    )
  );

CREATE POLICY "Managers can delete documents in their org"
  ON provider_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = provider_documents.organization_id
      AND om.role IN ('admin', 'manager')
    )
  );

-- RLS Policies for document_categories
CREATE POLICY "Users can view categories in their org"
  ON document_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = document_categories.organization_id
    )
  );

CREATE POLICY "Managers can create categories in their org"
  ON document_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = document_categories.organization_id
      AND om.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update categories in their org"
  ON document_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = document_categories.organization_id
      AND om.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = document_categories.organization_id
      AND om.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can delete categories in their org"
  ON document_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.organization_id = document_categories.organization_id
      AND om.role IN ('admin', 'manager')
    )
    AND is_default = false
  );

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_provider_documents_updated_at') THEN
    CREATE TRIGGER update_provider_documents_updated_at
      BEFORE UPDATE ON provider_documents
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_document_categories_updated_at') THEN
    CREATE TRIGGER update_document_categories_updated_at
      BEFORE UPDATE ON document_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default document categories
-- These will be created for each organization when they first access documents
-- For now, we'll create a function that can be called to initialize categories for an org

CREATE OR REPLACE FUNCTION initialize_document_categories(org_id uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO document_categories (organization_id, name, description, is_default)
  VALUES
    (org_id, 'License', 'Professional licenses and registrations', true),
    (org_id, 'Certification', 'Board certifications and specialties', true),
    (org_id, 'Insurance', 'Malpractice insurance and coverage documents', true),
    (org_id, 'Identification', 'Government-issued identification documents', true),
    (org_id, 'Education', 'Diplomas, degrees, and transcripts', true),
    (org_id, 'References', 'Professional references and recommendations', true),
    (org_id, 'Background Check', 'Background check results and clearances', true),
    (org_id, 'Immunization', 'Vaccination records and health clearances', true),
    (org_id, 'Other', 'Miscellaneous documents', true)
  ON CONFLICT (organization_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;