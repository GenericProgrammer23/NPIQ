import React, { useState } from 'react';
import { useLocations } from '../hooks/useDatabase';
import { MapPin, Plus, Search, CreditCard as Edit, Eye, Building, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { StartWorkflowModal } from './StartWorkflowModal';

interface LocationsPageProps {
  initialFilter?: { type: string; value: string } | null;
}

export const LocationsPage: React.FC<LocationsPageProps> = ({ initialFilter }) => {
  const { locations, loading, error, createLocation, updateLocation } = useLocations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [workflowLocation, setWorkflowLocation] = useState<any>(null);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    departments: 1,
    status: 'active' as const
  });
  const [customFieldData, setCustomFieldData] = useState<Record<string, any>>({});

  // Handle initial filter from dashboard
  React.useEffect(() => {
    if (initialFilter) {
      if (initialFilter.type === 'action' && initialFilter.value === 'add') {
        setShowAddForm(true);
      }
    }
  }, [initialFilter]);

  // Load custom fields on component mount
  React.useEffect(() => {
    loadCustomFields();
  }, []);

  const loadCustomFields = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('custom_fields')
        .select('*')
        .eq('table_name', 'locations')
        .order('created_at');

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to load custom fields:', error);
        return;
      }

      setCustomFields(data || []);
    } catch (err) {
      console.error('Failed to load custom fields:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize custom field data
    const sanitizedCustomFieldData: Record<string, any> = {};
    customFields.forEach(field => {
      const value = customFieldData[field.name];
      if (field.type === 'number') {
        sanitizedCustomFieldData[field.name] = value === '' ? null : value;
      } else {
        sanitizedCustomFieldData[field.name] = value;
      }
    });
    
    try {
      const locationData = {
        ...formData,
        organization_id: 'current-org-id', // This will be resolved by the service
        ...sanitizedCustomFieldData // Include sanitized custom field data
      };
      
      await createLocation(locationData);
      setShowAddForm(false);
      setFormData({
        name: '',
        address: '',
        departments: 1,
        status: 'active'
      });
      setCustomFieldData({});
    } catch (err) {
      console.error('Failed to create location:', err);
    }
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      address: location.address || '',
      departments: location.departments,
      status: location.status
    });
    
    // Load custom field values for editing
    const customData: Record<string, any> = {};
    customFields.forEach(field => {
      customData[field.name] = (location as any)[field.name] || '';
    });
    setCustomFieldData(customData);
    
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;
    
    // Sanitize custom field data
    const sanitizedCustomFieldData: Record<string, any> = {};
    customFields.forEach(field => {
      const value = customFieldData[field.name];
      if (field.type === 'number') {
        sanitizedCustomFieldData[field.name] = value === '' ? null : value;
      } else {
        sanitizedCustomFieldData[field.name] = value;
      }
    });
    
    try {
      const updateData = {
        ...formData,
        ...sanitizedCustomFieldData // Include sanitized custom field data
      };
      
      await updateLocation(editingLocation.id, updateData);
      setShowEditForm(false);
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        departments: 1,
        status: 'active'
      });
      setCustomFieldData({});
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  };

  const renderCustomField = (field: any) => {
    const value = customFieldData[field.name] || '';
    
    switch (field.type) {
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            required={field.required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            required={field.required}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            required={field.required}
          />
        );
      case 'tel':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            required={field.required}
          />
        );
      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setCustomFieldData({ ...customFieldData, [field.name]: file.name });
                }
              }}
              className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              required={field.required}
            />
            {value && (
              <p className="text-sm text-navy/60 dark:text-cream/60">
                Current file: {value}
              </p>
            )}
          </div>
        );
      default: // text
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setCustomFieldData({ ...customFieldData, [field.name]: e.target.value })}
            className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            required={field.required}
          />
        );
    }
  };

  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-navy/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading locations: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-page-bg dark:bg-navy min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Locations</h1>
          <p className="text-navy/70 dark:text-cream/70">Manage your healthcare facilities and locations</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Location
        </button>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-cream/50" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
          />
        </div>
      </div>

      {/* Locations List */}
      <div className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30">
        {filteredLocations.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="h-12 w-12 text-navy/30 dark:text-cream/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No locations found</h3>
            <p className="text-navy/60 dark:text-cream/60">
              {locations.length === 0 
                ? "Get started by adding your first location"
                : "Try adjusting your search criteria"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy/10 dark:divide-dark-cyan/20">
            {filteredLocations.map((location) => (
              <div key={location.id} className="p-6 hover:bg-navy/5 dark:hover:bg-navy-dark/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-navy dark:text-white">{location.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(location.status)}`}>
                        {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-navy/70 dark:text-cream/70">
                      {location.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {location.address}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        {location.departments} {location.departments === 1 ? 'Department' : 'Departments'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setWorkflowLocation(location);
                        setShowWorkflowModal(true);
                      }}
                      className="p-2 text-goldenrod hover:text-goldenrod/80 hover:bg-goldenrod/10 rounded-lg transition-colors"
                      title="Start Workflow"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream hover:bg-navy/10 dark:hover:bg-navy-dark/50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream hover:bg-navy/10 dark:hover:bg-navy-dark/50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Add New Location</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Location Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="e.g., Main Hospital"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="123 Medical Center Drive"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Number of Departments</label>
                <input
                  type="number"
                  min="1"
                  value={formData.departments}
                  onChange={(e) => setFormData({ ...formData, departments: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <>
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium text-navy dark:text-white mb-4 border-t border-navy/20 dark:border-dark-cyan/30 pt-4">
                      Additional Information
                    </h3>
                  </div>
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-navy dark:text-white font-medium mb-2">
                        {field.label} {field.required && '*'}
                      </label>
                      {renderCustomField(field)}
                    </div>
                  ))}
                </>
              )}

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
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy rounded-lg font-medium"
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Location Modal */}
      {showEditForm && editingLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10 dark:border-dark-cyan/30">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Edit Location</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Location Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="e.g., Main Hospital"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="123 Medical Center Drive"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Number of Departments</label>
                <input
                  type="number"
                  min="1"
                  value={formData.departments}
                  onChange={(e) => setFormData({ ...formData, departments: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                />
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <>
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium text-navy dark:text-white mb-4 border-t border-navy/20 dark:border-dark-cyan/30 pt-4">
                      Additional Information
                    </h3>
                  </div>
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <label className="block text-navy dark:text-white font-medium mb-2">
                        {field.label} {field.required && '*'}
                      </label>
                      {renderCustomField(field)}
                    </div>
                  ))}
                </>
              )}

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingLocation(null);
                  }}
                  className="px-4 py-2 text-navy dark:text-cream border border-navy/20 dark:border-dark-cyan/30 rounded-lg hover:bg-navy/5 dark:hover:bg-navy-dark/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy rounded-lg font-medium"
                >
                  Update Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Workflow Modal */}
      {showWorkflowModal && workflowLocation && (
        <StartWorkflowModal
          entityType="location"
          entityId={workflowLocation.id}
          entityName={workflowLocation.name}
          onClose={() => {
            setShowWorkflowModal(false);
            setWorkflowLocation(null);
          }}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};