import { supabase } from './supabase';

/**
 * Database Connection and Schema Verification
 * This module provides functions to test database connectivity and verify schema structure
 */

export class DatabaseDiagnostics {
  /**
   * Test basic database connection
   */
  static async testConnection(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('count')
        .limit(1);
      
      if (error) {
        return {
          success: false,
          message: 'Database connection failed',
          details: error
        };
      }
      
      return {
        success: true,
        message: 'Database connection successful',
        details: { recordCount: data?.length || 0 }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        details: error
      };
    }
  }

  /**
   * Verify all required tables exist and have data
   */
  static async verifySchema(): Promise<{ success: boolean; message: string; details: any }> {
    const tables = ['organizations', 'locations', 'providers', 'workflows', 'tasks', 'users'];
    const results: any = {};
    
    try {
      for (const table of tables) {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact' })
          .limit(1);
        
        results[table] = {
          exists: !error,
          hasData: (count || 0) > 0,
          recordCount: count || 0,
          error: error?.message
        };
      }
      
      const allTablesExist = Object.values(results).every((r: any) => r.exists);
      const hasData = Object.values(results).some((r: any) => r.hasData);
      
      return {
        success: allTablesExist,
        message: allTablesExist 
          ? (hasData ? 'Schema verified with data' : 'Schema exists but no data found')
          : 'Some tables are missing',
        details: results
      };
    } catch (error) {
      return {
        success: false,
        message: 'Schema verification failed',
        details: { error }
      };
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<{ success: boolean; stats: any; message: string }> {
    try {
      const [orgs, locations, providers, workflows, tasks] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact' }),
        supabase.from('locations').select('*', { count: 'exact' }),
        supabase.from('providers').select('*', { count: 'exact' }),
        supabase.from('workflows').select('*', { count: 'exact' }),
        supabase.from('tasks').select('*', { count: 'exact' })
      ]);

      const stats = {
        organizations: orgs.count || 0,
        locations: locations.count || 0,
        providers: providers.count || 0,
        workflows: workflows.count || 0,
        tasks: tasks.count || 0,
        totalRecords: (orgs.count || 0) + (locations.count || 0) + (providers.count || 0) + (workflows.count || 0) + (tasks.count || 0)
      };

      return {
        success: true,
        stats,
        message: `Database contains ${stats.totalRecords} total records across ${Object.keys(stats).length - 1} tables`
      };
    } catch (error) {
      return {
        success: false,
        stats: {},
        message: 'Failed to retrieve database statistics'
      };
    }
  }

  /**
   * Test sample queries to verify relationships
   */
  static async testRelationships(): Promise<{ success: boolean; message: string; details: any }> {
    try {
      // Test provider with location and organization
      const { data: providerData, error: providerError } = await supabase
        .from('providers')
        .select(`
          *,
          organization:organizations(*),
          location:locations(*)
        `)
        .limit(1);

      // Test tasks with workflow and provider
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          workflow:workflows(*),
          provider:providers(*)
        `)
        .limit(1);

      const results = {
        providerRelationships: {
          success: !providerError,
          hasData: (providerData?.length || 0) > 0,
          error: providerError?.message
        },
        taskRelationships: {
          success: !taskError,
          hasData: (taskData?.length || 0) > 0,
          error: taskError?.message
        }
      };

      const allSuccess = Object.values(results).every((r: any) => r.success);

      return {
        success: allSuccess,
        message: allSuccess ? 'All relationships working correctly' : 'Some relationship queries failed',
        details: results
      };
    } catch (error) {
      return {
        success: false,
        message: 'Relationship testing failed',
        details: { error }
      };
    }
  }

  /**
   * Run complete database diagnostics
   */
  static async runFullDiagnostics(): Promise<{
    connection: any;
    schema: any;
    stats: any;
    relationships: any;
    overall: { success: boolean; message: string };
  }> {
    console.log('🔍 Running database diagnostics...');
    
    const connection = await this.testConnection();
    console.log('📡 Connection test:', connection.success ? '✅' : '❌', connection.message);
    
    const schema = await this.verifySchema();
    console.log('🗄️ Schema verification:', schema.success ? '✅' : '❌', schema.message);
    
    const stats = await this.getDatabaseStats();
    console.log('📊 Database stats:', stats.success ? '✅' : '❌', stats.message);
    
    const relationships = await this.testRelationships();
    console.log('🔗 Relationships test:', relationships.success ? '✅' : '❌', relationships.message);
    
    const overallSuccess = connection.success && schema.success && stats.success && relationships.success;
    
    return {
      connection,
      schema,
      stats,
      relationships,
      overall: {
        success: overallSuccess,
        message: overallSuccess 
          ? 'Database is fully operational with sample data' 
          : 'Database has issues that need attention'
      }
    };
  }
}