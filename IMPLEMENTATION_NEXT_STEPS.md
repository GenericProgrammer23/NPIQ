# Implementation Next Steps - Simplified Action System

## What We've Done

### ✅ Database Schema
- Created `action_templates` table for pre-defined action bundles
- Created `provider_actions` table to track provider action history
- Enhanced `payers` table with action-specific requirements
- Added `provider_action_id` to tasks table for grouping
- Installed system templates: Initial Credentialing, Name Change, Re-credentialing, Add Single Payer

### ✅ Storage Setup
- Added automatic storage bucket setup in Admin Settings
- One-click button to create and configure document storage
- Status indicator shows if storage is ready

### ✅ Documentation
- **SIMPLIFIED_ARCHITECTURE_V2.md** - Complete system design
- **DOCUMENT_UPLOAD_FIX.md** - Storage configuration guide
- **IMPLEMENTATION_NEXT_STEPS.md** - This file

## What Needs to Be Built

### 1. Action Assignment UI (Priority: HIGH)

**Location:** `src/components/StartActionModal.tsx` (new file)

**Functionality:**
- Modal to select action type (Initial Credentialing, Name Change, etc.)
- Form to capture action-specific details (old/new name, dates, etc.)
- Payer selection checkboxes
- Preview of what will be created

**Integration:**
- Add "+ Start Action" button to Provider Detail page
- Pass providerId and organizationId
- On submit, create provider_action and generate tasks

### 2. Action Service (Priority: HIGH)

**Location:** `src/services/ActionExecutionService.ts` (new file)

**Functions:**
```typescript
// Create a new provider action and generate tasks
async function startProviderAction(params: {
  providerId: string;
  organizationId: string;
  actionTemplateId: string;
  actionType: string;
  actionName: string;
  metadata: Record<string, any>;
  payerIds: string[];
}): Promise<ProviderAction>

// Generate tasks based on action template and payer requirements
async function generateTasksForAction(
  actionId: string,
  payers: Payer[],
  template: ActionTemplate
): Promise<Task[]>

// Check if action requirements are met for a specific payer
async function checkPayerReadiness(
  providerId: string,
  payerId: string,
  actionId: string
): Promise<{ ready: boolean; missing: string[] }>

// Update action progress when tasks change
async function updateActionProgress(actionId: string): Promise<void>
```

### 3. Provider Actions Tab (Priority: MEDIUM)

**Location:** Update `src/components/ProviderDetailModal.tsx`

**Add New Tab:** "Actions"

**Shows:**
- Timeline of all actions for this provider
- Status of each action (in progress, completed)
- Progress bars (X/Y payers complete)
- Click to view action details
- Button to start new action

### 4. Enhanced Tasks Page (Priority: MEDIUM)

**Location:** Update `src/components/TasksPage.tsx`

**Add:**
- Filter by action (dropdown showing all active actions)
- Group tasks by action
- Show which action each task belongs to
- Priority badges based on blocking count
- "READY TO SUBMIT" notification tasks highlighted

### 5. Smart Task Generation (Priority: HIGH)

**Update:** `src/services/TaskGenerationService.ts`

**New Logic:**
- When action is started, iterate through selected payers
- For each payer, check what's required based on action type
  - Initial credentialing: use `initial_required_documents`
  - Name change: use `name_change_required_documents`
  - Re-credentialing: use `reauth_required_documents`
- Create tasks for missing documents and fields
- Calculate priority based on:
  - Number of dependent payers blocked
  - Whether payer is a foundation payer
  - Days overdue
- Create "READY TO SUBMIT" notification when all requirements met

### 6. Payers Page Enhancement (Priority: LOW)

**Location:** Update `src/components/PayersPage.tsx`

**Add:**
- Action-specific requirement fields
- Tab for "Initial Credentialing" vs "Name Change" vs "Re-credentialing"
- Show different requirements for different action types

### 7. Real-Time Requirement Checker (Priority: MEDIUM)

**Location:** `src/services/RequirementCheckerService.ts` (new file)

**Functionality:**
- Runs when provider data changes
- Runs when document is uploaded
- Checks all active actions for this provider
- For each action/payer combination, checks if ready
- Creates notification task if ready to submit
- Updates task priorities based on new blocking relationships

### 8. Action History View (Priority: LOW)

**Location:** `src/components/ActionHistoryPage.tsx` (new file)

**Shows:**
- All actions across all providers
- Filterable by action type, status, date range
- Searchable by provider name
- Export to CSV

## Suggested Implementation Order

### Phase 1: Core Functionality (Week 1)
1. ✅ Database migration (DONE)
2. Create `ActionExecutionService.ts`
3. Create `StartActionModal.tsx`
4. Update `ProviderDetailModal.tsx` to add "+ Start Action" button
5. Basic task generation for actions

### Phase 2: Smart Features (Week 2)
6. Update `TaskGenerationService.ts` with priority calculation
7. Create `RequirementCheckerService.ts`
8. Add automatic "READY TO SUBMIT" notifications
9. Update `TasksPage.tsx` with action filtering

### Phase 3: Enhanced UI (Week 3)
10. Add Actions tab to Provider Detail
11. Enhance Payers page with action-specific requirements
12. Add action timeline visualization
13. Improve task grouping and display

### Phase 4: Polish (Week 4)
14. Create Action History page
15. Add export functionality
16. Performance optimization
17. Testing and bug fixes

## Example Usage Flow

**User Story: Name Change**

1. User opens Dr. Jane Smith's profile
2. Clicks "+ Start Action"
3. Selects "Provider Name Change"
4. Fills in:
   - Previous Name: Jane Smith
   - New Name: Jane Jones
   - Effective Date: 2024-12-01
   - Reason: Marriage
   - Selects payers: Medicare, AHCCCS, PTPN, BCBS
5. Clicks "Start Action"

**System Response:**
- Creates provider_action record
- Generates tasks:
  - HIGH: Obtain marriage certificate (blocks all 4 payers)
  - HIGH: Update license with new name (blocks all 4 payers)
  - HIGH: Submit Medicare name change (foundation, blocks 2 dependents)
  - MEDIUM: Submit AHCCCS name change (depends on Medicare)
  - MEDIUM: Submit PTPN name change (depends on AHCCCS)
  - MEDIUM: Submit BCBS name change
- Shows success message: "Created 6 tasks for name change action"

**As User Completes Tasks:**
- Uploads marriage certificate → Task marked complete
- System checks: "Is Medicare ready to submit?"
  - Marriage cert ✓
  - Updated license ✗
  - Not ready yet
- Uploads updated license → Task marked complete
- System checks: "Is Medicare ready to submit?"
  - Marriage cert ✓
  - Updated license ✓
  - **Creates notification: "READY TO SUBMIT: Medicare name change"**

**When Medicare Approved:**
- User marks "Submit Medicare" complete
- System checks AHCCCS dependencies
  - AHCCCS depends on Medicare ✓
  - Creates notification: "READY TO SUBMIT: AHCCCS name change"

## Migration Strategy

### Option A: Gradual (Recommended)
- Keep existing workflow/subflow system running
- Add new action system alongside it
- Let users choose which to use
- Gradually migrate users to new system
- Deprecate old system after 3-6 months

### Option B: Clean Break
- Remove workflow/subflow pages immediately
- Migrate existing data to new structure
- Force all users to new system
- Faster but riskier

## Testing Checklist

Before deploying to production:

- [ ] Can create Initial Credentialing action
- [ ] Can create Name Change action
- [ ] Can create Re-credentialing action
- [ ] Tasks are generated correctly
- [ ] Priorities are calculated correctly
- [ ] Ready to submit notifications appear
- [ ] Action progress updates automatically
- [ ] Can view action history
- [ ] Can filter tasks by action
- [ ] Storage bucket setup works
- [ ] Document uploads work after storage setup
- [ ] RLS policies prevent unauthorized access

## Questions to Answer

1. **Should we remove workflows/subflows entirely or keep as advanced feature?**
   - Recommendation: Keep as hidden advanced feature for 6 months, then remove

2. **Should action templates be editable by users?**
   - Recommendation: System templates are read-only, users can create custom ones

3. **How should we handle re-credentialing reminders?**
   - Recommendation: Add scheduled task to check for payers needing re-auth

4. **Should we support nested actions (action within action)?**
   - Recommendation: Not needed for v1, keep simple

5. **How to handle bulk actions (same action for multiple providers)?**
   - Recommendation: Add to Phase 4 as bulk action feature
