import React from 'react';
import { useWorkflows, useSubflows, useTasks, useProviders } from '../hooks/useDatabase';
import { Workflow as WorkflowIcon, TrendingUp } from 'lucide-react';

interface WorkflowProgressWidgetProps {
  onNavigate?: (providerId: string, workflowId: string) => void;
}

interface WorkflowProgress {
  workflowId: string;
  workflowName: string;
  providerId: string;
  providerName: string;
  totalTasks: number;
  completedTasks: number;
  submittedTasks: number;
  percentage: number;
}

export const WorkflowProgressWidget: React.FC<WorkflowProgressWidgetProps> = ({ onNavigate }) => {
  const { workflows } = useWorkflows();
  const { subflows } = useSubflows();
  const { tasks } = useTasks();
  const { providers } = useProviders();
  const [workflowProgress, setWorkflowProgress] = React.useState<WorkflowProgress[]>([]);

  React.useEffect(() => {
    const calculateProgress = () => {
      const progressMap = new Map<string, WorkflowProgress>();

      workflows.forEach(workflow => {
        const workflowSubflows = subflows.filter(sf => sf.workflow_id === workflow.id);

        workflowSubflows.forEach(subflow => {
          const subflowTasks = tasks.filter(t => t.subflow_id === subflow.id);

          subflowTasks.forEach(task => {
            if (task.provider_id) {
              const key = `${workflow.id}-${task.provider_id}`;

              if (!progressMap.has(key)) {
                const provider = providers.find(p => p.id === task.provider_id);
                progressMap.set(key, {
                  workflowId: workflow.id,
                  workflowName: workflow.name,
                  providerId: task.provider_id,
                  providerName: provider ? `${provider.first_name} ${provider.last_name}` : 'Unknown',
                  totalTasks: 0,
                  completedTasks: 0,
                  submittedTasks: 0,
                  percentage: 0
                });
              }

              const progress = progressMap.get(key)!;
              progress.totalTasks++;

              if (task.status === 'completed') {
                progress.completedTasks++;
              } else if (task.status === 'in_progress' && task.title.toLowerCase().includes('submit')) {
                progress.submittedTasks++;
              }
            }
          });
        });
      });

      const progressArray = Array.from(progressMap.values())
        .map(p => ({
          ...p,
          percentage: p.totalTasks > 0 ? Math.round(((p.completedTasks + p.submittedTasks) / p.totalTasks) * 100) : 0
        }))
        .filter(p => p.percentage < 100 && p.totalTasks > 0)
        .sort((a, b) => b.percentage - a.percentage);

      setWorkflowProgress(progressArray);
    };

    calculateProgress();
  }, [workflows, subflows, tasks, providers]);

  if (workflowProgress.length === 0) {
    return (
      <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 p-6">
        <h2 className="text-xl font-semibold text-navy dark:text-white mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          In-Progress Workflows
        </h2>
        <div className="text-center py-8">
          <WorkflowIcon className="h-12 w-12 text-navy/20 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-navy/60 dark:text-gray-400">No workflows in progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-navy dark:text-white mb-4 flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        In-Progress Workflows
      </h2>
      <div className="space-y-4">
        {workflowProgress.map((progress, index) => {
          const completedPercentage = progress.totalTasks > 0
            ? (progress.completedTasks / progress.totalTasks) * 100
            : 0;
          const submittedPercentage = progress.totalTasks > 0
            ? (progress.submittedTasks / progress.totalTasks) * 100
            : 0;

          return (
            <div
              key={`${progress.workflowId}-${progress.providerId}-${index}`}
              className="cursor-pointer hover:bg-navy/5 dark:hover:bg-navy-dark p-3 rounded-lg transition-colors"
              onClick={() => onNavigate?.(progress.providerId, progress.workflowId)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-navy dark:text-white text-sm">
                    {progress.providerName}
                  </h3>
                  <p className="text-xs text-navy/60 dark:text-gray-400">
                    {progress.workflowName}
                  </p>
                </div>
                <span className="text-sm font-semibold text-navy dark:text-white">
                  {progress.percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="bg-green-500 dark:bg-green-600 h-full transition-all duration-300"
                    style={{ width: `${completedPercentage}%` }}
                  />
                  <div
                    className="bg-yellow-500 dark:bg-yellow-600 h-full transition-all duration-300"
                    style={{ width: `${submittedPercentage}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-navy/60 dark:text-gray-400">
                <span>{progress.completedTasks} completed, {progress.submittedTasks} submitted</span>
                <span>{progress.totalTasks} total tasks</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
