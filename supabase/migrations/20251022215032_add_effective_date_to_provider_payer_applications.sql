/*
  # Add Effective Date to Provider Payer Applications

  1. Changes
    - Add effective_date column to provider_payer_applications table
    - This represents when the provider becomes effective with the payer
    
  2. Notes
    - Column is nullable as it may not always be set immediately
    - Uses DATE type to match other date columns in the table
*/

-- Add effective_date column
ALTER TABLE provider_payer_applications 
ADD COLUMN IF NOT EXISTS effective_date DATE;