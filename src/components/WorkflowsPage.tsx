import React, { useState } from 'react';
import { useWorkflows, useSubflows, useProviders } from '../hooks/useDatabase';
import { Workflow, Plus, Search, Edit, Eye, Play, Archive, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Subflow } from '../lib/supabase';

interface WorkflowsPageProps {
  initialFilter?: { type: string; value: string } | null;
}

export const WorkflowsPage: React.FC<WorkflowsPageProps> = ({ initialFilter }) => {
  const { workflows, loading, error, createWorkflow } = useWorkflows();
  const { providers } = useProviders();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<any>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
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

  // Get subflows for selected workflow
  const { subflows, updateSubflow, emitTasksForSubflow } = useSubflows(selectedWorkflow || undefined);

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

  const handleEdit = (workflow: any) => {
    setEditingWorkflow(workflow);
    setFormData({
      name: workflow.name,
      description: workflow.description || '',
      type: workflow.type,
      status: workflow.status,
      steps: workflow.steps || []
    });
    
    // Load custom field values for editing
    const customData: Record<string, any> = {};
    customFields.forEach(field => {
      customData[field.name] = (workflow as any)[field.name] || '';
    });
    setCustomFieldData(customData);
    
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkflow) return;
    
    try {
      const updateData = {
        ...formData,
        ...customFieldData // Include custom field data
      };
      
      // We need to add updateWorkflow to the hook
      // For now, we'll use the supabase client directly
      if (supabase) {
        const { error } = await supabase
          .from('workflows')
          .update(updateData)
          .eq('id', editingWorkflow.id);
        
        if (error) throw error;
        
        // Refresh the page to show updated data
        window.location.reload();
      }
      
      setShowEditForm(false);
      setEditingWorkflow(null);
      setFormData({
        name: '',
        description: '',
        type: 'credentialing',
        status: 'draft',
        steps: []
      });
      setCustomFieldData({});
    } catch (err) {
      console.error('Failed to update workflow:', err);
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

  const handleViewWorkflow = (workflowId: string) => {
    setSelectedWorkflow(selectedWorkflow === workflowId ? null : workflowId);
  };

  const getSubflowStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'not_started': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const checkPrerequisites = (subflow: Subflow): boolean => {
    // Simple prerequisite checking - in practice you'd parse the prerequisites string
    if (subflow.prerequisites.includes('Provider Baseline')) {
      const baselineSubflow = subflows.find(s => s.name === 'Provider Baseline');
      return baselineSubflow?.status === 'complete';
    }
    if (subflow.prerequisites.includes('provider')) {
      // Check if we have a provider with basic info
      return providers.length > 0 && providers.some(p => p.first_name && p.last_name && p.specialty);
    }
    return true;
  };

  const checkDependencies = (subflow: Subflow): boolean => {
    if (!subflow.dependencies) return true;
    
    // Simple dependency checking
    if (subflow.dependencies.includes('Provider Baseline Complete')) {
      const baselineSubflow = subflows.find(s => s.name === 'Provider Baseline');
      return baselineSubflow?.status === 'complete';
    }
    if (subflow.dependencies.includes('AHCCCS Complete')) {
      const ahcccsSubflow = subflows.find(s => s.name === 'AHCCCS Enrollment');
      return ahcccsSubflow?.status === 'complete';
    }
    return true;
  };

  const handleStartSubflow = async (subflowId: string) => {
    try {
      const providerId = providers.length > 0 ? providers[0].id : undefined;
      await emitTasksForSubflow(subflowId, providerId);
    } catch (err) {
      console.error('Failed to start subflow:', err);
    }
  };

  const handleCompleteSubflow = async (subflowId: string) => {
    try {
      await updateSubflow(subflowId, { status: 'complete' });
    } catch (err) {
      console.error('Failed to complete subflow:', err);
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
    <div className="p-6 bg-cream dark:bg-navy min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Workflows</h1>
          <p className="text-navy/70 dark:text-cream/70">Manage credentialing and compliance workflows</p>
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
      <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-cream/50" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              />
            </div>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
      <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30">
        {filteredWorkflows.length === 0 ? (
          <div className="p-8 text-center">
            <Workflow className="h-12 w-12 text-navy/30 dark:text-cream/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No workflows found</h3>
            <p className="text-navy/60 dark:text-cream/60">
              {workflows.length === 0 
                ? "Get started by creating your first workflow"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy/10 dark:divide-dark-cyan/20">
            {filteredWorkflows.map((workflow) => (
              <div key={workflow.id} className="p-6 hover:bg-navy/5 dark:hover:bg-navy-dark/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-navy dark:text-white">{workflow.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
                        {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(workflow.type)}`}>
                        {workflow.type.charAt(0).toUpperCase() + workflow.type.slice(1)}
                      </span>
                    </div>
                    
                    {workflow.description && (
                      <p className="text-navy/70 dark:text-cream/70 mb-2">{workflow.description}</p>
                    )}
                    
                    <div className="text-sm text-navy/50 dark:text-cream/50">
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
                      <Eye 
                        className="h-4 w-4 dark:text-gray-400 dark:hover:text-white" 
                        onClick={() => handleViewWorkflow(workflow.id)}
                      />
                    </button>
                    <button 
                      onClick={() => handleEdit(workflow)}
                      className="p-2 text-navy/60 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4 dark:text-cream/60 dark:hover:text-cream" />
                    </button>
                  </div>
                </div>

                {/* Subflows Section */}
                {selectedWorkflow === workflow.id && (
                  <div className="mt-6 border-t border-navy/10 dark:border-dark-cyan/20 pt-6">
                    <h4 className="text-lg font-semibold text-navy dark:text-white mb-4">Subflows</h4>
                    <div className="space-y-4">
                      {subflows.map((subflow) => {
                        const prereqsMet = checkPrerequisites(subflow);
                        const depsMet = checkDependencies(subflow);
                        const canStart = prereqsMet && depsMet && subflow.status === 'not_started';
                        const canComplete = subflow.status === 'in_progress';

                        return (
                          <div key={subflow.id} className="bg-navy-dark dark:bg-navy-light border border-dark-cyan/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-dark-cyan/20 flex items-center justify-center">
                                  {getSubflowStatusIcon(subflow.status)}
                                </div>
                                <h5 className="text-lg font-semibold text-cream">{subflow.name}</h5>
                                <span className="text-xs px-2 py-1 rounded-full bg-dark-cyan/20 text-dark-cyan font-medium">
                                  {subflow.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {canStart && (
                                  <button
                                    onClick={() => handleStartSubflow(subflow.id)}
                                    className="px-3 py-1 bg-goldenrod text-navy text-sm rounded font-medium hover:bg-goldenrod/90 transition-colors"
                                  >
                                    Start
                                  </button>
                                )}
                                {canComplete && (
                                  <button
                                    onClick={() => handleCompleteSubflow(subflow.id)}
                                    className="px-3 py-1 bg-green-600 text-white text-sm rounded font-medium hover:bg-green-700 transition-colors"
                                  >
                                    Complete
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {subflow.purpose && (
                              <p className="text-sm text-cream/80 mb-3">{subflow.purpose}</p>
                            )}
                            
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <h6 className="font-medium text-cream mb-1">Prerequisites</h6>
                                <div className="flex items-center gap-1">
                                  <span className={`w-3 h-3 rounded-full ${prereqsMet ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                  <span className="text-cream/70 text-xs">
                                    {(() => {
                                      try {
                                        const prereqs = JSON.parse(subflow.prerequisites);
                                        return Array.isArray(prereqs) ? `${prereqs.length} checks` : 'None';
                                      } catch {
                                        return subflow.prerequisites ? '1 check' : 'None';
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                              
                              <div>
                                <h6 className="font-medium text-cream mb-1">Dependencies</h6>
                                <div className="flex items-center gap-1">
                                  <span className={`w-3 h-3 rounded-full ${depsMet ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                  <span className="text-cream/70 text-xs">
                                    {(() => {
                                      try {
                                        const deps = JSON.parse(subflow.dependencies);
                                        return Array.isArray(deps) && deps.length > 0 ? `${deps.length} deps` : 'None';
                                      } catch {
                                        return subflow.dependencies ? '1 dep' : 'None';
                                      }
                                    })()}
                                  </span>
                                </div>
                              </div>
                              
                              <div>
                                <h6 className="font-medium text-cream mb-1">Exit Condition</h6>
                                <span className="text-cream/70 text-xs">
                                  {(() => {
                                    try {
                                      const conditions = JSON.parse(subflow.exit_condition);
                                      return Array.isArray(conditions) && conditions.length > 0 ? `${conditions.length} conditions` : 'Tasks complete';
                                    } catch {
                                      return subflow.exit_condition ? '1 condition' : 'Tasks complete';
                                    }
                                  })()}
                                </span>
                              </div>
                              
                              <div>
                                <h6 className="font-medium text-cream mb-1">Tasks</h6>
                                <span className="text-cream/70 text-xs">
                                  {subflow.tasks?.length || 0} tasks
                                  {subflow.tasks && subflow.tasks.length > 0 && (
                                    <span className="ml-1 text-green-400">
                                      ({subflow.tasks.filter((t: any) => t.status === 'completed').length} done)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                            
                            {subflow.status === 'not_started' && !canStart && (
                              <div className="mt-2 text-xs text-orange-400">
                                Waiting for prerequisites and dependencies
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {subflows.length === 0 && (
                        <div className="text-center py-8">
                          <div className="text-cream/30 mb-2">
                            <CheckSquare className="h-12 w-12 mx-auto" />
                          </div>
                          <h6 className="text-lg font-medium text-cream mb-2">No subflows defined</h6>
                          <p className="text-cream/60">
                            This workflow doesn't have any subflows configured yet.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Workflow Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
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
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="e.g., New Provider Credentialing"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan h-20 resize-none bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="Describe the workflow purpose and process..."
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
                  className="px-4 py-2 text-navy dark:text-cream border border-navy/20 dark:border-dark-cyan/30 rounded-lg hover:bg-navy/5 dark:hover:bg-navy-dark/50"
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

      {/* Edit Workflow Modal */}
      {showEditForm && editingWorkflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Edit Workflow</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Workflow Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="e.g., New Provider Credentialing"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan h-20 resize-none bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="Describe the workflow purpose and process..."
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
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
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingWorkflow(null);
                  }}
                  className="px-4 py-2 text-navy dark:text-cream border border-navy/20 dark:border-dark-cyan/30 rounded-lg hover:bg-navy/5 dark:hover:bg-navy-dark/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy rounded-lg font-medium"
                >
                  Update Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};