import { DatabaseService, Provider, Payer, Task } from '../lib/supabase';

export class DynamicTaskUpdateService {
  /**
   * Updates provider information tasks to reflect currently missing fields
   * Auto-completes task if all required fields are now present
   */
  static async updateProviderInfoTask(
    taskId: string,
    providerId: string,
    payerId: string
  ): Promise<{ updated: boolean; autoCompleted: boolean; stillMissing: string[] }> {
    try {
      // Get the task, provider, and payer
      const task = await DatabaseService.getTask(taskId);
      const provider = await DatabaseService.getProvider(providerId);
      const payer = await DatabaseService.getPayer(payerId);

      if (!task || !provider || !payer) {
        return { updated: false, autoCompleted: false, stillMissing: [] };
      }

      // Only process if this is an info task
      if (!task.title.includes('Complete Provider Information') && !task.title.includes('Complete Info')) {
        return { updated: false, autoCompleted: false, stillMissing: [] };
      }

      // Get required fields from payer
      const requiredFields = payer.required_provider_fields || [];
      if (requiredFields.length === 0) {
        return { updated: false, autoCompleted: false, stillMissing: [] };
      }

      // Check which fields are missing
      const missingFields: string[] = [];
      const completedFields: string[] = [];

      for (const field of requiredFields) {
        const value = provider[field as keyof Provider];
        if (!value || value === '') {
          missingFields.push(field);
        } else {
          completedFields.push(field);
        }
      }

      // If no fields missing, auto-complete the task
      if (missingFields.length === 0) {
        await DatabaseService.updateTask(taskId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          title: `Complete Provider Information for ${payer.name}`,
          description: `All required fields are now complete! ✓\n\nCompleted fields: ${completedFields.join(', ')}`,
          last_updated_by_system: new Date().toISOString()
        });

        return { updated: true, autoCompleted: true, stillMissing: [] };
      }

      // Otherwise, update the task description with current missing fields
      const newDescription = this.buildProviderInfoDescription(
        payer.name,
        missingFields,
        completedFields
      );

      await DatabaseService.updateTask(taskId, {
        title: `Complete Provider Information for ${payer.name}`,
        description: newDescription,
        last_updated_by_system: new Date().toISOString()
      });

      return { updated: true, autoCompleted: false, stillMissing: missingFields };
    } catch {
      return { updated: false, autoCompleted: false, stillMissing: [] };
    }
  }

  /**
   * Finds and updates all provider info tasks for a specific provider
   */
  static async updateRelatedProviderInfoTasks(providerId: string): Promise<{
    tasksUpdated: number;
    tasksCompleted: number;
    results: Array<{ taskId: string; payerName: string; stillMissing: string[]; autoCompleted: boolean }>;
  }> {
    try {
      // Get all pending/in-progress info tasks for this provider
      const tasks = await DatabaseService.getTasks({ providerId, status: ['pending', 'in_progress'] });

      const infoTasks = tasks.filter(task =>
        task.payer_id &&
        (task.title.includes('Complete Provider Information') || task.title.includes('Complete Info'))
      );

      let tasksUpdated = 0;
      let tasksCompleted = 0;
      const results = [];

      for (const task of infoTasks) {
        if (!task.payer_id) continue;

        const result = await this.updateProviderInfoTask(task.id, providerId, task.payer_id);

        if (result.updated) {
          tasksUpdated++;

          if (result.autoCompleted) {
            tasksCompleted++;
          }

          // Get payer name for result
          const payer = await DatabaseService.getPayer(task.payer_id);
          results.push({
            taskId: task.id,
            payerName: payer?.name || 'Unknown',
            stillMissing: result.stillMissing,
            autoCompleted: result.autoCompleted
          });
        }
      }

      return { tasksUpdated, tasksCompleted, results };
    } catch {
      return { tasksUpdated: 0, tasksCompleted: 0, results: [] };
    }
  }

  /**
   * Checks if a submit task should auto-complete based on submission date
   */
  static async checkAndAutoCompleteSubmitTask(
    providerId: string,
    payerId: string,
    applicationSubmissionDate: string
  ): Promise<boolean> {
    try {
      // Find submit task for this provider/payer
      const tasks = await DatabaseService.getTasks({ providerId });
      const submitTask = tasks.find(task =>
        task.payer_id === payerId &&
        task.title.includes('Submit') &&
        task.title.includes('Application') &&
        task.status !== 'completed'
      );

      if (!submitTask) {
        return false;
      }

      // Auto-complete the submit task
      await DatabaseService.updateTask(submitTask.id, {
        status: 'completed',
        completed_at: applicationSubmissionDate,
        description: `Application submitted on ${new Date(applicationSubmissionDate).toLocaleDateString()}`,
        last_updated_by_system: new Date().toISOString()
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Marks "Enter Provider in Prompt" task as complete and updates provider loading date
   */
  static async completeLoadingTask(
    taskId: string,
    providerId: string
  ): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Update task
      await DatabaseService.updateTask(taskId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });

      // Update provider with credentialing loaded date
      await DatabaseService.updateProvider(providerId, {
        credentialing_loaded_date: today
      });

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Builds a descriptive message for provider info tasks
   */
  private static buildProviderInfoDescription(
    payerName: string,
    missingFields: string[],
    completedFields: string[]
  ): string {
    const formatFieldName = (field: string) => {
      return field
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    let description = `Ensure the following provider information is complete for ${payerName} application:\n\n`;

    if (missingFields.length > 0) {
      description += `❌ **Missing Fields:**\n`;
      missingFields.forEach(field => {
        description += `  • ${formatFieldName(field)}\n`;
      });
    }

    if (completedFields.length > 0) {
      description += `\n✓ **Completed Fields:**\n`;
      completedFields.forEach(field => {
        description += `  • ${formatFieldName(field)}\n`;
      });
    }

    description += `\n**Next Step:** Click on this task to open the provider modal, click "Edit", fill in the missing fields, and save.`;

    return description;
  }
}
