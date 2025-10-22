import { DatabaseService as SupabaseService } from './supabase';
import { LocalDBService, getLocalDB } from './localdb';
import type { Provider, Location, Payer, Workflow, Task, ProviderPayerApplication } from './supabase';

const USE_LOCAL_DB = import.meta.env.VITE_USE_LOCAL_DB === 'true';

export const DatabaseAdapter = {
  isLocalMode: () => USE_LOCAL_DB,

  // Providers
  async getProviders(organizationId?: string): Promise<Provider[]> {
    if (USE_LOCAL_DB) {
      const rows = await LocalDBService.getProviders();
      return rows as any[];
    }
    return SupabaseService.getProviders(organizationId);
  },

  async getProvider(id: string): Promise<Provider | null> {
    if (USE_LOCAL_DB) {
      const row = await LocalDBService.getProvider(id);
      return row as any;
    }
    return SupabaseService.getProvider(id);
  },

  async createProvider(provider: any): Promise<Provider> {
    if (USE_LOCAL_DB) {
      const row = await LocalDBService.createProvider(provider);
      return row as any;
    }
    return SupabaseService.createProvider(provider);
  },

  async updateProvider(id: string, updates: any): Promise<Provider> {
    if (USE_LOCAL_DB) {
      const db = getLocalDB();
      if (!db) throw new Error('Database not initialized');

      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      const result = await db.execute({
        sql: `UPDATE providers SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
        args: [...values, id]
      });
      return result.rows[0] as any;
    }
    return SupabaseService.updateProvider(id, updates);
  },

  // Locations
  async getLocations(organizationId?: string): Promise<Location[]> {
    if (USE_LOCAL_DB) {
      const rows = await LocalDBService.getLocations();
      return rows as any[];
    }
    return SupabaseService.getLocations(organizationId);
  },

  async createLocation(location: any): Promise<Location> {
    if (USE_LOCAL_DB) {
      const db = getLocalDB();
      if (!db) throw new Error('Database not initialized');

      const result = await db.execute({
        sql: `INSERT INTO locations (organization_id, name, address, phone_number, departments, status)
              VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
        args: [
          location.organization_id || 'default-org-id',
          location.name,
          location.address,
          location.phone_number,
          location.departments || 1,
          location.status || 'active'
        ]
      });
      return result.rows[0] as any;
    }
    return SupabaseService.createLocation(location);
  },

  async updateLocation(id: string, updates: any): Promise<Location> {
    if (USE_LOCAL_DB) {
      const db = getLocalDB();
      if (!db) throw new Error('Database not initialized');

      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      const result = await db.execute({
        sql: `UPDATE locations SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
        args: [...values, id]
      });
      return result.rows[0] as any;
    }
    return SupabaseService.updateLocation(id, updates);
  },

  // Payers
  async getPayers(organizationId?: string): Promise<Payer[]> {
    if (USE_LOCAL_DB) {
      const rows = await LocalDBService.getPayers();
      return rows as any[];
    }
    return SupabaseService.getPayers(organizationId);
  },

  async createPayer(payer: any): Promise<Payer> {
    if (USE_LOCAL_DB) {
      const db = getLocalDB();
      if (!db) throw new Error('Database not initialized');

      const result = await db.execute({
        sql: `INSERT INTO payers (organization_id, name, type, contact_email, contact_phone, notes)
              VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
        args: [
          payer.organization_id || 'default-org-id',
          payer.name,
          payer.type,
          payer.contact_email,
          payer.contact_phone,
          payer.notes
        ]
      });
      return result.rows[0] as any;
    }
    return SupabaseService.createPayer(payer);
  },

  // Provider Payer Applications
  async getProviderPayerApplications(filters: { providerId?: string; payerId?: string }): Promise<ProviderPayerApplication[]> {
    if (USE_LOCAL_DB && filters.providerId) {
      const rows = await LocalDBService.getProviderPayerApplications(filters.providerId);
      return rows.map(row => ({
        ...row,
        payer: row.payer_name ? { name: row.payer_name, type: row.payer_type } : undefined
      })) as any[];
    }
    return SupabaseService.getProviderPayerApplications(filters);
  },

  async updateProviderPayerApplication(id: string, updates: any): Promise<ProviderPayerApplication> {
    if (USE_LOCAL_DB) {
      const row = await LocalDBService.updateProviderPayerApplication(id, updates);
      return row as any;
    }
    return SupabaseService.updateProviderPayerApplication(id, updates);
  },

  // Workflows
  async getWorkflows(organizationId?: string): Promise<Workflow[]> {
    if (USE_LOCAL_DB) {
      const rows = await LocalDBService.getWorkflows();
      return rows as any[];
    }
    return SupabaseService.getWorkflows(organizationId);
  },

  async createWorkflow(workflow: any): Promise<Workflow> {
    if (USE_LOCAL_DB) {
      const db = getLocalDB();
      if (!db) throw new Error('Database not initialized');

      const result = await db.execute({
        sql: `INSERT INTO workflows (organization_id, name, description, type, status, steps)
              VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
        args: [
          workflow.organization_id || 'default-org-id',
          workflow.name,
          workflow.description,
          workflow.type,
          workflow.status || 'draft',
          JSON.stringify(workflow.steps || [])
        ]
      });
      return result.rows[0] as any;
    }
    return SupabaseService.createWorkflow(workflow);
  },

  // Tasks
  async getTasks(filters?: any): Promise<Task[]> {
    if (USE_LOCAL_DB) {
      const rows = await LocalDBService.getTasks();
      return rows as any[];
    }
    return SupabaseService.getTasks(filters);
  },

  async createTask(task: any): Promise<Task> {
    if (USE_LOCAL_DB) {
      const db = getLocalDB();
      if (!db) throw new Error('Database not initialized');

      const result = await db.execute({
        sql: `INSERT INTO tasks (workflow_id, provider_id, subflow_id, title, description, status, priority, due_date)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
        args: [
          task.workflow_id,
          task.provider_id,
          task.subflow_id,
          task.title,
          task.description,
          task.status || 'pending',
          task.priority || 'medium',
          task.due_date
        ]
      });
      return result.rows[0] as any;
    }
    return SupabaseService.createTask(task);
  },

  async updateTask(id: string, updates: any): Promise<Task> {
    if (USE_LOCAL_DB) {
      const db = getLocalDB();
      if (!db) throw new Error('Database not initialized');

      const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const values = Object.values(updates);
      const result = await db.execute({
        sql: `UPDATE tasks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
        args: [...values, id]
      });
      return result.rows[0] as any;
    }
    return SupabaseService.updateTask(id, updates);
  }
};
