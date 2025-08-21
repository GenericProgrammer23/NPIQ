import React, { useState, useEffect, memo } from 'react';
import { Location } from '../lib/supabase';
import { MapPin, Building, AlertCircle } from 'lucide-react';

interface LocationFormProps {
  data: Partial<Location>;
  onChange: (data: Partial<Location>) => void;
  onSubmit: (data: Partial<Location>) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export const LocationForm = memo<LocationFormProps>(({
  data,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  error = null
}) => {
  const [form, setForm] = useState<Partial<Location>>(data);

  // Re-initialize form only when the record identity changes
  useEffect(() => {
    setForm(data);
  }, [data.id]);

  const handleInputChange = (field: keyof Location, value: string | number) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    onChange(updatedForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-cream font-medium mb-2">
          <Building className="h-4 w-4 inline mr-2" />
          Location Name *
        </label>
        <input
          type="text"
          value={form.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
          placeholder="Enter location name"
          required
        />
      </div>

      <div>
        <label className="block text-cream font-medium mb-2">
          <MapPin className="h-4 w-4 inline mr-2" />
          Address
        </label>
        <input
          type="text"
          value={form.address || ''}
          onChange={(e) => handleInputChange('address', e.target.value)}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
          placeholder="Enter address"
        />
      </div>

      <div>
        <label className="block text-cream font-medium mb-2">Number of Departments</label>
        <input
          type="number"
          min="1"
          value={form.departments || 1}
          onChange={(e) => handleInputChange('departments', parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
        />
      </div>

      <div>
        <label className="block text-cream font-medium mb-2">Status</label>
        <select
          value={form.status || 'active'}
          onChange={(e) => handleInputChange('status', e.target.value as Location['status'])}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="flex space-x-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-navy-dark hover:bg-navy text-cream px-4 py-3 rounded-lg font-medium border border-dark-cyan/30"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !form.name}
          className="flex-1 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy px-4 py-3 rounded-lg font-medium"
        >
          {loading ? 'Saving...' : data.id ? 'Update Location' : 'Create Location'}
        </button>
      </div>
    </form>
  );
});

LocationForm.displayName = 'LocationForm';