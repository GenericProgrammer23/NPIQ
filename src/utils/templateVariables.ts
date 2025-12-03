/**
 * Template Variable System
 *
 * Processes template strings with variables like:
 * - {{provider.first_name}}, {{provider.last_name}}, {{provider.full_name}}
 * - {{location.name}}, {{location.address}}
 * - {{payer.name}}, {{payer.type}}
 * - {{current_date}}, {{due_date}}
 * - {{organization.name}}
 */

export interface TemplateContext {
  provider?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    specialty?: string;
    license_number?: string;
    [key: string]: any;
  };
  location?: {
    id: string;
    name: string;
    address?: string;
    phone_number?: string;
    [key: string]: any;
  };
  payer?: {
    id: string;
    name: string;
    type: string;
    workflow_state?: string;
    [key: string]: any;
  };
  organization?: {
    id: string;
    name: string;
    [key: string]: any;
  };
  workflow?: {
    id: string;
    name: string;
    [key: string]: any;
  };
  dates?: {
    current_date?: string;
    due_date?: string;
    [key: string]: any;
  };
  custom?: {
    [key: string]: any;
  };
}

/**
 * Processes a template string and replaces variables with actual values
 */
export function processTemplate(template: string, context: TemplateContext): string {
  if (!template) return '';

  let result = template;

  // Process provider variables
  if (context.provider) {
    const fullName = `${context.provider.first_name || ''} ${context.provider.last_name || ''}`.trim();
    result = result.replace(/\{\{provider\.full_name\}\}/g, fullName);

    Object.keys(context.provider).forEach(key => {
      const value = context.provider![key];
      const regex = new RegExp(`\\{\\{provider\\.${key}\\}\\}`, 'g');
      result = result.replace(regex, value?.toString() || '');
    });
  }

  // Process location variables
  if (context.location) {
    Object.keys(context.location).forEach(key => {
      const value = context.location![key];
      const regex = new RegExp(`\\{\\{location\\.${key}\\}\\}`, 'g');
      result = result.replace(regex, value?.toString() || '');
    });
  }

  // Process payer variables
  if (context.payer) {
    Object.keys(context.payer).forEach(key => {
      const value = context.payer![key];
      const regex = new RegExp(`\\{\\{payer\\.${key}\\}\\}`, 'g');
      result = result.replace(regex, value?.toString() || '');
    });
  }

  // Process organization variables
  if (context.organization) {
    Object.keys(context.organization).forEach(key => {
      const value = context.organization![key];
      const regex = new RegExp(`\\{\\{organization\\.${key}\\}\\}`, 'g');
      result = result.replace(regex, value?.toString() || '');
    });
  }

  // Process workflow variables
  if (context.workflow) {
    Object.keys(context.workflow).forEach(key => {
      const value = context.workflow![key];
      const regex = new RegExp(`\\{\\{workflow\\.${key}\\}\\}`, 'g');
      result = result.replace(regex, value?.toString() || '');
    });
  }

  // Process date variables
  if (context.dates) {
    Object.keys(context.dates).forEach(key => {
      const value = context.dates![key];
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value?.toString() || '');
    });
  }

  // Process custom variables
  if (context.custom) {
    Object.keys(context.custom).forEach(key => {
      const value = context.custom![key];
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value?.toString() || '');
    });
  }

  // Add current date if not provided
  if (result.includes('{{current_date}}')) {
    const today = new Date().toISOString().split('T')[0];
    result = result.replace(/\{\{current_date\}\}/g, today);
  }

  return result;
}

/**
 * Extracts all variable names from a template string
 */
export function extractVariables(template: string): string[] {
  if (!template) return [];

  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1]);
  }

  return variables;
}

/**
 * Validates that all required variables in a template can be resolved
 */
export function validateTemplate(template: string, context: TemplateContext): {
  valid: boolean;
  missingVariables: string[];
} {
  const variables = extractVariables(template);
  const missingVariables: string[] = [];

  variables.forEach(variable => {
    // Skip current_date as it's auto-generated
    if (variable === 'current_date') return;

    const parts = variable.split('.');
    if (parts.length === 2) {
      const [category, field] = parts;
      const categoryData = context[category as keyof TemplateContext];

      if (!categoryData || !(field in (categoryData as any))) {
        missingVariables.push(variable);
      }
    } else {
      // Check custom or dates
      const inDates = context.dates && variable in context.dates;
      const inCustom = context.custom && variable in context.custom;

      if (!inDates && !inCustom) {
        missingVariables.push(variable);
      }
    }
  });

  return {
    valid: missingVariables.length === 0,
    missingVariables
  };
}

/**
 * Returns a list of common template variables with descriptions
 */
export function getAvailableVariables(): Array<{
  variable: string;
  description: string;
  category: string;
}> {
  return [
    // Provider variables
    { variable: '{{provider.first_name}}', description: 'Provider first name', category: 'Provider' },
    { variable: '{{provider.last_name}}', description: 'Provider last name', category: 'Provider' },
    { variable: '{{provider.full_name}}', description: 'Provider full name', category: 'Provider' },
    { variable: '{{provider.email}}', description: 'Provider email', category: 'Provider' },
    { variable: '{{provider.specialty}}', description: 'Provider specialty', category: 'Provider' },
    { variable: '{{provider.license_number}}', description: 'Provider license number', category: 'Provider' },

    // Location variables
    { variable: '{{location.name}}', description: 'Location name', category: 'Location' },
    { variable: '{{location.address}}', description: 'Location address', category: 'Location' },
    { variable: '{{location.phone_number}}', description: 'Location phone', category: 'Location' },

    // Payer variables
    { variable: '{{payer.name}}', description: 'Payer name (e.g., Medicare)', category: 'Payer' },
    { variable: '{{payer.type}}', description: 'Payer type', category: 'Payer' },
    { variable: '{{payer.workflow_state}}', description: 'Payer state', category: 'Payer' },

    // Organization variables
    { variable: '{{organization.name}}', description: 'Organization name', category: 'Organization' },

    // Date variables
    { variable: '{{current_date}}', description: 'Current date', category: 'Dates' },
    { variable: '{{due_date}}', description: 'Calculated due date', category: 'Dates' },
  ];
}

/**
 * Example usage for testing
 */
export function getExampleContext(): TemplateContext {
  return {
    provider: {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      specialty: 'Cardiology',
      license_number: 'MD12345'
    },
    location: {
      id: '456',
      name: 'Main Clinic',
      address: '123 Healthcare Ave',
      phone_number: '555-0100'
    },
    payer: {
      id: '789',
      name: 'Medicare',
      type: 'government',
      workflow_state: 'ALL'
    },
    organization: {
      id: 'org1',
      name: 'Healthcare Partners'
    },
    dates: {
      current_date: '2024-12-03',
      due_date: '2024-12-31'
    }
  };
}
