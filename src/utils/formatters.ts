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

  // Format date to MM/DD/YYYY
  date: (value: string): string => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    return value;
  },

  // Format date to MM/YYYY (for education dates)
  monthYear: (value: string): string => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 6) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 6)}`;
    }
    return value;
  },

  // Format SSN as XXX-XX-XXXX
  ssn: (value: string): string => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return value;
  },

  // Format zip code as XXXXX or XXXXX-XXXX
  zipCode: (value: string): string => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 5) {
      return cleaned;
    }
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
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

  // Validate SSN (9 digits)
  ssn: (value: string): boolean => {
    if (!value) return true; // Optional field
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 9;
  },

  // Validate date MM/DD/YYYY
  date: (value: string): boolean => {
    if (!value) return true; // Optional field
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 8) return false;
    const month = parseInt(cleaned.slice(0, 2));
    const day = parseInt(cleaned.slice(2, 4));
    const year = parseInt(cleaned.slice(4, 8));
    return month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100;
  },

  // Validate month/year MM/YYYY
  monthYear: (value: string): boolean => {
    if (!value) return true; // Optional field
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length !== 6) return false;
    const month = parseInt(cleaned.slice(0, 2));
    const year = parseInt(cleaned.slice(2, 6));
    return month >= 1 && month <= 12 && year >= 1900 && year <= 2100;
  },

  // Validate zip code (5 or 9 digits)
  zipCode: (value: string): boolean => {
    if (!value) return true; // Optional field
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 5 || cleaned.length === 9;
  },

  // Validate required field
  required: (value: string): boolean => {
    return value && value.trim().length > 0;
  }
};
