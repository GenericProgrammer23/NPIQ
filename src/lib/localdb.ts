import { createClient } from '@libsql/client';

const USE_LOCAL_DB = import.meta.env.VITE_USE_LOCAL_DB === 'true';

let db: ReturnType<typeof createClient> | null = null;

export const initLocalDatabase = async () => {
  if (!USE_LOCAL_DB) return null;

  try {
    db = createClient({
      url: 'file:local.db'
    });

    // Create tables
    await createTables();

    return db;
  } catch (error) {
    console.error('Failed to initialize local database:', error);
    return null;
  }
};

const createTables = async () => {
  if (!db) return;

  // Organizations table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Locations table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      departments INTEGER DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      phone_number TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
  `);

  // Providers table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      organization_id TEXT NOT NULL,
      location_id TEXT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      specialty TEXT,
      license_number TEXT,
      license_expiry TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'expired', 'suspended')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      phone_number TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    )
  `);

  // Workflows table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'credentialing' CHECK (type IN ('credentialing', 'renewal', 'compliance')),
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'archived')),
      steps TEXT DEFAULT '[]',
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
  `);

  // Subflows table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS subflows (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      workflow_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      order_index INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'skipped')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id)
    )
  `);

  // Tasks table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      workflow_id TEXT,
      provider_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      due_date TEXT,
      assigned_to TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      subflow_id TEXT,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id),
      FOREIGN KEY (provider_id) REFERENCES providers(id),
      FOREIGN KEY (subflow_id) REFERENCES subflows(id)
    )
  `);

  // Payers table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS payers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK (type IN ('commercial', 'medicare', 'medicaid', 'other')),
      contact_email TEXT,
      contact_phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
  `);

  // Provider Payer Applications table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS provider_payer_applications (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      organization_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      payer_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'submitted', 'approved', 'loaded', 'rejected')),
      application_submission_date TEXT,
      application_approved_date TEXT,
      provider_loaded_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (provider_id) REFERENCES providers(id),
      FOREIGN KEY (payer_id) REFERENCES payers(id)
    )
  `);

  // Custom fields table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_fields (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      organization_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      name TEXT NOT NULL,
      label TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('text', 'number', 'date', 'boolean', 'email', 'tel')),
      required INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
  `);

  console.log('Local database tables created successfully');
};

export const seedLocalDatabase = async () => {
  if (!db) return;

  // Create default organization
  const orgResult = await db.execute({
    sql: `INSERT INTO organizations (id, name, email, phone)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING`,
    args: ['default-org-id', 'Bolt Healthcare', 'admin@bolthealthcare.com', '555-0100']
  });

  // Create locations
  const locations = [
    { id: 'loc-1', name: 'Main Office', address: '123 Healthcare Blvd, Medical City, MC 12345', phone: '555-0101' },
    { id: 'loc-2', name: 'Westside Clinic', address: '456 West Ave, Medical City, MC 12346', phone: '555-0102' },
    { id: 'loc-3', name: 'East Campus', address: '789 East St, Medical City, MC 12347', phone: '555-0103' }
  ];

  for (const loc of locations) {
    await db.execute({
      sql: `INSERT INTO locations (id, organization_id, name, address, phone_number, departments, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING`,
      args: [loc.id, 'default-org-id', loc.name, loc.address, loc.phone, 3, 'active']
    });
  }

  // Create providers
  const providers = [
    { id: 'prov-1', first_name: 'Sarah', last_name: 'Johnson', specialty: 'Cardiology', email: 'sjohnson@example.com', phone: '555-0201', license: 'MD-12345', location: 'loc-1' },
    { id: 'prov-2', first_name: 'Michael', last_name: 'Chen', specialty: 'Pediatrics', email: 'mchen@example.com', phone: '555-0202', license: 'MD-12346', location: 'loc-1' },
    { id: 'prov-3', first_name: 'Emily', last_name: 'Rodriguez', specialty: 'Internal Medicine', email: 'erodriguez@example.com', phone: '555-0203', license: 'MD-12347', location: 'loc-2' },
    { id: 'prov-4', first_name: 'David', last_name: 'Williams', specialty: 'Orthopedics', email: 'dwilliams@example.com', phone: '555-0204', license: 'MD-12348', location: 'loc-2' },
    { id: 'prov-5', first_name: 'Lisa', last_name: 'Anderson', specialty: 'Dermatology', email: 'landerson@example.com', phone: '555-0205', license: 'MD-12349', location: 'loc-3' }
  ];

  for (const prov of providers) {
    await db.execute({
      sql: `INSERT INTO providers (id, organization_id, location_id, first_name, last_name, specialty, email, phone, license_number, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING`,
      args: [prov.id, 'default-org-id', prov.location, prov.first_name, prov.last_name, prov.specialty, prov.email, prov.phone, prov.license, 'active']
    });
  }

  // Create payers
  const payers = [
    { id: 'payer-1', name: 'Blue Cross Blue Shield', type: 'commercial', email: 'credentialing@bcbs.com', phone: '555-1001' },
    { id: 'payer-2', name: 'UnitedHealthcare', type: 'commercial', email: 'provider@uhc.com', phone: '555-1002' },
    { id: 'payer-3', name: 'Medicare', type: 'medicare', email: 'enrollment@medicare.gov', phone: '555-1003' },
    { id: 'payer-4', name: 'Medicaid', type: 'medicaid', email: 'providers@medicaid.gov', phone: '555-1004' },
    { id: 'payer-5', name: 'Aetna', type: 'commercial', email: 'credentialing@aetna.com', phone: '555-1005' }
  ];

  for (const payer of payers) {
    await db.execute({
      sql: `INSERT INTO payers (id, organization_id, name, type, contact_email, contact_phone)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING`,
      args: [payer.id, 'default-org-id', payer.name, payer.type, payer.email, payer.phone]
    });
  }

  // Create workflows
  const workflows = [
    { id: 'wf-1', name: 'New Provider Onboarding', description: 'Complete onboarding process for new providers', type: 'credentialing' },
    { id: 'wf-2', name: 'Provider Name Change', description: 'Update provider name across all systems', type: 'credentialing' },
    { id: 'wf-3', name: 'License Renewal', description: 'Renew provider license', type: 'renewal' }
  ];

  for (const wf of workflows) {
    await db.execute({
      sql: `INSERT INTO workflows (id, organization_id, name, description, type, status)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO NOTHING`,
      args: [wf.id, 'default-org-id', wf.name, wf.description, wf.type, 'active']
    });
  }

  // Create provider-payer applications
  const applications = [
    { provider: 'prov-1', payer: 'payer-1', status: 'approved', submitted: '2024-01-15', approved: '2024-02-01', loaded: '2024-02-15' },
    { provider: 'prov-1', payer: 'payer-2', status: 'submitted', submitted: '2024-03-01', approved: null, loaded: null },
    { provider: 'prov-2', payer: 'payer-1', status: 'loaded', submitted: '2024-01-20', approved: '2024-02-10', loaded: '2024-02-25' },
    { provider: 'prov-2', payer: 'payer-3', status: 'approved', submitted: '2024-02-01', approved: '2024-03-01', loaded: null },
    { provider: 'prov-3', payer: 'payer-2', status: 'not_started', submitted: null, approved: null, loaded: null },
  ];

  for (const app of applications) {
    await db.execute({
      sql: `INSERT INTO provider_payer_applications (organization_id, provider_id, payer_id, status, application_submission_date, application_approved_date, provider_loaded_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: ['default-org-id', app.provider, app.payer, app.status, app.submitted, app.approved, app.loaded]
    });
  }

  console.log('Local database seeded successfully');
};

export const getLocalDB = () => db;

export const LocalDBService = {
  // Organizations
  async getOrganization(id: string) {
    if (!db) return null;
    const result = await db.execute({
      sql: 'SELECT * FROM organizations WHERE id = ?',
      args: [id]
    });
    return result.rows[0] || null;
  },

  // Providers
  async getProviders() {
    if (!db) return [];
    const result = await db.execute('SELECT * FROM providers ORDER BY last_name, first_name');
    return result.rows;
  },

  async getProvider(id: string) {
    if (!db) return null;
    const result = await db.execute({
      sql: 'SELECT * FROM providers WHERE id = ?',
      args: [id]
    });
    return result.rows[0] || null;
  },

  async createProvider(provider: any) {
    if (!db) return null;
    const result = await db.execute({
      sql: `INSERT INTO providers (organization_id, location_id, first_name, last_name, email, phone, specialty, license_number, license_expiry, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      args: [
        provider.organization_id || 'default-org-id',
        provider.location_id,
        provider.first_name,
        provider.last_name,
        provider.email,
        provider.phone,
        provider.specialty,
        provider.license_number,
        provider.license_expiry,
        provider.status || 'pending'
      ]
    });
    return result.rows[0];
  },

  // Locations
  async getLocations() {
    if (!db) return [];
    const result = await db.execute('SELECT * FROM locations ORDER BY name');
    return result.rows;
  },

  // Payers
  async getPayers() {
    if (!db) return [];
    const result = await db.execute('SELECT * FROM payers ORDER BY name');
    return result.rows;
  },

  // Provider Payer Applications
  async getProviderPayerApplications(providerId: string) {
    if (!db) return [];
    const result = await db.execute({
      sql: `SELECT ppa.*, p.name as payer_name, p.type as payer_type
            FROM provider_payer_applications ppa
            LEFT JOIN payers p ON ppa.payer_id = p.id
            WHERE ppa.provider_id = ?
            ORDER BY p.name`,
      args: [providerId]
    });
    return result.rows;
  },

  async updateProviderPayerApplication(id: string, updates: any) {
    if (!db) return null;
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    const result = await db.execute({
      sql: `UPDATE provider_payer_applications SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *`,
      args: [...values, id]
    });
    return result.rows[0];
  },

  // Workflows
  async getWorkflows() {
    if (!db) return [];
    const result = await db.execute('SELECT * FROM workflows ORDER BY name');
    return result.rows;
  },

  // Tasks
  async getTasks() {
    if (!db) return [];
    const result = await db.execute('SELECT * FROM tasks ORDER BY due_date, created_at');
    return result.rows;
  }
};
