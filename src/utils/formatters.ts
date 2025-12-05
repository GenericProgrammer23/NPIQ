// Utility functions for formatting and validating fields

// Map of database field names to human-readable display names
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  // Provider fields
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  specialty: 'Specialty',
  license_number: 'License Number',
  license_expiry: 'License Expiry',
  location_id: 'Location',
  npi: 'NPI',
  dea: 'DEA',
  date_of_birth: 'Date of Birth',
  ssn: 'SSN',
  medicaid_number: 'Medicaid Number',
  medicare_number: 'Medicare Number',
  caqh_id: 'CAQH ID',

  // Payer fields
  payer_id: 'Payer',
  payer_name: 'Payer Name',

  // Location fields
  location_name: 'Location Name',
  address: 'Address',
  city: 'City',
  state: 'State',
  zip_code: 'ZIP Code',

  // Application fields
  application_submission_date: 'Submission Date',
  application_approval_date: 'Approval Date',
  effective_date: 'Effective Date',

  // Document fields
  document_type: 'Document Type',
  expiry_date: 'Expiry Date',

  // Status fields
  status: 'Status',
  workflow_state: 'Workflow State',

  // Other common fields
  created_at: 'Created At',
  updated_at: 'Updated At',
  description: 'Description',
  notes: 'Notes',
};

export const formatters = {
  // Format phone number as 123-456-7890
  phone: (value: string): string => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return value;
  },

  // Convert database field name to human-readable display name
  fieldName: (fieldName: string): string => {
    // Check if we have a specific mapping
    if (FIELD_DISPLAY_NAMES[fieldName]) {
      return FIELD_DISPLAY_NAMES[fieldName];
    }

    // Fallback: convert snake_case to Title Case
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

};

export const validators = {
  // Validate phone number (10 digits)
  phone: (value: string): boolean => {
    if (!value) return true; // Optional field
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10;
  },

  // Validate NPI (exactly 10 digits)
  npi: (value: string): boolean => {
    if (!value) return true; // Optional field
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10;
  },

  // Validate email
  email: (value: string): boolean => {
    if (!value) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  // Validate required field
  required: (value: string): boolean => {
    return value && value.trim().length > 0;
  }
};
