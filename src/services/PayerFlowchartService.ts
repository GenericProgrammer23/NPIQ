import { DatabaseService, Payer, PayerTaskTemplate, Provider } from '../lib/supabase';

export interface FlowchartNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    taskType?: string;
    triggerCondition?: string;
    status?: 'completed' | 'pending' | 'in_progress' | 'not_created';
  };
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: string;
  animated?: boolean;
}

export class PayerFlowchartService {
  /**
   * Generates flowchart data for a payer's workflow
   */
  static async generateFlowchartForPayer(
    payerId: string,
    providerId?: string
  ): Promise<{ nodes: FlowchartNode[]; edges: FlowchartEdge[] }> {
    const payer = await DatabaseService.getPayer(payerId);
    if (!payer) {
      return { nodes: [], edges: [] };
    }

    const templates = await DatabaseService.getPayerTaskTemplates(payerId);
    const nodes: FlowchartNode[] = [];
    const edges: FlowchartEdge[] = [];

    let yOffset = 0;
    const xSpacing = 300;
    const ySpacing = 120;

    // Get task statuses if provider is specified
    let taskStatuses: Record<string, string> = {};
    if (providerId) {
      const tasks = await DatabaseService.getTasks({ providerId });
      taskStatuses = tasks
        .filter(t => t.payer_id === payerId)
        .reduce((acc, task) => {
          acc[task.title] = task.status;
          return acc;
        }, {} as Record<string, string>);
    }

    // Section 1: Dependencies (if any)
    if (payer.dependent_on_payer_ids && payer.dependent_on_payer_ids.length > 0) {
      nodes.push({
        id: 'dep-header',
        type: 'input',
        position: { x: xSpacing, y: yOffset },
        data: {
          label: 'Prerequisites',
          description: 'Must be approved first'
        }
      });
      yOffset += ySpacing;

      for (let i = 0; i < payer.dependent_on_payer_ids.length; i++) {
        const depPayerId = payer.dependent_on_payer_ids[i];
        const depPayer = await DatabaseService.getPayer(depPayerId);
        if (depPayer) {
          const nodeId = `dep-${depPayerId}`;
          nodes.push({
            id: nodeId,
            type: 'default',
            position: { x: i * xSpacing, y: yOffset },
            data: {
              label: `${depPayer.name} Approved`,
              status: 'pending'
            }
          });
        }
      }
      yOffset += ySpacing * 1.5;
    }

    // Section 2: Initial Phase (on_provider_assign)
    const initialTasks = templates.filter(t => t.trigger_condition === 'on_provider_assign');
    if (initialTasks.length > 0) {
      nodes.push({
        id: 'phase-initial',
        type: 'input',
        position: { x: xSpacing, y: yOffset },
        data: {
          label: 'Initial Phase',
          description: 'Tasks created when payer assigned'
        }
      });
      yOffset += ySpacing;

      initialTasks.forEach((template, i) => {
        const nodeId = `task-${template.id}`;
        const status = taskStatuses[template.title_template] as any || 'not_created';

        nodes.push({
          id: nodeId,
          type: this.getNodeType(template.task_type),
          position: { x: i * xSpacing, y: yOffset },
          data: {
            label: template.title_template,
            description: template.description_template,
            taskType: template.task_type,
            triggerCondition: template.trigger_condition,
            status
          }
        });

        // Edge from dependencies if they exist
        if (nodes.find(n => n.id === 'dep-header')) {
          edges.push({
            id: `edge-dep-to-${nodeId}`,
            source: 'dep-header',
            target: nodeId,
            type: 'smoothstep'
          });
        }
      });
      yOffset += ySpacing * 1.5;
    }

    // Section 3: Submission Phase (prerequisites_met)
    const submitTasks = templates.filter(t => t.trigger_condition === 'prerequisites_met');
    if (submitTasks.length > 0) {
      submitTasks.forEach((template, i) => {
        const nodeId = `task-${template.id}`;
        const status = taskStatuses[template.title_template] as any || 'not_created';

        nodes.push({
          id: nodeId,
          type: 'output',
          position: { x: xSpacing, y: yOffset },
          data: {
            label: template.title_template,
            description: template.description_template,
            taskType: template.task_type,
            triggerCondition: template.trigger_condition,
            status
          }
        });

        // Edge from initial tasks to submit
        initialTasks.forEach(initTask => {
          edges.push({
            id: `edge-${initTask.id}-to-${nodeId}`,
            source: `task-${initTask.id}`,
            target: nodeId,
            type: 'smoothstep'
          });
        });
      });
      yOffset += ySpacing * 1.5;
    }

    // Section 4: Post-Submit Phase (on_task_complete:submit)
    const postSubmitTasks = templates.filter(t => t.trigger_condition?.includes('on_task_complete:submit'));
    if (postSubmitTasks.length > 0) {
      postSubmitTasks.forEach((template, i) => {
        const nodeId = `task-${template.id}`;
        const status = taskStatuses[template.title_template] as any || 'not_created';

        nodes.push({
          id: nodeId,
          type: 'default',
          position: { x: i * xSpacing, y: yOffset },
          data: {
            label: template.title_template,
            description: template.description_template,
            taskType: template.task_type,
            triggerCondition: template.trigger_condition,
            status
          }
        });

        // Edge from submit task
        const submitNode = nodes.find(n => n.data.taskType === 'submit');
        if (submitNode) {
          edges.push({
            id: `edge-${submitNode.id}-to-${nodeId}`,
            source: submitNode.id,
            target: nodeId,
            label: 'on complete',
            type: 'smoothstep',
            animated: true
          });
        }
      });
      yOffset += ySpacing;
    }

    // Section 5: Post-Submission (on_submission)
    const onSubmissionTasks = templates.filter(t => t.trigger_condition === 'on_submission');
    if (onSubmissionTasks.length > 0) {
      onSubmissionTasks.forEach((template, i) => {
        const nodeId = `task-${template.id}`;
        const status = taskStatuses[template.title_template] as any || 'not_created';

        nodes.push({
          id: nodeId,
          type: 'default',
          position: { x: (i + postSubmitTasks.length) * xSpacing, y: yOffset },
          data: {
            label: template.title_template,
            description: template.description_template,
            taskType: template.task_type,
            triggerCondition: template.trigger_condition,
            status
          }
        });

        // Edge from submit task
        const submitNode = nodes.find(n => n.data.taskType === 'submit');
        if (submitNode) {
          edges.push({
            id: `edge-${submitNode.id}-to-${nodeId}`,
            source: submitNode.id,
            target: nodeId,
            label: 'on submit date',
            type: 'smoothstep'
          });
        }
      });
      yOffset += ySpacing * 1.5;
    }

    // Section 6: Post-Approval (on_approval)
    const approvalTasks = templates.filter(t => t.trigger_condition === 'on_approval');
    if (approvalTasks.length > 0) {
      approvalTasks.forEach((template, i) => {
        const nodeId = `task-${template.id}`;
        const status = taskStatuses[template.title_template] as any || 'not_created';

        nodes.push({
          id: nodeId,
          type: 'output',
          position: { x: i * xSpacing, y: yOffset },
          data: {
            label: template.title_template,
            description: template.description_template,
            taskType: template.task_type,
            triggerCondition: template.trigger_condition,
            status
          }
        });

        // Edge from approval tracking task
        const approvalNode = nodes.find(n => n.data.taskType === 'approval');
        if (approvalNode) {
          edges.push({
            id: `edge-${approvalNode.id}-to-${nodeId}`,
            source: approvalNode.id,
            target: nodeId,
            label: 'on approval',
            type: 'smoothstep',
            animated: true
          });
        }
      });
    }

    return { nodes, edges };
  }

  private static getNodeType(taskType: string): string {
    switch (taskType) {
      case 'submit':
        return 'output';
      case 'info':
      case 'document':
        return 'default';
      case 'approval':
      case 'loading':
        return 'default';
      default:
        return 'default';
    }
  }
}
