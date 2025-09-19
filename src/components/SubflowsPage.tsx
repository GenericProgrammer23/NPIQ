import React, { useState } from 'react';
import { useSubflows, useWorkflows } from '../hooks/useDatabase';
import { GitBranch, Plus, Search, Filter, Edit, Eye, Play, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Subflow } from '../lib/supabase';

interface SubflowsPageProps {
  initialFilter?: { type: string; value: string } | null;
}

export const SubflowsPage: React.FC<SubflowsPageProps> = ({ initialFilter }) => {
  const { subflows, loading, error, createSubflow, updateSubflow } = useSubflows();
  const { workflows } = useWorkflows();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSubflow, setEditingSubflow] = useState<Subflow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workflowFilter, setWorkflowFilter] = useState('all');

  const [formData, setFormData] = useState({
    workflow_id: '',
    name: '',
    purpose: '',
    prerequisites: '',
    dependencies: '',
    exit_condition: '',
    status: 'not_started' as const,
    order_index: 0
  });

  // Handle initial filter from dashboard
  React.useEffect(() => {
    if (initialFilter) {
      if (initialFilter.type === 'action' && initialFilter.value === 'add') {
        setShowAddForm(true);
      } else if (initialFilter.type === 'status') {
        setStatusFilter(initialFilter.value);
      } else if (initialFilter.type === 'workflow') {
        setWorkflowFilter(initialFilter.value);
      }
    }
  }, [initialFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSubflow(formData);
      setShowAddForm(false);
      setFormData({
        workflow_id: '',
        name: '',
        purpose: '',
        prerequisites: '',
        dependencies: '',
        exit_condition: '',
        status: 'not_started',
        order_index: 0
      });
    } catch (err) {
      console.error('Failed to create subflow:', err);
    }
  };

  const handleEdit = (subflow: Subflow) => {
    setEditingSubflow(subflow);
    setFormData({
      workflow_id: subflow.workflow_id,
      name: subflow.name,
      purpose: subflow.purpose || '',
      prerequisites: subflow.prerequisites,
      dependencies: subflow.dependencies,
      exit_condition: subflow.exit_condition,
      status: subflow.status,
      order_index: subflow.order_index
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubflow) return;
    
    try {
      await updateSubflow(editingSubflow.id, formData);
      setShowEditForm(false);
      setEditingSubflow(null);
      setFormData({
        workflow_id: '',
        name: '',
        purpose: '',
        prerequisites: '',
        dependencies: '',
        exit_condition: '',
        status: 'not_started',
        order_index: 0
      });
    } catch (err) {
      console.error('Failed to update subflow:', err);
    }
  };

  const filteredSubflows = subflows.filter(subflow => {
    const matchesSearch = 
      subflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subflow.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || subflow.status === statusFilter;
    const matchesWorkflow = workflowFilter === 'all' || subflow.workflow_id === workflowFilter;
    
    return matchesSearch && matchesStatus && matchesWorkflow;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'not_started': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'not_started': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 dark:bg-gray-700 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-navy/10 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">Error loading subflows: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Subflows</h1>
          <p className="text-navy/70 dark:text-gray-300">Manage workflow subflows and their configurations</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Subflow
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
                placeholder="Search subflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-navy/50 dark:text-gray-400" />
            <select
              value={workflowFilter}
              onChange={(e) => setWorkflowFilter(e.target.value)}
              className="px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            >
              <option value="all">All Workflows</option>
              {workflows.map((workflow) => (
                <option key={workflow.id} value={workflow.id}>
                  {workflow.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subflows List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600">
        {filteredSubflows.length === 0 ? (
          <div className="p-8 text-center">
            <GitBranch className="h-12 w-12 text-navy/30 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No subflows found</h3>
            <p className="text-navy/60 dark:text-gray-400">
              {subflows.length === 0 
                ? "Get started by creating your first subflow"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy/10 dark:divide-gray-600">
            {filteredSubflows.map((subflow) => (
              <div key={subflow.id} className="p-6 hover:bg-navy/5 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      {getStatusIcon(subflow.status)}
                      <h3 className="text-lg font-semibold text-navy dark:text-white">{subflow.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(subflow.status)}`}>
                        {subflow.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-navy/10 dark:bg-gray-600 text-navy dark:text-gray-300">
                        Order: {subflow.order_index}
                      </span>
                    </div>
                    
                    {subflow.workflow && (
                      <div className="mb-3">
                        <span className="text-sm font-medium text-navy/70 dark:text-gray-400">Workflow: </span>
                        <span className="text-sm text-navy dark:text-white">{subflow.workflow.name}</span>
                      </div>
                    )}

                    {subflow.purpose && (
                      <div className="mb-3">
                        <h6 className="text-sm font-medium text-navy dark:text-white mb-1">Purpose</h6>
                        <p className="text-sm text-navy/70 dark:text-gray-300">{subflow.purpose}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <h6 className="font-medium text-navy dark:text-white mb-1">Prerequisites</h6>
                        <p className="text-navy/70 dark:text-gray-300">{subflow.prerequisites || 'None'}</p>
                      </div>
                      
                      {subflow.dependencies && (
                        <div>
                          <h6 className="font-medium text-navy dark:text-white mb-1">Dependencies</h6>
                          <p className="text-navy/70 dark:text-gray-300">{subflow.dependencies}</p>
                        </div>
                      )}
                      
                      <div>
                        <h6 className="font-medium text-navy dark:text-white mb-1">Exit Condition</h6>
                        <p className="text-navy/70 dark:text-gray-300">{subflow.exit_condition || 'All tasks completed'}</p>
                      </div>
                    </div>

                    {subflow.tasks && subflow.tasks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-navy/10 dark:border-gray-600">
                        <h6 className="text-sm font-medium text-navy dark:text-white mb-2">
                          Tasks ({subflow.tasks.length})
                        </h6>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                            {subflow.tasks.filter((t: any) => t.status === 'completed').length} completed
                          </span>
                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {subflow.tasks.filter((t: any) => t.status === 'in_progress').length} in progress
                          </span>
                          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                            {subflow.tasks.filter((t: any) => t.status === 'pending').length} pending
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-2 text-navy/60 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:bg-navy/10 dark:hover:bg-gray-600 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(subflow)}
                      className="p-2 text-navy/60 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:bg-navy/10 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Subflow Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-navy/10 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Create New Subflow</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Workflow *</label>
                <select
                  required
                  value={formData.workflow_id}
                  onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                >
                  <option value="">Select Workflow</option>
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Subflow Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., Provider Baseline"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Purpose</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="One sentence describing the purpose"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Prerequisites *</label>
                <input
                  type="text"
                  required
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., required provider info present"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Dependencies</label>
                <input
                  type="text"
                  value={formData.dependencies}
                  onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., If location.state == AZ then depends on AHCCCS Complete"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Exit Condition *</label>
                <input
                  type="text"
                  required
                  value={formData.exit_condition}
                  onChange={(e) => setFormData({ ...formData, exit_condition: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., approval captured"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Order Index</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
              </div>

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
                  Create Subflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subflow Modal */}
      {showEditForm && editingSubflow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-navy/10 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Edit Subflow</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Workflow *</label>
                <select
                  required
                  value={formData.workflow_id}
                  onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                >
                  <option value="">Select Workflow</option>
                  {workflows.map((workflow) => (
                    <option key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Subflow Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., Provider Baseline"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Purpose</label>
                <input
                  type="text"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="One sentence describing the purpose"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Prerequisites *</label>
                <input
                  type="text"
                  required
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., required provider info present"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Dependencies</label>
                <input
                  type="text"
                  value={formData.dependencies}
                  onChange={(e) => setFormData({ ...formData, dependencies: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., If location.state == AZ then depends on AHCCCS Complete"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Exit Condition *</label>
                <input
                  type="text"
                  required
                  value={formData.exit_condition}
                  onChange={(e) => setFormData({ ...formData, exit_condition: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., approval captured"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Order Index</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingSubflow(null);
                  }}
                  className="px-4 py-2 text-navy dark:text-white border border-navy/20 dark:border-gray-600 rounded-lg hover:bg-navy/5 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy rounded-lg font-medium"
                >
                  Update Subflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};