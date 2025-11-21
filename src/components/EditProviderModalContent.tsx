import React, { useState, useEffect } from 'react';
import { Provider, ProviderPayerApplication } from '../lib/supabase';
import { useProviderPayerApplications, usePayers } from '../hooks/useDatabase';
import { CheckCircle, X, Edit2 } from 'lucide-react';
import { DatabaseService } from '../lib/supabase';

interface EditProviderModalContentProps {
  editingProvider: Provider;
  formData: any;
  setFormData: (data: any) => void;
  customFields: any[];
  customFieldData: Record<string, any>;
  locations: any[];
  handleUpdate: (e: React.FormEvent) => void;
  renderCustomField: (field: any) => React.ReactNode;
  onCancel: () => void;
}

export const EditProviderModalContent: React.FC<EditProviderModalContentProps> = ({
  editingProvider,
  formData,
  setFormData,
  customFields,
  customFieldData,
  locations,
  handleUpdate,
  renderCustomField,
  onCancel
}) => {
  const { applications, loading: appsLoading, refetch: refetchApplications } = useProviderPayerApplications({
    providerId: editingProvider.id
  });
  const { payers } = usePayers();
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [appUpdates, setAppUpdates] = useState<Record<string, Partial<ProviderPayerApplication>>>({});

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const handleUpdateApplication = async (appId: string) => {
    const updates = appUpdates[appId];
    if (!updates) return;

    try {
      await DatabaseService.updateProviderPayerApplication(appId, updates);
      await refetchApplications();
      setEditingApp(null);
      setAppUpdates({});
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-navy-light rounded-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-navy/10 dark:border-dark-cyan/30">
          <h2 className="text-xl font-semibold text-navy dark:text-white">Edit Provider</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-navy/5 dark:hover:bg-navy-dark rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-navy dark:text-white" />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-navy dark:text-white font-medium mb-2">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              />
            </div>
            <div>
              <label className="block text-navy dark:text-white font-medium mb-2">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
                className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              />
            </div>
            <div>
              <label className="block text-navy dark:text-white font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-navy dark:text-white font-medium mb-2">Specialty</label>
              <select
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              >
                <option value="">Select Specialty</option>
                <option value="Physical Therapy">Physical Therapy</option>
                <option value="Occupational Therapy">Occupational Therapy</option>
              </select>
            </div>
            <div>
              <label className="block text-navy dark:text-white font-medium mb-2">Location</label>
              <select
                value={formData.location_id}
                onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
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
                className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              />
            </div>
            <div>
              <label className="block text-navy dark:text-white font-medium mb-2">License Expiry</label>
              <input
                type="date"
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
              />
            </div>
          </div>

          <div>
            <label className="block text-navy dark:text-white font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:border-dark-cyan bg-white dark:bg-navy-dark text-navy dark:text-cream"
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {customFields.length > 0 && (
            <>
              <div className="col-span-2">
                <h3 className="text-lg font-medium text-navy dark:text-white mb-4 border-t border-navy/20 dark:border-gray-600 pt-4">
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
                                  type="button"
                                  onClick={() => handleUpdateApplication(app.id)}
                                  className="px-3 py-1 bg-goldenrod hover:bg-goldenrod/90 text-navy rounded text-sm font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
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
                                type="button"
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

          <div className="flex justify-end gap-4 pt-4 border-t border-navy/10 dark:border-dark-cyan/30">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-navy dark:text-cream border border-navy/20 dark:border-dark-cyan/30 rounded-lg hover:bg-navy/5 dark:hover:bg-navy-dark/50"
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
  );
};
