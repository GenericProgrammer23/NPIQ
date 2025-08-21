import React, { useState, useEffect } from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { DatabaseService } from './lib/supabase';
import { useProviders, useLocations, useTasks, useWorkflows, useDashboardStats } from './hooks/useDatabase';
import { 
  Users, 
  MapPin, 
  CheckSquare, 
  Settings, 
  Plus, 
  Search,
  Filter,
  MoreHorizontal,
  Building,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Edit,
  Save,
  Calendar,
  Phone,
  Mail,
  User,
  Stethoscope
} from 'lucide-react';
import Diagnostics from './components/Diagnostics';

type View = 'dashboard' | 'providers' | 'locations' | 'tasks' | 'workflows' | 'settings';

// Separate component for the provider form to prevent remounting
const ProviderForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (provider: any) => Promise<void>;
  editingProvider?: any;
}> = ({ isOpen, onClose, onSubmit, editingProvider }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialty: '',
    license_number: '',
    license_expiry: '',
    status: 'pending' as const
  });
  const [loading, setLoading] = useState(false);

  // Initialize form data when editing provider changes
  useEffect(() => {
    if (editingProvider) {
      setFormData({
        first_name: editingProvider.first_name || '',
        last_name: editingProvider.last_name || '',
        email: editingProvider.email || '',
        phone: editingProvider.phone || '',
        specialty: editingProvider.specialty || '',
        license_number: editingProvider.license_number || '',
        license_expiry: editingProvider.license_expiry || '',
        status: editingProvider.status || 'pending'
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialty: '',
        license_number: '',
        license_expiry: '',
        status: 'pending'
      });
    }
  }, [editingProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-cream">
            {editingProvider ? 'Edit Provider' : 'Add New Provider'}
          </h2>
          <button
            onClick={onClose}
            className="text-cream/70 hover:text-cream"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-cream font-medium mb-2">First Name *</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-cream font-medium mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                placeholder="Smith"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-cream font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
              placeholder="john.smith@healthcare.org"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-cream font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-cream font-medium mb-2">Specialty</label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                placeholder="e.g., Cardiology"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-cream font-medium mb-2">License Number</label>
              <input
                type="text"
                value={formData.license_number}
                onChange={(e) => handleInputChange('license_number', e.target.value)}
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                placeholder="MD123456"
              />
            </div>
            <div>
              <label className="block text-cream font-medium mb-2">License Expiry</label>
              <input
                type="date"
                value={formData.license_expiry}
                onChange={(e) => handleInputChange('license_expiry', e.target.value)}
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-cream font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-navy-dark hover:bg-navy text-cream rounded-lg border border-dark-cyan/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy rounded-lg font-medium flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {editingProvider ? 'Update' : 'Create'} Provider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Separate component for location form
const LocationForm: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (location: any) => Promise<void>;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    departments: 1
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        organization_id: 'current-org-id',
        status: 'active'
      });
      setFormData({ name: '', address: '', departments: 1 });
      onClose();
    } catch (error) {
      console.error('Failed to create location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-cream">Add New Location</h2>
          <button
            onClick={onClose}
            className="text-cream/70 hover:text-cream"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-cream font-medium mb-2">Location Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
              placeholder="e.g., Main Hospital"
              required
            />
          </div>

          <div>
            <label className="block text-cream font-medium mb-2">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
              placeholder="123 Medical Center Drive"
            />
          </div>

          <div>
            <label className="block text-cream font-medium mb-2">Number of Departments</label>
            <input
              type="number"
              min="1"
              value={formData.departments}
              onChange={(e) => handleInputChange('departments', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-navy-dark hover:bg-navy text-cream rounded-lg border border-dark-cyan/30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy rounded-lg font-medium flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-navy mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Create Location
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);

  // Database hooks
  const { providers, loading: providersLoading, createProvider, updateProvider, refetch: refetchProviders } = useProviders();
  const { locations, loading: locationsLoading, createLocation, refetch: refetchLocations } = useLocations();
  const { tasks, loading: tasksLoading, updateTask, refetch: refetchTasks } = useTasks();
  const { workflows, loading: workflowsLoading } = useWorkflows();
  const { stats, loading: statsLoading } = useDashboardStats();

  // Handle provider form submission
  const handleProviderSubmit = async (providerData: any) => {
    if (editingProvider) {
      await updateProvider(editingProvider.id, providerData);
    } else {
      await createProvider(providerData);
    }
    refetchProviders();
    setEditingProvider(null);
  };

  // Handle location form submission
  const handleLocationSubmit = async (locationData: any) => {
    await createLocation(locationData);
    refetchLocations();
  };

  // Handle edit provider
  const handleEditProvider = (provider: any) => {
    setEditingProvider(provider);
    setShowProviderForm(true);
  };

  // Handle close provider form
  const handleCloseProviderForm = () => {
    setShowProviderForm(false);
    setEditingProvider(null);
  };

  // Filter providers based on search term
  const filteredProviders = providers.filter(provider =>
    `${provider.first_name} ${provider.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter locations based on search term
  const filteredLocations = locations.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'expired': return 'text-red-400 bg-red-400/20';
      case 'suspended': return 'text-gray-400 bg-gray-400/20';
      case 'completed': return 'text-green-400 bg-green-400/20';
      case 'in_progress': return 'text-blue-400 bg-blue-400/20';
      case 'rejected': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-400/20';
      case 'high': return 'text-orange-400 bg-orange-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm">Total Providers</p>
              <p className="text-2xl font-bold text-cream">{statsLoading ? '...' : stats.totalProviders}</p>
            </div>
            <Users className="h-8 w-8 text-dark-cyan" />
          </div>
        </div>

        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm">Active Workflows</p>
              <p className="text-2xl font-bold text-cream">{statsLoading ? '...' : stats.activeWorkflows}</p>
            </div>
            <Activity className="h-8 w-8 text-goldenrod" />
          </div>
        </div>

        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm">Completed Tasks</p>
              <p className="text-2xl font-bold text-cream">{statsLoading ? '...' : stats.completedTasks}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-cream">{statsLoading ? '...' : stats.pendingTasks}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
        <h2 className="text-xl font-semibold text-cream mb-4">Recent Tasks</h2>
        {tasksLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-cream/70 text-center py-8">No tasks found</p>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-navy-dark rounded-lg">
                <div className="flex-1">
                  <h3 className="text-cream font-medium">{task.title}</h3>
                  <p className="text-cream/70 text-sm">{task.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProviders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cream">Providers</h1>
        <button
          onClick={() => setShowProviderForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cream/50 h-4 w-4" />
          <input
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
          />
        </div>
        <button className="p-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream hover:bg-navy">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {providersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod" />
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-cream/30 mx-auto mb-4" />
          <p className="text-cream/70">No providers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <div key={provider.id} className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-dark-cyan rounded-full flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-cream font-semibold">{provider.first_name} {provider.last_name}</h3>
                    <p className="text-cream/70 text-sm">{provider.specialty || 'No specialty'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditProvider(provider)}
                  className="text-cream/70 hover:text-cream"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                {provider.email && (
                  <div className="flex items-center text-cream/70 text-sm">
                    <Mail className="h-4 w-4 mr-2" />
                    {provider.email}
                  </div>
                )}
                {provider.phone && (
                  <div className="flex items-center text-cream/70 text-sm">
                    <Phone className="h-4 w-4 mr-2" />
                    {provider.phone}
                  </div>
                )}
                {provider.license_number && (
                  <div className="flex items-center text-cream/70 text-sm">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    License: {provider.license_number}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(provider.status)}`}>
                  {provider.status}
                </span>
                {provider.license_expiry && (
                  <div className="flex items-center text-cream/70 text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    Expires: {new Date(provider.license_expiry).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cream">Locations</h1>
        <button
          onClick={() => setShowLocationForm(true)}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cream/50 h-4 w-4" />
        <input
          type="text"
          placeholder="Search locations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
        />
      </div>

      {locationsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod" />
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-cream/30 mx-auto mb-4" />
          <p className="text-cream/70">No locations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((location) => (
            <div key={location.id} className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-goldenrod rounded-full flex items-center justify-center mr-3">
                    <Building className="h-5 w-5 text-navy" />
                  </div>
                  <div>
                    <h3 className="text-cream font-semibold">{location.name}</h3>
                    <p className="text-cream/70 text-sm">{location.departments} departments</p>
                  </div>
                </div>
                <button className="text-cream/70 hover:text-cream">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {location.address && (
                <div className="flex items-center text-cream/70 text-sm mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  {location.address}
                </div>
              )}

              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(location.status)}`}>
                {location.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cream">Tasks</h1>
        <button className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cream/50 h-4 w-4" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
        />
      </div>

      {tasksLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod" />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-cream/30 mx-auto mb-4" />
          <p className="text-cream/70">No tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div key={task.id} className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-cream font-semibold mb-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-cream/70 text-sm mb-3">{task.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-cream/70">
                    {task.due_date && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                    {task.provider && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {task.provider.first_name} {task.provider.last_name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <button className="text-cream/70 hover:text-cream">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cream">Workflows</h1>
        <button className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </button>
      </div>

      {workflowsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-goldenrod" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-cream/30 mx-auto mb-4" />
          <p className="text-cream/70">No workflows found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-cream font-semibold">{workflow.name}</h3>
                  <p className="text-cream/70 text-sm">{workflow.type}</p>
                </div>
                <button className="text-cream/70 hover:text-cream">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {workflow.description && (
                <p className="text-cream/70 text-sm mb-4">{workflow.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                  {workflow.status}
                </span>
                <span className="text-cream/70 text-xs">
                  {workflow.steps?.length || 0} steps
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-cream">Settings</h1>
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
        <p className="text-cream/70">Settings panel coming soon...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return renderDashboard();
      case 'providers': return renderProviders();
      case 'locations': return renderLocations();
      case 'tasks': return renderTasks();
      case 'workflows': return renderWorkflows();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-navy">
        {/* Navigation */}
        <nav className="bg-navy-light border-b border-dark-cyan/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-cream">NPIQ</h1>
              </div>
              <div className="flex items-center space-x-8">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'dashboard' 
                      ? 'bg-dark-cyan text-white' 
                      : 'text-cream/70 hover:text-cream hover:bg-navy-dark'
                  }`}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('providers')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'providers' 
                      ? 'bg-dark-cyan text-white' 
                      : 'text-cream/70 hover:text-cream hover:bg-navy-dark'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Providers
                </button>
                <button
                  onClick={() => setCurrentView('locations')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'locations' 
                      ? 'bg-dark-cyan text-white' 
                      : 'text-cream/70 hover:text-cream hover:bg-navy-dark'
                  }`}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Locations
                </button>
                <button
                  onClick={() => setCurrentView('tasks')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'tasks' 
                      ? 'bg-dark-cyan text-white' 
                      : 'text-cream/70 hover:text-cream hover:bg-navy-dark'
                  }`}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Tasks
                </button>
                <button
                  onClick={() => setCurrentView('workflows')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'workflows' 
                      ? 'bg-dark-cyan text-white' 
                      : 'text-cream/70 hover:text-cream hover:bg-navy-dark'
                  }`}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Workflows
                </button>
                <button
                  onClick={() => setCurrentView('settings')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'settings' 
                      ? 'bg-dark-cyan text-white' 
                      : 'text-cream/70 hover:text-cream hover:bg-navy-dark'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </main>

        {/* Provider Form Modal */}
        <ProviderForm
          isOpen={showProviderForm}
          onClose={handleCloseProviderForm}
          onSubmit={handleProviderSubmit}
          editingProvider={editingProvider}
        />

        {/* Location Form Modal */}
        <LocationForm
          isOpen={showLocationForm}
          onClose={() => setShowLocationForm(false)}
          onSubmit={handleLocationSubmit}
        />

        {/* Diagnostics */}
        <Diagnostics />
      </div>
    </AuthWrapper>
  );
}

export default App;