import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, MoveUp, MoveDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface WorkflowComposerProps {
  workflowId: string;
  organizationId: string;
  onUpdate: () => void;
}

interface Subflow {
  id: string;
  name: string;
  purpose: string;
  order_index: number;
  status: string;
  prerequisites: string;
  dependencies: string;
  exit_condition: string;
}

interface AggregatedRequirement {
  field: string;
  entityType: string;
  requiredBySubflows: string[];
  isMet: boolean;
}

export const WorkflowComposer: React.FC<WorkflowComposerProps> = ({
  workflowId,
  organizationId,
  onUpdate
}) => {
  const [workflowSubflows, setWorkflowSubflows] = useState<Subflow[]>([]);
  const [availableSubflows, setAvailableSubflows] = useState<Subflow[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aggregatedReqs, setAggregatedReqs] = useState<AggregatedRequirement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflowSubflows();
    loadAvailableSubflows();
  }, [workflowId]);

  const loadWorkflowSubflows = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subflows')
        .select('*')
        .eq('workflow_id', workflowId)
        .eq('is_template', true)
        .order('order_index');

      if (error) throw error;
      setWorkflowSubflows(data || []);
      analyzeRequirements(data || []);
    } catch (error) {
      console.error('Error loading workflow subflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSubflows = async () => {
    try {
      const { data, error } = await supabase
        .from('subflows')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_reusable', true)
        .is('workflow_id', null)
        .order('name');

      if (error) throw error;
      setAvailableSubflows(data || []);
    } catch (error) {
      console.error('Error loading available subflows:', error);
    }
  };

  const analyzeRequirements = (subflows: Subflow[]) => {
    const reqMap = new Map<string, AggregatedRequirement>();

    subflows.forEach(subflow => {
      try {
        const prereqs = JSON.parse(subflow.prerequisites || '[]');
        if (Array.isArray(prereqs)) {
          prereqs.forEach((req: any) => {
            const key = `${req.entity_type}:${req.field}`;
            if (!reqMap.has(key)) {
              reqMap.set(key, {
                field: req.field,
                entityType: req.entity_type,
                requiredBySubflows: [],
                isMet: false
              });
            }
            reqMap.get(key)!.requiredBySubflows.push(subflow.name);
          });
        }
      } catch (error) {
        console.error('Error parsing prerequisites:', error);
      }
    });

    setAggregatedReqs(Array.from(reqMap.values()));
  };

  const addSubflowToWorkflow = async (subflowId: string) => {
    try {
      const maxOrder = workflowSubflows.reduce((max, sf) => Math.max(max, sf.order_index), -1);

      const { data: originalSubflow, error: fetchError } = await supabase
        .from('subflows')
        .select('*')
        .eq('id', subflowId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('subflows')
        .insert({
          workflow_id: workflowId,
          organization_id: organizationId,
          name: originalSubflow.name,
          purpose: originalSubflow.purpose,
          prerequisites: originalSubflow.prerequisites,
          dependencies: originalSubflow.dependencies,
          exit_condition: originalSubflow.exit_condition,
          is_template: true,
          is_reusable: false,
          order_index: maxOrder + 1,
          workflow_data: originalSubflow.workflow_data,
          metadata: originalSubflow.metadata
        })
        .select()
        .single();

      if (error) throw error;

      setShowAddModal(false);
      loadWorkflowSubflows();
      onUpdate();
    } catch (error) {
      console.error('Error adding subflow:', error);
      alert('Failed to add subflow');
    }
  };

  const removeSubflowFromWorkflow = async (subflowId: string) => {
    if (!confirm('Remove this subflow from the workflow?')) return;

    try {
      const { error } = await supabase
        .from('subflows')
        .delete()
        .eq('id', subflowId);

      if (error) throw error;

      loadWorkflowSubflows();
      onUpdate();
    } catch (error) {
      console.error('Error removing subflow:', error);
      alert('Failed to remove subflow');
    }
  };

  const moveSubflow = async (subflowId: string, direction: 'up' | 'down') => {
    const currentIndex = workflowSubflows.findIndex(sf => sf.id === subflowId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= workflowSubflows.length) return;

    try {
      const updates = [
        {
          id: workflowSubflows[currentIndex].id,
          order_index: targetIndex
        },
        {
          id: workflowSubflows[targetIndex].id,
          order_index: currentIndex
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('subflows')
          .update({ order_index: update.order_index })
          .eq('id', update.id);

        if (error) throw error;
      }

      loadWorkflowSubflows();
      onUpdate();
    } catch (error) {
      console.error('Error reordering subflows:', error);
      alert('Failed to reorder subflows');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-navy dark:text-white">Workflow Composition</h4>
          <p className="text-sm text-navy/60 dark:text-gray-400">
            {workflowSubflows.length} subflow{workflowSubflows.length !== 1 ? 's' : ''} in this workflow
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-dark-cyan hover:bg-dark-cyan/90 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Subflow
        </button>
      </div>

      {aggregatedReqs.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Inherited Requirements ({aggregatedReqs.length})
          </h5>
          <div className="space-y-2">
            {aggregatedReqs.map((req, index) => (
              <div
                key={index}
                className="flex items-start justify-between bg-white dark:bg-navy-dark rounded p-3"
              >
                <div className="flex-1">
                  <div className="font-medium text-navy dark:text-white text-sm">
                    {req.entityType}: {req.field}
                  </div>
                  <div className="text-xs text-navy/60 dark:text-gray-400 mt-1">
                    Required by: {req.requiredBySubflows.join(', ')}
                  </div>
                  <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    ⚠️ {req.requiredBySubflows.length} subflow{req.requiredBySubflows.length !== 1 ? 's' : ''} blocked
                  </div>
                </div>
                <div className={`flex-shrink-0 ${req.isMet ? 'text-green-600' : 'text-red-600'}`}>
                  {req.isMet ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : workflowSubflows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No subflows added yet</p>
            <p className="text-sm mt-2">Click "Add Subflow" to build your workflow</p>
          </div>
        ) : (
          workflowSubflows.map((subflow, index) => (
            <div
              key={subflow.id}
              className="bg-white dark:bg-navy-light border border-gray-200 dark:border-dark-cyan/30 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded px-3 py-1 font-semibold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-semibold text-navy dark:text-white">{subflow.name}</h5>
                    {subflow.purpose && (
                      <p className="text-sm text-navy/60 dark:text-gray-400 mt-1">{subflow.purpose}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-navy/60 dark:text-gray-400">
                        Status: <span className="font-medium capitalize">{subflow.status.replace('_', ' ')}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {index > 0 && (
                    <button
                      onClick={() => moveSubflow(subflow.id, 'up')}
                      className="p-1 text-navy/60 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:bg-navy/10 dark:hover:bg-dark-cyan/20 rounded transition-colors"
                      title="Move up"
                    >
                      <MoveUp className="w-4 h-4" />
                    </button>
                  )}
                  {index < workflowSubflows.length - 1 && (
                    <button
                      onClick={() => moveSubflow(subflow.id, 'down')}
                      className="p-1 text-navy/60 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:bg-navy/10 dark:hover:bg-dark-cyan/20 rounded transition-colors"
                      title="Move down"
                    >
                      <MoveDown className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => removeSubflowFromWorkflow(subflow.id)}
                    className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-light rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h3 className="text-xl font-semibold text-navy dark:text-white">Add Subflow to Workflow</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-navy/5 dark:hover:bg-navy-dark rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-navy dark:text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {availableSubflows.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No reusable subflows available</p>
                  <p className="text-sm mt-2">Create reusable subflows in the Subflows page first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableSubflows.map(subflow => (
                    <div
                      key={subflow.id}
                      className="border border-gray-200 dark:border-dark-cyan/30 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-navy-dark transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-navy dark:text-white">{subflow.name}</h5>
                          {subflow.purpose && (
                            <p className="text-sm text-navy/60 dark:text-gray-400 mt-1">{subflow.purpose}</p>
                          )}
                        </div>
                        <button
                          onClick={() => addSubflowToWorkflow(subflow.id)}
                          className="ml-4 px-4 py-2 bg-dark-cyan hover:bg-dark-cyan/90 text-white rounded-lg font-medium transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-navy/10 dark:border-dark-cyan/30">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-navy dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};