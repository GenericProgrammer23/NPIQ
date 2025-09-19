/*
  # Add subflow_id to tasks table (idempotent)

  1. Changes
    - Add subflow_id column to tasks table if it doesn't exist
    - Add foreign key constraint to subflows table if it doesn't exist
    - Add index for performance if it doesn't exist

  2. Security
    - No RLS changes needed (inherits from existing tasks policies)
*/

-- Add subflow_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'subflow_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN subflow_id uuid;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_subflow_id_fkey'
    AND table_name = 'tasks'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_subflow_id_fkey 
    FOREIGN KEY (subflow_id) REFERENCES subflows(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_tasks_subflow_id'
  ) THEN
    CREATE INDEX idx_tasks_subflow_id ON tasks(subflow_id);
  END IF;
END $$;