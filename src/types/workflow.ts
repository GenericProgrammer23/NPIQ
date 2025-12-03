import { Node, Edge } from 'reactflow';

export type WorkflowNodeType =
  | 'start'
  | 'complete'
  | 'prerequisite_check'
  | 'dependency_check'
  | 'generate_task'
  | 'generate_task_with_due_date'
  | 'wait_for_date'
  | 'wait_for_document'
  | 'wait_for_profile_field'
  | 'calculate_due_date'
  | 'branch'
  | 'parallel_tasks'
  | 'auto_complete_task'
  | 'update_provider_field'
  | 'send_notification'
  | 'execute_subflow'
  | 'check_subflow_status'
  | 'execute_workflow_template';

export type WorkflowExecutionStatus =
  | 'running'
  | 'waiting_for_date'
  | 'waiting_for_prerequisite'
  | 'waiting_for_dependency'
  | 'completed'
  | 'error'
  | 'paused';

export type NodeExecutionStatus =
  | 'pending'
  | 'executing'
  | 'completed'
  | 'skipped'
  | 'error'
  | 'waiting';

export interface WorkflowDefinition {
  id: string;
  payer_id: string;
  organization_id: string;
  name: string;
  description?: string;
  version: number;
  effective_from_date: string;
  effective_to_date?: string;
  is_active: boolean;
  created_by?: string;
  workflow_data: {
    nodes: Node[];
    edges: Edge[];
  };
  metadata?: {
    viewport?: { x: number; y: number; zoom: number };
  };
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  workflow_definition_id: string;
  node_id: string;
  node_type: WorkflowNodeType;
  label: string;
  config: NodeConfig;
  position_x: number;
  position_y: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEdge {
  id: string;
  workflow_definition_id: string;
  edge_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string;
  target_handle?: string;
  label?: string;
  edge_type: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowExecutionInstance {
  id: string;
  workflow_definition_id?: string;
  provider_id: string;
  payer_id: string;
  organization_id: string;
  status: WorkflowExecutionStatus;
  current_node_id?: string;
  execution_context: ExecutionContext;
  started_at: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNodeExecution {
  id: string;
  workflow_execution_instance_id: string;
  node_id: string;
  node_type: string;
  status: NodeExecutionStatus;
  started_at: string;
  completed_at?: string;
  result_data: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowVersionHistory {
  id: string;
  workflow_definition_id: string;
  payer_id: string;
  version: number;
  changes_summary: string;
  changed_by?: string;
  previous_version_id?: string;
  created_at: string;
}

export interface ExecutionContext {
  variables: Record<string, any>;
  generatedTaskIds: string[];
  completedNodes: string[];
  [key: string]: any;
}

export type NodeConfig =
  | StartNodeConfig
  | CompleteNodeConfig
  | PrerequisiteCheckConfig
  | DependencyCheckConfig
  | GenerateTaskConfig
  | GenerateTaskWithDueDateConfig
  | WaitForDateConfig
  | WaitForDocumentConfig
  | WaitForProfileFieldConfig
  | CalculateDueDateConfig
  | BranchConfig
  | ParallelTasksConfig
  | AutoCompleteTaskConfig
  | UpdateProviderFieldConfig
  | SendNotificationConfig
  | ExecuteSubflowConfig
  | CheckSubflowStatusConfig
  | ExecuteWorkflowTemplateConfig;

export interface BaseNodeConfig {
  type: WorkflowNodeType;
}

export interface StartNodeConfig extends BaseNodeConfig {
  type: 'start';
  trigger: 'on_payer_assignment';
}

export interface CompleteNodeConfig extends BaseNodeConfig {
  type: 'complete';
  completion_message: string;
  trigger_notifications: boolean;
  notification_recipients?: string[];
  mark_application_as?: 'loaded' | 'completed';
}

export interface PrerequisiteCheckConfig extends BaseNodeConfig {
  type: 'prerequisite_check';
  required_fields: string[];
  required_documents?: string[];
  check_type: 'all' | 'any';
  generate_info_task_if_missing: boolean;
  info_task_title?: string;
  info_task_description?: string;
}

export interface DependencyCheckConfig extends BaseNodeConfig {
  type: 'dependency_check';
  dependency_type: 'payer' | 'subflow' | 'workflow_template' | 'task';

  required_payers?: string[];
  required_payer_status?: 'approved' | 'loaded';

  required_subflows?: string[];
  required_subflow_status?: 'not_started' | 'in_progress' | 'complete';

  required_workflow_templates?: string[];
  required_workflow_status?: 'active' | 'completed';

  required_task_titles?: string[];
  required_task_status?: 'completed';

  check_type: 'all' | 'any';
  block_if_not_met: boolean;
}

export interface GenerateTaskConfig extends BaseNodeConfig {
  type: 'generate_task';
  task_title: string;
  task_description: string;
  task_type: 'document' | 'info' | 'submit' | 'approval' | 'loading';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to_role?: string;
  prevent_duplicates: boolean;
}

export interface GenerateTaskWithDueDateConfig extends GenerateTaskConfig {
  type: 'generate_task_with_due_date';
  due_date_variable?: string;
  due_date_base_field?: string;
  due_date_offset_days?: number;
  due_date_offset_source?: 'static' | 'payer_field';
  payer_field_name?: string;
}

export interface WaitForDateConfig extends BaseNodeConfig {
  type: 'wait_for_date';
  date_field: 'application_submission_date' | 'application_approved_date' | 'provider_loaded_date' | string;
  table: 'provider_payer_applications' | 'providers';
  timeout_days?: number;
  timeout_action?: 'alert' | 'fail' | 'continue';
}

export interface CalculateDueDateConfig extends BaseNodeConfig {
  type: 'calculate_due_date';
  base_date_field: string;
  base_date_source: 'application' | 'provider' | 'variable';
  operation: 'add' | 'subtract';
  offset_value?: number;
  offset_source: 'static' | 'payer_field';
  payer_field_name?: string;
  store_in_variable: string;
}

export interface BranchConfig extends BaseNodeConfig {
  type: 'branch';
  condition_type: 'field_value' | 'field_exists' | 'custom_expression';
  field_to_check?: string;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'is_empty';
  comparison_value?: string | number | boolean;
  custom_expression?: string;
}

export interface ParallelTasksConfig extends BaseNodeConfig {
  type: 'parallel_tasks';
  tasks: Array<{
    title: string;
    description: string;
    type: string;
    priority: string;
  }>;
  wait_for_all: boolean;
}

export interface AutoCompleteTaskConfig extends BaseNodeConfig {
  type: 'auto_complete_task';
  task_title_pattern: string;
  completion_date_field: string;
  update_completed_at: boolean;
}

export interface UpdateProviderFieldConfig extends BaseNodeConfig {
  type: 'update_provider_field';
  field_name: string;
  value_source: 'static' | 'current_date' | 'variable';
  static_value?: string;
  variable_name?: string;
}

export interface WaitForDocumentConfig extends BaseNodeConfig {
  type: 'wait_for_document';
  document_type: string;
  document_name?: string;
  auto_complete_task_on_upload: boolean;
  task_title_pattern?: string;
  timeout_days?: number;
  timeout_action?: 'alert' | 'continue' | 'fail';
}

export interface WaitForProfileFieldConfig extends BaseNodeConfig {
  type: 'wait_for_profile_field';
  entity_type: 'provider' | 'location';
  required_fields: string[];
  check_type: 'all' | 'any';
  auto_complete_task_on_fill: boolean;
  task_title_pattern?: string;
  timeout_days?: number;
  timeout_action?: 'alert' | 'continue' | 'fail';
}

export interface SendNotificationConfig extends BaseNodeConfig {
  type: 'send_notification';
  notification_type: 'email' | 'in_app' | 'both';
  recipient_type: 'assigned_user' | 'role' | 'specific_user';
  recipient_role?: 'admin' | 'manager' | 'user';
  recipient_user_id?: string;
  subject: string;
  message: string;
  include_task_link: boolean;
}

export interface NodeTypeDefinition {
  type: WorkflowNodeType;
  label: string;
  icon: string;
  color: string;
  category: 'flow' | 'prerequisites' | 'tasks' | 'dates' | 'data' | 'components';
  description: string;
  inputs: string[];
  outputs: string[];
  defaultConfig: Partial<NodeConfig>;
}

export interface ExecuteSubflowConfig extends BaseNodeConfig {
  type: 'execute_subflow';
  subflow_id: string;
  subflow_name?: string;
  wait_for_completion: boolean;
  pass_context: boolean;
  timeout_days?: number;
}

export interface CheckSubflowStatusConfig extends BaseNodeConfig {
  type: 'check_subflow_status';
  required_subflows: string[];
  required_status: 'not_started' | 'in_progress' | 'complete';
  check_type: 'all' | 'any';
}

export interface ExecuteWorkflowTemplateConfig extends BaseNodeConfig {
  type: 'execute_workflow_template';
  workflow_template_id: string;
  workflow_template_name?: string;
  wait_for_completion: boolean;
}

export const NODE_TYPE_DEFINITIONS: Record<WorkflowNodeType, NodeTypeDefinition> = {
  start: {
    type: 'start',
    label: 'Start',
    icon: 'Play',
    color: '#10b981',
    category: 'flow',
    description: 'Workflow starts when payer is assigned to provider',
    inputs: [],
    outputs: ['default'],
    defaultConfig: {
      type: 'start',
      trigger: 'on_payer_assignment'
    }
  },
  complete: {
    type: 'complete',
    label: 'Complete',
    icon: 'CheckCircle2',
    color: '#22c55e',
    category: 'flow',
    description: 'Marks workflow as complete',
    inputs: ['default'],
    outputs: [],
    defaultConfig: {
      type: 'complete',
      completion_message: 'Workflow completed successfully',
      trigger_notifications: false
    }
  },
  prerequisite_check: {
    type: 'prerequisite_check',
    label: 'Check Prerequisites',
    icon: 'CheckCircle',
    color: '#3b82f6',
    category: 'prerequisites',
    description: 'Checks if required fields and documents are present',
    inputs: ['default'],
    outputs: ['met', 'not_met'],
    defaultConfig: {
      type: 'prerequisite_check',
      required_fields: [],
      check_type: 'all',
      generate_info_task_if_missing: true
    }
  },
  dependency_check: {
    type: 'dependency_check',
    label: 'Check Dependencies',
    icon: 'GitBranch',
    color: '#ec4899',
    category: 'prerequisites',
    description: 'Checks if payers, subflows, workflows, or tasks are completed',
    inputs: ['default'],
    outputs: ['met', 'not_met'],
    defaultConfig: {
      type: 'dependency_check',
      dependency_type: 'payer',
      check_type: 'all',
      block_if_not_met: true
    }
  },
  execute_subflow: {
    type: 'execute_subflow',
    label: 'Execute Subflow',
    icon: 'Play',
    color: '#8b5cf6',
    category: 'components',
    description: 'Executes a reusable subflow component',
    inputs: ['default'],
    outputs: ['default'],
    defaultConfig: {
      type: 'execute_subflow',
      subflow_id: '',
      wait_for_completion: true,
      pass_context: true
    }
  },
  check_subflow_status: {
    type: 'check_subflow_status',
    label: 'Check Subflow Status',
    icon: 'ListChecks',
    color: '#10b981',
    category: 'components',
    description: 'Checks if subflows are completed',
    inputs: ['default'],
    outputs: ['met', 'not_met'],
    defaultConfig: {
      type: 'check_subflow_status',
      required_subflows: [],
      required_status: 'complete',
      check_type: 'all'
    }
  },
  execute_workflow_template: {
    type: 'execute_workflow_template',
    label: 'Execute Workflow Template',
    icon: 'Workflow',
    color: '#3b82f6',
    category: 'components',
    description: 'Executes a reusable workflow template',
    inputs: ['default'],
    outputs: ['default'],
    defaultConfig: {
      type: 'execute_workflow_template',
      workflow_template_id: '',
      wait_for_completion: true
    }
  },
  generate_task: {
    type: 'generate_task',
    label: 'Generate Task',
    icon: 'CheckSquare',
    color: '#8b5cf6',
    category: 'tasks',
    description: 'Creates a new task for the user',
    inputs: ['default'],
    outputs: ['default'],
    defaultConfig: {
      type: 'generate_task',
      task_title: 'New Task',
      task_description: '',
      task_type: 'document',
      priority: 'medium',
      prevent_duplicates: true
    }
  },
  generate_task_with_due_date: {
    type: 'generate_task_with_due_date',
    label: 'Generate Task (Due Date)',
    icon: 'CalendarCheck',
    color: '#a855f7',
    category: 'tasks',
    description: 'Creates a task with a calculated due date',
    inputs: ['default'],
    outputs: ['default'],
    defaultConfig: {
      type: 'generate_task_with_due_date',
      task_title: 'New Task',
      task_description: '',
      task_type: 'approval',
      priority: 'high',
      prevent_duplicates: true
    }
  },
  wait_for_date: {
    type: 'wait_for_date',
    label: 'Wait for Date',
    icon: 'Calendar',
    color: '#f59e0b',
    category: 'dates',
    description: 'Pauses workflow until a date field is filled',
    inputs: ['default'],
    outputs: ['date_entered', 'timeout'],
    defaultConfig: {
      type: 'wait_for_date',
      date_field: 'application_submission_date',
      table: 'provider_payer_applications'
    }
  },
  calculate_due_date: {
    type: 'calculate_due_date',
    label: 'Calculate Due Date',
    icon: 'Calculator',
    color: '#06b6d4',
    category: 'dates',
    description: 'Calculates a due date based on another date',
    inputs: ['default'],
    outputs: ['default'],
    defaultConfig: {
      type: 'calculate_due_date',
      base_date_field: 'application_submission_date',
      base_date_source: 'application',
      operation: 'add',
      offset_source: 'static',
      store_in_variable: 'calculated_due_date'
    }
  },
  branch: {
    type: 'branch',
    label: 'Branch',
    icon: 'GitMerge',
    color: '#14b8a6',
    category: 'flow',
    description: 'Conditional branching based on a condition',
    inputs: ['default'],
    outputs: ['true', 'false'],
    defaultConfig: {
      type: 'branch',
      condition_type: 'field_value'
    }
  },
  parallel_tasks: {
    type: 'parallel_tasks',
    label: 'Parallel Tasks',
    icon: 'Layers',
    color: '#f97316',
    category: 'tasks',
    description: 'Generates multiple tasks simultaneously',
    inputs: ['default'],
    outputs: ['all_complete', 'any_complete'],
    defaultConfig: {
      type: 'parallel_tasks',
      tasks: [],
      wait_for_all: true
    }
  },
  auto_complete_task: {
    type: 'auto_complete_task',
    label: 'Auto-Complete Task',
    icon: 'CheckCheck',
    color: '#84cc16',
    category: 'tasks',
    description: 'Automatically marks a task as complete',
    inputs: ['default'],
    outputs: ['default'],
    defaultConfig: {
      type: 'auto_complete_task',
      task_title_pattern: '',
      completion_date_field: '',
      update_completed_at: true
    }
  },
  update_provider_field: {
    type: 'update_provider_field',
    label: 'Update Provider Data',
    icon: 'Edit',
    color: '#6366f1',
    category: 'data',
    description: 'Updates a field in the provider record',
    inputs: ['default'],
    outputs: ['default'],
    defaultConfig: {
      type: 'update_provider_field',
      field_name: '',
      value_source: 'current_date'
    }
  },
  wait_for_document: {
    type: 'wait_for_document',
    label: 'Wait for Document',
    icon: 'FileText',
    color: '#f59e0b',
    category: 'prerequisites',
    description: 'Pauses workflow until a document is uploaded, optionally auto-completing task',
    inputs: ['default'],
    outputs: ['uploaded', 'timeout'],
    defaultConfig: {
      type: 'wait_for_document',
      document_type: '',
      auto_complete_task_on_upload: true,
      task_title_pattern: ''
    }
  },
  wait_for_profile_field: {
    type: 'wait_for_profile_field',
    label: 'Wait for Profile Field',
    icon: 'UserCheck',
    color: '#f59e0b',
    category: 'prerequisites',
    description: 'Pauses workflow until provider/location fields are filled, optionally auto-completing task',
    inputs: ['default'],
    outputs: ['filled', 'timeout'],
    defaultConfig: {
      type: 'wait_for_profile_field',
      entity_type: 'provider',
      required_fields: [],
      check_type: 'all',
      auto_complete_task_on_upload: true
    }
  },
  send_notification: {
    type: 'send_notification',
    label: 'Send Notification',
    icon: 'Bell',
    color: '#06b6d4',
    category: 'flow',
    description: 'Sends an email or in-app notification to users',
    inputs: ['default'],
    outputs: ['default'],
    defaultConfig: {
      type: 'send_notification',
      notification_type: 'in_app',
      recipient_type: 'assigned_user',
      subject: '',
      message: '',
      include_task_link: false
    }
  }
};
