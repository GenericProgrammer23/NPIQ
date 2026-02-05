import React, { useState, useEffect } from 'react';
import { X, Play, Calendar, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ActionTemplateService, ActionTemplate } from '../services/ActionTemplateService';
import { ProviderActionService } from '../services/ProviderActionService';
import { TaskGenerationService } from '../services/TaskGenerationService';

interface StartActionModalNewProps {
  providerId: string;
  providerName: string;
  organizationId: string;
  onClose: () => void;
  onActionStarted?: () => void;
}

interface Payer {
  id: string;
  name: string;
}

export const StartActionModalNew: React.FC<StartActionModalNewProps> = ({
  providerId,
  providerName,
  organizationId,
  onClose,
  onActionStarted
}) => {
  const [step, setStep] = useState<'select-action' | 'configure-action'>('select-action');
  const [actionTemplates, setActionTemplates] = useState<ActionTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplate | null>(null);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [selectedPayerIds, setSelectedPayerIds] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActionTemplates();
    loadPayers();
  }, [organizationId]);

  const loadActionTemplates = async () => {
    try {
      const templates = await ActionTemplateService.getActionTemplates(organizationId);
      setActionTemplates(templates);
    } catch {
    }
  };

  const loadPayers = async () => {
    try {
      const { data, error } = await supabase
        .from('payers')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setPayers(data || []);
    } catch {
    }
  };

  const handleSelectTemplate = (template: ActionTemplate) => {
    setSelectedTemplate(template);
    setStep('configure-action');
    setMetadata({});
    setSelectedPayerIds([]);
  };

  const handleTogglePayer = (payerId: string) => {
    setSelectedPayerIds(prev =>
      prev.includes(payerId)
        ? prev.filter(id => id !== payerId)
        : [...prev, payerId]
    );
  };

  const handleStartAction = async () => {
    if (!selectedTemplate || selectedPayerIds.length === 0) {
      setError('Please select at least one payer');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      const action = await ProviderActionService.createProviderAction({
        provider_id: providerId,
        organization_id: organizationId,
        action_template_id: selectedTemplate.id,
        action_type: selectedTemplate.category === 'credentialing'
          ? 'initial_credentialing'
          : selectedTemplate.name.toLowerCase().includes('name')
            ? 'name_change'
            : selectedTemplate.category === 'renewal'
              ? 're_credentialing'
              : 'custom',
        action_name: `${selectedTemplate.name} - ${providerName}`,
        metadata,
        payer_ids: selectedPayerIds
      });

      if (!action) {
        throw new Error('Failed to create action');
      }

      const taskCount = await TaskGenerationService.generateTasksForAction(
        action.id,
        providerId,
        organizationId,
        selectedPayerIds,
        selectedTemplate
      );

      await ProviderActionService.updateProviderAction(action.id, {
        total_tasks: taskCount
      });

      if (onActionStarted) {
        onActionStarted();
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to start action');
    } finally {
      setIsStarting(false);
    }
  };

  const renderSelectAction = () => (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Action Type</h3>
        <p className="text-sm text-gray-500">Choose the type of action you want to perform</p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {actionTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleSelectTemplate(template)}
            className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {template.category}
                  </span>
                  {template.is_system_template && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      System Template
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderConfigureAction = () => {
    if (!selectedTemplate) return null;

    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setStep('select-action')}
            className="text-sm text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Change Action Type
          </button>
          <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
          <p className="text-sm text-gray-500">{selectedTemplate.description}</p>
        </div>

        {selectedTemplate.name.includes('Name Change') && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Previous Name
              </label>
              <input
                type="text"
                value={metadata.previous_name || providerName}
                onChange={(e) => setMetadata({ ...metadata, previous_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Name
              </label>
              <input
                type="text"
                value={metadata.new_name || ''}
                onChange={(e) => setMetadata({ ...metadata, new_name: e.target.value })}
                placeholder="Enter new legal name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Effective Date
              </label>
              <input
                type="date"
                value={metadata.effective_date || ''}
                onChange={(e) => setMetadata({ ...metadata, effective_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason
              </label>
              <select
                value={metadata.reason || ''}
                onChange={(e) => setMetadata({ ...metadata, reason: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select reason</option>
                <option value="marriage">Marriage</option>
                <option value="divorce">Divorce</option>
                <option value="legal">Legal Name Change</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Payers to Include
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {payers.map((payer) => (
              <label
                key={payer.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPayerIds.includes(payer.id)}
                  onChange={() => handleTogglePayer(payer.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">{payer.name}</span>
              </label>
            ))}
          </div>
          {selectedPayerIds.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {selectedPayerIds.length} payer{selectedPayerIds.length !== 1 ? 's' : ''} selected
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleStartAction}
            disabled={isStarting || selectedPayerIds.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isStarting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Action
              </>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isStarting}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Start New Action</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select-action' ? renderSelectAction() : renderConfigureAction()}
        </div>
      </div>
    </div>
  );
};
