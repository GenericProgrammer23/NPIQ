# Local Database Setup

This application now supports both **Supabase** (remote PostgreSQL) and **Local SQLite** database options.

## Quick Start

To use the local database:

1. Update your `.env` file:
   ```bash
   VITE_USE_LOCAL_DB=true
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The local database will automatically:
- Initialize with the correct schema
- Seed with sample data on first run
- Store data in `local.db` file

## Database Toggle

Set `VITE_USE_LOCAL_DB` in your `.env` file:
- `true` = Use local SQLite database
- `false` or omitted = Use Supabase (requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)

## Sample Data Included

The local database comes pre-seeded with:

### Organizations
- Bolt Healthcare (default organization)

### Locations (3)
- Main Office
- Westside Clinic
- East Campus

### Providers (5)
- Dr. Sarah Johnson (Cardiology)
- Dr. Michael Chen (Pediatrics)
- Dr. Emily Rodriguez (Internal Medicine)
- Dr. David Williams (Orthopedics)
- Dr. Lisa Anderson (Dermatology)

### Payers (5)
- Blue Cross Blue Shield
- UnitedHealthcare
- Medicare
- Medicaid
- Aetna

### Workflows (3)
- New Provider Onboarding
- Provider Name Change
- License Renewal

### Provider-Payer Applications
Sample applications showing various statuses (not_started, submitted, approved, loaded, rejected)

## Features

All features work identically with both database options:
- Provider management
- Location management
- Payer management
- Workflow and task management
- Provider-payer application tracking
- Custom fields
- Admin settings

## Technical Details

### Database Schema
The local SQLite database mirrors the Supabase PostgreSQL schema:
- All tables and relationships are preserved
- UUIDs are replaced with TEXT primary keys
- Timestamps use ISO 8601 format
- JSON fields are stored as TEXT

### Database Adapter
The application uses a transparent adapter pattern:
- `DatabaseAdapter` routes calls to either local or Supabase
- All hooks use the adapter, ensuring consistent behavior
- Switching databases requires only changing the environment variable

### Files
- `src/lib/localdb.ts` - Local database implementation
- `src/lib/database-adapter.ts` - Routing adapter
- `src/hooks/useDatabase.ts` - React hooks (updated to use adapter)
- `local.db` - SQLite database file (created on first run)

## Switching Databases

To switch from local to Supabase:

1. Update `.env`:
   ```bash
   VITE_USE_LOCAL_DB=false
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

2. Restart the dev server

To switch back to local, set `VITE_USE_LOCAL_DB=true` and restart.

## Benefits

**Local Database:**
- No internet connection required
- Faster development
- No API rate limits
- Complete offline functionality
- Pre-seeded with test data

**Supabase Database:**
- Multi-user support
- Real-time subscriptions
- Row Level Security (RLS)
- Production-ready
- Cloud backup

## Notes

- The local database file `local.db` is created in the project root
- Data is persisted between sessions
- To reset local data, delete `local.db` and restart the app
- Custom fields and admin settings work in local mode
- Authentication is simplified in local mode (no real auth required)
