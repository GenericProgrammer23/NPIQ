import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Save, X, Layers, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ActionTemplateService, ActionTemplate } from '../services/ActionTemplateService';

interface ActionTemplatesPageProps {
  organizationId: string;
}

interface Payer {
  id: string;
  name: string;
}

export const ActionTemplatesPage: React.FC<ActionTemplatesPageProps> = ({ organizationId }) => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ActionTemplate> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPayerId, setSelectedPayerId] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [templatesData, payersData] = await Promise.all([
        loadTemplates(),
        loadPayers()
      ]);
      setTemplates(templatesData);
      setPayers(payersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (): Promise<ActionTemplate[]> => {
    const { data, error } = await supabase
      .from('action_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('action_type');

    if (error) {
      console.error('Error loading templates:', error);
      return [];
    }

    return data || [];
  };

  const loadPayers = async (): Promise<Payer[]> => {
    const { data, error } = await supabase
      .from('payers')
      .select('id, name')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error loading payers:', error);
      return [];
    }

    return data || [];
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({
      organization_id: organizationId,
      action_type: 'custom',
      action_name: '',
      description: '',
      payer_id: null,
      task_definitions: [],
      estimated_duration_days: 30,
      required_documents: [],
      is_active: true
    });
    setIsCreating(true);
  };

  const handleEditTemplate = (template: ActionTemplate) => {
    setEditingTemplate({ ...template });
    setIsCreating(false);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    if (!editingTemplate.action_name || !editingTemplate.action_type) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (isCreating) {
        const { error } = await supabase
          .from('action_templates')
          .insert([editingTemplate]);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('action_templates')
          .update(editingTemplate)
          .eq('id', editingTemplate.id!);

        if (error) throw error;
      }

      await loadTemplates().then(setTemplates);
      setEditingTemplate(null);
      setIsCreating(false);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('action_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: ActionTemplate) => {
    const duplicate = {
      ...template,
      action_name: `${template.action_name} (Copy)`,
      id: undefined,
      created_at: undefined,
      updated_at: undefined
    };

    try {
      const { error } = await supabase
        .from('action_templates')
        .insert([duplicate]);

      if (error) throw error;

      await loadTemplates().then(setTemplates);
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Failed to duplicate template');
    }
  };

  const getPayerName = (payerId: string | null) => {
    if (!payerId) return 'All Payers';
    return payers.find(p => p.id === payerId)?.name || 'Unknown Payer';
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedPayerId === 'all') return true;
    if (selectedPayerId === 'global') return template.payer_id === null;
    return template.payer_id === selectedPayerId;
  });

  const actionTypeOptions = [
    { value: 'initial_credentialing', label: 'Initial Credentialing' },
    { value: 'name_change', label: 'Name Change' },
    { value: 'address_change', label: 'Address Change' },
    { value: 're_credentialing', label: 'Re-credentialing' },
    { value: 'add_single_payer', label: 'Add Single Payer' },
    { value: 'custom', label: 'Custom Action' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Action Templates</h1>
          <p className="text-navy/70 dark:text-gray-400">
            Configure what happens when you start different types of actions
          </p>
        </div>
        <button
          onClick={handleCreateTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      <div className="bg-white dark:bg-navy-dark rounded-lg shadow-sm border border-navy/10 dark:border-dark-cyan/30 p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Payer:</label>
          <select
            value={selectedPayerId}
            onChange={(e) => setSelectedPayerId(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Templates</option>
            <option value="global">Global Templates</option>
            {payers.map(payer => (
              <option key={payer.id} value={payer.id}>{payer.name}</option>
            ))}
          </select>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-dark rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-cyan/30 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-navy dark:text-white">
                {isCreating ? 'Create Action Template' : 'Edit Action Template'}
              </h2>
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsCreating(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-navy-light rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Action Type *
                </label>
                <select
                  value={editingTemplate.action_type}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, action_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {actionTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Action Name *
                </label>
                <input
                  type="text"
                  value={editingTemplate.action_name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, action_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Initial Credentialing - Standard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this action template does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payer (Optional)
                </label>
                <select
                  value={editingTemplate.payer_id || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, payer_id: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Global (All Payers)</option>
                  {payers.map(payer => (
                    <option key={payer.id} value={payer.id}>{payer.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to make this template available for all payers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Duration (Days)
                </label>
                <input
                  type="number"
                  value={editingTemplate.estimated_duration_days}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, estimated_duration_days: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editingTemplate.is_active}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active (available for use)
                </label>
              </div>

              <div className="bg-blue-50 dark:bg-navy-light p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-1">What happens when you save:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>This template becomes available when starting a new action</li>
                      <li>Tasks will be automatically generated based on the payer's workflow configuration</li>
                      <li>You can configure payer-specific workflows in the Payers page</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-dark-cyan/30 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsCreating(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-light transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredTemplates.length === 0 ? (
        <div className="bg-white dark:bg-navy-dark rounded-lg shadow-sm border border-navy/10 dark:border-dark-cyan/30 p-12 text-center">
          <Layers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first action template to get started
          </p>
          <button
            onClick={handleCreateTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-navy-dark rounded-lg shadow-sm border border-navy/10 dark:border-dark-cyan/30 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {template.action_name}
                    </h3>
                    {!template.is_active && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {actionTypeOptions.find(o => o.value === template.action_type)?.label}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {getPayerName(template.payer_id)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      ~{template.estimated_duration_days} days
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-navy-light rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-navy-light rounded-lg transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-navy-light rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
