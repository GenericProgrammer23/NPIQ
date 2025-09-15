import React, { useState } from 'react';
import { useLocations } from '../hooks/useDatabase';
import { MapPin, Plus, Search, Edit, Eye, Building } from 'lucide-react';

export const LocationsPage: React.FC = () => {
  const { locations, loading, error, createLocation } = useLocations();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    departments: 1,
    status: 'active' as const
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLocation({
        ...formData,
        organization_id: 'current-org-id', // This will be resolved by the service
      });
      setShowAddForm(false);
      setFormData({
        name: '',
        address: '',
        departments: 1,
        status: 'active'
      });
    } catch (err) {
      console.error('Failed to create location:', err);
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-navy mb-2">Locations</h1>
          <p className="text-navy/70">Manage your healthcare facilities and locations</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Location
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-navy/10 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navy/50" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-navy/20 rounded-lg focus:outline-none focus:border-dark-cyan"
          />
        </div>
      </div>

      {/* Locations List */}
      <div className="bg-white rounded-lg border border-navy/10">
        {filteredLocations.length === 0 ? (
          <div className="p-8 text-center">
            <MapPin className="h-12 w-12 text-navy/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-navy mb-2">No locations found</h3>
            <p className="text-navy/60">
              {locations.length === 0 
                ? "Get started by adding your first location"
                : "Try adjusting your search criteria"
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-navy/10">
            {filteredLocations.map((location) => (
              <div key={location.id} className="p-6 hover:bg-navy/5 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-navy">{location.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(location.status)}`}>
                        {location.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-navy/70">
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
                    <button className="p-2 text-navy/60 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-navy/60 hover:text-navy hover:bg-navy/10 rounded-lg transition-colors">
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
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-navy/10">
              <h2 className="text-xl font-semibold text-navy">Add New Location</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-navy font-medium mb-2">Location Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 rounded-lg focus:outline-none focus:border-dark-cyan"
                  placeholder="e.g., Main Hospital"
                />
              </div>

              <div>
                <label className="block text-navy font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 rounded-lg focus:outline-none focus:border-dark-cyan"
                  placeholder="123 Medical Center Drive"
                />
              </div>

              <div>
                <label className="block text-navy font-medium mb-2">Number of Departments</label>
                <input
                  type="number"
                  min="1"
                  value={formData.departments}
                  onChange={(e) => setFormData({ ...formData, departments: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-navy/20 rounded-lg focus:outline-none focus:border-dark-cyan"
                />
              </div>

              <div>
                <label className="block text-navy font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 rounded-lg focus:outline-none focus:border-dark-cyan"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-navy border border-navy/20 rounded-lg hover:bg-navy/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy rounded-lg font-medium"
                >
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};