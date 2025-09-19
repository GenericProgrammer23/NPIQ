import React, { useState } from 'react';
import { useTasks, useWorkflows, useProviders, useSubflows } from '../hooks/useDatabase';
import { CheckSquare, Plus, Search, Filter, Calendar, User, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TasksPageProps {
  initialFilter?: { type: string; value: string } | null;
}

export const TasksPage: React.FC<TasksPageProps> = ({ initialFilter }) => {
  const { tasks, loading, error, createTask, updateTask } = useTasks();
  const { workflows } = useWorkflows();
  const { subflows } = useSubflows();
  const { providers } = useProviders();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [customFields, setCustomFields] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    workflow_id: '',
    subflow_id: '',
    provider_id: '',
    status: 'pending' as const,
    priority: 'medium' as const,
    due_date: '',
    assigned_to: ''
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
        .eq('table_name', 'tasks')
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
      const taskData = {
        ...formData,
        workflow_id: formData.workflow_id || null,
        subflow_id: formData.subflow_id || null,
        provider_id: formData.provider_id || null,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        ...customFieldData // Include custom field data
      };
      
      await createTask(taskData);
      setShowAddForm(false);
      setFormData({
        title: '',
        description: '',
        workflow_id: '',
        subflow_id: '',
        provider_id: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        assigned_to: ''
      });
      setCustomFieldData({});
    } catch (err) {
      console.error('Failed to create task:', err);
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

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      await updateTask(taskId, { 
        status: newStatus as any,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      });
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
          <p className="text-red-800">Error loading tasks: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cream dark:bg-navy min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Tasks</h1>
          <p className="text-navy/70 dark:text-cream/70">Manage workflow tasks and assignments</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Task
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
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-navy/50 dark:text-cream/50" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center">
            <CheckSquare className="h-12 w-12 text-navy/30 dark:text-cream/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No tasks found</h3>
            <p className="text-navy/60 dark:text-cream/60">
              {tasks.length === 0 
                ? "Get started by creating your first task"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy/10 dark:divide-dark-cyan/20">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-6 hover:bg-navy/5 dark:hover:bg-navy-dark/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-navy dark:text-white">{task.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                      {task.due_date && isOverdue(task.due_date) && task.status !== 'completed' && (
                        <span className="flex items-center text-red-600 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Overdue
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-navy/70 dark:text-cream/70 mb-3">{task.description}</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-navy/70 dark:text-cream/70">
                      {task.workflow && (
                        <div className="flex items-center">
                          <CheckSquare className="h-4 w-4 mr-2" />
                          <span className="text-navy/70 dark:text-cream/70">
                            {task.workflow.name}
                            {task.subflow && (
                              <>
                                <span className="mx-2 text-navy/40 dark:text-cream/40">→</span>
                                <span className="font-medium text-navy dark:text-white">{task.subflow.name}</span>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                      {task.provider && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {task.provider.first_name} {task.provider.last_name}
                        </div>
                      )}
                      {task.due_date && (
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Due {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      className="px-3 py-1 border border-navy/20 dark:border-dark-cyan/30 rounded text-sm focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Create New Task</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="e.g., Review license documentation"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan h-20 resize-none bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="Describe the task details..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Workflow</label>
                  <select
                    value={formData.workflow_id}
                    onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value, subflow_id: '' })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  >
                    <option value="">No workflow</option>
                    {workflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Subflow</label>
                  <select
                    value={formData.subflow_id}
                    onChange={(e) => setFormData({ ...formData, subflow_id: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                    disabled={!formData.workflow_id}
                  >
                    <option value="">No subflow</option>
                    {subflows
                      .filter(subflow => subflow.workflow_id === formData.workflow_id)
                      .map((subflow) => (
                        <option key={subflow.id} value={subflow.id}>
                          {subflow.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Provider</label>
                  <select
                    value={formData.provider_id}
                    onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  >
                    <option value="">No provider</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.first_name} {provider.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                />
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <>
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium text-navy dark:text-white mb-4 border-t border-navy/20 dark:border-dark-cyan/20 pt-4">
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
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};