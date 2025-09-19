// Utility functions for formatting and validating fields

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

  // Format NPI as 10 digits
  npi: (value: string): string => {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  },

  // Format address object
  address: (addressObj: any): string => {
    if (typeof addressObj === 'string') return addressObj;
    if (!addressObj) return '';
    
    const parts = [];
    if (addressObj.line1) parts.push(addressObj.line1);
    if (addressObj.line2) parts.push(addressObj.line2);
    if (addressObj.city) parts.push(addressObj.city);
    if (addressObj.state) parts.push(addressObj.state);
    if (addressObj.zip) parts.push(addressObj.zip);
    
    return parts.join(', ');
  }
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

export const parseAddress = (addressString: string) => {
  // Simple parser - in practice you might want more sophisticated parsing
  return {
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    full: addressString
  };
};