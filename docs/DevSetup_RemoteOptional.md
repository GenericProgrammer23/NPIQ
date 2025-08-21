# NPIQ Development Setup

## Overview

NPIQ is a local-first healthcare credentialing application that optionally integrates with Supabase for remote database functionality. The app works in two modes:

- **Local Mode**: No database configuration required, uses local state
- **Remote Mode**: Connects to Supabase for persistent, multi-user data

## Quick Start

### Local Development (No Database)
```bash
npm install
npm run dev
```
The app will run in local mode with demo data.

### Remote Development (With Supabase)

#### Option 1: Using the Built-in Setup Wizard (Recommended)
1. **Start the application**:
   ```bash
   npm install
   npm run dev
   ```

2. **Follow the Database Setup Wizard**:
   - The app will automatically show the database setup screen
   - Follow the 3-step process to create and configure Supabase
   - The wizard will guide you through credential setup and schema creation

#### Option 2: Manual Configuration
1. **Set up Supabase project**:
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Copy project URL and anon key

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Apply database migrations**:
   ```bash
   # For local Supabase (if using CLI)
   supabase db reset
   supabase db push
   
   # For remote Supabase
   # Use the SQL editor in Supabase dashboard to run:
   # 1. supabase/migrations/20250114000001_initial_schema.sql
   # 2. supabase/migrations/20250114000002_demo_data.sql (optional)
   ```

4. **Start the application**:
   ```bash
   npm run dev
   ```

## Database Migrations

### Idempotent Migrations & Re-runs

The NPIQ database migrations are designed to be idempotent, meaning they can be safely run multiple times without causing "already exists" errors.

**Protected Objects:**
- **Extensions**: `pgcrypto` and `uuid-ossp` use `CREATE EXTENSION IF NOT EXISTS`
- **Functions**: `update_updated_at_column()` uses `CREATE OR REPLACE FUNCTION`
- **Triggers**: All `update_*_updated_at` triggers are guarded with existence checks
- **RLS Policies**: All policies check for existence before creation
- **Seed Data**: All inserts use `ON CONFLICT (id) DO NOTHING`

**Safe Operations:**
- Re-running migrations on fresh databases ✅
- Re-running migrations on existing databases ✅
- Running migrations after partial failures ✅

### Migration Files

1. **20250114000001_initial_schema.sql**: Complete schema with tables, RLS policies, triggers
2. **20250114000002_demo_data.sql**: Optional demo data (conflict-safe)

## Setup Wizard

When you first sign in to the remote app, if no organizations exist for your user, the Setup Wizard will guide you through:

1. **Create Organization**: Set up your healthcare organization
2. **Add Location**: Create your first facility location  
3. **Add Provider**: Add your first healthcare provider
4. **Complete**: Access the main dashboard

The wizard creates all data through the UI - no manual SQL required.

## Authentication & RLS

### Row Level Security (RLS)

All tables use RLS policies that scope data access to the user's organizations via the `org_members` table:

- Users only see data from organizations they belong to
- Admins can manage organization settings and memberships
- Managers can create/update providers, locations, workflows
- Regular users have read access to organizational data

### User Roles

- **admin**: Full organization management, can manage users
- **manager**: Can create/update providers, locations, workflows  
- **user**: Read-only access to organizational data

## Demo Data Setup

The optional demo migration includes:
- Demo Healthcare Organization
- 2 sample locations (Main Hospital, North Clinic)
- 3 sample providers with different specialties and statuses
- 2 workflow templates
- Sample tasks in various states

**Important**: Update the user_id in the demo migration to match your authenticated user ID.

## CLI Commands

```bash
# Local Supabase development
supabase db reset          # Reset local database (fresh start)
supabase db push           # Apply migrations to running local DB

# Remote Supabase
# Use SQL editor in dashboard to run migration files

# Application
npm run dev                # Start development server
npm run build              # Build for production
npm run preview            # Preview production build
```

## Troubleshooting

See [Troubleshooting.md](./Troubleshooting.md) for common issues and solutions.

## Database Schema

The NPIQ schema includes:
- **organizations**: Healthcare organizations
- **org_members**: User membership with roles
- **locations**: Facilities within organizations  
- **providers**: Healthcare providers with credentials
- **workflows**: Credentialing process workflows
- **tasks**: Individual workflow tasks and assignments

All tables include:
- Automatic timestamp tracking (`created_at`, `updated_at`)
- Row Level Security (RLS) policies
- Proper foreign key relationships
- Performance indexes on frequently queried columns