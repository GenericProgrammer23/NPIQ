/*
  # Update Location Fields

  Updates locations table with comprehensive address and contact information:
  1. Replace single address field with structured address components
  2. Add contact information (phone, fax)
  3. Add NPI and hours
  4. Replace departments with specialties (PT/OT)

  ## Changes
  - address -> address_line_1, address_line_2, city, state, zip_code
  - departments (integer) -> specialties (text array)
  - Add phone, fax, npi, hours fields
*/

DO $$ 
BEGIN
  -- Add new address fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'address_line_1'
  ) THEN
    ALTER TABLE locations ADD COLUMN address_line_1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'address_line_2'
  ) THEN
    ALTER TABLE locations ADD COLUMN address_line_2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'city'
  ) THEN
    ALTER TABLE locations ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'state'
  ) THEN
    ALTER TABLE locations ADD COLUMN state text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE locations ADD COLUMN zip_code text;
  END IF;

  -- Add contact fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'phone'
  ) THEN
    ALTER TABLE locations ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'fax'
  ) THEN
    ALTER TABLE locations ADD COLUMN fax text;
  END IF;

  -- Add NPI and hours
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'npi'
  ) THEN
    ALTER TABLE locations ADD COLUMN npi text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'hours'
  ) THEN
    ALTER TABLE locations ADD COLUMN hours text;
  END IF;

  -- Add specialties array (PT, OT)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'locations' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE locations ADD COLUMN specialties text[] DEFAULT ARRAY['PT']::text[];
  END IF;

  -- Migrate existing address data if present
  UPDATE locations 
  SET address_line_1 = address 
  WHERE address IS NOT NULL AND address_line_1 IS NULL;
END $$;

-- Note: departments field is kept for backward compatibility but should be phased out in favor of specialties
