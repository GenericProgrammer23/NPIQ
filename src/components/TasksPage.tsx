import React, { useState, useEffect } from 'react';
import { useTasks, useWorkflows, useProviders, useSubflows } from '../hooks/useDatabase';
import { CheckSquare, Plus, Search, Filter, Calendar, User, AlertCircle, Trash2, Edit, ExternalLink, Info } from 'lucide-react';
import { supabase, Provider } from '../lib/supabase';
import { ProviderDetailModal } from './ProviderDetailModal';
import { PriorityCalculationService } from '../services/PriorityCalculationService';
import { TaskGenerationService } from '../services/TaskGenerationService';
import { DynamicTaskUpdateService } from '../services/DynamicTaskUpdateService';

interface TasksPageProps {
  initialFilter?: { type: string; value: string } | null;
}

export const TasksPage: React.FC<TasksPageProps> = ({ initialFilter }) => {
  const { tasks, loading, error, createTask, updateTask, refetch } = useTasks();
  const { workflows } = useWorkflows();
  const { subflows } = useSubflows();
  const { providers } = useProviders();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [providerActions, setProviderActions] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [highlightMissingFields, setHighlightMissingFields] = useState<string[]>([]);

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

  // Load custom fields and refresh tasks on component mount
  React.useEffect(() => {
    loadCustomFields();
    loadProviderActions();
    refetch();
  }, []);

  const loadProviderActions = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('provider_actions')
        .select('id, action_name, action_type, provider_id, status')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load provider actions:', error);
        return;
      }

      setProviderActions(data || []);
    } catch (err) {
      console.error('Failed to load provider actions:', err);
    }
  };

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
    
    // Sanitize custom field data
    const sanitizedCustomFieldData: Record<string, any> = {};
    customFields.forEach(field => {
      const value = customFieldData[field.name];
      if (field.type === 'number') {
        sanitizedCustomFieldData[field.name] = value === '' ? null : value;
      } else {
        sanitizedCustomFieldData[field.name] = value;
      }
    });
    
    try {
      const taskData = {
        ...formData,
        workflow_id: formData.workflow_id || null,
        subflow_id: formData.subflow_id || null,
        provider_id: formData.provider_id || null,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        ...sanitizedCustomFieldData // Include sanitized custom field data
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
      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCustomFieldData({ ...customFieldData, [field.name]: file.name });
                }
              }}
              className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              required={field.required}
            />
            {value && (
              <p className="text-sm text-navy/60 dark:text-gray-400">
                Current file: {value}
              </p>
            )}
          </div>
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

  const handleStatusChange = async (taskId: string, newStatus: string, task?: any) => {
    try {
      // Handle special case for "Enter Provider in Prompt" task
      if (newStatus === 'completed' && task && task.title.includes('Enter Provider Information in Prompt') && task.provider_id) {
        await DynamicTaskUpdateService.completeLoadingTask(taskId, task.provider_id);
        await refetch();
        alert('✓ Provider credentialing loaded date has been updated!');
        return;
      }

      // Update task status
      await updateTask(taskId, {
        status: newStatus as any,
        completed_at: newStatus === 'completed' ? new Date().toISOString() : null
      });

      // If task completed, trigger dependent tasks
      if (newStatus === 'completed') {
        const result = await TaskGenerationService.handleTaskCompletion(taskId);
        await refetch();

        if (result.tasksCreated > 0) {
          alert(`✓ Task completed!\n\n${result.tasksCreated} new task(s) created:\n${result.taskTitles.join('\n')}`);
        }
      }
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      workflow_id: task.workflow_id || '',
      subflow_id: task.subflow_id || '',
      provider_id: task.provider_id || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      assigned_to: task.assigned_to || ''
    });

    const customData: Record<string, any> = {};
    customFields.forEach(field => {
      customData[field.name] = (task as any)[field.name] || '';
    });
    setCustomFieldData(customData);

    setShowEditForm(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    const sanitizedCustomFieldData: Record<string, any> = {};
    customFields.forEach(field => {
      const value = customFieldData[field.name];
      if (field.type === 'number') {
        sanitizedCustomFieldData[field.name] = value === '' ? null : value;
      } else {
        sanitizedCustomFieldData[field.name] = value;
      }
    });

    try {
      const updateData = {
        ...formData,
        workflow_id: formData.workflow_id || null,
        subflow_id: formData.subflow_id || null,
        provider_id: formData.provider_id || null,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        ...sanitizedCustomFieldData
      };

      await updateTask(editingTask.id, updateData);
      setShowEditForm(false);
      setEditingTask(null);
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
      console.error('Failed to update task:', err);
      alert('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      if (supabase) {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', taskId);

        if (error) throw error;

        // Refresh tasks list
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      alert('Failed to delete task. Please try again.');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.provider && `${task.provider.first_name} ${task.provider.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesAction = actionFilter === 'all' || task.provider_action_id === actionFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAction;
  });

  // Sort tasks by computed priority
  const sortedTasks = PriorityCalculationService.sortTasksByPriority(filteredTasks);

  const tasksByProvider = sortedTasks.reduce((acc, task) => {
    if (!task.provider_id) return acc;

    const providerKey = task.provider_id;
    if (!acc[providerKey]) {
      acc[providerKey] = {
        provider: task.provider,
        tasks: []
      };
    }
    acc[providerKey].tasks.push(task);
    return acc;
  }, {} as Record<string, { provider: any; tasks: any[] }>);

  const handleProviderClick = (providerId: string, taskTitle?: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return;

    setSelectedProvider(provider);
    if (taskTitle && taskTitle.includes('Obtain Provider Information')) {
      const missingFields: string[] = [];
      if (!provider.email) missingFields.push('email');
      if (!provider.phone) missingFields.push('phone');
      if (!provider.license_number) missingFields.push('license_number');
      if (!provider.specialty) missingFields.push('specialty');
      setHighlightMissingFields(missingFields);
    } else {
      setHighlightMissingFields([]);
    }
    setShowProviderModal(true);
  };

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
    <div className="p-6 bg-page-bg dark:bg-navy min-h-screen">
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
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            >
              <option value="all">All Actions</option>
              {providerActions.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.action_name} ({action.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks Grouped by Provider */}
      <div className="space-y-4">
        {Object.keys(tasksByProvider).length === 0 ? (
          <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 p-8 text-center">
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
          Object.entries(tasksByProvider).map(([providerId, { provider, tasks: providerTasks }]) => (
            <div key={providerId} className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 overflow-hidden">
              <div
                className="bg-dark-cyan/10 dark:bg-dark-cyan/20 p-4 cursor-pointer hover:bg-dark-cyan/15 dark:hover:bg-dark-cyan/30 transition-colors"
                onClick={() => handleProviderClick(providerId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-dark-cyan/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-dark-cyan" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-navy dark:text-white">
                        {provider?.first_name} {provider?.last_name}
                      </h3>
                      <p className="text-sm text-navy/60 dark:text-cream/60">
                        {providerTasks.length} {providerTasks.length === 1 ? 'task' : 'tasks'} •
                        {' '}{providerTasks.filter(t => t.status === 'completed').length} completed
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-5 w-5 text-navy/40 dark:text-cream/40" />
                </div>
              </div>

              <div className="divide-y divide-navy/10 dark:divide-dark-cyan/20">
                {providerTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-navy/5 dark:hover:bg-navy-dark/50 transition-colors cursor-pointer"
                    onClick={() => handleProviderClick(providerId, task.title)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {task.computed_priority && (
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-dark-cyan text-white text-xs font-bold">
                              {task.computed_priority <= 20 ? '!' : task.computed_priority <= 50 ? '↑' : ''}
                            </span>
                          )}
                          <h4 className="text-base font-semibold text-navy dark:text-white">{task.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                          {task.priority_reason && (
                            <div className="group relative">
                              <Info className="h-4 w-4 text-navy/40 dark:text-cream/40 cursor-help" />
                              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-navy dark:bg-dark-cyan text-white text-xs rounded-lg shadow-lg z-10">
                                {task.priority_reason}
                              </div>
                            </div>
                          )}
                          {task.due_date && isOverdue(task.due_date) && task.status !== 'completed' && (
                            <span className="flex items-center text-red-600 text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-sm text-navy/70 dark:text-cream/70 mb-2">{task.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-navy/60 dark:text-cream/60">
                          {task.workflow && (
                            <div className="flex items-center">
                              <CheckSquare className="h-3 w-3 mr-1" />
                              {task.workflow.name}
                              {task.subflow && ` → ${task.subflow.name}`}
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value, task)}
                          className="px-2 py-1 border border-navy/20 dark:border-dark-cyan/30 rounded text-xs focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTask(task);
                          }}
                          className="p-1.5 text-dark-cyan hover:text-dark-cyan/80 hover:bg-dark-cyan/10 dark:hover:bg-dark-cyan/20 rounded transition-colors"
                          title="Edit Task"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {showProviderModal && selectedProvider && (
        <ProviderDetailModal
          provider={selectedProvider}
          onClose={() => {
            setShowProviderModal(false);
            setSelectedProvider(null);
            setHighlightMissingFields([]);
          }}
          onUpdate={() => {
            refetch();
          }}
          highlightMissingFields={highlightMissingFields}
        />
      )}

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

      {/* Edit Task Modal */}
      {showEditForm && editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Edit Task</h2>
            </div>

            <form onSubmit={handleUpdateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Status *</label>
                  <select
                    required
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
                  <label className="block text-navy dark:text-white font-medium mb-2">Priority *</label>
                  <select
                    required
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

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Provider</label>
                <select
                  value={formData.provider_id}
                  onChange={(e) => setFormData({ ...formData, provider_id: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="">No Provider</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.first_name} {provider.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Workflow</label>
                <select
                  value={formData.workflow_id}
                  onChange={(e) => setFormData({ ...formData, workflow_id: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="">No Workflow</option>
                  {workflows.map(workflow => (
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
                  <option value="">No Subflow</option>
                  {subflows
                    .filter(sf => sf.workflow_id === formData.workflow_id)
                    .map(subflow => (
                      <option key={subflow.id} value={subflow.id}>
                        {subflow.name}
                      </option>
                    ))}
                </select>
              </div>

              {customFields.map(field => (
                <div key={field.id}>
                  <label className="block text-navy dark:text-white font-medium mb-2">
                    {field.label} {field.required && '*'}
                  </label>
                  {renderCustomField(field, customFieldData[field.name] || '')}
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-navy dark:text-cream rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy rounded-lg font-medium"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};