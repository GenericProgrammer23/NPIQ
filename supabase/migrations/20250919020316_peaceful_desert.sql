/*
  # Admin Functions for Dynamic Field Management

  1. Functions
    - `create_custom_fields_table()` - Creates the custom fields configuration table
    - `add_provider_column()` - Adds a new column to the providers table
    - `drop_provider_column()` - Removes a column from the providers table

  2. Security
    - Functions are restricted to authenticated users with admin role
    - Proper validation and error handling
*/

-- Create custom fields configuration table
CREATE OR REPLACE FUNCTION create_custom_fields_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS custom_provider_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    label text NOT NULL,
    type text NOT NULL CHECK (type IN ('text', 'number', 'date', 'email', 'tel')),
    required boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  -- Enable RLS
  ALTER TABLE custom_provider_fields ENABLE ROW LEVEL SECURITY;

  -- Create policies
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'custom_provider_fields' 
      AND policyname = 'Admins can manage custom fields'
    ) THEN
      CREATE POLICY "Admins can manage custom fields"
        ON custom_provider_fields
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM org_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM org_members 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
          )
        );
    END IF;
  END $$;

  -- Create trigger for updated_at
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'update_custom_provider_fields_updated_at'
    ) THEN
      CREATE TRIGGER update_custom_provider_fields_updated_at
        BEFORE UPDATE ON custom_provider_fields
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
  END $$;
END;
$$;

-- Function to add a column to the providers table
CREATE OR REPLACE FUNCTION add_provider_column(
  column_name text,
  column_type text,
  is_required boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_statement text;
BEGIN
  -- Validate user is admin
  IF NOT EXISTS (
    SELECT 1 FROM org_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Validate column name (alphanumeric and underscores only)
  IF column_name !~ '^[a-zA-Z][a-zA-Z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid column name. Use only letters, numbers, and underscores.';
  END IF;

  -- Validate column type
  IF column_type NOT IN ('text', 'integer', 'date', 'boolean') THEN
    RAISE EXCEPTION 'Invalid column type. Allowed types: text, integer, date, boolean';
  END IF;

  -- Check if column already exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' 
    AND column_name = add_provider_column.column_name
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Column % already exists in providers table', column_name;
  END IF;

  -- Build and execute ALTER TABLE statement
  sql_statement := format('ALTER TABLE providers ADD COLUMN %I %s', column_name, column_type);
  
  IF is_required THEN
    sql_statement := sql_statement || ' NOT NULL DEFAULT ''''';
  END IF;

  EXECUTE sql_statement;
END;
$$;

-- Function to drop a column from the providers table
CREATE OR REPLACE FUNCTION drop_provider_column(column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_statement text;
BEGIN
  -- Validate user is admin
  IF NOT EXISTS (
    SELECT 1 FROM org_members 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Prevent dropping core columns
  IF column_name IN (
    'id', 'organization_id', 'location_id', 'first_name', 'last_name', 
    'email', 'phone', 'specialty', 'license_number', 'license_expiry', 
    'status', 'created_at', 'updated_at'
  ) THEN
    RAISE EXCEPTION 'Cannot drop core column: %', column_name;
  END IF;

  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' 
    AND column_name = drop_provider_column.column_name
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Column % does not exist in providers table', column_name;
  END IF;

  -- Build and execute ALTER TABLE statement
  sql_statement := format('ALTER TABLE providers DROP COLUMN %I', column_name);
  EXECUTE sql_statement;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_custom_fields_table() TO authenticated;
GRANT EXECUTE ON FUNCTION add_provider_column(text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION drop_provider_column(text) TO authenticated;