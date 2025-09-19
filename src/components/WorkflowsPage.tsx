import React, { useState } from 'react';
import { useWorkflows } from '../hooks/useDatabase';
import { Workflow, Plus, Search, Edit, Eye, Play, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface WorkflowsPageProps {
  initialFilter?: { type: string; value: string } | null;
}

export const WorkflowsPage: React.FC<WorkflowsPageProps> = ({ initialFilter }) => {
  const { workflows, loading, error, createWorkflow } = useWorkflows();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customFields, setCustomFields] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'credentialing' as const,
    status: 'draft' as const,
    steps: [] as any[]
  });
  const [customFieldData, setCustomFieldData] = useState<Record<string, any>>({});

  // Handle initial filter from dashboard
  React.useEffect(() => {
    if (initialFilter) {
      if (initialFilter.type === 'action' && initialFilter.value === 'add') {
        setShowAddForm(true);
      } else if (initialFilter.type === 'status') {
        setStatusFilter(initialFilter.value);
      }
    }
  }, [initialFilter]);

  // Load custom fields on component mount
  React.useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('table_name', 'workflows')
        .order('created_at');

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load custom fields:', error);
        return;
      }

      setCustomFields(data || []);
    } catch (err) {
      console.error('Failed to load custom fields:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const workflowData = {
        ...formData,
        organization_id: 'current-org-id', // This will be resolved by the service
        ...customFieldData // Include custom field data
      };
      
      await createWorkflow(workflowData);
      setShowAddForm(false);
      setFormData({
        name: '',
        description: '',
        type: 'credentialing',
        status: 'draft',
        steps: []
      });
      setCustomFieldData({});
    } catch (err) {
      console.error('Failed to create workflow:', err);
    }
  };

  const renderCustomField = (field: any) => {
    const value = customFieldData[field.name] || '';
    
    switch (field.type) {
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            required={field.required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            required={field.required}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            required={field.required}
          />
        );
      case 'tel':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            required={field.required}
          />
        );
      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            required={field.required}
          />
        );
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = 
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credentialing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'renewal': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'compliance': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-navy/10 rounded"></div>
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
          <p className="text-red-800">Error loading workflows: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Workflows</h1>
          <p className="text-navy/70 dark:text-gray-300">Manage credentialing and compliance workflows</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Workflow
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600">
        {filteredWorkflows.length === 0 ? (
          <div className="p-8 text-center">
            <Workflow className="h-12 w-12 text-navy/30 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No workflows found</h3>
            <p className="text-navy/60 dark:text-gray-400">
              {workflows.length === 0 
                ? "Get started by creating your first workflow"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy/10 dark:divide-gray-600">
            {filteredWorkflows.map((workflow) => (
              <div key={workflow.id} className="p-6 hover:bg-navy/5 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-navy dark:text-white">{workflow.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                        {workflow.status}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(workflow.type)}`}>
                        {workflow.type}
                      </span>
                    </div>
                    
                    {workflow.description && (
                      <p className="text-navy/70 dark:text-gray-300 mb-2">{workflow.description}</p>
                    )}
                    
                    <div className="text-sm text-navy/50 dark:text-gray-400">
                      {workflow.steps.length} steps • Created {new Date(workflow.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {workflow.status === 'draft' && (
                      <button className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors" title="Activate">
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    {workflow.status === 'active' && (
                      <button className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors" title="Archive">
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                    <button className="p-2 text-navy/60 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors">
                      <Eye className="h-4 w-4 dark:text-gray-400 dark:hover:text-white" />
                    </button>
                    <button className="p-2 text-navy/60 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors">
                      <Edit className="h-4 w-4 dark:text-gray-400 dark:hover:text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Workflow Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Create New Workflow</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Workflow Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., New Provider Credentialing"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan h-20 resize-none bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="Describe the workflow purpose and process..."
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                >
                  <option value="credentialing">Credentialing</option>
                  <option value="renewal">Renewal</option>
                  <option value="compliance">Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <>
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium text-navy dark:text-white mb-4 border-t border-navy/20 dark:border-gray-600 pt-4">
                      Additional Information
                    </h3>
                  </div>
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-navy dark:text-white font-medium mb-2">
                        {field.label} {field.required && '*'}
                      </label>
                      {renderCustomField(field)}
                    </div>
                  ))}
                </>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-navy dark:text-white border border-navy/20 dark:border-gray-600 rounded-lg hover:bg-navy/5 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy rounded-lg font-medium"
                >
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};