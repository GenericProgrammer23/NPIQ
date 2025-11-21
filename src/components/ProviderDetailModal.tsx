import React, { useState, useEffect } from 'react';
import { Provider, Payer, ProviderPayerApplication } from '../lib/supabase';
import { useProviderPayerApplications, usePayers, useLocations } from '../hooks/useDatabase';
import { X, CheckCircle, Clock, AlertCircle, Ban, Edit2, Save } from 'lucide-react';
import { DatabaseService } from '../lib/supabase';

interface ProviderDetailModalProps {
  provider: Provider;
  onClose: () => void;
  onUpdate: () => void;
  highlightMissingFields?: string[];
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  onClose,
  onUpdate,
  highlightMissingFields = []
}) => {
  const { applications: rawApplications, loading: appsLoading, refetch: refetchApplications } = useProviderPayerApplications({
    providerId: provider.id
  });

  // Sort applications alphabetically by payer name
  const applications = [...rawApplications].sort((a, b) =>
    (a.payer?.name || '').localeCompare(b.payer?.name || '')
  );
  const { payers } = usePayers();
  const { locations } = useLocations();
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [appUpdates, setAppUpdates] = useState<Record<string, Partial<ProviderPayerApplication>>>({});
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [providerData, setProviderData] = useState({
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
  const [savingProvider, setSavingProvider] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started':
        return <Ban className="h-4 w-4 text-gray-400" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'loaded':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'loaded':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateApplication = async (appId: string) => {
    const updates = appUpdates[appId];
    if (!updates) return;

    try {
      await DatabaseService.updateProviderPayerApplication(appId, updates);
      await refetchApplications();
      setEditingApp(null);
      setAppUpdates({});
      onUpdate();
    } catch (err) {
      console.error('Failed to update application:', err);
      alert('Failed to update application');
    }
  };

  const setAppUpdate = (appId: string, field: string, value: any) => {
    setAppUpdates(prev => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        [field]: value
      }
    }));
  };

  const handleSaveProvider = async () => {
    try {
      setSavingProvider(true);
      await DatabaseService.updateProvider(provider.id, providerData);
      await onUpdate();
      setIsEditingProvider(false);

      // Check if missing fields were filled and ask to complete tasks
      const filledFields = highlightMissingFields.filter(field => {
        return providerData[field as keyof typeof providerData] && providerData[field as keyof typeof providerData] !== '';
      });

      if (filledFields.length > 0) {
        alert(`Great! You've completed ${filledFields.length} required field(s). Related tasks can now be marked as complete.`);
      }
    } catch (err) {
      console.error('Failed to update provider:', err);
      alert('Failed to update provider information');
    } finally {
      setSavingProvider(false);
    }
  };

  const handleCancelEdit = () => {
    setProviderData({
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
    setIsEditingProvider(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-navy-light rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-navy/10 dark:border-dark-cyan/30">
          <div>
            <h2 className="text-2xl font-bold text-navy dark:text-white">
              {provider.first_name} {provider.last_name}
            </h2>
            <p className="text-navy/60 dark:text-gray-400">{provider.specialty || 'No specialty'}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditingProvider ? (
              <button
                onClick={() => setIsEditingProvider(true)}
                className="px-4 py-2 bg-dark-cyan hover:bg-dark-cyan/90 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={handleSaveProvider}
                  disabled={savingProvider}
                  className="px-4 py-2 bg-goldenrod hover:bg-goldenrod/90 text-navy rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {savingProvider ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={savingProvider}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-navy dark:text-cream rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-navy/5 dark:hover:bg-navy-dark rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-navy dark:text-white" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {highlightMissingFields.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Missing Required Information</h4>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    Please complete the following fields: {highlightMissingFields.map(f => f.replace('_', ' ')).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={highlightMissingFields.includes('email') ? 'bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-2 border-red-300 dark:border-red-700' : ''}>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400 flex items-center gap-1">
                Email
                {highlightMissingFields.includes('email') && <span className="text-red-600">*</span>}
              </label>
              {isEditingProvider ? (
                <input
                  type="email"
                  value={providerData.email}
                  onChange={(e) => setProviderData({ ...providerData, email: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="provider@example.com"
                />
              ) : (
                <p className="text-navy dark:text-white">{provider.email || 'N/A'}</p>
              )}
            </div>
            <div className={highlightMissingFields.includes('phone') ? 'bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-2 border-red-300 dark:border-red-700' : ''}>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400 flex items-center gap-1">
                Phone
                {highlightMissingFields.includes('phone') && <span className="text-red-600">*</span>}
              </label>
              {isEditingProvider ? (
                <input
                  type="tel"
                  value={providerData.phone}
                  onChange={(e) => setProviderData({ ...providerData, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="(555) 123-4567"
                />
              ) : (
                <p className="text-navy dark:text-white">{provider.phone || 'N/A'}</p>
              )}
            </div>
            <div className={highlightMissingFields.includes('license_number') ? 'bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-2 border-red-300 dark:border-red-700' : ''}>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400 flex items-center gap-1">
                License Number
                {highlightMissingFields.includes('license_number') && <span className="text-red-600">*</span>}
              </label>
              {isEditingProvider ? (
                <input
                  type="text"
                  value={providerData.license_number}
                  onChange={(e) => setProviderData({ ...providerData, license_number: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                  placeholder="LIC-12345"
                />
              ) : (
                <p className="text-navy dark:text-white">{provider.license_number || 'N/A'}</p>
              )}
            </div>
            <div className={highlightMissingFields.includes('specialty') ? 'bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border-2 border-red-300 dark:border-red-700' : ''}>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400 flex items-center gap-1">
                Specialty
                {highlightMissingFields.includes('specialty') && <span className="text-red-600">*</span>}
              </label>
              {isEditingProvider ? (
                <select
                  value={providerData.specialty}
                  onChange={(e) => setProviderData({ ...providerData, specialty: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="">Select Specialty</option>
                  <option value="Physical Therapy">Physical Therapy</option>
                  <option value="Occupational Therapy">Occupational Therapy</option>
                  <option value="Speech Therapy">Speech Therapy</option>
                </select>
              ) : (
                <p className="text-navy dark:text-white">{provider.specialty || 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400">License Expiry</label>
              {isEditingProvider ? (
                <input
                  type="date"
                  value={providerData.license_expiry?.split('T')[0] || ''}
                  onChange={(e) => setProviderData({ ...providerData, license_expiry: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                />
              ) : (
                <p className="text-navy dark:text-white">{provider.license_expiry ? new Date(provider.license_expiry).toLocaleDateString() : 'N/A'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400">Location</label>
              {isEditingProvider ? (
                <select
                  value={providerData.location_id}
                  onChange={(e) => setProviderData({ ...providerData, location_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="">No Location</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              ) : (
                <p className="text-navy dark:text-white">{provider.location?.name || 'No location'}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400">Status</label>
              {isEditingProvider ? (
                <select
                  value={providerData.status}
                  onChange={(e) => setProviderData({ ...providerData, status: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                  <option value="suspended">Suspended</option>
                </select>
              ) : (
                <p className="text-navy dark:text-white capitalize">{provider.status}</p>
              )}
            </div>
          </div>

          <div className="border-t border-navy/10 dark:border-dark-cyan/30 pt-6">
            <h3 className="text-xl font-semibold text-navy dark:text-white mb-4">Payer Application Status</h3>

            {appsLoading ? (
              <div className="text-center py-8">
                <p className="text-navy/60 dark:text-gray-400">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-navy/60 dark:text-gray-400">No payer applications yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-navy/10 dark:border-dark-cyan/30">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-navy dark:text-white">Payer</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-navy dark:text-white">Submitted</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-navy dark:text-white">Approved</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-navy dark:text-white">Loaded</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-navy dark:text-white">Effective Date</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-navy dark:text-white w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const formatDate = (dateString: string | null) => {
                        if (!dateString) return '';
                        const date = new Date(dateString);
                        return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                      };

                      const formatDateForInput = (dateString: string | null) => {
                        if (!dateString) return '';
                        return dateString.split('T')[0];
                      };

                      const isEditing = editingApp === app.id;

                      return (
                        <tr key={app.id} className="border-b border-navy/10 dark:border-dark-cyan/30 hover:bg-navy/5 dark:hover:bg-navy-dark">
                          <td className="py-3 px-4">
                            <span className="font-medium text-navy dark:text-white">
                              {app.payer?.name || 'Unknown Payer'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {isEditing ? (
                              <input
                                type="date"
                                value={formatDateForInput(appUpdates[app.id]?.application_submission_date ?? app.application_submission_date)}
                                onChange={(e) => setAppUpdate(app.id, 'application_submission_date', e.target.value || null)}
                                className="px-2 py-1 border border-navy/20 dark:border-dark-cyan/30 rounded text-center bg-white dark:bg-navy-dark text-navy dark:text-cream"
                              />
                            ) : (
                              <span className="text-navy dark:text-cream cursor-pointer hover:bg-dark-cyan/10 px-2 py-1 rounded" onClick={() => setEditingApp(app.id)}>
                                {formatDate(app.application_submission_date)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {isEditing ? (
                              <input
                                type="date"
                                value={formatDateForInput(appUpdates[app.id]?.application_approved_date ?? app.application_approved_date)}
                                onChange={(e) => setAppUpdate(app.id, 'application_approved_date', e.target.value || null)}
                                className="px-2 py-1 border border-navy/20 dark:border-dark-cyan/30 rounded text-center bg-white dark:bg-navy-dark text-navy dark:text-cream"
                              />
                            ) : (
                              <span className="text-navy dark:text-cream cursor-pointer hover:bg-dark-cyan/10 px-2 py-1 rounded" onClick={() => setEditingApp(app.id)}>
                                {formatDate(app.application_approved_date)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {isEditing ? (
                              <input
                                type="date"
                                value={formatDateForInput(appUpdates[app.id]?.provider_loaded_date ?? app.provider_loaded_date)}
                                onChange={(e) => setAppUpdate(app.id, 'provider_loaded_date', e.target.value || null)}
                                className="px-2 py-1 border border-navy/20 dark:border-dark-cyan/30 rounded text-center bg-white dark:bg-navy-dark text-navy dark:text-cream"
                              />
                            ) : (
                              <span className="text-navy dark:text-cream cursor-pointer hover:bg-dark-cyan/10 px-2 py-1 rounded" onClick={() => setEditingApp(app.id)}>
                                {formatDate(app.provider_loaded_date)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-sm">
                            {isEditing ? (
                              <input
                                type="date"
                                value={formatDateForInput(appUpdates[app.id]?.effective_date ?? app.effective_date)}
                                onChange={(e) => setAppUpdate(app.id, 'effective_date', e.target.value || null)}
                                className="px-2 py-1 border border-navy/20 dark:border-dark-cyan/30 rounded text-center bg-white dark:bg-navy-dark text-navy dark:text-cream"
                              />
                            ) : (
                              <span className="text-navy dark:text-cream cursor-pointer hover:bg-dark-cyan/10 px-2 py-1 rounded" onClick={() => setEditingApp(app.id)}>
                                {formatDate(app.effective_date)}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isEditing ? (
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() => handleUpdateApplication(app.id)}
                                  className="px-3 py-1 bg-goldenrod hover:bg-goldenrod/90 text-navy rounded text-sm font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingApp(null);
                                    setAppUpdates({});
                                  }}
                                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-navy dark:text-cream rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingApp(app.id)}
                                className="p-1 text-navy/60 dark:text-cream/60 hover:text-navy dark:hover:text-cream hover:bg-navy/10 dark:hover:bg-dark-cyan/20 rounded transition-colors"
                                title="Edit dates"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-navy/10 dark:border-dark-cyan/30">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-navy dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
