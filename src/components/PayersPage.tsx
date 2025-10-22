import React, { useState } from 'react';
import { usePayers, useProviders, useProviderPayerApplications } from '../hooks/useDatabase';
import { CreditCard, Plus, Search, CreditCard as Edit, Trash2, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { Payer } from '../lib/supabase';

interface PayersPageProps {
  initialFilter?: { type: string; value: string } | null;
}

export const PayersPage: React.FC<PayersPageProps> = ({ initialFilter }) => {
  const { payers, loading, error, createPayer, updatePayer, deletePayer } = usePayers();
  const { providers } = useProviders();
  const { applications, createApplication } = useProviderPayerApplications();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPayer, setEditingPayer] = useState<Payer | null>(null);
  const [showBulkAssign, setShowBulkAssign] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    type: 'insurance' as const,
    workflow_state: 'ALL' as const,
    description: '',
    status: 'active' as const,
    application_fields: {},
    requires_demographics: false,
    dependent_on_payer_ids: [] as string[]
  });

  const [bulkAssignData, setBulkAssignData] = useState({
    selectedProviders: [] as string[],
    submissionDate: '',
    addToWorkflows: false
  });

  React.useEffect(() => {
    if (initialFilter) {
      if (initialFilter.type === 'action' && initialFilter.value === 'add') {
        setShowAddForm(true);
      } else if (initialFilter.type === 'status') {
        setStatusFilter(initialFilter.value);
      }
    }
  }, [initialFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payerData = {
        ...formData,
        organization_id: 'current-org-id'
      };

      const newPayer = await createPayer(payerData);

      if (bulkAssignData.addToWorkflows) {
        setShowBulkAssign(newPayer.id);
      }

      setShowAddForm(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create payer:', err);
      alert('Failed to create payer. Please try again.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayer) return;

    try {
      await updatePayer(editingPayer.id, formData);
      setShowEditForm(false);
      setEditingPayer(null);
      resetForm();
    } catch (err) {
      console.error('Failed to update payer:', err);
      alert('Failed to update payer. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payer? All associated applications will also be deleted.')) {
      return;
    }

    try {
      await deletePayer(id);
    } catch (err) {
      console.error('Failed to delete payer:', err);
      alert('Failed to delete payer. Please try again.');
    }
  };

  const handleBulkAssign = async () => {
    if (!showBulkAssign) return;

    try {
      const selectedProviderIds = bulkAssignData.selectedProviders.length > 0
        ? bulkAssignData.selectedProviders
        : providers.map(p => p.id);

      for (const providerId of selectedProviderIds) {
        const existingApp = applications.find(
          app => app.provider_id === providerId && app.payer_id === showBulkAssign
        );

        if (!existingApp) {
          await createApplication({
            provider_id: providerId,
            payer_id: showBulkAssign,
            application_submission_date: bulkAssignData.submissionDate || undefined,
            status: bulkAssignData.submissionDate ? 'submitted' : 'not_started',
            notes: ''
          });
        }
      }

      setShowBulkAssign(null);
      setBulkAssignData({
        selectedProviders: [],
        submissionDate: '',
        addToWorkflows: false
      });

      alert(`Payer assigned to ${selectedProviderIds.length} provider(s)`);
    } catch (err) {
      console.error('Failed to bulk assign payer:', err);
      alert('Failed to assign payer to providers. Please try again.');
    }
  };

  const openEditForm = (payer: Payer) => {
    setEditingPayer(payer);
    setFormData({
      name: payer.name,
      type: payer.type,
      workflow_state: payer.workflow_state,
      description: payer.description || '',
      status: payer.status,
      application_fields: payer.application_fields || {},
      requires_demographics: payer.requires_demographics || false,
      dependent_on_payer_ids: payer.dependent_on_payer_ids || []
    });
    setShowEditForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'insurance',
      workflow_state: 'ALL',
      description: '',
      status: 'active',
      application_fields: {},
      requires_demographics: false,
      dependent_on_payer_ids: []
    });
  };

  const toggleProviderSelection = (providerId: string) => {
    setBulkAssignData(prev => ({
      ...prev,
      selectedProviders: prev.selectedProviders.includes(providerId)
        ? prev.selectedProviders.filter(id => id !== providerId)
        : [...prev.selectedProviders, providerId]
    }));
  };

  const selectAllProviders = () => {
    setBulkAssignData(prev => ({
      ...prev,
      selectedProviders: prev.selectedProviders.length === providers.length
        ? []
        : providers.map(p => p.id)
    }));
  };

  const filteredPayers = payers.filter(payer => {
    const matchesSearch = payer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payer.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProviderCountForPayer = (payerId: string) => {
    return applications.filter(app => app.payer_id === payerId).length;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 dark:bg-gray-700 rounded w-32 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-700 p-6">
                <div className="h-4 bg-navy/10 dark:bg-gray-700 rounded w-32 mb-2"></div>
                <div className="h-6 bg-navy/10 dark:bg-gray-700 rounded w-48 mb-4"></div>
                <div className="h-4 bg-navy/10 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">Error loading payers: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-page-bg dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Payers</h1>
            <p className="text-navy/70 dark:text-gray-400">Manage insurance payers and credentialing organizations</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-navy dark:bg-navy-light text-white dark:text-cream rounded-lg hover:bg-navy/90 dark:hover:bg-navy-dark transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Payer
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy/40 dark:text-gray-500 h-5 w-5" />
          <input
            type="text"
            placeholder="Search payers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-light dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-light dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPayers.map((payer) => (
          <div
            key={payer.id}
            className="bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <CreditCard className="h-8 w-8 text-dark-cyan dark:text-dark-cyan mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-navy dark:text-white">{payer.name}</h3>
                  <p className="text-sm text-navy/60 dark:text-gray-400 capitalize">{payer.type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditForm(payer)}
                  className="p-2 text-dark-cyan dark:text-dark-cyan hover:bg-dark-cyan/10 dark:hover:bg-dark-cyan/20 rounded transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(payer.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {payer.description && (
              <p className="text-sm text-navy/70 dark:text-gray-400 mb-4">{payer.description}</p>
            )}

            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-navy/60 dark:text-gray-400">State:</span>
              <span className="font-medium text-navy dark:text-white">{payer.workflow_state}</span>
            </div>

            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-navy/60 dark:text-gray-400">Providers:</span>
              <span className="font-medium text-navy dark:text-white">{getProviderCountForPayer(payer.id)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                payer.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {payer.status === 'active' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {payer.status}
              </span>
              <button
                onClick={() => setShowBulkAssign(payer.id)}
                className="text-sm text-dark-cyan dark:text-dark-cyan hover:underline"
              >
                Assign to Providers
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPayers.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 text-navy/20 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-navy/60 dark:text-gray-400 text-lg">No payers found</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-4 text-dark-cyan dark:text-dark-cyan hover:underline"
          >
            Add your first payer
          </button>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-light rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-navy dark:text-white mb-6">Add New Payer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Payer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                  placeholder="e.g., CAQH, Medicare, AHCCCS"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                >
                  <option value="insurance">Insurance</option>
                  <option value="credentialing">Credentialing</option>
                  <option value="government">Government</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Workflow State <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.workflow_state}
                  onChange={(e) => setFormData({ ...formData, workflow_state: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                >
                  <option value="ALL">All States</option>
                  <option value="AZ">Arizona (AZ)</option>
                  <option value="TX">Texas (TX)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="addToWorkflows"
                  checked={bulkAssignData.addToWorkflows}
                  onChange={(e) => setBulkAssignData({ ...bulkAssignData, addToWorkflows: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="addToWorkflows" className="text-sm text-navy dark:text-gray-300">
                  Add to existing workflows (assign to providers)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-navy dark:bg-dark-cyan text-white rounded-lg hover:bg-navy/90 dark:hover:bg-dark-cyan/80 transition-colors"
                >
                  Add Payer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-navy-dark text-navy dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-navy transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && editingPayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-light rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-navy dark:text-white mb-6">Edit Payer</h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Payer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                >
                  <option value="insurance">Insurance</option>
                  <option value="credentialing">Credentialing</option>
                  <option value="government">Government</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Workflow State <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.workflow_state}
                  onChange={(e) => setFormData({ ...formData, workflow_state: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                >
                  <option value="ALL">All States</option>
                  <option value="AZ">Arizona (AZ)</option>
                  <option value="TX">Texas (TX)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresDemographics"
                  checked={formData.requires_demographics}
                  onChange={(e) => setFormData({ ...formData, requires_demographics: e.target.checked })}
                  className="mr-2 h-4 w-4 text-dark-cyan focus:ring-dark-cyan border-navy/20 dark:border-dark-cyan/30 rounded"
                />
                <label htmlFor="requiresDemographics" className="text-sm text-navy dark:text-gray-300">
                  Requires demographic information
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Dependent on Other Applications
                </label>
                <select
                  multiple
                  value={formData.dependent_on_payer_ids}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({ ...formData, dependent_on_payer_ids: selected });
                  }}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                  size={4}
                >
                  {payers.filter(p => p.id !== editingPayer?.id).map(payer => (
                    <option key={payer.id} value={payer.id}>
                      {payer.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-navy/60 dark:text-gray-400 mt-1">
                  Hold Ctrl/Cmd to select multiple. Applications for this payer will be blocked until selected payers are approved.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-navy dark:bg-dark-cyan text-white rounded-lg hover:bg-navy/90 dark:hover:bg-dark-cyan/80 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingPayer(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-navy-dark text-navy dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-navy transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkAssign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-light rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-navy dark:text-white mb-6">Assign Payer to Providers</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-2">
                Submission Date (Optional)
              </label>
              <input
                type="date"
                value={bulkAssignData.submissionDate}
                onChange={(e) => setBulkAssignData({ ...bulkAssignData, submissionDate: e.target.value })}
                className="w-full px-3 py-2 border border-navy/20 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-navy/60 dark:text-gray-400 mt-1">
                Set a bulk submission date for all selected providers
              </p>
            </div>

            <div className="mb-4 flex items-center justify-between border-b border-navy/10 dark:border-gray-700 pb-2">
              <h3 className="font-semibold text-navy dark:text-white">Select Providers</h3>
              <button
                onClick={selectAllProviders}
                className="text-sm text-dark-cyan dark:text-dark-cyan hover:underline"
              >
                {bulkAssignData.selectedProviders.length === providers.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
              {providers.map((provider) => (
                <label
                  key={provider.id}
                  className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-navy-dark rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={bulkAssignData.selectedProviders.includes(provider.id)}
                    onChange={() => toggleProviderSelection(provider.id)}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-navy dark:text-white">
                      {provider.first_name} {provider.last_name}
                    </p>
                    {provider.specialty && (
                      <p className="text-sm text-navy/60 dark:text-gray-400">{provider.specialty}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBulkAssign}
                disabled={bulkAssignData.selectedProviders.length === 0 && providers.length > 0}
                className="flex-1 px-4 py-2 bg-navy dark:bg-dark-cyan text-white rounded-lg hover:bg-navy/90 dark:hover:bg-dark-cyan/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign to {bulkAssignData.selectedProviders.length || providers.length} Provider(s)
              </button>
              <button
                onClick={() => {
                  setShowBulkAssign(null);
                  setBulkAssignData({
                    selectedProviders: [],
                    submissionDate: '',
                    addToWorkflows: false
                  });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-navy-dark text-navy dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-navy transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
