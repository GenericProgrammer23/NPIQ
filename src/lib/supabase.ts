import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('temp_supabase_url');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('temp_supabase_key');

// NEW: add this just below the two lines above
const supabaseSchema = (import.meta.env.VITE_DB_SCHEMA ?? 'public').trim();


// Create Supabase client only if environment variables are available
let supabase: SupabaseClient | null = null;

try {
  supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
        db: { schema: supabaseSchema },
      })
    : null;
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  supabase = null;
}

export { supabase };

// Database types
export interface Organization {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface OrgMember {
  id: string;
  user_id: string;
  organization_id: string;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Location {
  id: string;
  organization_id: string;
  name: string;
  address?: string;
  departments: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Provider {
  id: string;
  organization_id: string;
  location_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  license_number?: string;
  license_expiry?: string;
  credentialing_loaded_date?: string;
  status: 'active' | 'pending' | 'expired' | 'suspended';
  created_at: string;
  updated_at: string;
  organization?: Organization;
  location?: Location;
}

export interface Workflow {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  type: 'credentialing' | 'renewal' | 'compliance';
  status: 'active' | 'draft' | 'archived';
  steps: any[];
  created_by?: string;
  is_template?: boolean;
  trigger_conditions?: any[];
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface WorkflowInstance {
  id: string;
  workflow_template_id: string;
  entity_type: 'provider' | 'location';
  entity_id: string;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  progress_percentage: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
  workflow_template?: Workflow;
  provider?: Provider;
  location?: Location;
}

export interface Task {
  id: string;
  workflow_id?: string;
  subflow_id?: string;
  provider_id?: string;
  payer_id?: string;
  location_id?: string;
  instance_id?: string;
  task_template_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  computed_priority?: number;
  priority_reason?: string;
  blocks_payers?: string[];
  due_date?: string;
  assigned_to?: string;
  completed_at?: string;
  auto_generated?: boolean;
  last_updated_by_system?: string;
  created_at: string;
  updated_at: string;
  workflow?: Workflow;
  subflow?: Subflow;
  provider?: Provider;
  location?: Location;
  instance?: WorkflowInstance;
}

export interface Subflow {
  id: string;
  workflow_id?: string;
  instance_id?: string;
  organization_id?: string;
  name: string;
  purpose?: string;
  prerequisites: string;
  dependencies: string;
  exit_condition: string;
  status: 'not_started' | 'in_progress' | 'complete';
  order_index: number;
  is_template?: boolean;
  payer_id?: string;
  is_reusable?: boolean;
  execution_count?: number;
  last_executed_at?: string;
  tags?: string[];
  workflow_data?: any;
  metadata?: any;
  created_at: string;
  updated_at: string;
  workflow?: Workflow;
  instance?: WorkflowInstance;
  payer?: Payer;
  tasks?: Task[];
}

export interface Payer {
  id: string;
  organization_id: string;
  name: string;
  type: 'insurance' | 'credentialing' | 'government' | 'other';
  workflow_state: 'AZ' | 'TX' | 'ALL';
  application_fields: Record<string, any>;
  status: 'active' | 'inactive';
  description?: string;
  requires_demographics?: boolean;
  dependent_on_payer_ids?: string[];
  days_to_approve?: number;
  days_to_load?: number;
  required_documents?: string[];
  required_provider_fields?: string[];
  priority_base?: number;
  is_always_required?: boolean;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface ProviderPayerApplication {
  id: string;
  provider_id: string;
  payer_id: string;
  application_submission_date?: string;
  application_approved_date?: string;
  provider_loaded_date?: string;
  effective_date?: string;
  status: 'not_started' | 'submitted' | 'approved' | 'loaded' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  provider?: Provider;
  payer?: Payer;
}

export interface LocationPayerApplication {
  id: string;
  location_id: string;
  payer_id: string;
  application_submission_date?: string;
  application_approved_date?: string;
  location_loaded_date?: string;
  status: 'not_started' | 'submitted' | 'approved' | 'loaded' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
  location?: Location;
  payer?: Payer;
}

export interface WorkflowSubflow {
  id: string;
  workflow_id: string;
  subflow_id: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
  workflow?: Workflow;
  subflow?: Subflow;
}

export interface PayerSubflow {
  id: string;
  payer_id: string;
  subflow_id: string;
  is_primary: boolean;
  created_at: string;
  payer?: Payer;
  subflow?: Subflow;
}

export interface WorkflowPayer {
  id: string;
  workflow_id: string;
  payer_id: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
  workflow?: Workflow;
  payer?: Payer;
}

export interface PayerTaskTemplate {
  id: string;
  payer_id: string;
  title_template: string;
  description_template?: string;
  task_type: 'document' | 'info' | 'submit' | 'approval' | 'loading';
  trigger_condition?: string;
  priority_modifier?: number;
  due_date_offset_days?: number;
  prevents_duplication?: boolean;
  completion_triggers_template_ids?: string[];
  parent_task_type?: string;
  created_at: string;
  updated_at: string;
  payer?: Payer;
}

export interface PriorityRule {
  id: string;
  organization_id: string;
  rule_name: string;
  rule_type: 'payer_base' | 'dependency_count' | 'due_date' | 'task_type' | 'custom';
  rule_config: Record<string, any>;
  weight: number;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

// Database service functions
export class DatabaseService {
  // Check if Supabase is configured
  static isConfigured(): boolean {
    return supabase !== null;
  }

  // Get current user
  static async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  // Test database connection
  static async testConnection(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Check if user has any organizations
  static async hasUserOrganizations(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      console.log('Checking organizations for user:', user.id);

      const { data: memberData, error: memberError } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      if (!memberError && memberData && memberData.length > 0) {
        console.log('User found in org_members');
        return true;
      }

      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .limit(1);

      if (!orgError && orgData && orgData.length > 0) {
        console.log('User has access to organizations, auto-adding to org_members');
        await supabase.rpc('auto_add_user_to_provider_org');
        return true;
      }

      console.log('No organizations found for user');
      return false;
    } catch (error) {
      console.error('Failed to check user organizations:', error);
      return false;
    }
  }

  // Organizations
  static async getOrganizations(): Promise<Organization[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async createOrganization(org: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('organizations')
      .insert(org)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Organization membership
  static async createMembership(membership: Omit<OrgMember, 'id' | 'created_at' | 'updated_at'>): Promise<OrgMember> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('org_members')
      .insert(membership)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Locations
  static async getLocations(organizationId?: string): Promise<Location[]> {
    if (!supabase) return [];
    let query = supabase
      .from('locations')
      .select(`
        *,
        organization:organizations(*)
      `)
      .order('name');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createLocation(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Get current user's organization if not provided
    if (!location.organization_id || location.organization_id === 'current-org-id') {
      const user = await this.getCurrentUser();
      if (user) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        
        if (membership) {
          location.organization_id = membership.organization_id;
        }
      }
    }
    
    const { data, error } = await supabase
      .from('locations')
      .insert(location)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateLocation(id: string, updates: Partial<Location>): Promise<Location> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Providers
  static async getProviders(organizationId?: string): Promise<Provider[]> {
    if (!supabase) return [];
    let query = supabase
      .from('providers')
      .select(`
        *,
        organization:organizations(*),
        location:locations(*)
      `)
      .order('last_name');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createProvider(provider: Omit<Provider, 'id' | 'created_at' | 'updated_at'>): Promise<Provider> {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Get current user's organization if not provided
    if (!provider.organization_id || provider.organization_id === 'current-org-id') {
      const user = await this.getCurrentUser();
      if (user) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        
        if (membership) {
          provider.organization_id = membership.organization_id;
        }
      }
    }
    
    // Ensure location_id is properly handled - it can be null
    const providerData = {
      ...provider,
      location_id: provider.location_id || null
    };
    
    const { data, error } = await supabase
      .from('providers')
      .insert(providerData)
      .select(`
        *,
        organization:organizations(*),
        location:locations(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProvider(id: string, updates: Partial<Provider>): Promise<Provider> {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Ensure location_id is properly handled - it can be null
    const updateData = {
      ...updates,
      location_id: updates.location_id || null
    };
    
    const { data, error } = await supabase
      .from('providers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        organization:organizations(*),
        location:locations(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Workflows
  static async getWorkflows(organizationId?: string, templatesOnly: boolean = false): Promise<Workflow[]> {
    if (!supabase) return [];
    let query = supabase
      .from('workflows')
      .select(`
        *,
        organization:organizations(*)
      `)
      .order('name');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    if (templatesOnly) {
      query = query.eq('is_template', true);
    }

    const { data, error} = await query;
    if (error) throw error;
    return data || [];
  }

  static async createWorkflow(workflow: Omit<Workflow, 'id' | 'created_at' | 'updated_at'>): Promise<Workflow> {
    if (!supabase) throw new Error('Supabase not configured');
    
    // Get current user's organization if not provided
    if (!workflow.organization_id || workflow.organization_id === 'current-org-id') {
      const user = await this.getCurrentUser();
      if (user) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        
        if (membership) {
          workflow.organization_id = membership.organization_id;
          workflow.created_by = user.id;
        }
      }
    }
    
    const { data, error } = await supabase
      .from('workflows')
      .insert(workflow)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('workflows')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Subflows
  static async getSubflows(workflowId?: string): Promise<Subflow[]> {
    if (!supabase) return [];
    let query = supabase
      .from('subflows')
      .select(`
        *,
        workflow:workflows(*),
        tasks:tasks(*)
      `)
      .order('order_index');

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getWorkflowSubflows(workflowId: string): Promise<any[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('workflow_subflows')
      .select(`
        order_index,
        subflows (
          id,
          name,
          payer_id
        )
      `)
      .eq('workflow_id', workflowId)
      .order('order_index');

    if (error) throw error;
    return (data || []).map((ws: any) => ws.subflows);
  }

  static async createSubflow(subflow: Omit<Subflow, 'id' | 'created_at' | 'updated_at'>): Promise<Subflow> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('subflows')
      .insert(subflow)
      .select(`
        *,
        workflow:workflows(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateSubflow(id: string, updates: Partial<Subflow>): Promise<Subflow> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('subflows')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        workflow:workflows(*),
        tasks:tasks(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Check subflow prerequisites
  static async checkSubflowPrerequisites(subflowId: string, providerId?: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
      const { data: subflow } = await supabase
        .from('subflows')
        .select('prerequisites, dependencies, workflow_id')
        .eq('id', subflowId)
        .single();

      if (!subflow) return false;

      // Parse prerequisites from JSON
      let prerequisites: string[] = [];
      try {
        prerequisites = JSON.parse(subflow.prerequisites);
      } catch {
        // Fallback for old string format
        prerequisites = subflow.prerequisites ? [subflow.prerequisites] : [];
      }

      if (!Array.isArray(prerequisites)) return true;

      // Check each prerequisite
      for (const prereq of prerequisites) {
        const [type, field] = prereq.split(':');
        
        if (type === 'provider_field' && providerId) {
          const { data: provider } = await supabase
            .from('providers')
            .select(field)
            .eq('id', providerId)
            .single();
          
          if (!provider || !provider[field]) return false;
        }
        
        if (type === 'location_field' && providerId) {
          const { data: provider } = await supabase
            .from('providers')
            .select('location:locations(*)')
            .eq('id', providerId)
            .single();
          
          if (!provider?.location || !provider.location[field]) return false;
        }
        
        if (type === 'subflow_complete') {
          // Check if the prerequisite subflow is complete for this workflow
          const { data: prereqSubflow } = await supabase
            .from('subflows')
            .select('status')
            .eq('workflow_id', subflow.workflow_id)
            .eq('name', field)
            .single();
          
          if (!prereqSubflow || prereqSubflow.status !== 'complete') return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking prerequisites:', error);
      return false;
    }
  }

  // Emit tasks for a subflow when prerequisites are met
  static async emitSubflowTasks(subflowId: string, providerId?: string): Promise<void> {
    if (!supabase) return;

    try {
      const { data: subflow } = await supabase
        .from('subflows')
        .select('*')
        .eq('id', subflowId)
        .single();

      if (!subflow || subflow.status !== 'not_started') return;

      // Check if prerequisites are met
      const prereqsMet = await this.checkSubflowPrerequisites(subflowId, providerId);
      if (!prereqsMet) return;

      // Update subflow status to in_progress
      await this.updateSubflow(subflowId, { status: 'in_progress' });

      // Create default tasks based on subflow name
      const defaultTasks = this.getDefaultTasksForSubflow(subflow.name);
      
      for (const taskTemplate of defaultTasks) {
        await this.createTask({
          subflow_id: subflowId,
          workflow_id: subflow.workflow_id,
          provider_id: providerId || null,
          title: taskTemplate.title,
          description: taskTemplate.description,
          status: 'pending',
          priority: taskTemplate.priority || 'medium',
          due_date: taskTemplate.dueInDays ? 
            new Date(Date.now() + taskTemplate.dueInDays * 24 * 60 * 60 * 1000).toISOString() : 
            null
        });
      }
    } catch (error) {
      console.error('Error emitting subflow tasks:', error);
    }
  }

  // Get default tasks for a subflow
  private static getDefaultTasksForSubflow(subflowName: string) {
    const taskTemplates: Record<string, Array<{
      title: string;
      description: string;
      priority?: string;
      dueInDays?: number;
    }>> = {
      'Provider Baseline': [
        {
          title: 'Collect Provider Demographics',
          description: 'Gather basic provider information including name, address, contact details',
          priority: 'high',
          dueInDays: 3
        },
        {
          title: 'Verify Professional License',
          description: 'Verify provider license status and expiration date',
          priority: 'high',
          dueInDays: 5
        },
        {
          title: 'Background Check',
          description: 'Complete background verification process',
          priority: 'medium',
          dueInDays: 10
        }
      ],
      'Medicare Enrollment': [
        {
          title: 'Submit Medicare Application',
          description: 'Complete and submit Medicare provider enrollment application',
          priority: 'high',
          dueInDays: 7
        },
        {
          title: 'NPI Verification',
          description: 'Verify National Provider Identifier (NPI) number',
          priority: 'high',
          dueInDays: 3
        }
      ],
      'AHCCCS Enrollment': [
        {
          title: 'Submit AHCCCS Application',
          description: 'Complete Arizona Medicaid provider enrollment',
          priority: 'high',
          dueInDays: 14
        },
        {
          title: 'AHCCCS Site Visit',
          description: 'Schedule and complete required site visit',
          priority: 'medium',
          dueInDays: 21
        }
      ],
      'PTPN Application': [
        {
          title: 'Submit PTPN Application',
          description: 'Complete Provider Training and Practice Network application',
          priority: 'medium',
          dueInDays: 10
        },
        {
          title: 'Attach Approval Evidence',
          description: 'Upload PTPN approval documentation',
          priority: 'high',
          dueInDays: 5
        }
      ]
    };

    return taskTemplates[subflowName] || [];
  }

  // Tasks
  static async getTasks(filters?: {
    workflowId?: string;
    subflowId?: string;
    providerId?: string;
    status?: string | string[];
    assignedTo?: string;
  }): Promise<Task[]> {
    if (!supabase) return [];
    let query = supabase
      .from('tasks')
      .select(`
        *,
        workflow:workflows(*),
        subflow:subflows(*),
        provider:providers(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.workflowId) {
      query = query.eq('workflow_id', filters.workflowId);
    }
    if (filters?.subflowId) {
      query = query.eq('subflow_id', filters.subflowId);
    }
    if (filters?.providerId) {
      query = query.eq('provider_id', filters.providerId);
    }
    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error} = await query;
    if (error) throw error;
    return data || [];
  }

  static async getTask(id: string): Promise<Task | null> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        workflow:workflows(*),
        subflow:subflows(*),
        provider:providers(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select(`
        *,
        workflow:workflows(*),
        subflow:subflows(*),
        provider:providers(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        workflow:workflows(*),
        subflow:subflows(*),
        provider:providers(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Payers
  static async getPayers(organizationId?: string): Promise<Payer[]> {
    if (!supabase) return [];
    let query = supabase
      .from('payers')
      .select(`
        *,
        organization:organizations(*)
      `)
      .order('name');

    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getPayer(payerId: string): Promise<Payer | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('payers')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', payerId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createPayer(payer: Omit<Payer, 'id' | 'created_at' | 'updated_at'>): Promise<Payer> {
    if (!supabase) throw new Error('Supabase not configured');

    if (!payer.organization_id || payer.organization_id === 'current-org-id') {
      const user = await this.getCurrentUser();
      if (user) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (membership) {
          payer.organization_id = membership.organization_id;
        }
      }
    }

    const { data, error } = await supabase
      .from('payers')
      .insert(payer)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePayer(id: string, updates: Partial<Payer>): Promise<Payer> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('payers')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePayer(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('payers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Provider Payer Applications
  static async getProviderPayerApplications(filters?: {
    providerId?: string;
    payerId?: string;
  }): Promise<ProviderPayerApplication[]> {
    if (!supabase) return [];
    let query = supabase
      .from('provider_payer_applications')
      .select(`
        *,
        provider:providers(*),
        payer:payers(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.providerId) {
      query = query.eq('provider_id', filters.providerId);
    }
    if (filters?.payerId) {
      query = query.eq('payer_id', filters.payerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createProviderPayerApplication(
    application: Omit<ProviderPayerApplication, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ProviderPayerApplication> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('provider_payer_applications')
      .insert(application)
      .select(`
        *,
        provider:providers(*),
        payer:payers(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProviderPayerApplication(
    id: string,
    updates: Partial<ProviderPayerApplication>
  ): Promise<ProviderPayerApplication> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('provider_payer_applications')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        provider:providers(*),
        payer:payers(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Location Payer Applications
  static async getLocationPayerApplications(filters?: {
    locationId?: string;
    payerId?: string;
  }): Promise<LocationPayerApplication[]> {
    if (!supabase) return [];
    let query = supabase
      .from('location_payer_applications')
      .select(`
        *,
        location:locations(*),
        payer:payers(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.locationId) {
      query = query.eq('location_id', filters.locationId);
    }
    if (filters?.payerId) {
      query = query.eq('payer_id', filters.payerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async createLocationPayerApplication(
    application: Omit<LocationPayerApplication, 'id' | 'created_at' | 'updated_at'>
  ): Promise<LocationPayerApplication> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('location_payer_applications')
      .insert(application)
      .select(`
        *,
        location:locations(*),
        payer:payers(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async updateLocationPayerApplication(
    id: string,
    updates: Partial<LocationPayerApplication>
  ): Promise<LocationPayerApplication> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('location_payer_applications')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        location:locations(*),
        payer:payers(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // Workflow Instances
  static async getWorkflowInstances(filters?: {
    organizationId?: string;
    entityType?: 'provider' | 'location';
    entityId?: string;
    status?: string;
    workflowTemplateId?: string;
  }): Promise<WorkflowInstance[]> {
    if (!supabase) return [];
    let query = supabase
      .from('workflow_instances')
      .select(`
        *,
        workflow_template:workflows(*)
      `)
      .order('started_at', { ascending: false });

    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId);
    }
    if (filters?.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters?.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.workflowTemplateId) {
      query = query.eq('workflow_template_id', filters.workflowTemplateId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Fetch related providers and locations separately
    const instances = data || [];

    const providerIds = instances
      .filter(i => i.entity_type === 'provider')
      .map(i => i.entity_id);
    const locationIds = instances
      .filter(i => i.entity_type === 'location')
      .map(i => i.entity_id);

    let providers: Provider[] = [];
    let locations: Location[] = [];

    if (providerIds.length > 0) {
      const { data: providerData } = await supabase
        .from('providers')
        .select('*')
        .in('id', providerIds);
      providers = providerData || [];
    }

    if (locationIds.length > 0) {
      const { data: locationData } = await supabase
        .from('locations')
        .select('*')
        .in('id', locationIds);
      locations = locationData || [];
    }

    // Attach providers and locations to instances
    return instances.map(instance => {
      if (instance.entity_type === 'provider') {
        instance.provider = providers.find(p => p.id === instance.entity_id);
      } else if (instance.entity_type === 'location') {
        instance.location = locations.find(l => l.id === instance.entity_id);
      }
      return instance;
    });
  }

  static async createWorkflowInstance(
    instance: Omit<WorkflowInstance, 'id' | 'created_at' | 'updated_at'>
  ): Promise<WorkflowInstance> {
    if (!supabase) throw new Error('Supabase not configured');

    // Get current user's organization if not provided
    if (!instance.organization_id || instance.organization_id === 'current-org-id') {
      const user = await this.getCurrentUser();
      if (user) {
        const { data: membership } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (membership) {
          instance.organization_id = membership.organization_id;
        }
      }
    }

    const { data, error } = await supabase
      .from('workflow_instances')
      .insert(instance)
      .select(`
        *,
        workflow_template:workflows(*)
      `)
      .single();

    if (error) throw error;

    // Fetch the related provider or location
    if (data.entity_type === 'provider') {
      const { data: provider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', data.entity_id)
        .single();
      data.provider = provider;
    } else if (data.entity_type === 'location') {
      const { data: location } = await supabase
        .from('locations')
        .select('*')
        .eq('id', data.entity_id)
        .single();
      data.location = location;
    }

    return data;
  }

  static async updateWorkflowInstance(
    id: string,
    updates: Partial<WorkflowInstance>
  ): Promise<WorkflowInstance> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('workflow_instances')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        workflow_template:workflows(*)
      `)
      .single();

    if (error) throw error;

    // Fetch the related provider or location
    if (data.entity_type === 'provider') {
      const { data: provider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', data.entity_id)
        .single();
      data.provider = provider;
    } else if (data.entity_type === 'location') {
      const { data: location } = await supabase
        .from('locations')
        .select('*')
        .eq('id', data.entity_id)
        .single();
      data.location = location;
    }

    return data;
  }

  // Create a workflow instance with subflows and tasks
  static async instantiateWorkflow(
    workflowTemplateId: string,
    entityType: 'provider' | 'location',
    entityId: string
  ): Promise<WorkflowInstance> {
    if (!supabase) throw new Error('Supabase not configured');

    try {
      // Get the workflow template
      const { data: template, error: templateError } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowTemplateId)
        .single();

      if (templateError || !template) throw templateError || new Error('Template not found');

      // Create the workflow instance
      const instance = await this.createWorkflowInstance({
        workflow_template_id: workflowTemplateId,
        entity_type: entityType,
        entity_id: entityId,
        status: 'active',
        started_at: new Date().toISOString(),
        progress_percentage: 0,
        organization_id: template.organization_id
      });

      // Get subflows for this workflow template
      const { data: templateSubflows } = await supabase
        .from('subflows')
        .select('*')
        .eq('workflow_id', workflowTemplateId)
        .is('instance_id', null)
        .order('order_index');

      // Create instance subflows
      if (templateSubflows && templateSubflows.length > 0) {
        for (const templateSubflow of templateSubflows) {
          const { data: instanceSubflow } = await supabase
            .from('subflows')
            .insert({
              workflow_id: workflowTemplateId,
              instance_id: instance.id,
              name: templateSubflow.name,
              purpose: templateSubflow.purpose,
              prerequisites: templateSubflow.prerequisites,
              dependencies: templateSubflow.dependencies,
              exit_condition: templateSubflow.exit_condition,
              status: 'not_started',
              order_index: templateSubflow.order_index
            })
            .select()
            .single();

          // Check if prerequisites are met to start this subflow
          if (instanceSubflow) {
            const prereqsMet = await this.checkSubflowPrerequisites(
              instanceSubflow.id,
              entityType === 'provider' ? entityId : undefined
            );

            if (prereqsMet) {
              await this.emitSubflowTasks(
                instanceSubflow.id,
                entityType === 'provider' ? entityId : undefined
              );
            }
          }
        }
      }

      return instance;
    } catch (error) {
      console.error('Error instantiating workflow:', error);
      throw error;
    }
  }

  // Dashboard statistics
  static async getDashboardStats(organizationId?: string): Promise<{
    totalProviders: number;
    activeWorkflows: number;
    completedTasks: number;
    pendingTasks: number;
  }> {
    if (!supabase) {
      return {
        totalProviders: 0,
        activeWorkflows: 0,
        completedTasks: 0,
        pendingTasks: 0
      };
    }

    // Build queries conditionally based on organizationId
    let providersQuery = supabase
      .from('providers')
      .select('id', { count: 'exact' });
    
    let workflowsQuery = supabase
      .from('workflows')
      .select('id', { count: 'exact' })
      .eq('status', 'active');
    
    // Only apply organization filter if organizationId is provided
    if (organizationId) {
      providersQuery = providersQuery.eq('organization_id', organizationId);
      workflowsQuery = workflowsQuery.eq('organization_id', organizationId);
    }
    
    const [providersResult, workflowsResult, completedTasksResult, pendingTasksResult] = await Promise.all([
      providersQuery,
      workflowsQuery,
      supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('status', 'completed'),
      supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('status', 'pending')
    ]);

    return {
      totalProviders: providersResult.count || 0,
      activeWorkflows: workflowsResult.count || 0,
      completedTasks: completedTasksResult.count || 0,
      pendingTasks: pendingTasksResult.count || 0
    };
  }

  static async createSubflowFromPayer(payer: Payer): Promise<Subflow> {
    if (!supabase) throw new Error('Supabase not configured');

    // Build prerequisites from dependent payers
    const prerequisites = payer.dependent_on_payer_ids && payer.dependent_on_payer_ids.length > 0
      ? JSON.stringify(payer.dependent_on_payer_ids.map(id => `payer_approved:${id}`))
      : '[]';

    // Create the subflow
    const subflowData = {
      workflow_id: null,
      name: `${payer.name} Application Process`,
      purpose: `Complete application process for ${payer.name} credentialing`,
      prerequisites: prerequisites,
      dependencies: payer.dependent_on_payer_ids && payer.dependent_on_payer_ids.length > 0
        ? `Requires: ${payer.dependent_on_payer_ids.length} payer(s) to be approved first`
        : 'No dependencies',
      exit_condition: 'Provider loaded in system',
      status: 'not_started' as const,
      order_index: payer.priority_base || 100,
      is_template: true,
      payer_id: payer.id
    };

    const { data: subflow, error: subflowError } = await supabase
      .from('subflows')
      .insert(subflowData)
      .select()
      .single();

    if (subflowError) throw subflowError;

    // Create payer_subflows link
    const { error: linkError } = await supabase
      .from('payer_subflows')
      .insert({
        payer_id: payer.id,
        subflow_id: subflow.id,
        is_primary: true
      });

    if (linkError) throw linkError;

    // Create task templates
    await this.createTaskTemplatesForPayer(payer, subflow.id);

    return subflow;
  }

  static async createTaskTemplatesForPayer(payer: Payer, subflowId?: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const templates: Omit<PayerTaskTemplate, 'id' | 'created_at' | 'updated_at'>[] = [];

    // Create document tasks
    if (payer.required_documents && payer.required_documents.length > 0) {
      for (const doc of payer.required_documents) {
        templates.push({
          payer_id: payer.id,
          title_template: `Obtain ${doc}`,
          description_template: `Collect ${doc} document required for ${payer.name} application`,
          task_type: 'document',
          trigger_condition: 'on_provider_assign',
          priority_modifier: 0,
          due_date_offset_days: null
        });
      }
    }

    // Create provider info task
    if (payer.required_provider_fields && payer.required_provider_fields.length > 0) {
      templates.push({
        payer_id: payer.id,
        title_template: `Complete Provider Information for ${payer.name}`,
        description_template: `Ensure the following fields are completed: ${payer.required_provider_fields.join(', ')}`,
        task_type: 'info',
        trigger_condition: 'on_provider_assign',
        priority_modifier: -10,
        due_date_offset_days: null
      });
    }

    // Create submission task
    templates.push({
      payer_id: payer.id,
      title_template: `Submit ${payer.name} Application`,
      description_template: `Submit completed application to ${payer.name}`,
      task_type: 'submit',
      trigger_condition: 'prerequisites_met',
      priority_modifier: 5,
      due_date_offset_days: null
    });

    // Create "Attach Approval Evidence" task (triggered by submit completion)
    templates.push({
      payer_id: payer.id,
      title_template: `Attach Approval Evidence for ${payer.name}`,
      description_template: `Upload or attach evidence of ${payer.name} application approval`,
      task_type: 'document',
      trigger_condition: 'on_task_complete:submit',
      parent_task_type: 'submit',
      priority_modifier: 8,
      due_date_offset_days: null,
      prevents_duplication: true
    });

    // Create approval tracking task
    templates.push({
      payer_id: payer.id,
      title_template: `Track ${payer.name} Approval`,
      description_template: `Monitor approval status for ${payer.name} application`,
      task_type: 'approval',
      trigger_condition: 'on_submission',
      priority_modifier: 10,
      due_date_offset_days: payer.days_to_approve || 30,
      prevents_duplication: true
    });

    // Create "Enter Provider in Prompt" task (triggered by approval)
    templates.push({
      payer_id: payer.id,
      title_template: `Enter Provider Information in Prompt for ${payer.name}`,
      description_template: `Update provider credentialing status in EMR system for ${payer.name}`,
      task_type: 'loading',
      trigger_condition: 'on_approval',
      priority_modifier: 12,
      due_date_offset_days: null,
      prevents_duplication: true
    });

    // Create loading task
    templates.push({
      payer_id: payer.id,
      title_template: `Confirm ${payer.name} Loading`,
      description_template: `Verify provider is loaded in ${payer.name} system`,
      task_type: 'loading',
      trigger_condition: 'on_approval',
      priority_modifier: 15,
      due_date_offset_days: payer.days_to_load || 60,
      prevents_duplication: true
    });

    const { error } = await supabase
      .from('payer_task_templates')
      .insert(templates);

    if (error) throw error;
  }

  static async getPayerTaskTemplates(payerId: string): Promise<PayerTaskTemplate[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('payer_task_templates')
      .select('*')
      .eq('payer_id', payerId);

    if (error) throw error;
    return data || [];
  }

  static async getPayerSubflow(payerId: string): Promise<Subflow | null> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('payer_subflows')
      .select(`
        subflow:subflows(*)
      `)
      .eq('payer_id', payerId)
      .eq('is_primary', true)
      .maybeSingle();

    if (error) throw error;
    return data?.subflow || null;
  }

  static async handleApplicationStatusChange(
    applicationId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    // Get the application with related data
    const { data: application, error } = await supabase
      .from('provider_payer_applications')
      .select(`
        *,
        payer:payers(*),
        provider:providers(*)
      `)
      .eq('id', applicationId)
      .single();

    if (error || !application) return;

    // Import services dynamically to avoid circular dependency
    const { TaskGenerationService } = await import('../services/TaskGenerationService');
    const { DynamicTaskUpdateService } = await import('../services/DynamicTaskUpdateService');

    // Auto-complete submit task if submission date is entered
    if (application.application_submission_date) {
      await DynamicTaskUpdateService.checkAndAutoCompleteSubmitTask(
        application.provider_id,
        application.payer_id,
        application.application_submission_date
      );
    }

    // Generate new tasks based on status change
    if (newStatus === 'submitted' && oldStatus === 'not_started') {
      // Create approval tracking task
      await TaskGenerationService.generateTasksForProviderPayer(
        application.provider,
        application.payer,
        application
      );
    } else if (newStatus === 'approved' && oldStatus === 'submitted') {
      // Create loading task and check dependent payers
      await TaskGenerationService.generateTasksForProviderPayer(
        application.provider,
        application.payer,
        application
      );

      // Check if any other payers can now be submitted
      await this.checkAndUnlockDependentPayers(application.provider.id, application.payer_id);
    }
  }

  private static async checkAndUnlockDependentPayers(providerId: string, approvedPayerId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    // Find all payers that depend on this one
    const { data: dependentPayers } = await supabase
      .from('payers')
      .select('*')
      .contains('dependent_on_payer_ids', [approvedPayerId]);

    if (!dependentPayers || dependentPayers.length === 0) return;

    const provider = await this.getProvider(providerId);
    if (!provider) return;

    // Import TaskGenerationService
    const { TaskGenerationService } = await import('../services/TaskGenerationService');

    // For each dependent payer, check if all prerequisites are now met
    for (const payer of dependentPayers) {
      const application = await supabase
        .from('provider_payer_applications')
        .select('*')
        .eq('provider_id', providerId)
        .eq('payer_id', payer.id)
        .maybeSingle();

      if (application.data && application.data.status === 'not_started') {
        // Generate submission tasks if prerequisites are now met
        await TaskGenerationService.generateTasksForProviderPayer(
          provider,
          payer,
          application.data
        );
      }
    }
  }

  static async getPriorityRules(organizationId: string): Promise<PriorityRule[]> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('priority_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  static async createPriorityRule(rule: Omit<PriorityRule, 'id' | 'created_at' | 'updated_at'>): Promise<PriorityRule> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('priority_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePriorityRule(id: string, updates: Partial<PriorityRule>): Promise<PriorityRule> {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase
      .from('priority_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deletePriorityRule(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase
      .from('priority_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}