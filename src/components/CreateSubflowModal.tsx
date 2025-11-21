import React, { useState } from 'react';
import { Payer } from '../lib/supabase';
import { CheckCircle, X } from 'lucide-react';

interface CreateSubflowModalProps {
  payer: Payer;
  onCreateSubflow: () => Promise<void>;
  onSkip: () => void;
}

export const CreateSubflowModal: React.FC<CreateSubflowModalProps> = ({
  payer,
  onCreateSubflow,
  onSkip
}) => {
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await onCreateSubflow();
    } catch (err) {
      console.error('Failed to create subflow:', err);
      alert('Failed to create subflow. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const getDependentPayersList = () => {
    if (!payer.dependent_on_payer_ids || payer.dependent_on_payer_ids.length === 0) {
      return 'None';
    }
    return payer.dependent_on_payer_ids.length + ' payer(s)';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-light rounded-lg p-6 max-w-lg w-full">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-dark-cyan/10 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-dark-cyan" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy dark:text-white">
                Create Subflow for {payer.name}?
              </h2>
              <p className="text-sm text-navy/60 dark:text-gray-400">Payer created successfully!</p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-1 hover:bg-navy/5 dark:hover:bg-navy-dark rounded transition-colors"
          >
            <X className="h-5 w-5 text-navy dark:text-white" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-navy dark:text-cream mb-4">
            Would you like to automatically generate a subflow for this payer? This will create:
          </p>
          <ul className="space-y-2 text-sm text-navy dark:text-cream">
            <li className="flex items-start gap-2">
              <span className="text-dark-cyan font-bold">•</span>
              <span>A reusable subflow template named "{payer.name} Application Process"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dark-cyan font-bold">•</span>
              <span>Task templates for required documents: {payer.required_documents && payer.required_documents.length > 0 ? payer.required_documents.join(', ') : 'None specified'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dark-cyan font-bold">•</span>
              <span>Task templates for required provider fields: {payer.required_provider_fields && payer.required_provider_fields.length > 0 ? payer.required_provider_fields.map(f => f.replace('_', ' ')).join(', ') : 'None specified'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dark-cyan font-bold">•</span>
              <span>Application submission, approval tracking, and loading tasks</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-dark-cyan font-bold">•</span>
              <span>Dependencies: {getDependentPayersList()}</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Timeline:</strong> Approval in {payer.days_to_approve || 30} days, Loading in {payer.days_to_load || 60} days
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 px-4 py-3 bg-dark-cyan hover:bg-dark-cyan/90 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {creating ? 'Creating Subflow...' : 'Create Subflow'}
          </button>
          <button
            onClick={onSkip}
            disabled={creating}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-navy-dark dark:hover:bg-navy text-navy dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );
};
