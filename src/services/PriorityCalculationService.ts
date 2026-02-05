import { DatabaseService, Task, Payer, PriorityRule } from '../lib/supabase';

interface DependencyGraph {
  [payerId: string]: {
    payer: Payer;
    dependents: string[];
    blockedBy: string[];
  };
}

export class PriorityCalculationService {
  static async calculateTaskPriority(
    task: Task,
    providerId?: string,
    organizationId?: string
  ): Promise<{ priority: number; reason: string }> {
    let totalPriority = 100;
    const reasons: string[] = [];

    // Load priority rules if organization is specified
    let rules: PriorityRule[] = [];
    if (organizationId) {
      rules = await this.loadPriorityRules(organizationId);
    }

    // Factor 1: Payer base priority (if task is linked to a payer)
    if (task.subflow_id) {
      const payerPriority = await this.getPayerPriorityFromSubflow(task.subflow_id);
      if (payerPriority) {
        const weight = this.getRuleWeight(rules, 'payer_base') || 1.0;
        totalPriority = payerPriority.priority_base * weight;

        if (payerPriority.is_always_required) {
          totalPriority = Math.min(totalPriority, 5);
          reasons.push(`${payerPriority.name} is always required (highest priority)`);
        } else {
          reasons.push(`Payer priority: ${payerPriority.priority_base}`);
        }
      }
    }

    // Factor 2: Number of dependent payers (blocking analysis)
    if (providerId && task.blocks_payers && task.blocks_payers.length > 0) {
      const weight = this.getRuleWeight(rules, 'dependency_count') || 2.0;
      const blockingCount = task.blocks_payers.length;
      totalPriority -= (blockingCount * 10 * weight);
      reasons.push(`Blocks ${blockingCount} payer(s)`);
    }

    // Factor 3: Due date urgency
    if (task.due_date) {
      const { urgencyScore, urgencyText } = this.calculateDateUrgency(task.due_date);
      const weight = this.getRuleWeight(rules, 'due_date') || 1.5;
      totalPriority += (urgencyScore * weight);
      reasons.push(urgencyText);
    }

    // Factor 4: Task type weighting
    const taskTypeScore = this.getTaskTypeScore(task.title, task.description || '');
    const weight = this.getRuleWeight(rules, 'task_type') || 1.0;
    totalPriority += (taskTypeScore * weight);

    // Factor 5: Manual priority override
    const manualPriorityScore = this.getManualPriorityScore(task.priority);
    totalPriority -= manualPriorityScore;

    if (task.priority === 'urgent') {
      reasons.unshift('Marked as urgent');
    }

    // Ensure priority is within bounds
    totalPriority = Math.max(1, Math.min(1000, totalPriority));

    return {
      priority: Math.round(totalPriority),
      reason: reasons.join(' • ')
    };
  }

  static async buildDependencyGraph(
    payers: Payer[],
    providerId?: string
  ): Promise<DependencyGraph> {
    const graph: DependencyGraph = {};

    // Initialize graph nodes
    for (const payer of payers) {
      graph[payer.id] = {
        payer,
        dependents: [],
        blockedBy: payer.dependent_on_payer_ids || []
      };
    }

    // Build dependency relationships
    for (const payer of payers) {
      if (payer.dependent_on_payer_ids) {
        for (const dependencyId of payer.dependent_on_payer_ids) {
          if (graph[dependencyId]) {
            graph[dependencyId].dependents.push(payer.id);
          }
        }
      }
    }

    return graph;
  }

  static async analyzeBlockingImpact(
    payerId: string,
    graph: DependencyGraph
  ): Promise<{ directBlocks: number; totalBlocks: number; criticalPath: string[] }> {
    const directBlocks = graph[payerId]?.dependents.length || 0;
    const visited = new Set<string>();
    const criticalPath: string[] = [];

    const countTransitiveDependents = (id: string): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const node = graph[id];
      if (!node || node.dependents.length === 0) return 0;

      criticalPath.push(node.payer.name);

      let count = node.dependents.length;
      for (const dependentId of node.dependents) {
        count += countTransitiveDependents(dependentId);
      }

      return count;
    };

    const totalBlocks = countTransitiveDependents(payerId);

    return {
      directBlocks,
      totalBlocks,
      criticalPath
    };
  }

  static async updateTaskPriorities(
    tasks: Task[],
    organizationId?: string
  ): Promise<Task[]> {
    const updatedTasks: Task[] = [];

    for (const task of tasks) {
      const { priority, reason } = await this.calculateTaskPriority(
        task,
        task.provider_id,
        organizationId
      );

      const updatedTask = {
        ...task,
        computed_priority: priority,
        priority_reason: reason
      };

      // Update in database if changed
      if (task.computed_priority !== priority || task.priority_reason !== reason) {
        try {
          await DatabaseService.updateTask(task.id, {
            computed_priority: priority,
            priority_reason: reason
          });
        } catch { }
      }

      updatedTasks.push(updatedTask);
    }

    return updatedTasks;
  }

  private static async loadPriorityRules(organizationId: string): Promise<PriorityRule[]> {
    try {
      const rules = await DatabaseService.getPriorityRules(organizationId);
      return rules.filter(r => r.is_active);
    } catch {
      return [];
    }
  }

  private static getRuleWeight(rules: PriorityRule[], ruleType: string): number | null {
    const rule = rules.find(r => r.rule_type === ruleType);
    return rule ? rule.weight : null;
  }

  private static async getPayerPriorityFromSubflow(subflowId: string): Promise<Payer | null> {
    try {
      const subflow = await DatabaseService.getSubflow(subflowId);
      if (subflow?.payer_id) {
        return await DatabaseService.getPayer(subflow.payer_id);
      }
      return null;
    } catch {
      return null;
    }
  }

  private static calculateDateUrgency(dueDate: string): { urgencyScore: number; urgencyText: string } {
    const now = new Date();
    const due = new Date(dueDate);
    const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDue < 0) {
      return { urgencyScore: -50, urgencyText: `Overdue by ${Math.abs(daysUntilDue)} days` };
    } else if (daysUntilDue === 0) {
      return { urgencyScore: -30, urgencyText: 'Due today' };
    } else if (daysUntilDue <= 3) {
      return { urgencyScore: -20, urgencyText: `Due in ${daysUntilDue} days` };
    } else if (daysUntilDue <= 7) {
      return { urgencyScore: -10, urgencyText: `Due in ${daysUntilDue} days` };
    } else if (daysUntilDue <= 14) {
      return { urgencyScore: 0, urgencyText: `Due in ${daysUntilDue} days` };
    } else {
      return { urgencyScore: 10, urgencyText: `Due in ${daysUntilDue} days` };
    }
  }

  private static getTaskTypeScore(title: string, description: string): number {
    const text = `${title} ${description}`.toLowerCase();

    // Info gathering is highest priority (most blocking)
    if (text.includes('information') || text.includes('complete') || text.includes('field')) {
      return -15;
    }

    // Document collection is high priority
    if (text.includes('obtain') || text.includes('collect') || text.includes('document')) {
      return -10;
    }

    // Submission is medium-high priority
    if (text.includes('submit') || text.includes('application')) {
      return -5;
    }

    // Tracking is medium priority
    if (text.includes('track') || text.includes('approval')) {
      return 0;
    }

    // Loading/confirmation is lower priority
    if (text.includes('confirm') || text.includes('load')) {
      return 5;
    }

    return 0;
  }

  private static getManualPriorityScore(priority: string): number {
    switch (priority) {
      case 'urgent':
        return 40;
      case 'high':
        return 20;
      case 'medium':
        return 0;
      case 'low':
        return -20;
      default:
        return 0;
    }
  }

  static sortTasksByPriority(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // Sort by computed_priority (ascending, so 1 = highest)
      const priorityDiff = (a.computed_priority || 100) - (b.computed_priority || 100);
      if (priorityDiff !== 0) return priorityDiff;

      // Within same priority, sort by due date
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;

      return 0;
    });
  }
}
