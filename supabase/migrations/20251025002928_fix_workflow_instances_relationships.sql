/*
  # Fix Workflow Instances Relationships

  This migration adds proper handling for the polymorphic entity_id relationship
  in workflow_instances table.

  ## Changes
    - Add check constraints to ensure entity_id references valid providers or locations
    - Add helper function to validate entity references
    - Update documentation

  ## Note
    We cannot use traditional foreign keys for polymorphic relationships,
    so we rely on application-level validation and check constraints.
*/

-- Create a function to validate entity references
CREATE OR REPLACE FUNCTION validate_workflow_instance_entity()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if entity exists based on entity_type
  IF NEW.entity_type = 'provider' THEN
    IF NOT EXISTS (SELECT 1 FROM providers WHERE id = NEW.entity_id) THEN
      RAISE EXCEPTION 'Provider with id % does not exist', NEW.entity_id;
    END IF;
  ELSIF NEW.entity_type = 'location' THEN
    IF NOT EXISTS (SELECT 1 FROM locations WHERE id = NEW.entity_id) THEN
      RAISE EXCEPTION 'Location with id % does not exist', NEW.entity_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to validate entity references
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_workflow_instance_entity_trigger'
  ) THEN
    CREATE TRIGGER validate_workflow_instance_entity_trigger
      BEFORE INSERT OR UPDATE ON workflow_instances
      FOR EACH ROW
      EXECUTE FUNCTION validate_workflow_instance_entity();
  END IF;
END $$;
