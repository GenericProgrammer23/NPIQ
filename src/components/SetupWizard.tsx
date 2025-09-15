import React, { useState } from 'react';
import { DatabaseService } from '../lib/supabase';
import { Building, MapPin, Users, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form data
  const [orgData, setOrgData] = useState({
    name: '',
    address: '',
    phone: '',
    email: ''
  });
  
  const [locationData, setLocationData] = useState({
    name: '',
    address: '',
    departments: 1
  });
  
  const [providerData, setProviderData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialty: ''
  });

  const [createdOrganizationId, setCreatedOrganizationId] = useState<string | null>(null);

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError(null);
    } else {
      setError(message);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 5000);
  };

  const handleCreateOrganization = async () => {
    if (!orgData.name.trim()) {
      showMessage('Organization name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      // Create organization
      const organization = await DatabaseService.createOrganization(orgData);
      setCreatedOrganizationId(organization.id);
      
      // Create membership for current user
      const user = await DatabaseService.getCurrentUser();
      if (user) {
        await DatabaseService.createMembership({
          user_id: user.id,
          organization_id: organization.id,
          role: 'admin'
        });
      }
      
      showMessage('Organization created successfully!', 'success');
      setCurrentStep(2);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to create organization', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    if (!locationData.name.trim() || !createdOrganizationId) {
      showMessage('Location name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      await DatabaseService.createLocation({
        ...locationData,
        organization_id: createdOrganizationId,
        status: 'active'
      });
      
      showMessage('Location created successfully!', 'success');
      setCurrentStep(3);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to create location', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvider = async () => {
    if (!providerData.first_name.trim() || !providerData.last_name.trim() || !createdOrganizationId) {
      showMessage('Provider first and last name are required', 'error');
      return;
    }

    setLoading(true);
    try {
      await DatabaseService.createProvider({
        ...providerData,
        organization_id: createdOrganizationId,
        status: 'pending'
      });
      
      showMessage('Provider created successfully!', 'success');
      setCurrentStep(4);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : 'Failed to create provider', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    showMessage('Setup completed! Redirecting to dashboard...', 'success');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  const steps = [
    { number: 1, title: 'Create Organization', icon: Building },
    { number: 2, title: 'Add Location', icon: MapPin },
    { number: 3, title: 'Add Provider', icon: Users },
    { number: 4, title: 'Complete', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="bg-navy-light rounded-lg border border-dark-cyan/20 p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cream mb-2">Welcome to NPIQ</h1>
          <p className="text-cream/70">Let's set up your healthcare credentialing system</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                currentStep >= step.number 
                  ? 'bg-dark-cyan text-white' 
                  : 'bg-navy-dark text-cream/50'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <span className={`text-xs text-center ${
                currentStep >= step.number ? 'text-cream' : 'text-cream/50'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-600/20 border border-red-600/30 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <span className="text-red-400">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-600/20 border border-green-600/30 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
            <span className="text-green-400">{success}</span>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-cream mb-4">Create Your Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-cream font-medium mb-2">Organization Name *</label>
                <input
                  type="text"
                  value={orgData.name}
                  onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                  placeholder="e.g., Metro Healthcare System"
                />
              </div>
              <div>
                <label className="block text-cream font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={orgData.address}
                  onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                  placeholder="123 Medical Center Drive"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-cream font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={orgData.phone}
                    onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-cream font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={orgData.email}
                    onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                    placeholder="admin@healthcare.org"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={handleCreateOrganization}
              disabled={loading}
              className="w-full bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy px-4 py-3 rounded-lg font-medium flex items-center justify-center"
            >
              {loading ? <Loader className="h-5 w-5 animate-spin mr-2" /> : null}
              Create Organization
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-cream mb-4">Add Your First Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-cream font-medium mb-2">Location Name *</label>
                <input
                  type="text"
                  value={locationData.name}
                  onChange={(e) => setLocationData({ ...locationData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                  placeholder="e.g., Main Hospital"
                />
              </div>
              <div>
                <label className="block text-cream font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={locationData.address}
                  onChange={(e) => setLocationData({ ...locationData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                  placeholder="123 Medical Center Drive"
                />
              </div>
              <div>
                <label className="block text-cream font-medium mb-2">Number of Departments</label>
                <input
                  type="number"
                  min="1"
                  value={locationData.departments}
                  onChange={(e) => setLocationData({ ...locationData, departments: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 bg-navy-dark hover:bg-navy text-cream px-4 py-3 rounded-lg font-medium border border-dark-cyan/30"
              >
                Back
              </button>
              <button
                onClick={handleCreateLocation}
                disabled={loading}
                className="flex-1 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy px-4 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                {loading ? <Loader className="h-5 w-5 animate-spin mr-2" /> : null}
                Add Location
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-cream mb-4">Add Your First Provider</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-cream font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    value={providerData.first_name}
                    onChange={(e) => setProviderData({ ...providerData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-cream font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={providerData.last_name}
                    onChange={(e) => setProviderData({ ...providerData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div>
                <label className="block text-cream font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={providerData.email}
                  onChange={(e) => setProviderData({ ...providerData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                  placeholder="john.smith@healthcare.org"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-cream font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={providerData.phone}
                    onChange={(e) => setProviderData({ ...providerData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-cream font-medium mb-2">Specialty</label>
                  <input
                    type="text"
                    value={providerData.specialty}
                    onChange={(e) => setProviderData({ ...providerData, specialty: e.target.value })}
                    className="w-full px-3 py-2 bg-navy-dark border border-dark-cyan/30 rounded-lg text-cream placeholder-cream/50 focus:outline-none focus:border-dark-cyan"
                    placeholder="e.g., Cardiology"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="flex-1 bg-navy-dark hover:bg-navy text-cream px-4 py-3 rounded-lg font-medium border border-dark-cyan/30"
              >
                Back
              </button>
              <button
                onClick={handleCreateProvider}
                disabled={loading}
                className="flex-1 bg-goldenrod hover:bg-goldenrod/90 disabled:bg-goldenrod/50 text-navy px-4 py-3 rounded-lg font-medium flex items-center justify-center"
              >
                {loading ? <Loader className="h-5 w-5 animate-spin mr-2" /> : null}
                Add Provider
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-cream">Setup Complete!</h2>
            <p className="text-cream/70">
              Your NPIQ system is ready to use. You can now manage providers, create workflows, and track credentialing tasks.
            </p>
            <button
              onClick={handleComplete}
              className="bg-goldenrod hover:bg-goldenrod/90 text-navy px-8 py-3 rounded-lg font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};