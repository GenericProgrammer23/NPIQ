/*
  # Add action category support to workflow definitions
  
  1. Changes
    - Add `action_category` column to `workflow_definitions`
    - This allows each payer to have different workflows for different action types
    - Examples: Medicare Initial Credentialing vs Medicare Name Change
  
  2. Migration Details
    - Adds nullable action_category column (defaults to 'credentialing' for backwards compatibility)
    - Updates unique constraint to include action_category
    - Existing workflows will work as-is with 'credentialing' category
*/

-- Add action_category column to workflow_definitions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workflow_definitions' AND column_name = 'action_category'
  ) THEN
    ALTER TABLE workflow_definitions
    ADD COLUMN action_category text DEFAULT 'credentialing'
    CHECK (action_category IN ('credentialing', 'change', 'renewal', 'custom'));
  END IF;
END $$;

-- Update any NULL action_category values to 'credentialing'
UPDATE workflow_definitions
SET action_category = 'credentialing'
WHERE action_category IS NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_payer_action
  ON workflow_definitions(payer_id, action_category);

-- Add comment
COMMENT ON COLUMN workflow_definitions.action_category IS 'Action type this workflow is for (credentialing, change, renewal, custom)';
