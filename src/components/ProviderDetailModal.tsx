import React, { useState, useEffect } from 'react';
import { Provider, Payer, ProviderPayerApplication } from '../lib/supabase';
import { useProviderPayerApplications, usePayers } from '../hooks/useDatabase';
import { X, CheckCircle, Clock, AlertCircle, Ban } from 'lucide-react';
import { DatabaseService } from '../lib/supabase';

interface ProviderDetailModalProps {
  provider: Provider;
  onClose: () => void;
  onUpdate: () => void;
}

export const ProviderDetailModal: React.FC<ProviderDetailModalProps> = ({
  provider,
  onClose,
  onUpdate
}) => {
  const { applications, loading: appsLoading, refetch: refetchApplications } = useProviderPayerApplications({
    providerId: provider.id
  });
  const { payers } = usePayers();
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [appUpdates, setAppUpdates] = useState<Record<string, Partial<ProviderPayerApplication>>>({});

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
          <button
            onClick={onClose}
            className="p-2 hover:bg-navy/5 dark:hover:bg-navy-dark rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-navy dark:text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400">Email</label>
              <p className="text-navy dark:text-white">{provider.email || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400">Phone</label>
              <p className="text-navy dark:text-white">{provider.phone || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400">License Number</label>
              <p className="text-navy dark:text-white">{provider.license_number || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-navy/70 dark:text-gray-400">Status</label>
              <p className="text-navy dark:text-white capitalize">{provider.status}</p>
            </div>
          </div>

          <div className="border-t border-navy/10 dark:border-dark-cyan/30 pt-6">
            <h3 className="text-xl font-semibold text-navy dark:text-white mb-4">Payer Applications</h3>

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
                      <th className="text-left py-3 px-4 text-sm font-semibold text-navy dark:text-white">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-navy dark:text-white">Submitted</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-navy dark:text-white">Approved</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-navy dark:text-white">Loaded</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-navy dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => {
                      const isEditing = editingApp === app.id;
                      const updates = appUpdates[app.id] || {};

                      return (
                        <tr key={app.id} className="border-b border-navy/10 dark:border-dark-cyan/30 hover:bg-navy/5 dark:hover:bg-navy-dark">
                          <td className="py-3 px-4">
                            <span className="font-medium text-navy dark:text-white">
                              {app.payer?.name || 'Unknown Payer'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <select
                                value={updates.status || app.status}
                                onChange={(e) => setAppUpdate(app.id, 'status', e.target.value)}
                                className="px-2 py-1 border border-navy/20 dark:border-gray-600 rounded text-sm dark:bg-navy-dark dark:text-white"
                              >
                                <option value="not_started">Not Started</option>
                                <option value="submitted">Submitted</option>
                                <option value="approved">Approved</option>
                                <option value="loaded">Loaded</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                                {getStatusIcon(app.status)}
                                <span className="ml-1 capitalize">{app.status.replace('_', ' ')}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-navy dark:text-white">
                            {isEditing ? (
                              <input
                                type="date"
                                value={updates.application_submission_date || app.application_submission_date || ''}
                                onChange={(e) => setAppUpdate(app.id, 'application_submission_date', e.target.value)}
                                className="px-2 py-1 border border-navy/20 dark:border-gray-600 rounded text-sm dark:bg-navy-dark dark:text-white"
                              />
                            ) : (
                              app.application_submission_date || '-'
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-navy dark:text-white">
                            {isEditing ? (
                              <input
                                type="date"
                                value={updates.application_approved_date || app.application_approved_date || ''}
                                onChange={(e) => setAppUpdate(app.id, 'application_approved_date', e.target.value)}
                                className="px-2 py-1 border border-navy/20 dark:border-gray-600 rounded text-sm dark:bg-navy-dark dark:text-white"
                              />
                            ) : (
                              app.application_approved_date || '-'
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-navy dark:text-white">
                            {isEditing ? (
                              <input
                                type="date"
                                value={updates.provider_loaded_date || app.provider_loaded_date || ''}
                                onChange={(e) => setAppUpdate(app.id, 'provider_loaded_date', e.target.value)}
                                className="px-2 py-1 border border-navy/20 dark:border-gray-600 rounded text-sm dark:bg-navy-dark dark:text-white"
                              />
                            ) : (
                              app.provider_loaded_date || '-'
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateApplication(app.id)}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingApp(null);
                                    setAppUpdates({});
                                  }}
                                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingApp(app.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                Edit
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
