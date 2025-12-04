import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle, Clock, AlertTriangle, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface WorkflowStatusProps {
  providerId: string;
  organizationId: string;
}

interface SubflowStatus {
  id: string;
  name: string;
  status: string;
  order_index: number;
  blockers: string[];
}

interface WorkflowStatus {
  id: string;
  name: string;
  type: string;
  status: string;
  subflows: SubflowStatus[];
  overallProgress: number;
  totalSubflows: number;
  completedSubflows: number;
}

interface Bottleneck {
  field: string;
  entityType: string;
  blockingCount: number;
  affectedSubflows: string[];
  affectedWorkflows: string[];
}

export const ProviderWorkflowStatus: React.FC<WorkflowStatusProps> = ({
  providerId,
  organizationId
}) => {
  const [workflows, setWorkflows] = useState<WorkflowStatus[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [providerData, setProviderData] = useState<any>(null);

  useEffect(() => {
    loadWorkflowStatus();
    loadProviderData();
  }, [providerId]);

  const loadProviderData = async () => {
    try {
      const { data, error } = await supabase
        .from('providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error) throw error;
      setProviderData(data);
    } catch (error) {
      console.error('Error loading provider data:', error);
    }
  };

  const loadWorkflowStatus = async () => {
    try {
      setLoading(true);

      const { data: instances, error: instancesError } = await supabase
        .from('workflow_instances')
        .select(`
          id,
          workflow_template_id,
          status,
          progress_percentage,
          workflows:workflow_template_id (
            id,
            name,
            type,
            status
          )
        `)
        .eq('entity_id', providerId)
        .eq('entity_type', 'provider');

      if (instancesError) throw instancesError;

      const workflowStatuses: WorkflowStatus[] = [];
      const bottleneckMap = new Map<string, Bottleneck>();

      for (const instance of instances || []) {
        const workflow = instance.workflows;
        if (!workflow) continue;

        const { data: subflows, error: subflowsError } = await supabase
          .from('subflows')
          .select('*')
          .eq('workflow_id', workflow.id)
          .eq('is_template', true)
          .order('order_index');

        if (subflowsError) throw subflowsError;

        const subflowStatuses: SubflowStatus[] = [];
        let completedCount = 0;

        for (const subflow of subflows || []) {
          const blockers: string[] = [];

          try {
            const prerequisites = JSON.parse(subflow.prerequisites || '[]');
            if (Array.isArray(prerequisites)) {
              for (const req of prerequisites) {
                const isMet = await checkRequirement(req, providerId);
                if (!isMet) {
                  const blockerKey = `${req.entity_type}:${req.field}`;
                  blockers.push(req.field);

                  if (!bottleneckMap.has(blockerKey)) {
                    bottleneckMap.set(blockerKey, {
                      field: req.field,
                      entityType: req.entity_type,
                      blockingCount: 0,
                      affectedSubflows: [],
                      affectedWorkflows: []
                    });
                  }

                  const bottleneck = bottleneckMap.get(blockerKey)!;
                  bottleneck.blockingCount++;
                  if (!bottleneck.affectedSubflows.includes(subflow.name)) {
                    bottleneck.affectedSubflows.push(subflow.name);
                  }
                  if (!bottleneck.affectedWorkflows.includes(workflow.name)) {
                    bottleneck.affectedWorkflows.push(workflow.name);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error parsing prerequisites:', error);
          }

          if (subflow.status === 'complete') {
            completedCount++;
          }

          subflowStatuses.push({
            id: subflow.id,
            name: subflow.name,
            status: subflow.status,
            order_index: subflow.order_index,
            blockers
          });
        }

        const totalSubflows = subflowStatuses.length;
        const overallProgress = totalSubflows > 0 ? Math.round((completedCount / totalSubflows) * 100) : 0;

        workflowStatuses.push({
          id: workflow.id,
          name: workflow.name,
          type: workflow.type,
          status: instance.status,
          subflows: subflowStatuses,
          overallProgress,
          totalSubflows,
          completedSubflows: completedCount
        });
      }

      setWorkflows(workflowStatuses);
      setBottlenecks(
        Array.from(bottleneckMap.values())
          .sort((a, b) => b.blockingCount - a.blockingCount)
      );
    } catch (error) {
      console.error('Error loading workflow status:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRequirement = async (requirement: any, providerId: string): Promise<boolean> => {
    try {
      const entityType = requirement.entity_type;
      const field = requirement.field;

      if (entityType === 'provider') {
        if (!providerData) return false;
        return providerData[field] !== null && providerData[field] !== undefined && providerData[field] !== '';
      }

      if (entityType === 'document') {
        const { data, error } = await supabase
          .from('provider_documents')
          .select('id')
          .eq('provider_id', providerId)
          .eq('category', field)
          .limit(1);

        return !error && data && data.length > 0;
      }

      return false;
    } catch (error) {
      console.error('Error checking requirement:', error);
      return false;
    }
  };

  const toggleWorkflow = (workflowId: string) => {
    const newExpanded = new Set(expandedWorkflows);
    if (newExpanded.has(workflowId)) {
      newExpanded.delete(workflowId);
    } else {
      newExpanded.add(workflowId);
    }
    setExpandedWorkflows(newExpanded);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'complete':
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'not_started':
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'not_started':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {bottlenecks.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-300 mb-3">
                Bottlenecks Detected ({bottlenecks.length})
              </h4>
              <div className="space-y-2">
                {bottlenecks.slice(0, 5).map((bottleneck, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-navy-dark rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-navy dark:text-white text-sm">
                        {bottleneck.entityType}: {bottleneck.field}
                      </span>
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-semibold">
                        Blocking {bottleneck.blockingCount} subflow{bottleneck.blockingCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-navy/60 dark:text-gray-400">
                      Affected workflows: {bottleneck.affectedWorkflows.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              {bottlenecks.length > 5 && (
                <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                  ...and {bottlenecks.length - 5} more
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No active workflows for this provider</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              className="border border-gray-200 dark:border-dark-cyan/30 rounded-lg overflow-hidden"
            >
              <div
                className="bg-white dark:bg-navy-light p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-navy-dark transition-colors"
                onClick={() => toggleWorkflow(workflow.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {expandedWorkflows.has(workflow.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-navy dark:text-white">{workflow.name}</h4>
                      <p className="text-sm text-navy/60 dark:text-gray-400">
                        {workflow.completedSubflows} of {workflow.totalSubflows} subflows complete
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-navy dark:text-white">
                        {workflow.overallProgress}%
                      </div>
                      <div className="text-xs text-navy/60 dark:text-gray-400">Progress</div>
                    </div>
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        workflow.overallProgress === 100
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : workflow.overallProgress > 0
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-gray-100 dark:bg-gray-900/30'
                      }`}
                    >
                      {workflow.overallProgress === 100 ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : workflow.overallProgress > 0 ? (
                        <Clock className="w-8 h-8 text-yellow-600" />
                      ) : (
                        <XCircle className="w-8 h-8 text-gray-600" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      workflow.overallProgress === 100
                        ? 'bg-green-600'
                        : workflow.overallProgress > 0
                        ? 'bg-yellow-600'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${workflow.overallProgress}%` }}
                  />
                </div>
              </div>

              {expandedWorkflows.has(workflow.id) && (
                <div className="border-t border-gray-200 dark:border-dark-cyan/30 bg-gray-50 dark:bg-navy-dark p-4">
                  <div className="space-y-2">
                    {workflow.subflows.map((subflow, index) => (
                      <div
                        key={subflow.id}
                        className="bg-white dark:bg-navy-light rounded p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded px-2 py-1 text-xs font-semibold">
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-navy dark:text-white text-sm">
                              {subflow.name}
                            </div>
                            {subflow.blockers.length > 0 && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                ⚠️ Waiting for: {subflow.blockers.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(subflow.status)}
                          <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(subflow.status)}`}>
                            {subflow.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};