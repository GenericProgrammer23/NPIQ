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
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Task {
  id: string;
  workflow_id?: string;
  subflow_id?: string;
  provider_id?: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  workflow?: Workflow;
  subflow?: Subflow;
  provider?: Provider;
}

export interface Subflow {
  id: string;
  workflow_id: string;
  name: string;
  purpose?: string;
  prerequisites: string;
  dependencies: string;
  exit_condition: string;
  status: 'not_started' | 'in_progress' | 'complete';
  order_index: number;
  created_at: string;
  updated_at: string;
  workflow?: Workflow;
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
      const { data, error } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (error) {
        console.error('Error checking user organizations:', error);
        return false;
      }
      
      console.log('Organization check result:', data);
      return !error && (data?.length || 0) > 0;
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
  static async getWorkflows(organizationId?: string): Promise<Workflow[]> {
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

    const { data, error } = await query;
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
    status?: string;
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
      query = query.eq('status', filters.status);
    }
    if (filters?.assignedTo) {
      query = query.eq('assigned_to', filters.assignedTo);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
}