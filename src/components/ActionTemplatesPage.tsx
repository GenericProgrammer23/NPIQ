import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Copy, Save, X, Layers, AlertCircle, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ActionTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  category: 'credentialing' | 'change' | 'renewal' | 'custom';
  applies_to_payer_ids: string[];
  required_documents: string[];
  required_fields: string[];
  task_templates: any[];
  is_system_template: boolean;
  created_at: string;
  updated_at: string;
}

interface Payer {
  id: string;
  name: string;
}

interface ActionTemplatesPageProps {
  organizationId: string;
}

export const ActionTemplatesPage: React.FC<ActionTemplatesPageProps> = ({ organizationId }) => {
  const [templates, setTemplates] = useState<ActionTemplate[]>([]);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ActionTemplate> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
      .order('name');

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
      name: '',
      description: '',
      category: 'credentialing',
      applies_to_payer_ids: [],
      required_documents: [],
      required_fields: [],
      task_templates: [],
      is_system_template: false
    });
    setIsCreating(true);
  };

  const handleEditTemplate = (template: ActionTemplate) => {
    setEditingTemplate({ ...template });
    setIsCreating(false);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    if (!editingTemplate.name || !editingTemplate.category) {
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
      name: `${template.name} (Copy)`,
      id: undefined,
      created_at: undefined,
      updated_at: undefined,
      is_system_template: false
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

  const getPayerNames = (payerIds: string[]) => {
    if (!payerIds || payerIds.length === 0) return 'All Payers';
    return payerIds.map(id => payers.find(p => p.id === id)?.name || 'Unknown').join(', ');
  };

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory === 'all') return true;
    return template.category === selectedCategory;
  });

  const categoryOptions = [
    { value: 'credentialing', label: 'Credentialing' },
    { value: 'change', label: 'Change' },
    { value: 'renewal', label: 'Renewal' },
    { value: 'custom', label: 'Custom' }
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
            Configure action types and their workflows for different payers
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categoryOptions.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                  Template Name *
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Initial Credentialing - Standard"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe what this action template does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Applies to Payers (Optional)
                </label>
                <select
                  multiple
                  value={editingTemplate.applies_to_payer_ids || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setEditingTemplate({ ...editingTemplate, applies_to_payer_ids: selected });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  size={5}
                >
                  {payers.map(payer => (
                    <option key={payer.id} value={payer.id}>{payer.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Leave empty to make this template available for all payers. Hold Ctrl/Cmd to select multiple.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-navy-light p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-1">Setting up workflows:</p>
                    <p>After creating this template, configure the specific workflow for each payer by going to the <strong>Payers</strong> page and clicking <strong>Configure Workflow</strong> for the desired action type.</p>
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
                      {template.name}
                    </h3>
                    {template.is_system_template && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        System
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
                      {categoryOptions.find(o => o.value === template.category)?.label}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {getPayerNames(template.applies_to_payer_ids)}
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
                  {!template.is_system_template && (
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-navy-light rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
