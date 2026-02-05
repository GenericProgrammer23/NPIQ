import React, { useState, useEffect } from 'react';
import { Settings, Plus, Database, AlertCircle, CheckCircle, Trash2, Pencil, HardDrive } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { setupDocumentStorage } from '../lib/setupStorage';

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
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [settingUpStorage, setSettingUpStorage] = useState(false);
  const [storageStatus, setStorageStatus] = useState<'unknown' | 'ready' | 'not_ready'>('unknown');

  const [formData, setFormData] = useState({
    name: '',
    label: '',
    type: 'text' as 'text' | 'number' | 'date' | 'email' | 'tel',
    required: false,
    table_name: 'providers' as 'providers' | 'locations' | 'workflows' | 'tasks'
  });

  useEffect(() => {
    loadCustomFields();
    checkStorageStatus();
  }, []);

  const loadCustomFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .order('created_at');

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setCustomFields(data || []);
    } catch (err) {
      setCustomFields([]);
    } finally {
      setLoading(false);
    }
  };

  const checkStorageStatus = async () => {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'provider-documents');
      setStorageStatus(bucketExists ? 'ready' : 'not_ready');
    } catch (err) {
      setStorageStatus('not_ready');
    }
  };

  const handleSetupStorage = async () => {
    setSettingUpStorage(true);
    try {
      const result = await setupDocumentStorage();
      if (result.success) {
        showMessage('Storage bucket created successfully! Document uploads are now enabled.', 'success');
        setStorageStatus('ready');
      } else {
        if ((result as any).requiresManualSetup) {
          showMessage('Please create the storage bucket manually in Supabase Dashboard. See instructions below.', 'error');
        } else {
          showMessage(result.error || 'Failed to setup storage', 'error');
        }
      }
    } catch (err) {
      showMessage('Failed to setup storage bucket', 'error');
    } finally {
      setSettingUpStorage(false);
      await checkStorageStatus();
    }
  };

  const loadAllTableFields = async () => {
    if (!supabase) return;
    
    try {
      const tables = ['providers', 'locations', 'workflows', 'tasks'];
      const allFields: CustomField[] = [];
      
      for (const tableName of tables) {
        try {
          // Get custom field definitions
          const { data: customFieldDefs, error: customError } = await supabase
            .from('custom_fields')
            .select('*')
            .eq('table_name', tableName);
          
          if (customError && customError.code !== 'PGRST116') {
            continue;
          }
          
          // Combine core fields and custom fields
          const coreFields = getCoreFields(tableName);
          const customFields = customFieldDefs || [];
          
          // Add core fields as read-only
          coreFields.forEach(field => {
            allFields.push({
              id: `core_${tableName}_${field.name}`,
              name: field.name,
              label: field.label,
              type: field.type,
              required: field.required,
              table_name: tableName,
              created_at: '',
              is_core: true
            } as CustomField & { is_core: boolean });
          });
          
          // Add custom fields
          customFields.forEach(field => {
            allFields.push({
              ...field,
              is_core: false
            } as CustomField & { is_core: boolean });
          });
        } catch (err) {
          continue;
        }
      }
      
      setCustomFields(allFields);
    } catch {
    }
  };

  const getCoreFields = (tableName: string) => {
    const coreFieldsMap: Record<string, Array<{name: string, label: string, type: string, required: boolean}>> = {
      providers: [
        { name: 'first_name', label: 'First Name', type: 'text', required: true },
        { name: 'last_name', label: 'Last Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: false },
        { name: 'phone', label: 'Phone', type: 'tel', required: false },
        { name: 'specialty', label: 'Specialty', type: 'text', required: false },
        { name: 'license_number', label: 'License Number', type: 'text', required: false },
        { name: 'license_expiry', label: 'License Expiry', type: 'date', required: false },
        { name: 'status', label: 'Status', type: 'text', required: true }
      ],
      locations: [
        { name: 'name', label: 'Location Name', type: 'text', required: true },
        { name: 'address', label: 'Address', type: 'text', required: false },
        { name: 'departments', label: 'Departments', type: 'number', required: false },
        { name: 'status', label: 'Status', type: 'text', required: true }
      ],
      workflows: [
        { name: 'name', label: 'Workflow Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'text', required: false },
        { name: 'type', label: 'Type', type: 'text', required: true },
        { name: 'status', label: 'Status', type: 'text', required: true }
      ],
      tasks: [
        { name: 'title', label: 'Task Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'text', required: false },
        { name: 'status', label: 'Status', type: 'text', required: true },
        { name: 'priority', label: 'Priority', type: 'text', required: true },
        { name: 'due_date', label: 'Due Date', type: 'date', required: false }
      ]
    };
    
    return coreFieldsMap[tableName] || [];
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
        } catch {
        }
        throw fieldError;
      }

      setCustomFields(prev => [...prev, { ...fieldData, is_core: false } as CustomField & { is_core: boolean }]);
      setShowAddForm(false);
      setFormData({ name: '', label: '', type: 'text', required: false, table_name: 'providers' });
      showMessage('Field added successfully! The new field will appear in forms immediately.', 'success');

    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to add field', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditField = (field: CustomField & { is_core?: boolean }) => {
    if (field.is_core) {
      showMessage('Core fields cannot be edited', 'error');
      return;
    }
    
    setEditingField(field);
    setFormData({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      table_name: field.table_name
    });
    setShowEditForm(true);
  };

  const handleUpdateField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;
    
    try {
      setLoading(true);

      // Update the field configuration
      const { data: fieldData, error: fieldError } = await supabase
        .from('custom_fields')
        .update({
          label: formData.label,
          type: formData.type,
          required: formData.required
        })
        .eq('id', editingField.id)
        .select()
        .single();

      if (fieldError) throw fieldError;

      setCustomFields(prev => prev.map(f => 
        f.id === editingField.id ? { ...fieldData, is_core: false } as CustomField & { is_core: boolean } : f
      ));
      setShowEditForm(false);
      setEditingField(null);
      setFormData({ name: '', label: '', type: 'text', required: false, table_name: 'providers' });
      showMessage('Field updated successfully!', 'success');

    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to update field', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteField = async (field: CustomField) => {
    if ((field as any).is_core) {
      showMessage('Core fields cannot be deleted', 'error');
      return;
    }
    
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
        showMessage('Column was removed but configuration cleanup failed. Please refresh the page.', 'error');
        return;
      }

      setCustomFields(prev => prev.filter(f => f.id !== field.id));
      showMessage('Field deleted successfully! The field has been removed from all forms.', 'success');

    } catch (err) {
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
        return 'text';
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
  }, {} as Record<string, (CustomField & { is_core?: boolean })[]>);

  // Load all fields including core fields on mount
  React.useEffect(() => {
    loadAllTableFields();
  }, []);

  if (loading && customFields.length === 0) {
    return (
      <div className="p-6 bg-page-bg dark:bg-navy min-h-screen">
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
    <div className="p-6 bg-page-bg dark:bg-navy min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Admin Settings</h1>
          <p className="text-navy/70 dark:text-cream/70">Manage custom fields and system configuration</p>
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
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600/30 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
          <span className="text-red-800 dark:text-red-400">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-600/30 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
          <span className="text-green-800 dark:text-green-400">{success}</span>
        </div>
      )}

      {/* Storage Setup Section */}
      <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 mb-6">
        <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
          <h2 className="text-xl font-semibold text-navy dark:text-white flex items-center">
            <HardDrive className="h-5 w-5 mr-2" />
            Document Storage
          </h2>
          <p className="text-navy/60 dark:text-cream/60 mt-1">
            Configure storage for provider documents
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-medium text-navy dark:text-white">Storage Bucket Status</h3>
                {storageStatus === 'ready' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Ready
                  </span>
                )}
                {storageStatus === 'not_ready' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Not Configured
                  </span>
                )}
                {storageStatus === 'unknown' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    Checking...
                  </span>
                )}
              </div>
              <p className="text-sm text-navy/70 dark:text-cream/70">
                {storageStatus === 'ready' && 'Document uploads are enabled and ready to use.'}
                {storageStatus === 'not_ready' && 'Storage bucket needs to be created to enable document uploads.'}
                {storageStatus === 'unknown' && 'Checking storage configuration...'}
              </p>
              {storageStatus === 'not_ready' && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200 font-semibold mb-2">
                    Manual Setup Required
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                    Create the storage bucket in your Supabase Dashboard:
                  </p>
                  <ol className="text-sm text-yellow-800 dark:text-yellow-300 list-decimal list-inside space-y-2">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Navigate to <strong>Storage</strong> in the left sidebar</li>
                    <li>Click <strong>Create a new bucket</strong></li>
                    <li>Name: <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 rounded">provider-documents</code></li>
                    <li>Set as <strong>Private</strong> (not public)</li>
                    <li>File size limit: <strong>10 MB</strong></li>
                    <li>Allowed MIME types: PDF, DOC, DOCX, JPG, PNG</li>
                    <li>Click <strong>Create bucket</strong></li>
                    <li>Return here and refresh to verify</li>
                  </ol>
                  <button
                    onClick={checkStorageStatus}
                    className="mt-3 px-3 py-1.5 bg-yellow-200 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200 rounded text-sm font-medium hover:bg-yellow-300 dark:hover:bg-yellow-900/80"
                  >
                    Check Status Again
                  </button>
                </div>
              )}
            </div>
            {storageStatus === 'not_ready' && (
              <button
                onClick={handleSetupStorage}
                disabled={settingUpStorage}
                className="ml-4 px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy dark:text-navy rounded-lg font-medium flex items-center gap-2"
              >
                {settingUpStorage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <HardDrive className="h-4 w-4" />
                    Setup Storage
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Fields by Table */}
      <div className="space-y-6">
        {Object.keys(groupedFields).length === 0 ? (
          <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h2 className="text-xl font-semibold text-navy dark:text-white flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Custom Fields
              </h2>
              <p className="text-navy/60 dark:text-cream/60 mt-1">
                Add custom fields to database tables
              </p>
            </div>
            <div className="p-8 text-center">
              <Settings className="h-12 w-12 text-navy/30 dark:text-cream/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No custom fields</h3>
              <p className="text-navy/60 dark:text-cream/60">
                Get started by adding your first custom field to any table
              </p>
            </div>
          </div>
        ) : (
          Object.entries(groupedFields).map(([tableName, fields]) => (
            <div key={tableName} className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30">
              <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
                <h2 className="text-xl font-semibold text-navy dark:text-white flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  {getTableDisplayName(tableName)} Custom Fields
                </h2>
                <p className="text-navy/60 dark:text-cream/60 mt-1">
                  Custom fields added to the {tableName} table
                </p>
              </div>
              <div className="divide-y divide-navy/10 dark:divide-dark-cyan/20">
                {fields.map((field) => (
                  <div key={field.id} className="p-6 hover:bg-navy/5 dark:hover:bg-navy-dark/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-navy dark:text-white">{field.label}</h3>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {field.type}
                          </span>
                          {(field as any).is_core && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                              Core Field
                            </span>
                          )}
                          {field.required && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              Required
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-navy/70 dark:text-cream/70">
                          <span className="font-medium">Database Column:</span> {field.name}
                        </div>
                        {!(field as any).is_core && (
                          <div className="text-sm text-navy/50 dark:text-cream/50">
                            Added {new Date(field.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!(field as any).is_core && (
                          <button
                            onClick={() => handleEditField(field as CustomField & { is_core?: boolean })}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit Field"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteField(field)}
                          className={`p-2 rounded-lg transition-colors ${
                            (field as any).is_core 
                              ? 'text-cream/40 cursor-not-allowed' 
                              : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                          title="Delete Field"
                          disabled={(field as any).is_core}
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
          <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Add Custom Field</h2>
              <p className="text-navy/60 dark:text-cream/60 text-sm mt-1">
                This will add a new column to the selected table
              </p>
            </div>
            
            <form onSubmit={handleAddField} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Table *</label>
                <select
                  value={formData.table_name}
                  onChange={(e) => setFormData({ ...formData, table_name: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="e.g., NPI Number"
                />
                <p className="text-xs text-navy/50 dark:text-cream/50 mt-1">
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
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="e.g., NPI Number"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Field Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
                  className="px-4 py-2 text-navy dark:text-cream border border-navy/20 dark:border-dark-cyan/30 rounded-lg hover:bg-navy/5 dark:hover:bg-navy-dark/50"
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

      {/* Edit Field Modal */}
      {showEditForm && editingField && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Edit Custom Field</h2>
              <p className="text-navy/60 dark:text-cream/60 text-sm mt-1">
                Update field properties (column name cannot be changed)
              </p>
            </div>
            
            <form onSubmit={handleUpdateField} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Field Name</label>
                <input
                  type="text"
                  value={formData.name}
                  disabled
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg bg-gray-100 dark:bg-navy-dark text-gray-500 dark:text-cream/50"
                />
                <p className="text-xs text-navy/50 dark:text-cream/50 mt-1">
                  Column name cannot be changed after creation
                </p>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Display Label *</label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Field Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
                  id="edit-required"
                  checked={formData.required}
                  onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="edit-required" className="text-navy dark:text-white">
                  Required field
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingField(null);
                  }}
                  className="px-4 py-2 text-navy dark:text-cream border border-navy/20 dark:border-dark-cyan/30 rounded-lg hover:bg-navy/5 dark:hover:bg-navy-dark/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy dark:text-navy rounded-lg font-medium"
                >
                  {loading ? 'Updating...' : 'Update Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};