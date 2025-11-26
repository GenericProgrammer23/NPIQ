import { supabase } from './supabase';
import type {
  WorkflowDefinition,
  WorkflowExecutionInstance,
  WorkflowNodeExecution,
  WorkflowVersionHistory
} from '../types/workflow';

export class WorkflowDatabaseService {
  static async createWorkflowDefinition(data: Omit<WorkflowDefinition, 'id' | 'created_at' | 'updated_at'>): Promise<WorkflowDefinition> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: result, error } = await supabase
      .from('workflow_definitions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async getWorkflowDefinition(id: string): Promise<WorkflowDefinition | null> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getActiveWorkflowForPayer(payerId: string): Promise<WorkflowDefinition | null> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('payer_id', payerId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getWorkflowVersions(payerId: string): Promise<WorkflowDefinition[]> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('payer_id', payerId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateWorkflowDefinition(
    id: string,
    updates: Partial<WorkflowDefinition>
  ): Promise<WorkflowDefinition> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_definitions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteWorkflowDefinition(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('workflow_definitions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async createWorkflowExecution(
    data: Omit<WorkflowExecutionInstance, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WorkflowExecutionInstance> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: result, error } = await supabase
      .from('workflow_execution_instances')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async getWorkflowExecution(id: string): Promise<WorkflowExecutionInstance | null> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_execution_instances')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getActiveExecutionForProviderPayer(
    providerId: string,
    payerId: string
  ): Promise<WorkflowExecutionInstance | null> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_execution_instances')
      .select('*')
      .eq('provider_id', providerId)
      .eq('payer_id', payerId)
      .in('status', ['running', 'waiting_for_date', 'waiting_for_prerequisite', 'waiting_for_dependency'])
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async updateWorkflowExecution(
    id: string,
    updates: Partial<WorkflowExecutionInstance>
  ): Promise<WorkflowExecutionInstance> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_execution_instances')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async createNodeExecution(
    data: Omit<WorkflowNodeExecution, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WorkflowNodeExecution> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: result, error } = await supabase
      .from('workflow_node_executions')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async updateNodeExecution(
    id: string,
    updates: Partial<WorkflowNodeExecution>
  ): Promise<WorkflowNodeExecution> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_node_executions')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getNodeExecutionsForInstance(instanceId: string): Promise<WorkflowNodeExecution[]> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_node_executions')
      .select('*')
      .eq('workflow_execution_instance_id', instanceId)
      .order('started_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async createVersionHistory(
    data: Omit<WorkflowVersionHistory, 'id' | 'created_at'>
  ): Promise<WorkflowVersionHistory> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: result, error } = await supabase
      .from('workflow_version_history')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async getVersionHistory(payerId: string): Promise<WorkflowVersionHistory[]> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_version_history')
      .select('*')
      .eq('payer_id', payerId)
      .order('created_at', { ascending: false});

    if (error) throw error;
    return data || [];
  }

  static async getAllWorkflows(): Promise<WorkflowDefinition[]> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getActiveWorkflows(): Promise<WorkflowDefinition[]> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('workflow_definitions')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
