/*
  # Add subflow_id to tasks table

  1. Changes
    - Add `subflow_id` column to `tasks` table
    - Add foreign key constraint to `subflows` table
    - Add index for performance

  2. Security
    - No RLS changes needed (inherits from existing task policies)
*/

-- Add subflow_id column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subflow_id uuid;

-- Add foreign key constraint
ALTER TABLE tasks ADD CONSTRAINT tasks_subflow_id_fkey 
  FOREIGN KEY (subflow_id) REFERENCES subflows(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tasks_subflow_id ON tasks(subflow_id);