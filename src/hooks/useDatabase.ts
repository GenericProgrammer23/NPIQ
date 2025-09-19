import { useState, useEffect } from 'react';
import { DatabaseService, Provider, Location, Task, Workflow, Subflow } from '../lib/supabase';

// Custom hook for providers
export function useProviders(organizationId?: string) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true);
        const data = await DatabaseService.getProviders(organizationId);
        setProviders(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch providers');
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();
  }, [organizationId]);

  const createProvider = async (provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Ensure location_id is properly set (can be null)
      const providerData = {
        ...provider,
        location_id: provider.location_id || null
      };
      const newProvider = await DatabaseService.createProvider(provider);
      setProviders(prev => [...prev, newProvider]);
      return newProvider;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
      throw err;
    }
  };

  const updateProvider = async (id: string, updates: Partial<Provider>) => {
    try {
      // Ensure location_id is properly handled
      const updateData = {
        ...updates,
        location_id: updates.location_id || null
      };
      const updatedProvider = await DatabaseService.updateProvider(id, updates);
      setProviders(prev => prev.map(p => p.id === id ? updatedProvider : p));
      return updatedProvider;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider');
      throw err;
    }
  };

  return {
    providers,
    loading,
    error,
    createProvider,
    updateProvider,
    refetch: () => {
      setLoading(true);
      DatabaseService.getProviders(organizationId)
        .then(setProviders)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };
}

// Custom hook for locations
export function useLocations(organizationId?: string) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        setLoading(true);
        const data = await DatabaseService.getLocations(organizationId);
        setLocations(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch locations');
      } finally {
        setLoading(false);
      }
    }

    fetchLocations();
  }, [organizationId]);

  const createLocation = async (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newLocation = await DatabaseService.createLocation(location);
      setLocations(prev => [...prev, newLocation]);
      return newLocation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
      throw err;
    }
  };

  const updateLocation = async (id: string, updates: Partial<Location>) => {
    try {
      const updatedLocation = await DatabaseService.updateLocation(id, updates);
      setLocations(prev => prev.map(l => l.id === id ? updatedLocation : l));
      return updatedLocation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update location');
      throw err;
    }
  };

  return {
    locations,
    loading,
    error,
    createLocation,
    updateLocation,
    refetch: () => {
      setLoading(true);
      DatabaseService.getLocations(organizationId)
        .then(setLocations)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };
}

// Custom hook for subflows
export function useSubflows(workflowId?: string) {
  const [subflows, setSubflows] = useState<Subflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubflows() {
      try {
        setLoading(true);
        const data = await DatabaseService.getSubflows(workflowId);
        setSubflows(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch subflows');
      } finally {
        setLoading(false);
      }
    }

    fetchSubflows();
  }, [workflowId]);

  const createSubflow = async (subflow: Omit<Subflow, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newSubflow = await DatabaseService.createSubflow(subflow);
      setSubflows(prev => [...prev, newSubflow]);
      return newSubflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create subflow');
      throw err;
    }
  };

  const updateSubflow = async (id: string, updates: Partial<Subflow>) => {
    try {
      const updatedSubflow = await DatabaseService.updateSubflow(id, updates);
      setSubflows(prev => prev.map(s => s.id === id ? updatedSubflow : s));
      return updatedSubflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subflow');
      throw err;
    }
  };

  const emitTasksForSubflow = async (subflowId: string, providerId?: string) => {
    try {
      await DatabaseService.emitSubflowTasks(subflowId, providerId);
      // Refresh subflows to get updated status
      const data = await DatabaseService.getSubflows(workflowId);
      setSubflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to emit tasks for subflow');
      throw err;
    }
  };

  return {
    subflows,
    loading,
    error,
    createSubflow,
    updateSubflow,
    emitTasksForSubflow,
    refetch: () => {
      setLoading(true);
      DatabaseService.getSubflows(workflowId)
        .then(setSubflows)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };
}

// Custom hook for tasks
export function useTasks(filters?: {
  workflowId?: string;
  subflowId?: string;
  providerId?: string;
  status?: string;
  assignedTo?: string;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const data = await DatabaseService.getTasks(filters);
        setTasks(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [filters?.workflowId, filters?.subflowId, filters?.providerId, filters?.status, filters?.assignedTo]);

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTask = await DatabaseService.createTask(task);
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await DatabaseService.updateTask(id, updates);
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    }
  };

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    refetch: () => {
      setLoading(true);
      DatabaseService.getTasks(filters)
        .then(setTasks)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };
}

// Custom hook for workflows
export function useWorkflows(organizationId?: string) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWorkflows() {
      try {
        setLoading(true);
        const data = await DatabaseService.getWorkflows(organizationId);
        setWorkflows(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
      } finally {
        setLoading(false);
      }
    }

    fetchWorkflows();
  }, [organizationId]);

  const createWorkflow = async (workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newWorkflow = await DatabaseService.createWorkflow(workflow);
      setWorkflows(prev => [...prev, newWorkflow]);
      return newWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
      throw err;
    }
  };

  const updateWorkflow = async (id: string, updates: Partial<Workflow>) => {
    try {
      const updatedWorkflow = await DatabaseService.updateWorkflow(id, updates);
      setWorkflows(prev => prev.map(w => w.id === id ? updatedWorkflow : w));
      return updatedWorkflow;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow');
      throw err;
    }
  };
  return {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    refetch: () => {
      setLoading(true);
      DatabaseService.getWorkflows(organizationId)
        .then(setWorkflows)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };
}

// Custom hook for dashboard statistics
export function useDashboardStats(organizationId?: string) {
  const [stats, setStats] = useState({
    totalProviders: 0,
    activeWorkflows: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await DatabaseService.getDashboardStats(organizationId);
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [organizationId]);

  return {
    stats,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      DatabaseService.getDashboardStats(organizationId)
        .then(setStats)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };
}