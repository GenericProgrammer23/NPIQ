/*
  # Add Subflow Tracking and Reusability Features

  ## Summary
  Enhances the subflows table to support the unified workflow system where subflows
  become reusable components that can be referenced in visual workflows.

  ## Changes Made

  ### 1. New Columns Added to `subflows` Table
  - `execution_count` (integer) - Tracks how many times this subflow has been executed
  - `last_executed_at` (timestamptz) - Records the last time this subflow was executed
  - `is_reusable` (boolean) - Marks if this subflow can be reused across workflows
  - `tags` (jsonb) - Flexible tagging system for categorization and search

  ### 2. Indexes for Performance
  - Index on `is_reusable` for filtering reusable subflows
  - Index on `tags` using GIN for fast tag-based searches
  - Index on `payer_id` and `workflow_id` for relationship queries

  ### 3. Purpose
  These enhancements enable:
  - Visual workflows to reference and execute subflows
  - Tracking subflow usage and popularity
  - Better organization through tagging
  - Quick filtering of reusable components
*/

-- Add new columns to subflows table
DO $$
BEGIN
  -- Add execution_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'execution_count'
  ) THEN
    ALTER TABLE subflows ADD COLUMN execution_count INTEGER DEFAULT 0;
  END IF;

  -- Add last_executed_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'last_executed_at'
  ) THEN
    ALTER TABLE subflows ADD COLUMN last_executed_at TIMESTAMPTZ;
  END IF;

  -- Add is_reusable column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'is_reusable'
  ) THEN
    ALTER TABLE subflows ADD COLUMN is_reusable BOOLEAN DEFAULT true;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'tags'
  ) THEN
    ALTER TABLE subflows ADD COLUMN tags JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subflows_is_reusable ON subflows(is_reusable);
CREATE INDEX IF NOT EXISTS idx_subflows_tags ON subflows USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_subflows_payer_id ON subflows(payer_id) WHERE payer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subflows_workflow_id ON subflows(workflow_id) WHERE workflow_id IS NOT NULL;

-- Add helpful comment
COMMENT ON COLUMN subflows.execution_count IS 'Number of times this subflow has been executed';
COMMENT ON COLUMN subflows.last_executed_at IS 'Timestamp of the last execution of this subflow';
COMMENT ON COLUMN subflows.is_reusable IS 'Whether this subflow can be reused across multiple workflows';
COMMENT ON COLUMN subflows.tags IS 'Array of tags for categorization (e.g., ["license", "demographics"])';
