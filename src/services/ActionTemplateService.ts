import { supabase } from '../lib/supabase';

export interface TaskTemplate {
  title: string;
  description: string;
  type: 'document' | 'field' | 'submission' | 'approval' | 'custom';
  priority: number;
  estimated_days?: number;
  required_for_payers?: string[];
}

export interface ActionTemplate {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  category: 'credentialing' | 'change' | 'renewal' | 'custom';
  applies_to_payer_ids: string[];
  required_documents: string[];
  required_fields: string[];
  task_templates: TaskTemplate[];
  is_system_template: boolean;
  created_at: string;
  updated_at: string;
}

export class ActionTemplateService {
  static async getActionTemplates(organizationId: string): Promise<ActionTemplate[]> {
    const { data, error } = await supabase
      .from('action_templates')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error fetching action templates:', error);
      throw error;
    }

    return data || [];
  }

  static async getActionTemplateById(id: string): Promise<ActionTemplate | null> {
    const { data, error } = await supabase
      .from('action_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching action template:', error);
      return null;
    }

    return data;
  }

  static async createActionTemplate(
    template: Omit<ActionTemplate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ActionTemplate | null> {
    const { data, error } = await supabase
      .from('action_templates')
      .insert(template)
      .select()
      .single();

    if (error) {
      console.error('Error creating action template:', error);
      throw error;
    }

    return data;
  }

  static async updateActionTemplate(
    id: string,
    updates: Partial<ActionTemplate>
  ): Promise<ActionTemplate | null> {
    const { data, error } = await supabase
      .from('action_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating action template:', error);
      throw error;
    }

    return data;
  }

  static async deleteActionTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('action_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting action template:', error);
      throw error;
    }
  }
}
