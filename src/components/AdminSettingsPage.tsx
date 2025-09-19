import React, { useState, useEffect } from 'react';
import { Settings, Plus, Database, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'email' | 'tel';
  required: boolean;
  table_name: string;
  created_at: string;
}

export const AdminSettingsPage: React.FC = () => {
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text' as const,
    required: false,
    table_name: 'providers' as const
  });

  useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('created_at');

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load custom fields:', error);
        throw error;
      }

      setCustomFields(data || []);
    } catch (err) {
      console.error('Failed to load custom fields:', err);
      // Don't show error if table doesn't exist yet
      setCustomFields([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
  };

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.label) {
      showMessage('Field name and label are required', 'error');
      return;
    }

    try {
      setLoading(true);

      const columnName = formData.name.toLowerCase().replace(/\s+/g, '_');
      const columnType = getPostgresType(formData.type);

      // Add the actual column to the target table
      const { error: alterError } = await supabase.rpc('add_custom_column', {
        p_table_name: formData.table_name,
        p_column_name: columnName,
        p_column_type: columnType,
        p_is_required: formData.required
      });

      if (alterError) throw alterError;

      // Add the field configuration
      const { data: fieldData, error: fieldError } = await supabase
        .from('custom_fields')
        .insert({
          name: columnName,
          label: formData.label,
          type: formData.type,
          required: formData.required,
          table_name: formData.table_name
        })
        .select()
        .single();

      if (fieldError) {
        // If field config fails, try to remove the column
        try {
          await supabase.rpc('drop_custom_column', {
            p_table_name: formData.table_name,
            p_column_name: columnName
          });
        } catch (cleanupError) {
          console.error('Failed to cleanup column after error:', cleanupError);
        }
        throw fieldError;
      }

      setCustomFields(prev => [...prev, fieldData]);
      setShowAddForm(false);
      setFormData({ name: '', label: '', type: 'text', required: false, table_name: 'providers' });
      showMessage('Field added successfully! The new field will appear in forms immediately.', 'success');

    } catch (err) {
      console.error('Failed to add field:', err);
      showMessage(err instanceof Error ? err.message : 'Failed to add field', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (field: CustomField) => {
    if (!confirm(`Are you sure you want to delete the field "${field.label}"? This will permanently remove the column and all its data. This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      // Remove the column from the target table
      const { error: alterError } = await supabase.rpc('drop_custom_column', {
        p_table_name: field.table_name,
        p_column_name: field.name
      });

      if (alterError) throw alterError;

      // Remove the field configuration
      const { error: deleteError } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', field.id);

      if (deleteError) {
        // If config deletion fails, we should probably leave the column
        console.error('Failed to delete field config, but column was removed:', deleteError);
        showMessage('Column was removed but configuration cleanup failed. Please refresh the page.', 'error');
        return;
      }

      setCustomFields(prev => prev.filter(f => f.id !== field.id));
      showMessage('Field deleted successfully! The field has been removed from all forms.', 'success');

    } catch (err) {
      console.error('Failed to delete field:', err);
      showMessage(err instanceof Error ? err.message : 'Failed to delete field', 'error');
    } finally {
      setLoading(false);
    }
  };
          p_table_name: formData.table_name,
          p_column_name: columnName
        });
        throw fieldError;
      }

      setCustomFields(prev => [...prev, fieldData]);
      setShowAddForm(false);
      setFormData({ name: '', label: '', type: 'text', required: false, table_name: 'providers' });
      showMessage('Field added successfully! Please refresh the page to see changes in forms.', 'success');

    } catch (err) {
      console.error('Failed to add field:', err);
      showMessage(err instanceof Error ? err.message : 'Failed to add field', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (field: CustomField) => {
    if (!confirm(`Are you sure you want to delete the field "${field.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);

      // Remove the column from the target table
      const { error: alterError } = await supabase.rpc('drop_custom_column', {
        p_table_name: field.table_name,
        p_column_name: field.name
      });

      if (alterError) throw alterError;

      // Remove the field configuration
      const { error: deleteError } = await supabase
        .from('custom_fields')
        .delete()
        .eq('id', field.id);

      if (deleteError) throw deleteError;

      setCustomFields(prev => prev.filter(f => f.id !== field.id));
      showMessage('Field deleted successfully! Please refresh the page to see changes.', 'success');

    } catch (err) {
      console.error('Failed to delete field:', err);
      showMessage(err instanceof Error ? err.message : 'Failed to delete field', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getPostgresType = (type: string): string => {
    switch (type) {
      case 'number': return 'integer';
      case 'date': return 'date';
      case 'email':
      case 'tel':
      case 'text':
      default: return 'text';
    }
  };

  const getTableDisplayName = (tableName: string): string => {
    switch (tableName) {
      case 'providers': return 'Providers';
      case 'locations': return 'Locations';
      case 'workflows': return 'Workflows';
      case 'tasks': return 'Tasks';
      default: return tableName;
    }
  };

  const groupedFields = customFields.reduce((acc, field) => {
    if (!acc[field.table_name]) {
      acc[field.table_name] = [];
    }
    acc[field.table_name].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  if (loading && customFields.length === 0) {
    return (
      <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 dark:bg-gray-700 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-navy/10 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Admin Settings</h1>
          <p className="text-navy/70 dark:text-gray-300">Manage custom fields and system configuration</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Custom Field
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
          <span className="text-red-800 dark:text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
          <span className="text-green-800 dark:text-green-400">{success}</span>
        </div>
      )}

      {/* Custom Fields by Table */}
      <div className="space-y-6">
        {Object.keys(groupedFields).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600">
            <div className="p-6 border-b border-navy/10 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-navy dark:text-white flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Custom Fields
              </h2>
              <p className="text-navy/60 dark:text-gray-400 mt-1">
                Add custom fields to database tables
              </p>
            </div>
            <div className="p-8 text-center">
              <Settings className="h-12 w-12 text-navy/30 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No custom fields</h3>
              <p className="text-navy/60 dark:text-gray-400">
                Get started by adding your first custom field to any table
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedFields).map(([tableName, fields]) => (
            <div key={tableName} className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600">
              <div className="p-6 border-b border-navy/10 dark:border-gray-600">
                <h2 className="text-xl font-semibold text-navy dark:text-white flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  {getTableDisplayName(tableName)} Custom Fields
                </h2>
                <p className="text-navy/60 dark:text-gray-400 mt-1">
                  Custom fields added to the {tableName} table
                </p>
              </div>
              <div className="divide-y divide-navy/10 dark:divide-gray-600">
                {fields.map((field) => (
                  <div key={field.id} className="p-6 hover:bg-navy/5 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-navy dark:text-white">{field.label}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {field.type}
                          </span>
                          {field.required && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              Required
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-navy/70 dark:text-gray-300">
                          <span className="font-medium">Database Column:</span> {field.name}
                        </div>
                        <div className="text-sm text-navy/50 dark:text-gray-400">
                          Added {new Date(field.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteField(field)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete Field"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add Field Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Add Custom Field</h2>
              <p className="text-navy/60 dark:text-gray-400 text-sm mt-1">
                This will add a new column to the selected table
              </p>
            </div>
            
            <form onSubmit={handleAddField} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Table *</label>
                <select
                  value={formData.table_name}
                  onChange={(e) => setFormData({ ...formData, table_name: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                >
                  <option value="providers">Providers</option>
                  <option value="locations">Locations</option>
                  <option value="workflows">Workflows</option>
                  <option value="tasks">Tasks</option>
                </select>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Field Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., NPI Number"
                />
                <p className="text-xs text-navy/50 dark:text-gray-400 mt-1">
                  Database column: {formData.name.toLowerCase().replace(/\s+/g, '_') || 'field_name'}
                </p>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Display Label *</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  placeholder="e.g., NPI Number"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Field Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="required" className="text-navy dark:text-white">
                  Required field
                </label>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                  <strong>Warning:</strong> Adding custom fields modifies the database schema. 
                  This action cannot be easily undone. Make sure to test thoroughly.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-navy dark:text-white border border-navy/20 dark:border-gray-600 rounded-lg hover:bg-navy/5 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy dark:text-navy rounded-lg font-medium"
                >
                  {loading ? 'Adding...' : 'Add Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};