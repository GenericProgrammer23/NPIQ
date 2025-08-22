
import React, { useState, useMemo } from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { DatabaseService } from './lib/supabase';
import Diagnostics from './components/Diagnostics';
import { useProviders, useLocations, useDashboardStats, useWorkflows, useTasks } from './hooks/useDatabase';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  CheckSquare, 
  FileText, 
  FileImage, 
  GitBranch, 
  Shield, 
  FileSearch, 
  Settings, 
  UserCheck,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Bell,
  Lock,
  Building,
  Mail,
  X,
  Save,
  Trash2,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Phone,
  MapPinIcon,
  User,
  Briefcase,
  Hash,
  Calendar as CalendarIcon,
  Badge,
  FileCheck,
  Upload,
  Play,
  Pause,
  Target,
  BarChart3
} from 'lucide-react';
// --- place this at the very top of src/App.tsx ---


const ProviderForm: React.FC<any> = React.memo(({ data, onChange, onSubmit, onCancel, locations }) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
    {/* ——— your exact fields ——— */}
    {/* First/Last name */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-cream font-medium mb-2">First Name *</label>
        <input
          type="text"
          value={data.first_name || ''}
          onChange={(e) => onChange({ ...data, first_name: e.target.value })}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
          required
        />
      </div>
      <div>
        <label className="block text-cream font-medium mb-2">Last Name *</label>
        <input
          type="text"
          value={data.last_name || ''}
          onChange={(e) => onChange({ ...data, last_name: e.target.value })}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
          required
        />
      </div>
    </div>

    {/* Email */}
    <div>
      <label className="block text-cream font-medium mb-2">Email</label>
      <input
        type="email"
        value={data.email || ''}
        onChange={(e) => onChange({ ...data, email: e.target.value })}
        className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
      />
    </div>

    {/* Phone + Specialty */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-cream font-medium mb-2">Phone</label>
        <input
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
        />
      </div>
      <div>
        <label className="block text-cream font-medium mb-2">Specialty</label>
        <select
          value={data.specialty ?? ''}  // keep it a string
          onChange={(e) =>
            onChange({ ...data, specialty: e.target.value as 'PT' | 'OT' | '' })
          }
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
        >
          <option value="">Select specialty</option>
          <option value="PT">PT</option>
          <option value="OT">OT</option>
        </select>
      </div>
    </div>

    {/* License */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-cream font-medium mb-2">License Number</label>
        <input
          type="text"
          value={data.license_number || ''}
          onChange={(e) => onChange({ ...data, license_number: e.target.value })}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
        />
      </div>
      <div>
        <label className="block text-cream font-medium mb-2">License Expiry</label>
        <input
          type="date"
          value={data.license_expiry || ''}
          onChange={(e) => onChange({ ...data, license_expiry: e.target.value })}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
        />
      </div>
    </div>

    {/* Location */}
    <div>
      <label className="block text-cream font-medium mb-2">Location</label>
      <select
        value={data.location_id || ''}
        onChange={(e) => onChange({ ...data, location_id: e.target.value })}
        className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
      >
        <option value="">Select Location</option>
        {locations?.map((location: any) => (
          <option key={location.id} value={location.id}>{location.name}</option>
        ))}
      </select>
    </div>

    {/* Status */}
    <div>
      <label className="block text-cream font-medium mb-2">Status</label>
      <select
        value={data.status || 'pending'}
        onChange={(e) => onChange({ ...data, status: e.target.value })}
        className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
      >
        <option value="pending">Pending</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="expired">Expired</option>
      </select>
    </div>

    {/* Buttons */}
    <div className="flex justify-end space-x-4 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 bg-navy-dark text-cream rounded-lg hover:bg-navy border border-dark-cyan/30"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 bg-goldenrod text-navy rounded-lg hover:bg-goldenrod/90 font-medium"
      >
        Save Provider
      </button>
    </div>
  </form>
));

const LocationForm: React.FC<any> = React.memo(({ data, onChange, onSubmit, onCancel }) => (
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(data); }} className="space-y-4">
    {/* ——— your exact fields ——— */}
    <div>
      <label className="block text-cream font-medium mb-2">Location Name *</label>
      <input
        type="text"
        value={data.name || ''}
        onChange={(e) => onChange({ ...data, name: e.target.value })}
        className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
        required
      />
    </div>
    <div>
      <label className="block text-cream font-medium mb-2">Address</label>
      <textarea
        value={data.address || ''}
        onChange={(e) => onChange({ ...data, address: e.target.value })}
        className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan h-24 resize-none"
      />
    </div>
    <div>
      <label className="block text-cream font-medium mb-2">Number of Departments</label>
      <input
        type="number"
        min="1"
        value={data.departments || 1}
        onChange={(e) => onChange({ ...data, departments: parseInt(e.target.value) || 1 })}
        className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
      />
    </div>
    <div>
      <label className="block text-cream font-medium mb-2">Status</label>
      <select
        value={data.status || 'active'}
        onChange={(e) => onChange({ ...data, status: e.target.value })}
        className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
    <div className="flex justify-end space-x-4 pt-4">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 bg-navy-dark text-cream rounded-lg hover:bg-navy border border-dark-cyan/30"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-4 py-2 bg-goldenrod text-navy rounded-lg hover:bg-goldenrod/90 font-medium"
      >
        Save Location
      </button>
    </div>
  </form>
));

// Modal Components
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-navy-light rounded-lg border border-dark-cyan/20 w-full ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center p-6 border-b border-dark-cyan/20">
          <h2 className="text-xl font-semibold text-cream">{title}</h2>
          <button onClick={onClose} className="text-cream/60 hover:text-cream">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [settingsTab, setSettingsTab] = useState('general');
  const [tasksTab, setTasksTab] = useState('pending-provider');
  const [providersTab, setProvidersTab] = useState('active');
  const [workflowsTab, setWorkflowsTab] = useState('provider');
  // Filters for Providers tab
  const [q, setQ] = useState<string>('');            // search text
  const [filterSpecialty, setFilterSpecialty] = useState<string>(''); // "PT" | "OT" | ""
  const [filterLocation, setFilterLocation] = useState<string>('');   // location_id or ""

  // Modal states
  const [modals, setModals] = useState({
    addProvider: false,
    viewProvider: false,
    editProvider: false,
    addLocation: false,
    viewLocation: false,
    editLocation: false,
    addWorkflow: false,
    viewWorkflow: false,
    editWorkflow: false,
    viewTask: false,
    editTask: false,
    runCompliance: false,
    addUser: false,
    editUser: false
  });
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Use database hooks
  const { providers, loading: providersLoading, createProvider, updateProvider } = useProviders();
  const { locations, loading: locationsLoading, createLocation } = useLocations();
  const { workflows, loading: workflowsLoading, createWorkflow } = useWorkflows();
  const { tasks, loading: tasksLoading, createTask, updateTask } = useTasks();
  const { stats, loading: statsLoading } = useDashboardStats();
  const locationNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const loc of locations || []) m.set(loc.id, loc.name || '');
    return m;
  }, [locations]);
  
  const filteredProviders = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (providers || []).filter((p: any) => {
      if (filterSpecialty && p.specialty !== filterSpecialty) return false;
      if (filterLocation && p.location_id !== filterLocation) return false;
  
      if (!needle) return true;
      const locName = locationNameById.get(p.location_id) ?? '';
      const hay = [
        p.first_name, p.last_name, p.email, p.phone,
        p.license_number, p.specialty, locName
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [providers, q, filterSpecialty, filterLocation, locationNameById]);

  const isOnline = DatabaseService.isConfigured();

  const openModal = (modalName, item = null) => {
    setModals(prev => ({ ...prev, [modalName]: true }));
    setSelectedItem(item);
    if (item) {
      setFormData(item);
    } else {
      setFormData({});
    }
  };

  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    setSelectedItem(null);
    setFormData({});
  };

  const handleFormSubmit = async (modalName, data) => {
  try {
    switch (modalName) {
      case 'addProvider': {
        // Drop any stray nested location payload
        const { location, name, ...clean } = data;
        await createProvider(clean);
        break;
      }
      case 'editProvider':
        await updateProvider(selectedItem.id, data);
        break;
      case 'addLocation':
        await createLocation(data);
        break;
      case 'addWorkflow':
        await createWorkflow(data);
        break;
      case 'addTask':
        await createTask(data);
        break;
      case 'editTask':
        await updateTask(selectedItem.id, data);
        break;
    }
    closeModal(modalName);
  } catch (error) {
    console.error('Form submission error:', error);
  }
};


  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'providers', label: 'Providers', icon: Users },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'templates', label: 'Templates', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FileCheck },
    { id: 'pdf-mapping', label: 'PDF Mapping', icon: FileImage },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'audit', label: 'Audit', icon: FileSearch },
    { id: 'manage-users', label: 'Manage Users', icon: UserCheck },
    { id: 'system-settings', label: 'System Settings', icon: Settings },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Active' },
      pending: { bg: 'bg-goldenrod/20', text: 'text-goldenrod', label: 'Pending' },
      expired: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Expired' },
      suspended: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Suspended' },
      completed: { bg: 'bg-green-600/20', text: 'text-green-400', label: 'Completed' },
      in_progress: { bg: 'bg-blue-600/20', text: 'text-blue-400', label: 'In Progress' },
      rejected: { bg: 'bg-red-600/20', text: 'text-red-400', label: 'Rejected' },
      draft: { bg: 'bg-gray-600/20', text: 'text-gray-400', label: 'Draft' },
      archived: { bg: 'bg-gray-600/20', text: 'text-gray-400', label: 'Archived' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Dashboard</h1>
          <p className="text-cream/70 mt-1">Healthcare credentialing overview</p>
        </div>
        <div className="text-sm text-cream/60">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Customizable Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Providers', value: statsLoading ? '...' : stats.totalProviders.toString(), change: '+12%', trend: 'up', icon: Users, color: 'bg-dark-cyan' },
          { title: 'Active Workflows', value: statsLoading ? '...' : stats.activeWorkflows.toString(), change: '+8%', trend: 'up', icon: GitBranch, color: 'bg-dark-cyan' },
          { title: 'Completed Actions', value: statsLoading ? '...' : stats.completedTasks.toString(), change: '+15%', trend: 'up', icon: CheckSquare, color: 'bg-green-600' },
          { title: 'Pending Actions', value: statsLoading ? '...' : stats.pendingTasks.toString(), change: '-5%', trend: 'down', icon: AlertTriangle, color: 'bg-goldenrod' },
        ].map((stat, index) => (
          <div key={index} className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20 hover:border-dark-cyan/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center text-sm ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {stat.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-cream mb-1">{stat.value}</h3>
            <p className="text-cream/70 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity and Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
          <h3 className="text-xl font-semibold text-cream mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { action: 'Provider credential updated', subject: 'Dr. Johnson', time: '2 hours ago', type: 'update' },
              { action: 'New workflow created', subject: 'License Renewal', time: '4 hours ago', type: 'create' },
              { action: 'Compliance check completed', subject: 'North Clinic', time: '6 hours ago', type: 'complete' },
              { action: 'Provider added', subject: 'Dr. Smith', time: '1 day ago', type: 'create' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between text-cream/80 text-sm p-3 bg-navy-dark rounded-lg">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-3 ${
                    activity.type === 'create' ? 'bg-green-400' :
                    activity.type === 'update' ? 'bg-blue-400' :
                    'bg-goldenrod'
                  }`}></div>
                  <span>{activity.action} - {activity.subject}</span>
                </div>
                <span className="text-cream/60 text-xs">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
          <h3 className="text-xl font-semibold text-cream mb-4 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Compliance Status
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-cream/80">Overall Compliance</span>
              <span className="text-green-400 font-semibold">92%</span>
            </div>
            <div className="w-full bg-navy-dark rounded-full h-3">
              <div className="bg-green-400 h-3 rounded-full" style={{width: '92%'}}></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">156</div>
                <div className="text-cream/60 text-sm">Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">14</div>
                <div className="text-cream/60 text-sm">Issues</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
        <h3 className="text-xl font-semibold text-cream mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => openModal('addProvider')}
            className="border-2 border-dashed border-dark-cyan/50 rounded-lg p-6 text-center hover:border-dark-cyan hover:bg-dark-cyan/5 transition-colors"
          >
            <Users className="h-8 w-8 text-dark-cyan mx-auto mb-2" />
            <p className="text-cream font-medium">Add New Provider</p>
          </button>
          <button 
            onClick={() => openModal('addWorkflow')}
            className="border-2 border-dashed border-goldenrod/50 rounded-lg p-6 text-center hover:border-goldenrod hover:bg-goldenrod/5 transition-colors"
          >
            <GitBranch className="h-8 w-8 text-goldenrod mx-auto mb-2" />
            <p className="text-cream font-medium">Create Workflow</p>
          </button>
          <button 
            onClick={() => openModal('runCompliance')}
            className="border-2 border-dashed border-green-500/50 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-500/5 transition-colors"
          >
            <Shield className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-cream font-medium">Run Compliance</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderProviders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Providers</h1>
          <p className="text-cream/70 mt-1">Manage healthcare providers and credentials</p>
        </div>
        <button 
          onClick={() => openModal('addProvider')}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cream/50 pointer-events-none" />
          <input
            type="text"
            placeholder="Search providers…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pr-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
          />
        </div>
        <select
          className="bg-navy-light border border-dark-cyan/30 px-4 py-2 rounded-lg text-cream"
          value={filterSpecialty}
          onChange={(e) => setFilterSpecialty(e.target.value)}
        >
          <option value="">All Specialties</option>
          <option value="PT">PT</option>
          <option value="OT">OT</option>
        </select>

        <select
          className="bg-navy-light border border-dark-cyan/30 px-4 py-2 rounded-lg text-cream"
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value)}
        >
          <option value="">All Locations</option>
          {locations?.map(location => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
        </select>

      </div>

      {/* Provider Tabs */}
      <div className="flex space-x-1 bg-navy-dark rounded-lg p-1">
        {[
          { id: 'active', label: 'Active Providers' },
          { id: 'termed', label: 'Termed Providers' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setProvidersTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              providersTab === tab.id
                ? 'bg-dark-cyan text-white'
                : 'text-cream/70 hover:text-cream hover:bg-navy-light'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Providers List */}
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-dark border-b border-dark-cyan/20">
              <tr>
                <th className="text-left py-4 px-6 text-cream font-medium">Provider</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Specialty</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Location</th>
                <th className="text-left py-4 px-6 text-cream font-medium">NPI</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Status</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Start Date</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders
                .filter(p => providersTab === 'active' ? p.status === 'active' : p.status !== 'active')
                .map((provider) => (

                <tr key={provider.id} className="border-b border-dark-cyan/10 hover:bg-dark-cyan/5">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-dark-cyan rounded-full flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-cream font-medium">{provider.first_name} {provider.last_name}</div>
                        <div className="text-cream/60 text-sm">{provider.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-cream/80">{provider.specialty || 'Not specified'}</td>
                  <td className="py-4 px-6 text-cream/80">{locationNameById.get(provider.location_id) || 'Not assigned'}</td>
                  <td className="py-4 px-6 text-cream/80">NPI-{Math.floor(Math.random() * 1000000)}</td>
                  <td className="py-4 px-6">{getStatusBadge(provider.status)}</td>
                  <td className="py-4 px-6 text-cream/80">{new Date(provider.created_at).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openModal('viewProvider', provider)}
                        className="bg-dark-cyan hover:bg-dark-cyan/80 text-white px-3 py-1 rounded text-sm"
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => openModal('editProvider', provider)}
                        className="bg-goldenrod hover:bg-goldenrod/80 text-navy px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderLocations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Locations</h1>
          <p className="text-cream/70 mt-1">Manage healthcare facility locations</p>
        </div>
        <button 
          onClick={() => openModal('addLocation')}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div key={location.id} className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20 hover:border-dark-cyan/40 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-dark-cyan p-2 rounded-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <button className="text-cream/60 hover:text-cream">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-xl font-semibold text-cream mb-2">{location.name}</h3>
            <p className="text-cream/70 text-sm mb-4">{location.address}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-cream/60">Departments:</span>
                <span className="text-cream">{location.departments}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cream/60">Providers:</span>
                <span className="text-cream">{providers.filter(p => p.location_id === location.id).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-cream/60">NPI:</span>
                <span className="text-cream">NPI-{Math.floor(Math.random() * 1000000)}</span>
              </div>
            </div>

            {/* Specialty Badges */}
            <div className="flex flex-wrap gap-1 mb-4">
              {['Hand Therapy', 'Pelvic Floor', 'Prosthetics'].map((specialty, index) => (
                <span key={index} className="px-2 py-1 bg-dark-cyan/20 text-dark-cyan text-xs rounded-full">
                  {specialty}
                </span>
              ))}
            </div>

            {/* Insurance Badges */}
            <div className="flex flex-wrap gap-1 mb-4">
              {['AHCCCS', 'Medicare', 'BCBS'].map((insurance, index) => (
                <span key={index} className="px-2 py-1 bg-goldenrod/20 text-goldenrod text-xs rounded-full">
                  {insurance}
                </span>
              ))}
            </div>

            <button 
              onClick={() => openModal('viewLocation', location)}
              className="w-full bg-dark-cyan hover:bg-dark-cyan/80 text-white py-2 rounded-lg font-medium"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTasks = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Tasks</h1>
          <p className="text-cream/70 mt-1">Manage workflow tasks and actions</p>
        </div>
        <button 
          onClick={() => openModal('addTask')}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium"
        >
          Create Task
        </button>
      </div>

      {/* Task Tabs */}
      <div className="flex space-x-1 bg-navy-dark rounded-lg p-1">
        {[
          { id: 'pending-provider', label: 'Pending Provider Action' },
          { id: 'pending-applications', label: 'Pending Applications' },
          { id: 'ready-submit', label: 'Ready to Submit' },
          { id: 'submitted', label: 'Submitted' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTasksTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              tasksTab === tab.id
                ? 'bg-dark-cyan text-white'
                : 'text-cream/70 hover:text-cream hover:bg-navy-light'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-dark border-b border-dark-cyan/20">
              <tr>
                <th className="text-left py-4 px-6 text-cream font-medium">Task</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Provider</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Priority</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Status</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Due Date</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-dark-cyan/10 hover:bg-dark-cyan/5">
                  <td className="py-4 px-6">
                    <div className="text-cream font-medium">{task.title}</div>
                    <div className="text-cream/60 text-sm">{task.description}</div>
                  </td>
                  <td className="py-4 px-6 text-cream/80">
                    {task.provider ? `${task.provider.first_name} ${task.provider.last_name}` : 'Not assigned'}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'urgent' ? 'bg-red-600/20 text-red-400' :
                      task.priority === 'high' ? 'bg-orange-600/20 text-orange-400' :
                      task.priority === 'medium' ? 'bg-goldenrod/20 text-goldenrod' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(task.status)}</td>
                  <td className="py-4 px-6 text-cream/80">
                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                  </td>
                  <td className="py-4 px-6">
                    <button 
                      onClick={() => openModal('viewTask', task)}
                      className="bg-dark-cyan hover:bg-dark-cyan/80 text-white px-3 py-1 rounded text-sm"
                    >
                      View Task
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Templates</h1>
          <p className="text-cream/70 mt-1">Manage provider and location templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Templates */}
        <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
          <h3 className="text-xl font-semibold text-cream mb-4 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Provider Templates
          </h3>
          
          <div className="space-y-4">
            <div className="bg-navy-dark rounded-lg p-4">
              <h4 className="text-cream font-medium mb-2">Provider Information</h4>
              
              <div className="ml-4 space-y-3">
                <div>
                  <div className="flex items-center text-cream/80 mb-2">
                    <GitBranch className="h-4 w-4 mr-2" />
                    <span className="font-medium">Triggered Workflows</span>
                  </div>
                  <div className="ml-6 space-y-2">
                    <div className="bg-navy-light rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-cream">Initial Credentialing</span>
                        <button className="text-dark-cyan hover:text-dark-cyan/80">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="ml-4 mt-2 space-y-1 text-sm text-cream/70">
                        <div>• Information Verification</div>
                        <div>• Document Collection</div>
                        <div>• CAQH Application</div>
                        <div>• Insurance Applications</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-cream/80 mb-2">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="font-medium">Required Fields</span>
                  </div>
                  <div className="ml-6 text-sm text-cream/70 space-y-1">
                    <div>• First Name, Last Name</div>
                    <div>• NPI Number</div>
                    <div>• License Number & Expiry</div>
                    <div>• Specialty</div>
                    <div>• Contact Information</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-cream/80 mb-2">
                    <FileCheck className="h-4 w-4 mr-2" />
                    <span className="font-medium">Required Documents</span>
                  </div>
                  <div className="ml-6 text-sm text-cream/70 space-y-1">
                    <div>• Medical License</div>
                    <div>• DEA Certificate</div>
                    <div>• Malpractice Insurance</div>
                    <div>• CV/Resume</div>
                    <div>• Board Certifications</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Templates */}
        <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
          <h3 className="text-xl font-semibold text-cream mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Location Templates
          </h3>
          
          <div className="space-y-4">
            <div className="bg-navy-dark rounded-lg p-4">
              <h4 className="text-cream font-medium mb-2">Location Information</h4>
              
              <div className="ml-4 space-y-3">
                <div>
                  <div className="flex items-center text-cream/80 mb-2">
                    <GitBranch className="h-4 w-4 mr-2" />
                    <span className="font-medium">Triggered Workflows</span>
                  </div>
                  <div className="ml-6 space-y-2">
                    <div className="bg-navy-light rounded p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-cream">Location Setup</span>
                        <button className="text-dark-cyan hover:text-dark-cyan/80">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="ml-4 mt-2 space-y-1 text-sm text-cream/70">
                        <div>• Facility Verification</div>
                        <div>• Insurance Enrollment</div>
                        <div>• State Registration</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-cream/80 mb-2">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="font-medium">Required Fields</span>
                  </div>
                  <div className="ml-6 text-sm text-cream/70 space-y-1">
                    <div>• Location Name</div>
                    <div>• Physical Address</div>
                    <div>• NPI Number</div>
                    <div>• Tax ID</div>
                    <div>• Department Count</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-cream/80 mb-2">
                    <FileCheck className="h-4 w-4 mr-2" />
                    <span className="font-medium">Required Documents</span>
                  </div>
                  <div className="ml-6 text-sm text-cream/70 space-y-1">
                    <div>• Business License</div>
                    <div>• Facility License</div>
                    <div>• Liability Insurance</div>
                    <div>• Accreditation Certificates</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Documents</h1>
          <p className="text-cream/70 mt-1">Manage document expiration thresholds and tracking</p>
        </div>
      </div>

      <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
        <h3 className="text-xl font-semibold text-cream mb-4">Document Expiration Thresholds</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: 'Medical License', threshold: 90, color: 'text-green-400' },
            { name: 'DEA Certificate', threshold: 60, color: 'text-goldenrod' },
            { name: 'Malpractice Insurance', threshold: 30, color: 'text-red-400' },
            { name: 'Board Certification', threshold: 120, color: 'text-blue-400' },
            { name: 'Background Check', threshold: 365, color: 'text-green-400' },
            { name: 'Immunization Records', threshold: 180, color: 'text-goldenrod' },
          ].map((doc, index) => (
            <div key={index} className="bg-navy-dark rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-cream font-medium">{doc.name}</span>
                <button className="text-dark-cyan hover:text-dark-cyan/80">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center">
                <span className="text-cream/70 text-sm mr-2">Alert</span>
                <span className={`font-semibold ${doc.color}`}>{doc.threshold} days</span>
                <span className="text-cream/70 text-sm ml-2">before expiration</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
        <h3 className="text-xl font-semibold text-cream mb-4">Expiring Documents</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-dark border-b border-dark-cyan/20">
              <tr>
                <th className="text-left py-3 px-4 text-cream font-medium">Provider</th>
                <th className="text-left py-3 px-4 text-cream font-medium">Document</th>
                <th className="text-left py-3 px-4 text-cream font-medium">Expiry Date</th>
                <th className="text-left py-3 px-4 text-cream font-medium">Days Left</th>
                <th className="text-left py-3 px-4 text-cream font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { provider: 'Dr. Johnson', document: 'Medical License', expiry: '2024-03-15', days: 45, status: 'warning' },
                { provider: 'Dr. Smith', document: 'DEA Certificate', expiry: '2024-02-28', days: 28, status: 'urgent' },
                { provider: 'Dr. Brown', document: 'Malpractice Insurance', expiry: '2024-04-10', days: 70, status: 'ok' },
              ].map((item, index) => (
                <tr key={index} className="border-b border-dark-cyan/10 hover:bg-dark-cyan/5">
                  <td className="py-3 px-4 text-cream">{item.provider}</td>
                  <td className="py-3 px-4 text-cream/80">{item.document}</td>
                  <td className="py-3 px-4 text-cream/80">{item.expiry}</td>
                  <td className="py-3 px-4 text-cream/80">{item.days} days</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === 'urgent' ? 'bg-red-600/20 text-red-400' :
                      item.status === 'warning' ? 'bg-goldenrod/20 text-goldenrod' :
                      'bg-green-600/20 text-green-400'
                    }`}>
                      {item.status === 'urgent' ? 'Urgent' : item.status === 'warning' ? 'Warning' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPDFMapping = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">PDF Mapping</h1>
          <p className="text-cream/70 mt-1">Map PDF fields with drag-and-drop interface</p>
        </div>
        <button className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center">
          <Upload className="h-4 w-4 mr-2" />
          Map PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { name: 'CAQH Application Form', subflow: 'Initial Credentialing', status: 'mapped' },
          { name: 'Insurance Enrollment Form', subflow: 'Insurance Applications', status: 'mapped' },
          { name: 'Provider Information Form', subflow: 'Document Collection', status: 'draft' },
        ].map((pdf, index) => (
          <div key={index} className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-goldenrod p-2 rounded-lg">
                <FileImage className="h-5 w-5 text-navy" />
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                pdf.status === 'mapped' ? 'bg-green-600/20 text-green-400' : 'bg-goldenrod/20 text-goldenrod'
              }`}>
                {pdf.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-cream mb-2">{pdf.name}</h3>
            <p className="text-cream/70 text-sm mb-4">Subflow: {pdf.subflow}</p>
            <div className="flex space-x-2">
              <button className="flex-1 bg-dark-cyan hover:bg-dark-cyan/80 text-white py-2 rounded-lg font-medium text-sm">
                Preview
              </button>
              <button className="flex-1 bg-navy-dark hover:bg-navy text-cream py-2 rounded-lg font-medium text-sm border border-dark-cyan/30">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
        <h3 className="text-xl font-semibold text-cream mb-4">PDF Mapping Interface</h3>
        <div className="bg-navy-dark rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-cream/40 mx-auto mb-4" />
          <p className="text-cream/60 text-lg mb-2">Upload a PDF to start mapping</p>
          <p className="text-cream/40 text-sm mb-6">Drag and drop fields from templates to map data automatically</p>
          <button className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-6 py-3 rounded-lg font-medium">
            Upload PDF
          </button>
        </div>
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Workflows</h1>
          <p className="text-cream/70 mt-1">Create and manage workflow processes</p>
        </div>
        <button 
          onClick={() => openModal('addWorkflow')}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cream/50" />
        <input
          type="text"
          placeholder="Search workflows..."
          className="w-full pl-10 pr-4 py-2 bg-navy-light border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
        />
      </div>

      {/* Workflow Tabs */}
      <div className="flex space-x-1 bg-navy-dark rounded-lg p-1">
        {[
          { id: 'provider', label: 'Provider Workflows' },
          { id: 'location', label: 'Location Workflows' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setWorkflowsTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              workflowsTab === tab.id
                ? 'bg-dark-cyan text-white'
                : 'text-cream/70 hover:text-cream hover:bg-navy-light'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          {
            name: 'Initial Credentialing',
            type: 'provider',
            status: 'active',
            mode: 'automatic',
            active: 12,
            completed: 45,
            subflows: ['Document Collection', 'Information Verification', 'CAQH Application', 'PTPN Application']
          },
          {
            name: 'Provider Name Change',
            type: 'provider',
            status: 'active',
            mode: 'manual',
            active: 3,
            completed: 8,
            subflows: ['Update Records', 'Notify Insurances', 'Update Credentials']
          },
          {
            name: 'Location Setup',
            type: 'location',
            status: 'active',
            mode: 'automatic',
            active: 2,
            completed: 15,
            subflows: ['Facility Verification', 'Insurance Enrollment', 'State Registration']
          },
          {
            name: 'Provider Term',
            type: 'provider',
            status: 'draft',
            mode: 'manual',
            active: 0,
            completed: 12,
            subflows: ['Final Documentation', 'Insurance Termination', 'Record Archival']
          }
        ].filter(w => w.type === workflowsTab).map((workflow, index) => (
          <div key={index} className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-cream mb-2">{workflow.name}</h3>
                <div className="flex items-center space-x-2 mb-2">
                  {getStatusBadge(workflow.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workflow.mode === 'automatic' ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'
                  }`}>
                    {workflow.mode}
                  </span>
                </div>
              </div>
              <button className="text-cream/60 hover:text-cream">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-goldenrod">{workflow.active}</div>
                <div className="text-cream/60 text-sm">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{workflow.completed}</div>
                <div className="text-cream/60 text-sm">Completed</div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-cream font-medium mb-2">Subflows:</h4>
              <div className="space-y-1">
                {workflow.subflows.map((subflow, idx) => (
                  <div key={idx} className="text-cream/70 text-sm">• {subflow}</div>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button 
                onClick={() => openModal('viewWorkflow', workflow)}
                className="flex-1 bg-dark-cyan hover:bg-dark-cyan/80 text-white py-2 rounded-lg font-medium text-sm"
              >
                Configure
              </button>
              <button className="flex-1 bg-goldenrod hover:bg-goldenrod/80 text-navy py-2 rounded-lg font-medium text-sm">
                Assign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Compliance</h1>
          <p className="text-cream/70 mt-1">Run compliance checks and view results</p>
        </div>
        <button 
          onClick={() => openModal('runCompliance')}
          className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Play className="h-4 w-4 mr-2" />
          Run Compliance Check
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Checks', value: '1,247', icon: Target, color: 'bg-dark-cyan' },
          { title: 'Clear Results', value: '1,156', icon: CheckCircle, color: 'bg-green-600' },
          { title: 'Flagged Results', value: '91', icon: AlertTriangle, color: 'bg-red-600' },
          { title: 'Providers Checked', value: '156', icon: Users, color: 'bg-goldenrod' },
        ].map((stat, index) => (
          <div key={index} className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20 hover:border-dark-cyan/40 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-cream mb-1">{stat.value}</h3>
            <p className="text-cream/70 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Compliance Configuration */}
      <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
        <h3 className="text-xl font-semibold text-cream mb-4">Compliance Check Configuration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-cream font-medium mb-2">Select Providers</label>
            <select className="w-full bg-navy-dark border border-dark-cyan/30 rounded-lg px-3 py-2 text-cream">
              <option>All Providers</option>
              <option>Active Providers Only</option>
              <option>Specific Providers</option>
            </select>
          </div>
          
          <div>
            <label className="block text-cream font-medium mb-2">Check Types</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-dark-cyan/30 mr-2" />
                <span className="text-cream">OIG Exclusion List</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-dark-cyan/30 mr-2" />
                <span className="text-cream">SAM Exclusion List</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Compliance Results */}
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 overflow-hidden">
        <div className="p-6 border-b border-dark-cyan/20">
          <h3 className="text-xl font-semibold text-cream">Recent Compliance Results</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-dark border-b border-dark-cyan/20">
              <tr>
                <th className="text-left py-4 px-6 text-cream font-medium">Provider</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Check Type</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Result</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Date</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { provider: 'Dr. Johnson', type: 'OIG Exclusion', result: 'Clear', date: '2024-01-15' },
                { provider: 'Dr. Smith', type: 'SAM Exclusion', result: 'Flagged', date: '2024-01-15' },
                { provider: 'Dr. Brown', type: 'OIG Exclusion', result: 'Clear', date: '2024-01-14' },
              ].map((result, index) => (
                <tr key={index} className="border-b border-dark-cyan/10 hover:bg-dark-cyan/5">
                  <td className="py-4 px-6 text-cream">{result.provider}</td>
                  <td className="py-4 px-6 text-cream/80">{result.type}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.result === 'Clear' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                    }`}>
                      {result.result}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-cream/80">{result.date}</td>
                  <td className="py-4 px-6">
                    <button className="bg-dark-cyan hover:bg-dark-cyan/80 text-white px-3 py-1 rounded text-sm">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Audit</h1>
          <p className="text-cream/70 mt-1">Track all system activities and changes</p>
        </div>
        <button className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-4 py-2 rounded-lg font-medium flex items-center">
          <Download className="h-4 w-4 mr-2" />
          Export Audit Log
        </button>
      </div>

      {/* Audit Filters */}
      <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
        <h3 className="text-lg font-semibold text-cream mb-4">Filter Audit Log</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-cream font-medium mb-2">Date Range</label>
            <select className="w-full bg-navy-dark border border-dark-cyan/30 rounded-lg px-3 py-2 text-cream">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Custom range</option>
            </select>
          </div>
          
          <div>
            <label className="block text-cream font-medium mb-2">User</label>
            <select className="w-full bg-navy-dark border border-dark-cyan/30 rounded-lg px-3 py-2 text-cream">
              <option>All Users</option>
              <option>Admin Users</option>
              <option>Manager Users</option>
            </select>
          </div>
          
          <div>
            <label className="block text-cream font-medium mb-2">Action Type</label>
            <select className="w-full bg-navy-dark border border-dark-cyan/30 rounded-lg px-3 py-2 text-cream">
              <option>All Actions</option>
              <option>Create</option>
              <option>Update</option>
              <option>Delete</option>
              <option>Login</option>
            </select>
          </div>
          
          <div>
            <label className="block text-cream font-medium mb-2">Entity</label>
            <select className="w-full bg-navy-dark border border-dark-cyan/30 rounded-lg px-3 py-2 text-cream">
              <option>All Entities</option>
              <option>Providers</option>
              <option>Locations</option>
              <option>Workflows</option>
              <option>Tasks</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cream/50" />
            <input
              type="text"
              placeholder="Search audit log..."
              className="w-full pl-10 pr-4 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-dark border-b border-dark-cyan/20">
              <tr>
                <th className="text-left py-4 px-6 text-cream font-medium">Timestamp</th>
                <th className="text-left py-4 px-6 text-cream font-medium">User</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Action</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Entity</th>
                <th className="text-left py-4 px-6 text-cream font-medium">Details</th>
                <th className="text-left py-4 px-6 text-cream font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {[
                { timestamp: '2024-01-15 14:30:25', user: 'admin@npiq.com', action: 'CREATE', entity: 'Provider', details: 'Created Dr. Johnson', ip: '192.168.1.100' },
                { timestamp: '2024-01-15 14:25:12', user: 'manager@npiq.com', action: 'UPDATE', entity: 'Location', details: 'Updated Main Hospital address', ip: '192.168.1.101' },
                { timestamp: '2024-01-15 14:20:45', user: 'admin@npiq.com', action: 'LOGIN', entity: 'User', details: 'Successful login', ip: '192.168.1.100' },
                { timestamp: '2024-01-15 14:15:33', user: 'user@npiq.com', action: 'VIEW', entity: 'Provider', details: 'Viewed Dr. Smith profile', ip: '192.168.1.102' },
              ].map((log, index) => (
                <tr key={index} className="border-b border-dark-cyan/10 hover:bg-dark-cyan/5">
                  <td className="py-4 px-6 text-cream/80 font-mono text-sm">{log.timestamp}</td>
                  <td className="py-4 px-6 text-cream">{log.user}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      log.action === 'CREATE' ? 'bg-green-600/20 text-green-400' :
                      log.action === 'UPDATE' ? 'bg-blue-600/20 text-blue-400' :
                      log.action === 'DELETE' ? 'bg-red-600/20 text-red-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-cream/80">{log.entity}</td>
                  <td className="py-4 px-6 text-cream/80">{log.details}</td>
                  <td className="py-4 px-6 text-cream/80 font-mono text-sm">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderManageUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-cream">Manage Users</h1>
          <p className="text-cream/70 mt-1">Manage user accounts and permissions</p>
        </div>
        <button 
          onClick={() => openModal('addUser')}
          className="bg-dark-cyan hover:bg-dark-cyan/80 text-white px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-cream/50" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          className="w-full pl-10 pr-4 py-3 bg-navy-light border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
        />
      </div>

      {/* Users Table */}
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy-dark border-b border-dark-cyan/20">
              <tr>
                <th className="text-left py-4 px-6 text-cream font-medium">USER</th>
                <th className="text-left py-4 px-6 text-cream font-medium">ROLE</th>
                <th className="text-left py-4 px-6 text-cream font-medium">STATUS</th>
                <th className="text-left py-4 px-6 text-cream font-medium">LAST LOGIN</th>
                <th className="text-left py-4 px-6 text-cream font-medium">CREATED</th>
                <th className="text-left py-4 px-6 text-cream font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Admin User', email: 'admin@npiq.com', role: 'admin', status: 'active', lastLogin: '2024-01-15', created: '2024-01-01' },
                { name: 'Manager User', email: 'manager@npiq.com', role: 'manager', status: 'active', lastLogin: '2024-01-14', created: '2024-01-02' },
                { name: 'Regular User', email: 'user@npiq.com', role: 'user', status: 'inactive', lastLogin: '2024-01-10', created: '2024-01-03' },
              ].map((user, index) => (
                <tr key={index} className="border-b border-dark-cyan/10 hover:bg-dark-cyan/5">
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-dark-cyan rounded-full flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-cream font-medium">{user.name}</div>
                        <div className="text-cream/60 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-600/20 text-red-400' :
                      user.role === 'manager' ? 'bg-goldenrod/20 text-goldenrod' :
                      'bg-blue-600/20 text-blue-400'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6">{getStatusBadge(user.status)}</td>
                  <td className="py-4 px-6 text-cream/80">{user.lastLogin}</td>
                  <td className="py-4 px-6 text-cream/80">{user.created}</td>
                  <td className="py-4 px-6">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openModal('editUser', user)}
                        className="bg-goldenrod hover:bg-goldenrod/80 text-navy px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button className="bg-red-600 hover:bg-red-600/80 text-white px-3 py-1 rounded text-sm">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-cream">System Settings</h1>
        <p className="text-cream/70 mt-1">Configure system-wide preferences and options</p>
      </div>

      {/* Settings Tabs */}
      <div className="flex flex-wrap gap-1 bg-navy-dark rounded-lg p-1">
        {[
          { id: 'general', label: 'General', icon: Settings },
          { id: 'organization', label: 'Organization', icon: Building },
          { id: 'compliance', label: 'Compliance', icon: Shield },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security', icon: Lock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSettingsTab(tab.id)}
            className={`flex items-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              settingsTab === tab.id
                ? 'bg-dark-cyan text-white'
                : 'text-cream/70 hover:text-cream hover:bg-navy-light'
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Settings Content */}
      <div className="bg-navy-light rounded-lg p-6 border border-dark-cyan/20">
        {settingsTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-cream font-medium mb-2">Organization Name</label>
              <input
                type="text"
                defaultValue="NPIQ Healthcare"
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
              />
            </div>

            <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
              <h3 className="text-cream font-semibold mb-2">System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-cream/70">DB Status:</span>
                  <span className={isOnline ? 'text-green-400' : 'text-goldenrod'}>
                    {isOnline ? 'Connected' : 'Local Mode'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/70">Records:</span>
                  <span className="text-cream">{stats.totalProviders + stats.activeWorkflows + stats.completedTasks + stats.pendingTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/70">Version:</span>
                  <span className="text-cream">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/70">Last Updated:</span>
                  <span className="text-cream">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'organization' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cream font-medium mb-2">Organization NPI</label>
                <input
                  type="text"
                  placeholder="1234567890"
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
                />
              </div>
              <div>
                <label className="block text-cream font-medium mb-2">Tax ID (TIN)</label>
                <input
                  type="text"
                  placeholder="12-3456789"
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
                />
              </div>
            </div>

            <div>
              <h3 className="text-cream font-semibold mb-4">Linked Providers and Locations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-navy-dark rounded-lg p-4">
                  <h4 className="text-cream font-medium mb-2">Providers: {providers.length}</h4>
                  <div className="text-cream/70 text-sm">
                    Active: {providers.filter(p => p.status === 'active').length}
                  </div>
                </div>
                <div className="bg-navy-dark rounded-lg p-4">
                  <h4 className="text-cream font-medium mb-2">Locations: {locations.length}</h4>
                  <div className="text-cream/70 text-sm">
                    Active: {locations.filter(l => l.status === 'active').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'compliance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cream font-medium mb-2">OIG Check Frequency (days)</label>
                <input
                  type="number"
                  defaultValue="30"
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
                />
              </div>
              <div>
                <label className="block text-cream font-medium mb-2">SAM Check Frequency (days)</label>
                <input
                  type="number"
                  defaultValue="30"
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-cream font-medium mb-2">Document Expiration Threshold (days)</label>
              <input
                type="number"
                defaultValue="90"
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
              />
              <p className="text-cream/60 text-sm mt-1">Alert when documents expire within this timeframe</p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="rounded border-dark-cyan/30" />
                <span className="text-cream">Auto-run compliance checks</span>
              </label>
              <p className="text-cream/60 text-sm mt-1">Automatically run compliance checks based on frequency settings</p>
            </div>
          </div>
        )}

        {settingsTab === 'notifications' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded border-dark-cyan/30" />
                  <span className="text-cream font-medium">Email notifications</span>
                </label>
                <p className="text-cream/60 text-sm mt-1 ml-6">Send email notifications for important events</p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded border-dark-cyan/30" />
                  <span className="text-cream font-medium">Workflow alerts</span>
                </label>
                <p className="text-cream/60 text-sm mt-1 ml-6">Notify when workflows require attention</p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded border-dark-cyan/30" />
                  <span className="text-cream font-medium">Compliance alerts</span>
                </label>
                <p className="text-cream/60 text-sm mt-1 ml-6">Alert on compliance check failures or document expirations</p>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded border-dark-cyan/30" />
                  <span className="text-cream font-medium">System maintenance notifications</span>
                </label>
                <p className="text-cream/60 text-sm mt-1 ml-6">Notify about scheduled maintenance and updates</p>
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-cream font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  defaultValue="60"
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
                />
              </div>
              <div>
                <label className="block text-cream font-medium mb-2">Password Expiry (days)</label>
                <input
                  type="number"
                  defaultValue="90"
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
                />
              </div>
            </div>

            <div>
              <label className="block text-cream font-medium mb-2">Audit Log Retention (days)</label>
              <input
                type="number"
                defaultValue="365"
                className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
              />
              <p className="text-cream/60 text-sm mt-1">How long to keep audit log entries</p>
            </div>

            <div>
              <label className="flex items-center space-x-3">
                <input type="checkbox" className="rounded border-dark-cyan/30" />
                <span className="text-cream">Require two-factor authentication</span>
              </label>
              <p className="text-cream/60 text-sm mt-1">Require 2FA for all user accounts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'providers':
        return renderProviders();
      case 'locations':
        return renderLocations();
      case 'tasks':
        return renderTasks();
      case 'templates':
        return renderTemplates();
      case 'documents':
        return renderDocuments();
      case 'pdf-mapping':
        return renderPDFMapping();
      case 'workflows':
        return renderWorkflows();
      case 'compliance':
        return renderCompliance();
      case 'audit':
        return renderAudit();
      case 'manage-users':
        return renderManageUsers();
      case 'system-settings':
        return renderSystemSettings();
      default:
        return renderDashboard();
    }
  };



  return (
    <AuthWrapper>
      <div className="min-h-screen bg-navy flex">
        {/* Sidebar */}
        <div className="w-64 bg-navy-dark border-r border-dark-cyan/20 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-dark-cyan/20">
            <h1 className="text-2xl font-bold text-cream">NPIQ</h1>
            <p className="text-cream/60 text-sm mt-1">Healthcare Credentialing</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-dark-cyan text-white'
                    : 'text-cream/70 hover:text-cream hover:bg-navy-light'
                }`}
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={modals.addProvider}
        onClose={() => closeModal('addProvider')}
        title="Add New Provider"
        size="lg"
      >
        <ProviderForm
          data={formData}
          onChange={setFormData}
          onSubmit={(data) => handleFormSubmit('addProvider', data)}
          onCancel={() => closeModal('addProvider')}
          locations={locations}
        />
      </Modal>

      <Modal
        isOpen={modals.editProvider}
        onClose={() => closeModal('editProvider')}
        title="Edit Provider"
        size="lg"
      >
        <ProviderForm
          data={formData}
          onChange={setFormData}
          onSubmit={(data) => handleFormSubmit('editProvider', data)}
          onCancel={() => closeModal('editProvider')}
          locations={locations}
        />
      </Modal>

      <Modal
        isOpen={modals.viewProvider}
        onClose={() => closeModal('viewProvider')}
        title="Provider Profile"
        size="xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cream">Basic Information</h3>
                <div className="space-y-2">
                  <div><span className="text-cream/70">Name:</span> <span className="text-cream">{selectedItem.first_name} {selectedItem.last_name}</span></div>
                  <div><span className="text-cream/70">Email:</span> <span className="text-cream">{selectedItem.email || 'Not provided'}</span></div>
                  <div><span className="text-cream/70">Phone:</span> <span className="text-cream">{selectedItem.phone || 'Not provided'}</span></div>
                  <div><span className="text-cream/70">Specialty:</span> <span className="text-cream">{selectedItem.specialty || 'Not specified'}</span></div>
                  <div><span className="text-cream/70">NPI:</span> <span className="text-cream">NPI-{Math.floor(Math.random() * 1000000)}</span></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cream">Credentials</h3>
                <div className="space-y-2">
                  <div><span className="text-cream/70">License #:</span> <span className="text-cream">{selectedItem.license_number || 'Not provided'}</span></div>
                  <div><span className="text-cream/70">License Expiry:</span> <span className="text-cream">{selectedItem.license_expiry || 'Not provided'}</span></div>
                  <div><span className="text-cream/70">Start Date:</span> <span className="text-cream">{new Date(selectedItem.created_at).toLocaleDateString()}</span></div>
                  <div><span className="text-cream/70">Location:</span> <span className="text-cream">{selectedItem.location?.name || 'Not assigned'}</span></div>
                  <div><span className="text-cream/70">Status:</span> {getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cream">Insurance Applications</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-navy-dark">
                    <tr>
                      <th className="text-left py-2 px-4 text-cream font-medium">Insurance</th>
                      <th className="text-left py-2 px-4 text-cream font-medium">Submitted</th>
                      <th className="text-left py-2 px-4 text-cream font-medium">Approved</th>
                      <th className="text-left py-2 px-4 text-cream font-medium">Loaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['AHCCCS', 'BCBS', 'Cigna ASH', 'HMA', 'Medicare', 'CAQH', 'Mercy Care'].map((insurance, index) => (
                      <tr key={index} className="border-b border-dark-cyan/10">
                        <td className="py-2 px-4 text-cream">{insurance}</td>
                        <td className="py-2 px-4 text-cream/80">2024-01-{10 + index}</td>
                        <td className="py-2 px-4 text-cream/80">2024-01-{15 + index}</td>
                        <td className="py-2 px-4 text-cream/80">2024-01-{20 + index}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  closeModal('viewProvider');
                  openModal('editProvider', selectedItem);
                }}
                className="px-4 py-2 bg-goldenrod text-navy rounded-lg hover:bg-goldenrod/90 font-medium"
              >
                Edit Provider
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modals.addLocation}
        onClose={() => closeModal('addLocation')}
        title="Add New Location"
      >
        <LocationForm
          data={formData}
          onChange={setFormData}
          onSubmit={(data) => handleFormSubmit('addLocation', data)}
          onCancel={() => closeModal('addLocation')}
        />
      </Modal>

      <Modal
        isOpen={modals.viewLocation}
        onClose={() => closeModal('viewLocation')}
        title="Location Details"
        size="lg"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cream">Location Information</h3>
                <div className="space-y-2">
                  <div><span className="text-cream/70">Name:</span> <span className="text-cream">{selectedItem.name}</span></div>
                  <div><span className="text-cream/70">Address:</span> <span className="text-cream">{selectedItem.address || 'Not provided'}</span></div>
                  <div><span className="text-cream/70">Departments:</span> <span className="text-cream">{selectedItem.departments}</span></div>
                  <div><span className="text-cream/70">Status:</span> {getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cream">Additional Details</h3>
                <div className="space-y-2">
                  <div><span className="text-cream/70">NPI:</span> <span className="text-cream">NPI-{Math.floor(Math.random() * 1000000)}</span></div>
                  <div><span className="text-cream/70">DOL#:</span> <span className="text-cream">DOL-{Math.floor(Math.random() * 100000)}</span></div>
                  <div><span className="text-cream/70">Phone:</span> <span className="text-cream">(555) 123-4567</span></div>
                  <div><span className="text-cream/70">Fax:</span> <span className="text-cream">(555) 123-4568</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cream">Providers at this Location</h3>
              <div className="space-y-2">
                {providers.filter(p => p.location_id === selectedItem.id).map(provider => (
                  <div key={provider.id} className="flex justify-between items-center p-3 bg-navy-dark rounded-lg">
                    <span className="text-cream">{provider.first_name} {provider.last_name}</span>
                    <span className="text-cream/70">{provider.specialty}</span>
                  </div>
                ))}
                {providers.filter(p => p.location_id === selectedItem.id).length === 0 && (
                  <p className="text-cream/60">No providers assigned to this location</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modals.runCompliance}
        onClose={() => closeModal('runCompliance')}
        title="Run Compliance Check"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-cream font-medium mb-2">Select Providers</label>
            <select className="w-full bg-navy-dark border border-dark-cyan/30 rounded-lg px-3 py-2 text-cream">
              <option>All Active Providers</option>
              <option>Specific Providers</option>
              <option>By Location</option>
            </select>
          </div>
          
          <div>
            <label className="block text-cream font-medium mb-2">Check Types</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-dark-cyan/30 mr-2" />
                <span className="text-cream">OIG Exclusion List</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" defaultChecked className="rounded border-dark-cyan/30 mr-2" />
                <span className="text-cream">SAM Exclusion List</span>
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => closeModal('runCompliance')}
              className="px-4 py-2 bg-navy-dark text-cream rounded-lg hover:bg-navy border border-dark-cyan/30"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Simulate compliance check
                setTimeout(() => {
                  closeModal('runCompliance');
                  setActiveTab('compliance');
                }, 1000);
              }}
              className="px-4 py-2 bg-goldenrod text-navy rounded-lg hover:bg-goldenrod/90 font-medium"
            >
              Run Check
            </button>
          </div>
        </div>
      </Modal>
      <Diagnostics />
    </AuthWrapper>
  );
};

export default App;