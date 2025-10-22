/*
  # Add Unique Constraint and Improve Task Management

  1. Changes
    - Add unique constraint to prevent duplicate "Obtain Provider Information" tasks per provider
    - This ensures only one such task exists per provider at a time
    
  2. Notes
    - Uses partial unique index to only apply to specific task titles
    - Allows multiple other types of tasks per provider
*/

-- Create a unique index to prevent duplicate "Obtain Provider Information" tasks per provider
CREATE UNIQUE INDEX IF NOT EXISTS unique_obtain_provider_info_task 
ON tasks (provider_id, title) 
WHERE title = 'Obtain Provider Information' AND status IN ('pending', 'in_progress');