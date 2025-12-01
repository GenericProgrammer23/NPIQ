/*
  # Add Visual Workflow Data to Subflows

  ## Summary
  Transforms subflows from text-based configurations to fully visual node-based workflows.
  This enables a nested, hierarchical workflow system where subflows have their own visual
  workflow designer just like top-level workflows.

  ## Changes Made

  ### 1. New Columns Added to `subflows` Table
  - `workflow_data` (jsonb) - Stores the visual workflow graph (nodes and edges)
  - `metadata` (jsonb) - Stores viewport state, version info, and other metadata

  ### 2. Structure of workflow_data
  ```json
  {
    "nodes": [
      {
        "id": "node_id",
        "type": "node_type",
        "position": {"x": 100, "y": 200},
        "data": {"config": {...}}
      }
    ],
    "edges": [
      {
        "id": "edge_id",
        "source": "node_id",
        "target": "node_id"
      }
    ]
  }
  ```

  ### 3. Structure of metadata
  ```json
  {
    "viewport": {"x": 0, "y": 0, "zoom": 1},
    "last_edited_by": "user_id",
    "version": 1,
    "migrated": false
  }
  ```

  ### 4. Indexes for Performance
  - Index to quickly find subflows with visual workflows
  - GIN index for efficient JSONB queries

  ### 5. Purpose
  This enables:
  - Subflows to be designed visually using the same node-based designer
  - Users to "dive into" subflows from EXECUTE_SUBFLOW nodes
  - Nested workflow hierarchies (workflows contain subflows contain sub-subflows)
  - Complete visual consistency across the entire system
*/

-- Add workflow_data column to subflows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'workflow_data'
  ) THEN
    ALTER TABLE subflows ADD COLUMN workflow_data JSONB;
  END IF;
END $$;

-- Add metadata column to subflows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subflows' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE subflows ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index to find subflows with visual workflows
CREATE INDEX IF NOT EXISTS idx_subflows_has_visual_workflow 
ON subflows((workflow_data IS NOT NULL))
WHERE workflow_data IS NOT NULL;

-- Create GIN index for efficient JSONB queries on workflow_data
CREATE INDEX IF NOT EXISTS idx_subflows_workflow_data 
ON subflows USING GIN(workflow_data);

-- Create GIN index for efficient JSONB queries on metadata
CREATE INDEX IF NOT EXISTS idx_subflows_metadata 
ON subflows USING GIN(metadata);

-- Add helpful comments
COMMENT ON COLUMN subflows.workflow_data IS 'Visual workflow graph with nodes and edges (same structure as workflow_definitions)';
COMMENT ON COLUMN subflows.metadata IS 'Metadata including viewport state, version, and editor info';
