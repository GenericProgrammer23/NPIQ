/*
  # Add Payer Requirements and Dependencies

  1. New Columns Added to Payers Table
    - `requires_demographics` (boolean) - Indicates if payer requires demographic information
    - `dependent_on_payer_ids` (jsonb) - Array of payer IDs that must be approved before this application

  2. Changes
    - Add requires_demographics column with default false
    - Add dependent_on_payer_ids column for tracking dependencies between applications
    
  3. Notes
    - Uses IF NOT EXISTS pattern to prevent errors on re-run
    - Maintains data safety with non-destructive additions only
*/

-- Add requires_demographics column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'requires_demographics'
  ) THEN
    ALTER TABLE payers ADD COLUMN requires_demographics boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add dependent_on_payer_ids column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payers' AND column_name = 'dependent_on_payer_ids'
  ) THEN
    ALTER TABLE payers ADD COLUMN dependent_on_payer_ids jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;