import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, AlertCircle, Play, CheckSquare } from 'lucide-react';
import { WorkflowInstance, Subflow, Task } from '../lib/supabase';
import { DatabaseService } from '../lib/supabase';

interface WorkflowInstanceDetailModalProps {
  instance: WorkflowInstance;
  onClose: () => void;
}

export const WorkflowInstanceDetailModal: React.FC<WorkflowInstanceDetailModalProps> = ({
  instance,
  onClose
}) => {
  const [subflows, setSubflows] = useState<Subflow[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInstanceData();
  }, [instance.id]);

  const loadInstanceData = async () => {
    try {
      setLoading(true);
      const [subflowsData, tasksData] = await Promise.all([
        DatabaseService.getSubflows(),
        DatabaseService.getTasks({ instanceId: instance.id } as any)
      ]);

      const instanceSubflows = subflowsData.filter(s => s.instance_id === instance.id);
      setSubflows(instanceSubflows);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load instance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEntityName = () => {
    if (instance.entity_type === 'provider' && instance.provider) {
      return `${instance.provider.first_name} ${instance.provider.last_name}`;
    }
    if (instance.entity_type === 'location' && instance.location) {
      return instance.location.name;
    }
    return 'Unknown';
  };

  const getSubflowStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'not_started': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-4xl p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-navy/10 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-32 bg-navy/10 dark:bg-gray-700 rounded"></div>
            <div className="h-32 bg-navy/10 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30 flex items-center justify-between sticky top-0 bg-white dark:bg-navy-light z-10">
          <div>
            <h2 className="text-2xl font-bold text-navy dark:text-white">
              {instance.workflow_template?.name}
            </h2>
            <p className="text-navy/70 dark:text-cream/70 mt-1">
              {instance.entity_type === 'provider' ? 'Provider' : 'Location'}: {getEntityName()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy/10 dark:hover:bg-navy-dark rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-navy dark:text-cream" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-navy/5 dark:bg-navy-dark rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-navy dark:text-white">Overall Progress</span>
              <span className="text-sm font-semibold text-navy dark:text-white">
                {instance.progress_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
              <div
                className="bg-goldenrod h-3 rounded-full transition-all duration-300"
                style={{ width: `${instance.progress_percentage}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-navy/60 dark:text-cream/60">
              Started {new Date(instance.started_at).toLocaleDateString()}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-navy dark:text-white mb-4 flex items-center">
              <Play className="h-5 w-5 mr-2" />
              Subflows ({subflows.length})
            </h3>
            <div className="space-y-4">
              {subflows.map((subflow) => {
                const subflowTasks = tasks.filter(t => t.subflow_id === subflow.id);
                const completedTasks = subflowTasks.filter(t => t.status === 'completed').length;

                return (
                  <div
                    key={subflow.id}
                    className="bg-white dark:bg-navy-dark border border-navy/10 dark:border-dark-cyan/30 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dark-cyan/20 flex items-center justify-center">
                          {getSubflowStatusIcon(subflow.status)}
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-navy dark:text-white">
                            {subflow.name}
                          </h4>
                          {subflow.purpose && (
                            <p className="text-sm text-navy/60 dark:text-cream/60">
                              {subflow.purpose}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-navy/10 dark:bg-navy-light text-navy dark:text-cream font-medium">
                        {subflow.status.replace('_', ' ')}
                      </span>
                    </div>

                    {subflowTasks.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-navy/60 dark:text-cream/60">
                          <span>Tasks</span>
                          <span>{completedTasks} of {subflowTasks.length} completed</span>
                        </div>
                        <div className="space-y-2">
                          {subflowTasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-2 bg-navy/5 dark:bg-navy rounded text-sm"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <CheckSquare className="h-4 w-4 text-navy/50 dark:text-cream/50" />
                                <span className="text-navy dark:text-cream">{task.title}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTaskStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {subflows.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-navy/20 dark:text-cream/20 mx-auto mb-3" />
                  <p className="text-navy/60 dark:text-cream/60">No subflows found for this workflow instance</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
