import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('temp_supabase_url');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('temp_supabase_key');

// NEW: add this just below the two lines above
const supabaseSchema = (import.meta.env.VITE_DB_SCHEMA ?? 'public').trim();


// Create Supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      db: { schema: supabaseSchema },
    })
  : null;

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
  provider?: Provider;
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
    
    const { data, error } = await supabase
      .from('providers')
      .insert(provider)
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
    const { data, error } = await supabase
      .from('providers')
      .update(updates)
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

  // Tasks
  static async getTasks(filters?: {
    workflowId?: string;
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
        provider:providers(*)
      `)
      .order('created_at', { ascending: false });

    if (filters?.workflowId) {
      query = query.eq('workflow_id', filters.workflowId);
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
        provider:providers(*)
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