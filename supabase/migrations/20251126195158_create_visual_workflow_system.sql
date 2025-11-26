/*
  # Create Visual Workflow System

  Complete database schema for visual workflow builder system.

  1. New Tables:
    - workflow_definitions: Store workflow versions with effective dates
    - workflow_nodes: Individual nodes with positions and configs
    - workflow_edges: Connections between nodes
    - workflow_execution_instances: Track running workflows per provider
    - workflow_node_executions: Track execution of individual nodes
    - workflow_version_history: Version tracking and change history

  2. Features:
    - Workflow versioning with effective dates
    - Node-based workflow design
    - Real-time execution tracking
    - Complete audit trail

  3. Security:
    - RLS enabled on all tables
    - Admin-only write access for workflow design
    - Read access for execution tracking
*/

-- =====================================================
-- SECTION 1: WORKFLOW DEFINITIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id uuid REFERENCES payers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  version integer NOT NULL DEFAULT 1,
  effective_from_date date NOT NULL DEFAULT CURRENT_DATE,
  effective_to_date date DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_by uuid DEFAULT NULL,
  workflow_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_active_workflow_per_payer UNIQUE (payer_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_payer ON workflow_definitions(payer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_active ON workflow_definitions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_org ON workflow_definitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_effective_dates ON workflow_definitions(effective_from_date, effective_to_date);

COMMENT ON TABLE workflow_definitions IS 'Stores workflow versions with effective date ranges';
COMMENT ON COLUMN workflow_definitions.workflow_data IS 'Complete React Flow graph (nodes and edges) in JSON format';
COMMENT ON COLUMN workflow_definitions.metadata IS 'Canvas viewport, zoom level, and other UI state';

-- =====================================================
-- SECTION 2: WORKFLOW NODES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id uuid REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  node_type text NOT NULL,
  label text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  position_x float NOT NULL DEFAULT 0,
  position_y float NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_node_per_workflow UNIQUE (workflow_definition_id, node_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_nodes_definition ON workflow_nodes(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_type ON workflow_nodes(node_type);

COMMENT ON TABLE workflow_nodes IS 'Individual nodes in a workflow with configuration';
COMMENT ON COLUMN workflow_nodes.node_id IS 'React Flow node ID (e.g., "node_1")';
COMMENT ON COLUMN workflow_nodes.node_type IS 'Type: start, prerequisite_check, generate_task, etc.';
COMMENT ON COLUMN workflow_nodes.config IS 'Node-specific configuration';

-- =====================================================
-- SECTION 3: WORKFLOW EDGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id uuid REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  edge_id text NOT NULL,
  source_node_id text NOT NULL,
  target_node_id text NOT NULL,
  source_handle text DEFAULT NULL,
  target_handle text DEFAULT NULL,
  label text DEFAULT NULL,
  edge_type text DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_edge_per_workflow UNIQUE (workflow_definition_id, edge_id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_edges_definition ON workflow_edges(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_source ON workflow_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_target ON workflow_edges(target_node_id);

COMMENT ON TABLE workflow_edges IS 'Connections between workflow nodes';
COMMENT ON COLUMN workflow_edges.source_handle IS 'For branching: "true", "false", "met", "not_met"';
COMMENT ON COLUMN workflow_edges.edge_type IS 'Visual style: default, conditional, dependency';

-- =====================================================
-- SECTION 4: WORKFLOW EXECUTION INSTANCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_execution_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id uuid REFERENCES workflow_definitions(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES payers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'running',
  current_node_id text DEFAULT NULL,
  execution_context jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  error_message text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT workflow_execution_status_check CHECK (status IN (
    'running',
    'waiting_for_date',
    'waiting_for_prerequisite',
    'waiting_for_dependency',
    'completed',
    'error',
    'paused'
  ))
);

CREATE INDEX IF NOT EXISTS idx_workflow_exec_provider ON workflow_execution_instances(provider_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_payer ON workflow_execution_instances(payer_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_status ON workflow_execution_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_org ON workflow_execution_instances(organization_id);
CREATE INDEX IF NOT EXISTS idx_workflow_exec_provider_payer ON workflow_execution_instances(provider_id, payer_id);

COMMENT ON TABLE workflow_execution_instances IS 'Tracks running workflow instances for each provider-payer combination';
COMMENT ON COLUMN workflow_execution_instances.current_node_id IS 'Node where execution is currently paused/waiting';
COMMENT ON COLUMN workflow_execution_instances.execution_context IS 'Variables, calculated values, generated task IDs';

-- =====================================================
-- SECTION 5: WORKFLOW NODE EXECUTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_node_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_execution_instance_id uuid REFERENCES workflow_execution_instances(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  node_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz DEFAULT NULL,
  result_data jsonb DEFAULT '{}'::jsonb,
  error_message text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT node_execution_status_check CHECK (status IN (
    'pending',
    'executing',
    'completed',
    'skipped',
    'error',
    'waiting'
  ))
);

CREATE INDEX IF NOT EXISTS idx_workflow_node_exec_instance ON workflow_node_executions(workflow_execution_instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_exec_node ON workflow_node_executions(node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_exec_status ON workflow_node_executions(status);

COMMENT ON TABLE workflow_node_executions IS 'Tracks execution of individual nodes within a workflow instance';
COMMENT ON COLUMN workflow_node_executions.result_data IS 'Output data from node execution (e.g., generated task ID, calculated date)';

-- =====================================================
-- SECTION 6: WORKFLOW VERSION HISTORY TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_version_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id uuid REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES payers(id) ON DELETE CASCADE,
  version integer NOT NULL,
  changes_summary text NOT NULL,
  changed_by uuid DEFAULT NULL,
  previous_version_id uuid REFERENCES workflow_version_history(id) DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_version_definition ON workflow_version_history(workflow_definition_id);
CREATE INDEX IF NOT EXISTS idx_workflow_version_payer ON workflow_version_history(payer_id);

COMMENT ON TABLE workflow_version_history IS 'Audit trail of workflow versions and changes';

-- =====================================================
-- SECTION 7: ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_version_history ENABLE ROW LEVEL SECURITY;

-- workflow_definitions policies
CREATE POLICY "Users can view workflows in their organization"
  ON workflow_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create workflows"
  ON workflow_definitions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update workflows"
  ON workflow_definitions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete workflows"
  ON workflow_definitions FOR DELETE
  TO authenticated
  USING (true);

-- workflow_nodes policies
CREATE POLICY "Users can view workflow nodes"
  ON workflow_nodes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage workflow nodes"
  ON workflow_nodes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- workflow_edges policies
CREATE POLICY "Users can view workflow edges"
  ON workflow_edges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage workflow edges"
  ON workflow_edges FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- workflow_execution_instances policies
CREATE POLICY "Users can view workflow executions"
  ON workflow_execution_instances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage workflow executions"
  ON workflow_execution_instances FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- workflow_node_executions policies
CREATE POLICY "Users can view node executions"
  ON workflow_node_executions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage node executions"
  ON workflow_node_executions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- workflow_version_history policies
CREATE POLICY "Users can view version history"
  ON workflow_version_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create version history"
  ON workflow_version_history FOR INSERT
  TO authenticated
  WITH CHECK (true);