import { DatabaseService, Payer, Provider, PayerTaskTemplate, ProviderPayerApplication } from '../lib/supabase';

export class TaskGenerationService {
  static async generateTasksForProviderPayer(
    provider: Provider,
    payer: Payer,
    application: ProviderPayerApplication
  ): Promise<void> {
    // Check if prerequisites are met
    const prerequisitesMet = await this.checkPrerequisites(payer, provider);

    // Get task templates for this payer
    const templates = await DatabaseService.getPayerTaskTemplates(payer.id);

    for (const template of templates) {
      const shouldCreate = this.shouldCreateTask(template, application, prerequisitesMet);

      if (shouldCreate) {
        await this.createTaskFromTemplate(template, provider, payer, application);
      }
    }
  }

  private static shouldCreateTask(
    template: PayerTaskTemplate,
    application: ProviderPayerApplication,
    prerequisitesMet: boolean
  ): boolean {
    const { task_type, trigger_condition } = template;

    // Check trigger conditions
    switch (trigger_condition) {
      case 'on_provider_assign':
        return application.status === 'not_started';

      case 'prerequisites_met':
        return prerequisitesMet && application.status === 'not_started';

      case 'on_submission':
        return application.status === 'submitted' && !!application.application_submission_date;

      case 'on_approval':
        return application.status === 'approved' && !!application.application_approved_date;

      case 'manual':
      default:
        return false;
    }
  }

  private static async createTaskFromTemplate(
    template: PayerTaskTemplate,
    provider: Provider,
    payer: Payer,
    application: ProviderPayerApplication
  ): Promise<void> {
    // Calculate due date
    let dueDate: string | undefined;
    if (template.due_date_offset_days) {
      const baseDate = this.getBaseDateForTask(template, application);
      if (baseDate) {
        const due = new Date(baseDate);
        due.setDate(due.getDate() + template.due_date_offset_days);
        dueDate = due.toISOString();
      }
    }

    // Calculate priority
    const computedPriority = this.calculatePriority(payer, template);
    const priorityReason = this.generatePriorityReason(payer, template);

    // Get payer subflow if exists
    const subflow = await DatabaseService.getPayerSubflow(payer.id);

    // Check if task already exists (prevent duplication)
    if (template.prevents_duplication !== false) {
      const existingTasks = await DatabaseService.getTasks({ providerId: provider.id });
      const duplicate = existingTasks.find(t =>
        t.payer_id === payer.id &&
        t.title === template.title_template &&
        t.status !== 'completed'
      );
      if (duplicate) {
        console.log(`Task already exists: ${template.title_template}`);
        return;
      }
    }

    await DatabaseService.createTask({
      title: template.title_template,
      description: template.description_template || '',
      provider_id: provider.id,
      payer_id: payer.id,
      task_template_id: template.id,
      subflow_id: subflow?.id,
      status: 'pending',
      priority: this.mapComputedToManualPriority(computedPriority),
      computed_priority: computedPriority,
      priority_reason: priorityReason,
      blocks_payers: payer.is_always_required ? [] : [payer.id],
      due_date: dueDate,
      auto_generated: true,
      organization_id: provider.organization_id
    });
  }

  private static getBaseDateForTask(
    template: PayerTaskTemplate,
    application: ProviderPayerApplication
  ): Date | null {
    switch (template.task_type) {
      case 'approval':
        return application.application_submission_date
          ? new Date(application.application_submission_date)
          : null;

      case 'loading':
        return application.application_approved_date
          ? new Date(application.application_approved_date)
          : null;

      default:
        return new Date();
    }
  }

  private static calculatePriority(payer: Payer, template: PayerTaskTemplate): number {
    let priority = payer.priority_base || 100;

    // Apply template modifier
    priority += template.priority_modifier || 0;

    // Always required payers get highest priority
    if (payer.is_always_required) {
      priority = Math.min(priority, 10);
    }

    return priority;
  }

  private static generatePriorityReason(payer: Payer, template: PayerTaskTemplate): string {
    const reasons: string[] = [];

    if (payer.is_always_required) {
      reasons.push(`${payer.name} is always required (highest priority)`);
    } else if (payer.priority_base && payer.priority_base < 50) {
      reasons.push(`High priority payer (priority: ${payer.priority_base})`);
    }

    if (template.task_type === 'info') {
      reasons.push('Required information missing');
    } else if (template.task_type === 'document') {
      reasons.push('Required document');
    }

    if (payer.dependent_on_payer_ids && payer.dependent_on_payer_ids.length > 0) {
      reasons.push(`Depends on ${payer.dependent_on_payer_ids.length} other payer(s)`);
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Standard priority';
  }

  private static mapComputedToManualPriority(computed: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (computed <= 20) return 'urgent';
    if (computed <= 50) return 'high';
    if (computed <= 100) return 'medium';
    return 'low';
  }

  private static async checkPrerequisites(payer: Payer, provider: Provider): Promise<boolean> {
    if (!payer.dependent_on_payer_ids || payer.dependent_on_payer_ids.length === 0) {
      return true;
    }

    // Check if all dependent payers are approved
    const applications = await DatabaseService.getProviderPayerApplications(provider.id);

    for (const dependentPayerId of payer.dependent_on_payer_ids) {
      const app = applications.find(a => a.payer_id === dependentPayerId);
      if (!app || app.status !== 'approved') {
        return false;
      }
    }

    return true;
  }

  static async checkMissingProviderFields(
    provider: Provider,
    requiredFields: string[]
  ): Promise<string[]> {
    const missing: string[] = [];

    for (const field of requiredFields) {
      const value = provider[field as keyof Provider];
      if (!value || value === '') {
        missing.push(field);
      }
    }

    return missing;
  }

  static async regenerateTasksForProvider(providerId: string): Promise<void> {
    // Get all payer applications for this provider
    const applications = await DatabaseService.getProviderPayerApplications({ providerId });
    const provider = await DatabaseService.getProvider(providerId);

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Delete existing generated tasks (keep manually created ones)
    // This would need a flag to distinguish generated vs manual tasks

    // Regenerate tasks for each payer
    for (const application of applications) {
      if (application.payer) {
        await this.generateTasksForProviderPayer(provider, application.payer, application);
      }
    }
  }

  /**
   * Handles task completion and triggers dependent tasks
   */
  static async handleTaskCompletion(taskId: string): Promise<{ tasksCreated: number; taskTitles: string[] }> {
    try {
      const task = await DatabaseService.getTask(taskId);
      if (!task || !task.provider_id || !task.payer_id) {
        return { tasksCreated: 0, taskTitles: [] };
      }

      const provider = await DatabaseService.getProvider(task.provider_id);
      const payer = await DatabaseService.getPayer(task.payer_id);
      const application = (await DatabaseService.getProviderPayerApplications(task.provider_id))
        .find(app => app.payer_id === task.payer_id);

      if (!provider || !payer || !application) {
        return { tasksCreated: 0, taskTitles: [] };
      }

      // Get all templates for this payer
      const templates = await DatabaseService.getPayerTaskTemplates(payer.id);

      // Find templates that should be triggered by this task completion
      const triggeredTemplates = templates.filter(template => {
        if (!template.trigger_condition) return false;

        // Check for task-type-based triggers
        if (template.trigger_condition.startsWith('on_task_complete:')) {
          const triggerType = template.trigger_condition.split(':')[1];

          // Match by task type
          if (task.title.toLowerCase().includes(triggerType)) {
            return true;
          }

          // Match by parent_task_type if specified
          if (template.parent_task_type && task.title.toLowerCase().includes(template.parent_task_type)) {
            return true;
          }
        }

        return false;
      });

      const createdTasks: string[] = [];

      // Create tasks from triggered templates
      for (const template of triggeredTemplates) {
        await this.createTaskFromTemplate(template, provider, payer, application);
        createdTasks.push(template.title_template);
      }

      return { tasksCreated: createdTasks.length, taskTitles: createdTasks };
    } catch (error) {
      console.error('Error handling task completion:', error);
      return { tasksCreated: 0, taskTitles: [] };
    }
  }
}
