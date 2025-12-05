import { supabase } from '../lib/supabase';

export interface ProviderAction {
  id: string;
  provider_id: string;
  organization_id: string;
  action_template_id: string | null;
  action_type: 'initial_credentialing' | 'name_change' | 'address_change' | 're_credentialing' | 'add_single_payer' | 'custom';
  action_name: string;
  metadata: Record<string, any>;
  payer_ids: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  started_at: string | null;
  completed_at: string | null;
  total_tasks: number;
  completed_tasks: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProviderActionParams {
  provider_id: string;
  organization_id: string;
  action_template_id?: string;
  action_type: ProviderAction['action_type'];
  action_name: string;
  metadata?: Record<string, any>;
  payer_ids: string[];
}

export class ProviderActionService {
  static async getProviderActions(providerId: string): Promise<ProviderAction[]> {
    const { data, error } = await supabase
      .from('provider_actions')
      .select('*')
      .eq('provider_id', providerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching provider actions:', error);
      throw error;
    }

    return data || [];
  }

  static async getProviderActionById(id: string): Promise<ProviderAction | null> {
    const { data, error } = await supabase
      .from('provider_actions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching provider action:', error);
      return null;
    }

    return data;
  }

  static async createProviderAction(params: CreateProviderActionParams): Promise<ProviderAction | null> {
    const { data, error } = await supabase
      .from('provider_actions')
      .insert({
        ...params,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        total_tasks: 0,
        completed_tasks: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating provider action:', error);
      throw error;
    }

    return data;
  }

  static async updateProviderAction(
    id: string,
    updates: Partial<ProviderAction>
  ): Promise<ProviderAction | null> {
    const { data, error } = await supabase
      .from('provider_actions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating provider action:', error);
      throw error;
    }

    return data;
  }

  static async completeProviderAction(id: string): Promise<void> {
    await this.updateProviderAction(id, {
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  }

  static async cancelProviderAction(id: string): Promise<void> {
    await this.updateProviderAction(id, {
      status: 'cancelled'
    });
  }

  static async getActionProgress(actionId: string): Promise<{ total: number; completed: number; percentage: number }> {
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('status')
      .eq('provider_action_id', actionId);

    if (error) {
      console.error('Error fetching action progress:', error);
      return { total: 0, completed: 0, percentage: 0 };
    }

    const total = tasks?.length || 0;
    const completed = tasks?.filter(t => t.status === 'completed').length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percentage };
  }
}
