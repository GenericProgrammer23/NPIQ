import { Node, Edge } from 'reactflow';
import { WorkflowDatabaseService } from '../lib/workflowDatabase';
import { DatabaseService } from '../lib/supabase';
import { processTemplate, type TemplateContext } from '../utils/templateVariables';
import type {
  WorkflowDefinition,
  WorkflowExecutionInstance,
  NodeConfig,
  PrerequisiteCheckConfig,
  GenerateTaskConfig,
  WaitForDateConfig,
  WaitForDocumentConfig,
  WaitForProfileFieldConfig,
  SendNotificationConfig,
  AutoCompleteTaskConfig,
  UpdateProviderFieldConfig,
  ParallelTasksConfig
} from '../types/workflow';

export class WorkflowExecutionService {
  /**
   * Start a workflow for a provider-payer combination
   */
  static async startWorkflow(providerId: string, payerId: string, organizationId: string): Promise<string> {
    // Get active workflow definition for payer
    const workflow = await WorkflowDatabaseService.getActiveWorkflowForPayer(payerId);
    if (!workflow) {
      throw new Error(`No active workflow found for payer ${payerId}`);
    }

    // Check if workflow already running
    const existing = await WorkflowDatabaseService.getActiveExecutionForProviderPayer(providerId, payerId);
    if (existing) {
      console.log(`Workflow already running: ${existing.id}`);
      return existing.id;
    }

    // Create execution instance
    const instance = await WorkflowDatabaseService.createWorkflowExecution({
      workflow_definition_id: workflow.id,
      provider_id: providerId,
      payer_id: payerId,
      organization_id: organizationId,
      status: 'running',
      execution_context: {
        variables: {},
        generatedTaskIds: [],
        completedNodes: []
      },
      started_at: new Date().toISOString()
    });

    // Find START node and begin execution
    const startNode = workflow.workflow_data.nodes.find(n => n.type === 'start');
    if (startNode) {
      await this.executeNode(instance.id, startNode.id, workflow);
    }

    return instance.id;
  }

  /**
   * Execute a specific node in the workflow
   */
  static async executeNode(instanceId: string, nodeId: string, workflow?: WorkflowDefinition): Promise<void> {
    const instance = await WorkflowDatabaseService.getWorkflowExecution(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    if (!workflow) {
      if (!instance.workflow_definition_id) {
        throw new Error('No workflow definition associated with instance');
      }
      const wf = await WorkflowDatabaseService.getWorkflowDefinition(instance.workflow_definition_id);
      if (!wf) {
        throw new Error('Workflow definition not found');
      }
      workflow = wf;
    }

    const node = workflow.workflow_data.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found in workflow`);
    }

    // Create node execution record
    const nodeExec = await WorkflowDatabaseService.createNodeExecution({
      workflow_execution_instance_id: instanceId,
      node_id: nodeId,
      node_type: node.type || 'unknown',
      status: 'executing',
      started_at: new Date().toISOString(),
      result_data: {}
    });

    try {
      // Route to appropriate handler based on node type
      let result: any = {};
      let nextHandle = 'default';

      switch (node.type) {
        case 'start':
          result = await this.handleStartNode(instance, node);
          break;
        case 'prerequisite_check':
          result = await this.handlePrerequisiteCheck(instance, node);
          nextHandle = result.met ? 'met' : 'not_met';
          break;
        case 'generate_task':
        case 'generate_task_with_due_date':
          result = await this.handleGenerateTask(instance, node);
          break;
        case 'parallel_tasks':
          result = await this.handleParallelTasks(instance, node);
          nextHandle = result.allComplete ? 'all_complete' : 'any_complete';
          break;
        case 'wait_for_date':
          result = await this.handleWaitForDate(instance, node);
          if (result.waiting) {
            // Mark node as waiting, don't continue
            await WorkflowDatabaseService.updateNodeExecution(nodeExec.id, {
              status: 'waiting',
              result_data: result
            });
            await WorkflowDatabaseService.updateWorkflowExecution(instanceId, {
              status: 'waiting_for_date',
              current_node_id: nodeId
            });
            return;
          }
          break;
        case 'wait_for_document':
          result = await this.handleWaitForDocument(instance, node);
          if (result.waiting) {
            await WorkflowDatabaseService.updateNodeExecution(nodeExec.id, {
              status: 'waiting',
              result_data: result
            });
            await WorkflowDatabaseService.updateWorkflowExecution(instanceId, {
              status: 'waiting_for_prerequisite',
              current_node_id: nodeId
            });
            return;
          }
          nextHandle = result.uploaded ? 'uploaded' : 'timeout';
          break;
        case 'wait_for_profile_field':
          result = await this.handleWaitForProfileField(instance, node);
          if (result.waiting) {
            await WorkflowDatabaseService.updateNodeExecution(nodeExec.id, {
              status: 'waiting',
              result_data: result
            });
            await WorkflowDatabaseService.updateWorkflowExecution(instanceId, {
              status: 'waiting_for_prerequisite',
              current_node_id: nodeId
            });
            return;
          }
          nextHandle = result.filled ? 'filled' : 'timeout';
          break;
        case 'send_notification':
          result = await this.handleSendNotification(instance, node);
          break;
        case 'auto_complete_task':
          result = await this.handleAutoCompleteTask(instance, node);
          break;
        case 'update_provider_field':
          result = await this.handleUpdateProviderField(instance, node);
          break;
        case 'complete':
          result = await this.handleCompleteNode(instance, node);
          await WorkflowDatabaseService.updateNodeExecution(nodeExec.id, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            result_data: result
          });
          return;
        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      // Mark node as completed
      await WorkflowDatabaseService.updateNodeExecution(nodeExec.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        result_data: result
      });

      // Update execution context
      const updatedContext = {
        ...instance.execution_context,
        completedNodes: [...(instance.execution_context.completedNodes || []), nodeId],
        variables: {
          ...instance.execution_context.variables,
          ...result.variables
        }
      };

      await WorkflowDatabaseService.updateWorkflowExecution(instanceId, {
        execution_context: updatedContext
      });

      // Find next node(s) and continue
      await this.continueToNextNodes(instanceId, nodeId, nextHandle, workflow);

    } catch (error: any) {
      // Mark node as error
      await WorkflowDatabaseService.updateNodeExecution(nodeExec.id, {
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString()
      });

      await WorkflowDatabaseService.updateWorkflowExecution(instanceId, {
        status: 'error',
        error_message: error.message
      });

      throw error;
    }
  }

  /**
   * Continue to next nodes after current node completes
   */
  private static async continueToNextNodes(
    instanceId: string,
    currentNodeId: string,
    sourceHandle: string,
    workflow: WorkflowDefinition
  ): Promise<void> {
    // Find edges that start from current node
    const edges = workflow.workflow_data.edges.filter(e => e.source === currentNodeId);

    // Filter by source handle if specified
    const matchingEdges = edges.filter(e => {
      if (!e.sourceHandle) return sourceHandle === 'default';
      return e.sourceHandle === sourceHandle;
    });

    // Execute next nodes
    for (const edge of matchingEdges) {
      await this.executeNode(instanceId, edge.target, workflow);
    }
  }

  /**
   * Node Handler: START
   */
  private static async handleStartNode(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    return { started: true };
  }

  /**
   * Node Handler: PREREQUISITE_CHECK
   */
  private static async handlePrerequisiteCheck(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as PrerequisiteCheckConfig;
    const provider = await DatabaseService.getProvider(instance.provider_id);

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Check required fields
    const missingFields: string[] = [];
    for (const field of config.required_fields) {
      const value = provider[field as keyof typeof provider];
      if (!value || value === '') {
        missingFields.push(field);
      }
    }

    const met = config.check_type === 'all' ? missingFields.length === 0 : missingFields.length < config.required_fields.length;

    // If not met and should generate task
    if (!met && config.generate_info_task_if_missing) {
      const payer = await DatabaseService.getPayer(instance.payer_id);
      await DatabaseService.createTask({
        title: config.info_task_title || `Complete Provider Information for ${payer?.name}`,
        description: config.info_task_description || `Missing fields: ${missingFields.join(', ')}`,
        provider_id: instance.provider_id,
        payer_id: instance.payer_id,
        status: 'pending',
        priority: 'high',
        organization_id: instance.organization_id
      });
    }

    return { met, missingFields };
  }

  /**
   * Node Handler: GENERATE_TASK
   */
  private static async handleGenerateTask(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as GenerateTaskConfig;

    // Build template context for variable substitution
    const context = await this.buildTemplateContext(instance);

    // Process templates in title and description
    const taskTitle = processTemplate(config.task_title, context);
    const taskDescription = processTemplate(config.task_description, context);

    // Check for duplicates if enabled
    if (config.prevent_duplicates) {
      const existingTasks = await DatabaseService.getTasks({ providerId: instance.provider_id });
      const duplicate = existingTasks.find(t =>
        t.payer_id === instance.payer_id &&
        t.title === taskTitle &&
        t.status !== 'completed'
      );

      if (duplicate) {
        return { taskId: duplicate.id, duplicate: true };
      }
    }

    // Create task
    const task = await DatabaseService.createTask({
      title: taskTitle,
      description: taskDescription,
      provider_id: instance.provider_id,
      payer_id: instance.payer_id,
      status: 'pending',
      priority: config.priority,
      organization_id: instance.organization_id
    });

    // Store task ID in execution context
    const generatedTaskIds = [...(instance.execution_context.generatedTaskIds || []), task.id];

    return { taskId: task.id, generatedTaskIds };
  }

  /**
   * Node Handler: PARALLEL_TASKS
   */
  private static async handleParallelTasks(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as ParallelTasksConfig;

    if (!config.tasks || config.tasks.length === 0) {
      return { allComplete: true, anyComplete: false, tasksCreated: 0 };
    }

    const context = await this.buildTemplateContext(instance);
    const createdTaskIds: string[] = [];

    for (const taskConfig of config.tasks) {
      const taskTitle = processTemplate(taskConfig.title, context);
      const taskDescription = processTemplate(taskConfig.description, context);

      const existingTasks = await DatabaseService.getTasks({ providerId: instance.provider_id });
      const duplicate = existingTasks.find(t =>
        t.payer_id === instance.payer_id &&
        t.title === taskTitle &&
        t.status !== 'completed'
      );

      if (!duplicate) {
        const task = await DatabaseService.createTask({
          title: taskTitle,
          description: taskDescription,
          provider_id: instance.provider_id,
          payer_id: instance.payer_id,
          status: 'pending',
          priority: taskConfig.priority as any,
          organization_id: instance.organization_id
        });
        createdTaskIds.push(task.id);
      } else {
        createdTaskIds.push(duplicate.id);
      }
    }

    const tasks = await DatabaseService.getTasks({ providerId: instance.provider_id });
    const relevantTasks = tasks.filter(t => createdTaskIds.includes(t.id));
    const completedTasks = relevantTasks.filter(t => t.status === 'completed');

    const allComplete = completedTasks.length === relevantTasks.length;
    const anyComplete = completedTasks.length > 0;

    const generatedTaskIds = [...(instance.execution_context.generatedTaskIds || []), ...createdTaskIds];

    return {
      allComplete,
      anyComplete,
      tasksCreated: createdTaskIds.length,
      completedCount: completedTasks.length,
      totalCount: relevantTasks.length,
      generatedTaskIds
    };
  }

  /**
   * Node Handler: WAIT_FOR_DATE
   */
  private static async handleWaitForDate(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as WaitForDateConfig;

    // Check if date field is filled
    let dateValue: string | null = null;

    if (config.table === 'provider_payer_applications') {
      const apps = await DatabaseService.getProviderPayerApplications(instance.provider_id);
      const app = apps.find(a => a.payer_id === instance.payer_id);
      if (app) {
        dateValue = app[config.date_field as keyof typeof app] as string;
      }
    } else if (config.table === 'providers') {
      const provider = await DatabaseService.getProvider(instance.provider_id);
      if (provider) {
        dateValue = provider[config.date_field as keyof typeof provider] as string;
      }
    }

    if (dateValue) {
      return { dateEntered: dateValue, waiting: false };
    }

    return { waiting: true, waitingFor: config.date_field };
  }

  /**
   * Node Handler: AUTO_COMPLETE_TASK
   */
  private static async handleAutoCompleteTask(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as AutoCompleteTaskConfig;

    // Find task by title pattern
    const tasks = await DatabaseService.getTasks({ providerId: instance.provider_id });
    const task = tasks.find(t =>
      t.payer_id === instance.payer_id &&
      t.title.includes(config.task_title_pattern) &&
      t.status !== 'completed'
    );

    if (task) {
      await DatabaseService.updateTask(task.id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      return { taskId: task.id, completed: true };
    }

    return { completed: false };
  }

  /**
   * Node Handler: UPDATE_PROVIDER_FIELD
   */
  private static async handleUpdateProviderField(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as UpdateProviderFieldConfig;

    let value: any;
    if (config.value_source === 'current_date') {
      value = new Date().toISOString().split('T')[0];
    } else if (config.value_source === 'static') {
      value = config.static_value;
    } else if (config.value_source === 'variable') {
      value = instance.execution_context.variables[config.variable_name || ''];
    }

    await DatabaseService.updateProvider(instance.provider_id, {
      [config.field_name]: value
    });

    return { fieldName: config.field_name, value };
  }

  /**
   * Node Handler: COMPLETE
   */
  private static async handleCompleteNode(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    await WorkflowDatabaseService.updateWorkflowExecution(instance.id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    return { completed: true };
  }

  /**
   * Node Handler: WAIT FOR DOCUMENT
   */
  private static async handleWaitForDocument(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as WaitForDocumentConfig;

    // Check if document has been uploaded
    // Note: This requires a documents table in the database
    // For now, we'll return a waiting state
    // TODO: Implement document checking logic when documents table is available

    return {
      waiting: true,
      document_type: config.document_type,
      auto_complete_task: config.auto_complete_task_on_upload
    };
  }

  /**
   * Node Handler: WAIT FOR PROFILE FIELD
   */
  private static async handleWaitForProfileField(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as WaitForProfileFieldConfig;

    // Get provider or location data
    let entity: any = null;
    if (config.entity_type === 'provider') {
      const providers = await DatabaseService.getProviders();
      entity = providers.find(p => p.id === instance.provider_id);
    } else {
      // TODO: Add location lookup when needed
    }

    if (!entity) {
      return { waiting: true, reason: 'Entity not found' };
    }

    // Check if required fields are filled
    const checkResults = config.required_fields.map(fieldName => {
      const value = entity[fieldName];
      return value !== null && value !== undefined && value !== '';
    });

    const allFilled = config.check_type === 'all'
      ? checkResults.every(r => r)
      : checkResults.some(r => r);

    if (!allFilled) {
      return {
        waiting: true,
        required_fields: config.required_fields,
        check_type: config.check_type
      };
    }

    // Fields are filled, auto-complete task if configured
    if (config.auto_complete_task_on_fill && config.task_title_pattern) {
      const context = await this.buildTemplateContext(instance);
      const taskTitle = processTemplate(config.task_title_pattern, context);

      const tasks = await DatabaseService.getTasks({ providerId: instance.provider_id });
      const matchingTask = tasks.find(t =>
        t.title === taskTitle &&
        t.payer_id === instance.payer_id &&
        t.status !== 'completed'
      );

      if (matchingTask) {
        await DatabaseService.updateTask(matchingTask.id, { status: 'completed' });
      }
    }

    return { filled: true, waiting: false };
  }

  /**
   * Node Handler: SEND NOTIFICATION
   */
  private static async handleSendNotification(instance: WorkflowExecutionInstance, node: Node): Promise<any> {
    const config = node.data.config as SendNotificationConfig;

    // Build template context for variable substitution
    const context = await this.buildTemplateContext(instance);

    // Process templates in subject and message
    const subject = processTemplate(config.subject, context);
    const message = processTemplate(config.message, context);

    // TODO: Implement actual notification sending
    // For now, just log the notification
    console.log('Send Notification:', {
      type: config.notification_type,
      recipient_type: config.recipient_type,
      subject,
      message,
      include_task_link: config.include_task_link
    });

    return {
      notification_sent: true,
      subject,
      message,
      type: config.notification_type
    };
  }

  /**
   * Build template context for variable substitution
   */
  private static async buildTemplateContext(instance: WorkflowExecutionInstance): Promise<TemplateContext> {
    // Get provider data
    const providers = await DatabaseService.getProviders();
    const provider = providers.find(p => p.id === instance.provider_id);

    // Get payer data
    const payers = await DatabaseService.getPayers();
    const payer = payers.find(p => p.id === instance.payer_id);

    // Get organization data
    const orgs = await DatabaseService.getOrganizations();
    const organization = orgs.find(o => o.id === instance.organization_id);

    // TODO: Add location data when needed

    return {
      provider: provider ? {
        id: provider.id,
        first_name: provider.first_name,
        last_name: provider.last_name,
        email: provider.email || '',
        phone: provider.phone || '',
        specialty: provider.specialty || '',
        license_number: provider.license_number || ''
      } : undefined,
      payer: payer ? {
        id: payer.id,
        name: payer.name,
        type: payer.type || '',
        workflow_state: payer.workflow_state || ''
      } : undefined,
      organization: organization ? {
        id: organization.id,
        name: organization.name
      } : undefined,
      dates: {
        current_date: new Date().toISOString().split('T')[0]
      },
      custom: instance.execution_context.variables || {}
    };
  }

  /**
   * Resume workflow when a condition is met (e.g., date entered)
   */
  static async continueWorkflow(providerId: string, payerId: string): Promise<void> {
    const instance = await WorkflowDatabaseService.getActiveExecutionForProviderPayer(providerId, payerId);

    if (!instance || !instance.current_node_id) {
      return;
    }

    if (!instance.workflow_definition_id) {
      throw new Error('No workflow definition associated with instance');
    }

    const workflow = await WorkflowDatabaseService.getWorkflowDefinition(instance.workflow_definition_id);
    if (!workflow) {
      throw new Error('Workflow definition not found');
    }

    // Update status to running
    await WorkflowDatabaseService.updateWorkflowExecution(instance.id, {
      status: 'running'
    });

    // Continue from current node
    await this.executeNode(instance.id, instance.current_node_id, workflow);
  }
}
