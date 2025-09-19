/*
  # Add Custom Fields System

  1. New Tables
    - `custom_fields`
      - `id` (uuid, primary key)
      - `name` (text, field name/column name)
      - `label` (text, display label)
      - `type` (text, field type)
      - `required` (boolean)
      - `table_name` (text, target table)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `custom_fields` table
    - Add policies for authenticated users

  3. Functions
    - `get_table_columns()` - Get column information for tables
    - `add_custom_column()` - Add custom columns to tables
    - `drop_custom_column()` - Remove custom columns from tables
*/

-- Create the custom_fields table
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  label text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['text'::text, 'number'::text, 'date'::text, 'email'::text, 'tel'::text])),
  required boolean NOT NULL DEFAULT false,
  table_name text NOT NULL CHECK (table_name = ANY (ARRAY['providers'::text, 'locations'::text, 'workflows'::text, 'tasks'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT custom_fields_pkey PRIMARY KEY (id),
  CONSTRAINT custom_fields_table_name_name_key UNIQUE (table_name, name)
);

-- Enable RLS on the custom fields table
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom fields
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'custom_fields' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON public.custom_fields 
            FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'custom_fields' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON public.custom_fields 
            FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'custom_fields' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON public.custom_fields 
            FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'custom_fields' 
        AND policyname = 'Enable delete for authenticated users'
    ) THEN
        CREATE POLICY "Enable delete for authenticated users" ON public.custom_fields 
            FOR DELETE TO authenticated USING (true);
    END IF;
END $$;

-- Create the get_table_columns function
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable boolean,
  column_default text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::text,
    c.data_type::text,
    (c.is_nullable = 'YES')::boolean,
    c.column_default::text
  FROM
    information_schema.columns AS c
  WHERE
    c.table_schema = 'public' AND c.table_name = get_table_columns.table_name
  ORDER BY
    c.ordinal_position;
END;
$$;

-- Create the add_custom_column function
CREATE OR REPLACE FUNCTION public.add_custom_column(
  p_table_name text,
  p_column_name text,
  p_column_type text,
  p_is_required boolean DEFAULT FALSE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql text;
  allowed_tables text[] := ARRAY['providers', 'locations', 'workflows', 'tasks'];
BEGIN
  -- Validate table name
  IF p_table_name != ALL(allowed_tables) THEN
    RAISE EXCEPTION 'Table % is not supported for custom fields', p_table_name;
  END IF;

  -- Validate column name (basic validation)
  IF p_column_name !~ '^[a-z][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid column name. Use lowercase letters, numbers, and underscores only.';
  END IF;

  -- Check if the column already exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name
  ) THEN
    RAISE EXCEPTION 'Column % already exists in table %', p_column_name, p_table_name;
  END IF;

  -- Map field types to PostgreSQL types
  CASE p_column_type
    WHEN 'number' THEN p_column_type := 'integer';
    WHEN 'date' THEN p_column_type := 'date';
    WHEN 'email', 'tel', 'text' THEN p_column_type := 'text';
    ELSE p_column_type := 'text';
  END CASE;

  -- Construct the ALTER TABLE statement
  v_sql := FORMAT('ALTER TABLE public.%I ADD COLUMN %I %s', p_table_name, p_column_name, p_column_type);

  IF p_is_required THEN
    -- Add default value for NOT NULL columns
    IF p_column_type = 'text' THEN
      v_sql := v_sql || ' NOT NULL DEFAULT ''''';
    ELSIF p_column_type = 'integer' THEN
      v_sql := v_sql || ' NOT NULL DEFAULT 0';
    ELSIF p_column_type = 'date' THEN
      v_sql := v_sql || ' NOT NULL DEFAULT ''1970-01-01''';
    ELSE
      v_sql := v_sql || ' NOT NULL DEFAULT ''''';
    END IF;
  END IF;

  EXECUTE v_sql;

  -- If the column was added as NOT NULL with a default, remove the default after creation
  IF p_is_required THEN
    v_sql := FORMAT('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT', p_table_name, p_column_name);
    EXECUTE v_sql;
  END IF;
END;
$$;

-- Create the drop_custom_column function
CREATE OR REPLACE FUNCTION public.drop_custom_column(
  p_table_name text,
  p_column_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  allowed_tables text[] := ARRAY['providers', 'locations', 'workflows', 'tasks'];
  core_columns_providers text[] := ARRAY['id', 'organization_id', 'location_id', 'first_name', 'last_name', 
                                        'email', 'phone', 'specialty', 'license_number', 'license_expiry', 
                                        'status', 'created_at', 'updated_at'];
  core_columns_locations text[] := ARRAY['id', 'organization_id', 'name', 'address', 'departments', 
                                        'status', 'created_at', 'updated_at'];
  core_columns_workflows text[] := ARRAY['id', 'organization_id', 'name', 'description', 'type', 'status', 
                                        'steps', 'created_by', 'created_at', 'updated_at'];
  core_columns_tasks text[] := ARRAY['id', 'workflow_id', 'provider_id', 'title', 'description', 'status', 
                                    'priority', 'due_date', 'assigned_to', 'completed_at', 'created_at', 'updated_at'];
BEGIN
  -- Validate table name
  IF p_table_name != ALL(allowed_tables) THEN
    RAISE EXCEPTION 'Table % is not supported for custom fields', p_table_name;
  END IF;

  -- Prevent dropping core columns based on table
  IF (p_table_name = 'providers' AND p_column_name = ANY(core_columns_providers)) OR
     (p_table_name = 'locations' AND p_column_name = ANY(core_columns_locations)) OR
     (p_table_name = 'workflows' AND p_column_name = ANY(core_columns_workflows)) OR
     (p_table_name = 'tasks' AND p_column_name = ANY(core_columns_tasks)) THEN
    RAISE EXCEPTION 'Cannot drop core column % from table %', p_column_name, p_table_name;
  END IF;

  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name
  ) THEN
    RAISE EXCEPTION 'Column % does not exist in table %', p_column_name, p_table_name;
  END IF;

  -- Construct the ALTER TABLE statement to drop the column
  EXECUTE FORMAT('ALTER TABLE public.%I DROP COLUMN %I', p_table_name, p_column_name);
END;
$$;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for custom_fields table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_custom_fields_updated_at'
    ) THEN
        CREATE TRIGGER update_custom_fields_updated_at
            BEFORE UPDATE ON custom_fields
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;