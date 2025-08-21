import React, { useState } from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { useProviders, useLocations, useTasks, useWorkflows, useDashboardStats } from './hooks/useDatabase';
import { ProviderForm } from './components/ProviderForm';
import { LocationForm } from './components/LocationForm';
import Diagnostics from './components/Diagnostics';
import { 
  Users, 
  MapPin, 
  Workflow, 
  CheckSquare, 
  Plus, 
  Edit, 
  X,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [providerFormData, setProviderFormData] = useState({});
  const [locationFormData, setLocationFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data hooks
  const { providers, createProvider, updateProvider, refetch: refetchProviders } = useProviders();
  const { locations, createLocation, refetch: refetchLocations } = useLocations();
  const { tasks } = useTasks();
  const { workflows } = useWorkflows();
  const { stats } = useDashboardStats();

  const handleAddProvider = () => {
    setEditingProvider(null);
    setProviderFormData({});
    setShowProviderModal(true);
    setError(null);
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setProviderFormData(provider);
    setShowProviderModal(true);
    setError(null);
  };

  const handleProviderSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      if (editingProvider) {
        await updateProvider(editingProvider.id, data);
      } else {
        await createProvider(data);
      }
      setShowProviderModal(false);
      setProviderFormData({});
      setEditingProvider(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderCancel = () => {
    setShowProviderModal(false);
    setProviderFormData({});
    setEditingProvider(null);
    setError(null);
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setLocationFormData({});
    setShowLocationModal(true);
    setError(null);
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location);
    setLocationFormData(location);
    setShowLocationModal(true);
    setError(null);
  };

  const handleLocationSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      if (editingLocation) {
        // Update location logic would go here
        console.log('Update location:', data);
      } else {
        await createLocation(data);
      }
      setShowLocationModal(false);
      setLocationFormData({});
      setEditingLocation(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationCancel = () => {
    setShowLocationModal(false);
    setLocationFormData({});
    setEditingLocation(null);
    setError(null);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm">Total Providers</p>
              <p className="text-2xl font-bold text-cream">{stats.totalProviders}</p>
            </div>
            <Users className="h-8 w-8 text-dark-cyan" />
          </div>
        </div>

        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm">Active Workflows</p>
              <p className="text-2xl font-bold text-cream">{stats.activeWorkflows}</p>
            </div>
            <Activity className="h-8 w-8 text-goldenrod" />
          </div>
        </div>

        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm">Completed Tasks</p>
              <p className="text-2xl font-bold text-cream">{stats.completedTasks}</p>
            </div>
            <CheckSquare className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cream/70 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-cream">{stats.pendingTasks}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <h3 className="text-lg font-semibold text-cream mb-4">Recent Providers</h3>
          <div className="space-y-3">
            {providers.slice(0, 5).map((provider) => (
              <div key={provider.id} className="flex items-center justify-between p-3 bg-navy-dark rounded-lg">
                <div>
                  <p className="text-cream font-medium">{provider.first_name} {provider.last_name}</p>
                  <p className="text-cream/70 text-sm">{provider.specialty || 'No specialty'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  provider.status === 'active' ? 'bg-green-600/20 text-green-400' :
                  provider.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {provider.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
          <h3 className="text-lg font-semibold text-cream mb-4">Recent Tasks</h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-navy-dark rounded-lg">
                <div>
                  <p className="text-cream font-medium">{task.title}</p>
                  <p className="text-cream/70 text-sm">
                    {task.priority} priority • {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  task.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                  task.status === 'in_progress' ? 'bg-blue-600/20 text-blue-400' :
                  'bg-yellow-600/20 text-yellow-400'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProviders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cream">Providers</h2>
        <button
          onClick={handleAddProvider}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <div key={provider.id} className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-cream">
                  {provider.first_name} {provider.last_name}
                </h3>
                <p className="text-cream/70">{provider.specialty || 'No specialty'}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditProvider(provider)}
                  className="p-2 text-cream/70 hover:text-cream hover:bg-navy-dark rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {provider.email && (
                <p className="text-cream/70">📧 {provider.email}</p>
              )}
              {provider.phone && (
                <p className="text-cream/70">📞 {provider.phone}</p>
              )}
              {provider.location?.name && (
                <p className="text-cream/70">📍 {provider.location.name}</p>
              )}
            </div>

            <div className="mt-4">
              <span className={`px-2 py-1 rounded-full text-xs ${
                provider.status === 'active' ? 'bg-green-600/20 text-green-400' :
                provider.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                provider.status === 'expired' ? 'bg-red-600/20 text-red-400' :
                'bg-gray-600/20 text-gray-400'
              }`}>
                {provider.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cream">Locations</h2>
        <button
          onClick={handleAddLocation}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div key={location.id} className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-cream">{location.name}</h3>
                <p className="text-cream/70">{location.address || 'No address'}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditLocation(location)}
                  className="p-2 text-cream/70 hover:text-cream hover:bg-navy-dark rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-cream/70">🏢 {location.departments} departments</p>
            </div>

            <div className="mt-4">
              <span className={`px-2 py-1 rounded-full text-xs ${
                location.status === 'active' ? 'bg-green-600/20 text-green-400' :
                'bg-gray-600/20 text-gray-400'
              }`}>
                {location.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cream">Workflows</h2>
        <button className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-cream">{workflow.name}</h3>
                <p className="text-cream/70">{workflow.description || 'No description'}</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-cream/70 hover:text-cream hover:bg-navy-dark rounded">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-cream/70">Type: {workflow.type}</p>
              <p className="text-cream/70">Steps: {workflow.steps?.length || 0}</p>
            </div>

            <div className="mt-4">
              <span className={`px-2 py-1 rounded-full text-xs ${
                workflow.status === 'active' ? 'bg-green-600/20 text-green-400' :
                workflow.status === 'draft' ? 'bg-yellow-600/20 text-yellow-400' :
                'bg-gray-600/20 text-gray-400'
              }`}>
                {workflow.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cream">Tasks</h2>
        <button className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-cream mb-2">{task.title}</h3>
                {task.description && (
                  <p className="text-cream/70 mb-3">{task.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-cream/70">
                  <span>Priority: {task.priority}</span>
                  {task.due_date && (
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  )}
                  {task.provider && (
                    <span>Provider: {task.provider.first_name} {task.provider.last_name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  task.status === 'completed' ? 'bg-green-600/20 text-green-400' :
                  task.status === 'in_progress' ? 'bg-blue-600/20 text-blue-400' :
                  task.status === 'rejected' ? 'bg-red-600/20 text-red-400' :
                  'bg-yellow-600/20 text-yellow-400'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
                <button className="p-2 text-cream/70 hover:text-cream hover:bg-navy-dark rounded">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AuthWrapper>
      <div className="min-h-screen bg-navy">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-cream mb-2">NPIQ Healthcare Credentialing</h1>
            <p className="text-cream/70">Manage providers, workflows, and credentialing tasks</p>
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <nav className="flex space-x-1 bg-navy-light rounded-lg p-1">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                { id: 'providers', label: 'Providers', icon: Users },
                { id: 'locations', label: 'Locations', icon: MapPin },
                { id: 'workflows', label: 'Workflows', icon: Workflow },
                { id: 'tasks', label: 'Tasks', icon: CheckSquare }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-goldenrod text-navy'
                      : 'text-cream/70 hover:text-cream hover:bg-navy-dark'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="mb-8">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'providers' && renderProviders()}
            {activeTab === 'locations' && renderLocations()}
            {activeTab === 'workflows' && renderWorkflows()}
            {activeTab === 'tasks' && renderTasks()}
          </div>
        </div>

        {/* Provider Modal */}
        {showProviderModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-cream">
                  {editingProvider ? 'Edit Provider' : 'Add Provider'}
                </h2>
                <button
                  onClick={handleProviderCancel}
                  className="p-2 text-cream/70 hover:text-cream hover:bg-navy-dark rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <ProviderForm
                key={editingProvider?.id || 'new'}
                data={providerFormData}
                locations={locations}
                onChange={setProviderFormData}
                onSubmit={handleProviderSubmit}
                onCancel={handleProviderCancel}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        )}

        {/* Location Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-cream">
                  {editingLocation ? 'Edit Location' : 'Add Location'}
                </h2>
                <button
                  onClick={handleLocationCancel}
                  className="p-2 text-cream/70 hover:text-cream hover:bg-navy-dark rounded"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <LocationForm
                key={editingLocation?.id || 'new'}
                data={locationFormData}
                onChange={setLocationFormData}
                onSubmit={handleLocationSubmit}
                onCancel={handleLocationCancel}
                loading={loading}
                error={error}
              />
            </div>
          </div>
        )}

        <Diagnostics />
      </div>
    </AuthWrapper>
  );
}

export default App;