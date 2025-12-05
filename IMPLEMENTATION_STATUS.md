# Implementation Status

## Completed

### 1. Database Migrations
- ✅ Added comprehensive Provider fields:
  - AHCCCS number and application number
  - Medicare PTAN
  - Undergraduate education (school, start/end dates MM/YYYY, degree)
  - Postgraduate education (school, start/end dates MM/YYYY, degree)
  - Gender
  - Provider start date
  - SSN

- ✅ Added comprehensive Location fields:
  - Structured address (address_line_1, address_line_2, city, state, zip_code)
  - Phone and Fax
  - NPI
  - Hours
  - Specialties array (PT/OT) - replaces departments

### 2. Data Validation & Formatting
- ✅ Enhanced formatters utility with:
  - Phone formatting (123-456-7890)
  - Date formatting (MM/DD/YYYY from 12052025)
  - Month/Year formatting (MM/YYYY from 052025)
  - SSN formatting (XXX-XX-XXXX from 123456789)
  - Zip code formatting (XXXXX or XXXXX-XXXX)

- ✅ Enhanced validators utility with:
  - Date validation (MM/DD/YYYY)
  - Month/Year validation (MM/YYYY)
  - SSN validation (9 digits)
  - Zip code validation (5 or 9 digits)
  - Existing: phone, NPI, email validation

### 3. UI Components
- ✅ Created `DocumentStatusIndicator` component:
  - Shows 6 required documents (Facesheet, License, CV, Credentialing Forms, Diploma, SSN)
  - Visual checkmarks/X marks at a glance
  - Displays completion count (e.g., "4/6 Documents")
  - Added to provider profile header

- ✅ Removed all workflow-related functionality:
  - Removed "Start Workflow" buttons from Providers and Locations pages
  - Removed "Assign Workflow" section from provider detail modal
  - Removed "Workflow Progress" section
  - Removed redundant payer fields (demographic requirements, dependencies) - now handled in visual workflow designer

- ✅ Updated Dashboard:
  - Replaced workflow instances with action tracking
  - Compact calendar with task list
  - 2:1 grid layout (actions + calendar)

### 4. Architecture Cleanup
- ✅ Simplified action-centric model throughout
- ✅ Visual workflows now optional advanced feature
- ✅ No duplicate/redundant configuration paths

## Still Needs Implementation

### 1. Provider Form Updates
**Files to modify:**
- `src/components/ProvidersPage.tsx` - Add form section
- `src/components/ProviderDetailModal.tsx` - Add fields to detail view and edit mode
- `src/components/EditProviderModalContent.tsx` - Add all new fields

**New fields to add to forms:**
```typescript
// AHCCCS Section
ahcccs_number: string
ahcccs_application_number: string

// Medicare
medicare_ptan: string

// Education - Undergraduate
undergrad_school: string
undergrad_start_date: string  // MM/YYYY with auto-formatting
undergrad_end_date: string    // MM/YYYY with auto-formatting
undergrad_degree: string

// Education - Postgraduate
postgrad_school: string
postgrad_start_date: string   // MM/YYYY with auto-formatting
postgrad_end_date: string     // MM/YYYY with auto-formatting
postgrad_degree: string

// Demographics
gender: 'Male' | 'Female' | 'Other' | ''
provider_start_date: Date     // MM/DD/YYYY with auto-formatting
ssn: string                   // XXX-XX-XXXX with auto-formatting

// Move from custom fields to main form:
caqh_id: string  // Currently in "Additional Information"
```

**Implementation notes:**
- Use `formatters.monthYear()` for education dates with `onBlur` event
- Use `formatters.ssn()` for SSN field with `onBlur` event
- Use `formatters.date()` for provider_start_date with `onBlur` event
- Validate on submit using validators from `utils/formatters.ts`
- Group fields logically in the UI (Education section, Demographics section, etc.)

### 2. Location Form Updates
**Files to modify:**
- `src/components/LocationsPage.tsx`

**Replace/Add fields:**
```typescript
// Replace single address field with:
address_line_1: string
address_line_2: string
city: string
state: string  // Dropdown with US states
zip_code: string  // Auto-format with formatters.zipCode()

// Replace departments with:
specialties: string[]  // Multi-select: ['PT', 'OT']

// Add:
phone: string  // Auto-format with formatters.phone()
fax: string    // Auto-format with formatters.phone()
npi: string    // Validate with validators.npi()
hours: string  // Text field (e.g., "Mon-Fri 8AM-5PM")
```

**Implementation notes:**
- Use formatted inputs with `onBlur` for phone, fax, zip
- State dropdown should include all US states
- Specialties should be checkboxes for PT and OT
- Remove or hide the old `departments` field

### 3. Custom Fields Integration
**Issue:** Provider profile has an "Additional Information" section showing custom fields like CAQH. These should be integrated into the main profile.

**Solution:**
- Move `caqh_id` and other standard fields out of custom_fields table
- Add them as regular columns to providers table (or use existing columns)
- Remove "Additional Information" section or reserve it for truly custom fields
- Update `EditProviderModalContent.tsx` to show CAQH in main form

### 4. Provider Profile Blank Screen
**Potential causes:**
1. Missing data causing render error
2. State initialization issue
3. Modal z-index conflict

**Debugging steps:**
1. Check browser console for errors when clicking eye icon
2. Verify `viewingProvider` state is set correctly in ProvidersPage.tsx:442-444
3. Check if `ProviderDetailModal` receives correct props
4. Ensure all required Provider fields exist in database

**Quick fix to try:**
```typescript
// In ProvidersPage.tsx line 440-449
<button
  onClick={() => {
    console.log('Opening modal for provider:', provider);
    setViewingProvider(provider);
    setShowDetailModal(true);
  }}
  ...
>
```

### 5. Task Modal Workflow References
**Files to check:**
- `src/components/TasksPage.tsx` - Look for "workflow" in task creation/edit modals
- Any modal that creates tasks should say "Create Task for Action" not "Create Task for Workflow"

### 6. Visual Workflow Designer - Reference Helper
**Enhancement:** Add a helper dropdown/button to insert provider references easily

**Implementation:**
```typescript
// Add to WorkflowDesignerPage or NodeConfigPanel
const AVAILABLE_VARIABLES = [
  { label: 'Provider Full Name', value: '{{provider.full_name}}' },
  { label: 'Provider First Name', value: '{{provider.first_name}}' },
  { label: 'Provider Last Name', value: '{{provider.last_name}}' },
  { label: 'Provider Email', value: '{{provider.email}}' },
  { label: 'Provider Phone', value: '{{provider.phone}}' },
  { label: 'Provider License #', value: '{{provider.license_number}}' },
  { label: 'Provider NPI', value: '{{provider.npi}}' },
  { label: 'Payer Name', value: '{{payer.name}}' },
  { label: 'Today\'s Date', value: '{{today}}' },
];

// Add dropdown in node config panel for text fields
<select onChange={(e) => insertVariable(e.target.value)}>
  <option value="">-- Insert Variable --</option>
  {AVAILABLE_VARIABLES.map(v => (
    <option key={v.value} value={v.value}>{v.label}</option>
  ))}
</select>
```

### 7. Testing Checklist
- [ ] Provider form accepts and formats all new fields correctly
- [ ] Location form uses structured address fields
- [ ] Document status indicator shows correct status
- [ ] Provider profile opens without blank screen
- [ ] Actions can be assigned from provider profile
- [ ] Documents can be uploaded from provider profile
- [ ] Data validation prevents invalid entries (phone, SSN, dates, zip)
- [ ] Auto-formatting works on blur for all formatted fields

## Database Schema Reference

### Providers Table (New Fields)
```sql
ahcccs_number text
ahcccs_application_number text
medicare_ptan text
undergrad_school text
undergrad_start_date text
undergrad_end_date text
undergrad_degree text
postgrad_school text
postgrad_start_date text
postgrad_end_date text
postgrad_degree text
gender text
provider_start_date date
ssn text
```

### Locations Table (New Fields)
```sql
address_line_1 text
address_line_2 text
city text
state text
zip_code text
phone text
fax text
npi text
hours text
specialties text[]
```

## Quick Reference: Auto-Format Fields

**On blur, apply formatting:**
- Phone/Fax: `formatters.phone(value)` → 123-456-7890
- SSN: `formatters.ssn(value)` → 123-45-6789
- Dates (full): `formatters.date(value)` → 12/05/2025
- Dates (month/year): `formatters.monthYear(value)` → 05/2025
- Zip: `formatters.zipCode(value)` → 85001 or 85001-1234

**On submit, validate:**
- Use `validators.phone()`, `validators.ssn()`, `validators.date()`, etc.
- Show error message if validation fails
- Prevent form submission until valid
