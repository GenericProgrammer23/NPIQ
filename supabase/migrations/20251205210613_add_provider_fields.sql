/*
  # Add Additional Provider Fields

  Adds comprehensive provider information fields including:
  1. AHCCCS credentialing information
  2. Medicare PTAN
  3. Educational background (undergraduate and postgraduate)
  4. Demographics (gender, SSN)
  5. Provider start date

  ## New Fields
  - ahcccs_number: AHCCCS number
  - ahcccs_application_number: AHCCCS application tracking number
  - medicare_ptan: Medicare Provider Transaction Access Number
  - undergrad_school: Undergraduate institution name
  - undergrad_start_date: Format MM/YYYY
  - undergrad_end_date: Format MM/YYYY
  - undergrad_degree: Degree earned
  - postgrad_school: Postgraduate institution name
  - postgrad_start_date: Format MM/YYYY
  - postgrad_end_date: Format MM/YYYY
  - postgrad_degree: Degree earned
  - gender: Provider gender
  - provider_start_date: Date provider started with organization
  - ssn: Social Security Number (encrypted)
*/

-- Add new fields to providers table
DO $$ 
BEGIN
  -- AHCCCS fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'ahcccs_number'
  ) THEN
    ALTER TABLE providers ADD COLUMN ahcccs_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'ahcccs_application_number'
  ) THEN
    ALTER TABLE providers ADD COLUMN ahcccs_application_number text;
  END IF;

  -- Medicare
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'medicare_ptan'
  ) THEN
    ALTER TABLE providers ADD COLUMN medicare_ptan text;
  END IF;

  -- Undergraduate education
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'undergrad_school'
  ) THEN
    ALTER TABLE providers ADD COLUMN undergrad_school text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'undergrad_start_date'
  ) THEN
    ALTER TABLE providers ADD COLUMN undergrad_start_date text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'undergrad_end_date'
  ) THEN
    ALTER TABLE providers ADD COLUMN undergrad_end_date text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'undergrad_degree'
  ) THEN
    ALTER TABLE providers ADD COLUMN undergrad_degree text;
  END IF;

  -- Postgraduate education
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'postgrad_school'
  ) THEN
    ALTER TABLE providers ADD COLUMN postgrad_school text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'postgrad_start_date'
  ) THEN
    ALTER TABLE providers ADD COLUMN postgrad_start_date text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'postgrad_end_date'
  ) THEN
    ALTER TABLE providers ADD COLUMN postgrad_end_date text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'postgrad_degree'
  ) THEN
    ALTER TABLE providers ADD COLUMN postgrad_degree text;
  END IF;

  -- Demographics
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'gender'
  ) THEN
    ALTER TABLE providers ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'provider_start_date'
  ) THEN
    ALTER TABLE providers ADD COLUMN provider_start_date date;
  END IF;

  -- SSN (sensitive - should be encrypted in production)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'ssn'
  ) THEN
    ALTER TABLE providers ADD COLUMN ssn text;
  END IF;
END $$;
