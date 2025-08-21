import React, { useState, useEffect, memo } from 'react';
import { Provider, Location } from '../lib/supabase';
import { User, Mail, Phone, Stethoscope, Building, AlertCircle } from 'lucide-react';

interface ProviderFormProps {
  data: Partial<Provider>;
  locations: Location[];
  onChange: (data: Partial<Provider>) => void;
  onSubmit: (data: Partial<Provider>) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export const ProviderForm = memo<ProviderFormProps>(({
  data,
  locations,
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  error = null
}) => {
  const [form, setForm] = useState<Partial<Provider>>(data);

  // Re-initialize form only when the record identity changes
  useEffect(() => {
    setForm(data);
  }, [data.id]);

  const handleInputChange = (field: keyof Provider, value: string) => {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-cream font-medium mb-2">
            <User className="h-4 w-4 inline mr-2" />
            First Name *
          </label>
          <input
            type="text"
            value={form.first_name || ''}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
            placeholder="Enter first name"
            required
          />
        </div>

        <div>
          <label className="block text-cream font-medium mb-2">
            <User className="h-4 w-4 inline mr-2" />
            Last Name *
          </label>
          <input
            type="text"
            value={form.last_name || ''}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
            placeholder="Enter last name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-cream font-medium mb-2">
          <Mail className="h-4 w-4 inline mr-2" />
          Email
        </label>
        <input
          type="email"
          value={form.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
          placeholder="provider@example.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-cream font-medium mb-2">
            <Phone className="h-4 w-4 inline mr-2" />
            Phone
          </label>
          <input
            type="tel"
            value={form.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-cream font-medium mb-2">
            <Stethoscope className="h-4 w-4 inline mr-2" />
            Specialty
          </label>
          <input
            type="text"
            value={form.specialty || ''}
            onChange={(e) => handleInputChange('specialty', e.target.value)}
            className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
            placeholder="e.g., Cardiology"
          />
        </div>
      </div>

      <div>
        <label className="block text-cream font-medium mb-2">
          <Building className="h-4 w-4 inline mr-2" />
          Location
        </label>
        <select
          value={form.location_id || ''}
          onChange={(e) => handleInputChange('location_id', e.target.value)}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
        >
          <option value="">Select a location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-cream font-medium mb-2">License Number</label>
          <input
            type="text"
            value={form.license_number || ''}
            onChange={(e) => handleInputChange('license_number', e.target.value)}
            className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
            placeholder="Enter license number"
          />
        </div>

        <div>
          <label className="block text-cream font-medium mb-2">License Expiry</label>
          <input
            type="date"
            value={form.license_expiry || ''}
            onChange={(e) => handleInputChange('license_expiry', e.target.value)}
            className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
          />
        </div>
      </div>

      <div>
        <label className="block text-cream font-medium mb-2">Status</label>
        <select
          value={form.status || 'pending'}
          onChange={(e) => handleInputChange('status', e.target.value as Provider['status'])}
          className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream focus:outline-none focus:border-dark-cyan"
        >
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
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
          disabled={loading || !form.first_name || !form.last_name}
          className="flex-1 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy px-4 py-3 rounded-lg font-medium"
        >
          {loading ? 'Saving...' : data.id ? 'Update Provider' : 'Create Provider'}
        </button>
      </div>
    </form>
  );
});

ProviderForm.displayName = 'ProviderForm';