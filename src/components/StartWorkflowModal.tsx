import React, { useState } from 'react';
import { X, Play, Loader } from 'lucide-react';
import { useWorkflows, useWorkflowInstances } from '../hooks/useDatabase';

interface StartWorkflowModalProps {
  entityType: 'provider' | 'location';
  entityId: string;
  entityName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const StartWorkflowModal: React.FC<StartWorkflowModalProps> = ({
  entityType,
  entityId,
  entityName,
  onClose,
  onSuccess
}) => {
  const { workflows, loading: workflowsLoading } = useWorkflows(undefined, true);
  const { instantiateWorkflow } = useWorkflowInstances();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!selectedWorkflowId) {
      setError('Please select a workflow template');
      return;
    }

    try {
      setStarting(true);
      setError(null);
      await instantiateWorkflow(selectedWorkflowId, entityType, entityId);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to start workflow:', err);

      // Provide detailed error message
      let errorMessage = 'Failed to start workflow';

      if (err instanceof Error) {
        errorMessage = err.message;

        // Add helpful context for common errors
        if (err.message.includes('foreign key') || err.message.includes('relationship')) {
          errorMessage = 'Database Error: Unable to create workflow instance.\n\nThe system encountered an issue with database relationships. This has been logged and the technical team will investigate.';
        } else if (err.message.includes('does not exist')) {
          errorMessage = 'Entity Not Found: The selected ' + entityType + ' may have been deleted.\n\nPlease refresh the page and try again.';
        } else if (err.message.includes('permission') || err.message.includes('policy')) {
          errorMessage = 'Permission Denied: You do not have permission to create workflows.\n\nPlease contact your administrator to request workflow creation permissions.';
        } else if (err.message.includes('duplicate') || err.message.includes('unique')) {
          errorMessage = 'Duplicate Workflow: A workflow of this type is already running for this ' + entityType + '.\n\nCheck the Dashboard to see existing workflows.';
        } else if (err.message.includes('template')) {
          errorMessage = 'Template Error: The selected workflow template is invalid or incomplete.\n\nPlease select a different workflow or contact support.';
        }
      }

      setError(errorMessage);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-md">
        <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-goldenrod/20 flex items-center justify-center">
              <Play className="h-5 w-5 text-goldenrod" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-navy dark:text-white">Start Workflow</h2>
              <p className="text-sm text-navy/60 dark:text-cream/60">
                for {entityType}: {entityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy/10 dark:hover:bg-navy-dark rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-navy dark:text-cream" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {workflowsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-8 w-8 text-goldenrod animate-spin" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-navy/60 dark:text-cream/60">
                No workflow templates available. Create a workflow template first.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">
                  Select Workflow Template
                </label>
                <select
                  value={selectedWorkflowId}
                  onChange={(e) => {
                    setSelectedWorkflowId(e.target.value);
                    setError(null);
                  }}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="">Choose a workflow...</option>
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedWorkflowId && workflows.find(w => w.id === selectedWorkflowId)?.description && (
                <div className="p-3 bg-navy/5 dark:bg-navy-dark rounded-lg">
                  <p className="text-sm text-navy dark:text-white">
                    {workflows.find(w => w.id === selectedWorkflowId)?.description}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mt-0.5">
                      <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
                        Workflow Start Failed
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={onClose}
                  disabled={starting}
                  className="px-4 py-2 text-navy dark:text-cream border border-navy/20 dark:border-dark-cyan/30 rounded-lg hover:bg-navy/5 dark:hover:bg-navy-dark/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStart}
                  disabled={starting || !selectedWorkflowId}
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {starting ? (
                    <>
                      <Loader className="h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Start Workflow
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
