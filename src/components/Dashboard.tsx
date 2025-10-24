import React, { useState } from 'react';
import { useDashboardStats, useWorkflowInstances, useWorkflows } from '../hooks/useDatabase';
import { Users, MapPin, Workflow, CheckSquare, Plus, TrendingUp, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { CalendarWidget } from './CalendarWidget';
import { WorkflowInstanceDetailModal } from './WorkflowInstanceDetailModal';
import { WorkflowInstance } from '../lib/supabase';

interface DashboardProps {
  onPageChange: (page: string, filter?: { type: string; value: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { stats, loading, error } = useDashboardStats();
  const { instances, loading: instancesLoading } = useWorkflowInstances({ status: 'active' });
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [selectedInstance, setSelectedInstance] = useState<WorkflowInstance | null>(null);

  const toggleWorkflow = (workflowType: string) => {
    setExpandedWorkflows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workflowType)) {
        newSet.delete(workflowType);
      } else {
        newSet.add(workflowType);
      }
      return newSet;
    });
  };

  const getEntityName = (instance: WorkflowInstance) => {
    if (instance.entity_type === 'provider' && instance.provider) {
      return `${instance.provider.first_name} ${instance.provider.last_name}`;
    }
    if (instance.entity_type === 'location' && instance.location) {
      return instance.location.name;
    }
    return 'Unknown';
  };

  const groupInstancesByWorkflow = () => {
    const grouped: Record<string, WorkflowInstance[]> = {};

    instances.forEach(instance => {
      const templateName = instance.workflow_template?.name || 'Unknown Workflow';
      if (!grouped[templateName]) {
        grouped[templateName] = [];
      }
      grouped[templateName].push(instance);
    });

    return grouped;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-navy/10 p-6">
                <div className="h-4 bg-navy/10 rounded w-20 mb-2"></div>
                <div className="h-8 bg-navy/10 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Providers',
      value: stats.totalProviders,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      onClick: () => onPageChange('providers')
    },
    {
      title: 'Active Workflow Instances',
      value: instances.length,
      icon: Workflow,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      onClick: () => {}
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      onClick: () => onPageChange('tasks', { type: 'status', value: 'completed' })
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      onClick: () => onPageChange('tasks', { type: 'status', value: 'pending' })
    }
  ];

  const groupedInstances = groupInstancesByWorkflow();

  return (
    <div className="p-6 bg-page-bg dark:bg-navy min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Dashboard</h1>
        <p className="text-navy/70 dark:text-cream/70">Overview of your healthcare credentialing system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className={`${stat.bgColor} dark:bg-navy-light ${stat.borderColor} dark:border-dark-cyan/30 border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy/70 dark:text-cream/70 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-navy dark:text-white">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 p-6">
            <h2 className="text-xl font-semibold text-navy dark:text-white mb-4 flex items-center">
              <Workflow className="h-5 w-5 mr-2" />
              Active Workflow Instances
            </h2>

            {instancesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-12 bg-navy/10 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : Object.keys(groupedInstances).length === 0 ? (
              <div className="text-center py-12">
                <Workflow className="h-16 w-16 text-navy/20 dark:text-cream/20 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No Active Workflows</h3>
                <p className="text-navy/60 dark:text-cream/60 mb-4">
                  Start a workflow from a provider or location to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedInstances).map(([workflowName, workflowInstances]) => {
                  const isExpanded = expandedWorkflows.has(workflowName);

                  return (
                    <div
                      key={workflowName}
                      className="border border-navy/10 dark:border-dark-cyan/30 rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleWorkflow(workflowName)}
                        className="w-full flex items-center justify-between p-4 bg-navy/5 dark:bg-navy-dark hover:bg-navy/10 dark:hover:bg-navy transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Workflow className="h-5 w-5 text-dark-cyan" />
                          <span className="font-semibold text-navy dark:text-white">{workflowName}</span>
                          <span className="px-2 py-1 rounded-full bg-goldenrod/20 text-goldenrod text-xs font-medium">
                            {workflowInstances.length} {workflowInstances.length === 1 ? 'instance' : 'instances'}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-navy dark:text-cream" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-navy dark:text-cream" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="p-4 space-y-2 bg-white dark:bg-navy-light">
                          {workflowInstances.map((instance) => (
                            <div
                              key={instance.id}
                              onClick={() => setSelectedInstance(instance)}
                              className="flex items-center justify-between p-3 bg-navy/5 dark:bg-navy-dark rounded-lg hover:bg-navy/10 dark:hover:bg-navy cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                {instance.entity_type === 'provider' ? (
                                  <Users className="h-4 w-4 text-navy/50 dark:text-cream/50" />
                                ) : (
                                  <MapPin className="h-4 w-4 text-navy/50 dark:text-cream/50" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-navy dark:text-white">{getEntityName(instance)}</p>
                                  <p className="text-xs text-navy/60 dark:text-cream/60">
                                    Started {new Date(instance.started_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-navy dark:text-white">
                                    {instance.progress_percentage}%
                                  </div>
                                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                                    <div
                                      className="bg-goldenrod h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${instance.progress_percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div>
          <CalendarWidget />
        </div>
      </div>

      <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 p-6 mb-6">
        <h2 className="text-xl font-semibold text-navy dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => onPageChange('providers', { type: 'action', value: 'add' })}
            className="flex items-center p-4 bg-navy/5 dark:bg-navy-dark hover:bg-navy/10 dark:hover:bg-navy-dark/80 rounded-lg transition-colors group"
          >
            <Plus className="h-5 w-5 text-navy dark:text-white mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy dark:text-white group-hover:text-dark-cyan font-medium">Add Provider</span>
          </button>
          <button
            onClick={() => onPageChange('locations', { type: 'action', value: 'add' })}
            className="flex items-center p-4 bg-navy/5 dark:bg-navy-dark hover:bg-navy/10 dark:hover:bg-navy-dark/80 rounded-lg transition-colors group"
          >
            <MapPin className="h-5 w-5 text-navy dark:text-white mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy dark:text-white group-hover:text-dark-cyan font-medium">Add Location</span>
          </button>
          <button
            onClick={() => onPageChange('payers', { type: 'action', value: 'add' })}
            className="flex items-center p-4 bg-navy/5 dark:bg-navy-dark hover:bg-navy/10 dark:hover:bg-navy-dark/80 rounded-lg transition-colors group"
          >
            <CreditCard className="h-5 w-5 text-navy dark:text-white mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy dark:text-white group-hover:text-dark-cyan font-medium">Add Payer</span>
          </button>
          <button
            onClick={() => onPageChange('workflows', { type: 'action', value: 'add' })}
            className="flex items-center p-4 bg-navy/5 dark:bg-navy-dark hover:bg-navy/10 dark:hover:bg-navy-dark/80 rounded-lg transition-colors group"
          >
            <Workflow className="h-5 w-5 text-navy dark:text-white mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy dark:text-white group-hover:text-dark-cyan font-medium">Create Workflow Template</span>
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 p-6">
        <h2 className="text-xl font-semibold text-navy dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {stats.totalProviders > 0 ? (
            <>
              <div className="flex items-center p-3 bg-navy/5 dark:bg-navy-dark rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-navy dark:text-white">System initialized with {stats.totalProviders} providers</span>
                <span className="text-navy/50 dark:text-cream/50 text-sm ml-auto">Today</span>
              </div>
              {instances.length > 0 && (
                <div className="flex items-center p-3 bg-navy/5 dark:bg-navy-dark rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-navy dark:text-white">{instances.length} active workflow instances in progress</span>
                  <span className="text-navy/50 dark:text-cream/50 text-sm ml-auto">Today</span>
                </div>
              )}
              {stats.pendingTasks > 0 && (
                <div className="flex items-center p-3 bg-navy/5 dark:bg-navy-dark rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-navy dark:text-white">{stats.pendingTasks} tasks awaiting attention</span>
                  <span className="text-navy/50 dark:text-cream/50 text-sm ml-auto">Today</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-2 h-2 bg-gray-400 rounded-full mx-auto mb-3"></div>
              <span className="text-navy/60 dark:text-cream/60">No recent activity. Start by adding providers and creating workflows.</span>
            </div>
          )}
        </div>
      </div>

      {selectedInstance && (
        <WorkflowInstanceDetailModal
          instance={selectedInstance}
          onClose={() => setSelectedInstance(null)}
        />
      )}
    </div>
  );
};
