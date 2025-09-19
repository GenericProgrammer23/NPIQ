import React, { useState } from 'react';
import { useProviders, useLocations } from '../hooks/useDatabase';
import { Users, Plus, Search, Filter, Edit, Eye, MapPin, Mail, Phone } from 'lucide-react';
import { Provider } from '../lib/supabase';

export const ProvidersPage: React.FC = () => {
  const { providers, loading, error, createProvider } = useProviders();
  const { locations } = useLocations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialty: '',
    license_number: '',
    license_expiry: '',
    location_id: '',
    status: 'pending' as const
  });

  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProvider({
        ...formData,
        organization_id: 'current-org-id', // This will be resolved by the service
        location_id: formData.location_id || null, // Properly handle optional location
      });
      setShowAddForm(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialty: '',
        license_number: '',
        license_expiry: '',
        location_id: '',
        status: 'pending'
      });
    } catch (err) {
      console.error('Failed to create provider:', err);
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setFormData({
      first_name: provider.first_name,
      last_name: provider.last_name,
      email: provider.email || '',
      phone: provider.phone || '',
      specialty: provider.specialty || '',
      license_number: provider.license_number || '',
      license_expiry: provider.license_expiry || '',
      location_id: provider.location_id || '',
      status: provider.status
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    
    try {
      await updateProvider(editingProvider.id, {
        ...formData,
        location_id: formData.location_id || null,
      });
      setShowEditForm(false);
      setEditingProvider(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialty: '',
        license_number: '',
        license_expiry: '',
        location_id: '',
        status: 'pending'
      });
    } catch (err) {
      console.error('Failed to update provider:', err);
    }
  };

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = 
      provider.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 dark:bg-gray-700 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-navy/10 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">Error loading providers: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Providers</h1>
          <p className="text-navy/70 dark:text-gray-300">Manage healthcare providers and their credentials</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Provider
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navy/50 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-navy/50 dark:text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Providers List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600">
        {filteredProviders.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-navy/30 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy dark:text-white mb-2">No providers found</h3>
            <p className="text-navy/60 dark:text-gray-400">
              {providers.length === 0 
                ? "Get started by adding your first provider"
                : "Try adjusting your search or filter criteria"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy/10 dark:divide-gray-600">
            {filteredProviders.map((provider) => (
              <div key={provider.id} className="p-6 hover:bg-navy/5 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-navy dark:text-white">
                        {provider.first_name} {provider.last_name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-navy/70 dark:text-gray-300">
                      {provider.specialty && (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {provider.specialty}
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {provider.email}
                        </div>
                      )}
                      {provider.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {provider.phone}
                        </div>
                      )}
                      {provider.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          {provider.location.name}
                        </div>
                      )}
                      {provider.license_number && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">License:</span>
                          {provider.license_number}
                        </div>
                      )}
                      {provider.license_expiry && (
                        <div className="flex items-center">
                          <span className="font-medium mr-2">Expires:</span>
                          {new Date(provider.license_expiry).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-navy/60 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(provider)}
                      className="p-2 text-navy/60 dark:text-gray-400 hover:text-navy dark:hover:text-white hover:bg-navy/10 dark:hover:bg-gray-600 rounded-lg transition-colors"
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

      {/* Add Provider Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-navy/10 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Add New Provider</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Specialty</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Location</label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  >
                    <option value="">No location assigned</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">License Number</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">License Expiry</label>
                  <input
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
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
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy rounded-lg font-medium"
                >
                  Add Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {showEditForm && editingProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-navy/10 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-navy dark:text-white">Edit Provider</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
              </div>
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Specialty</label>
                  <input
                    type="text"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">Location</label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  >
                    <option value="">No location assigned</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
                  />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">License Number</label>
                  <input
                    type="text"
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-navy dark:text-white font-medium mb-2">License Expiry</label>
                  <input
                    type="date"
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                  />
                </div>
              </div>
                </div>
              <div>
                <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-gray-700 text-navy dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingProvider(null);
                  }}
                  className="px-4 py-2 text-navy dark:text-white border border-navy/20 dark:border-gray-600 rounded-lg hover:bg-navy/5 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy dark:text-navy rounded-lg font-medium"
                >
                  Update Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};