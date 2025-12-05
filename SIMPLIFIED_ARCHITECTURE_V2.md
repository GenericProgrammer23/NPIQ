# Simplified Architecture v2 - Action-Based System

## Core Concept

**Remove workflows entirely, but keep action templates for flexibility.**

When you need to credential a provider or handle a name change, you assign an **Action** which automatically creates the appropriate tasks based on requirements.

---

## New Data Model

### 1. Action Templates
**Pre-defined bundles of tasks that can be assigned to providers**

```typescript
interface ActionTemplate {
  id: string;
  organization_id: string;
  name: string;                          // "Initial Credentialing", "Provider Name Change", "Re-credentialing"
  description: string;
  category: 'credentialing' | 'change' | 'renewal';

  // What payers does this action apply to?
  applies_to_payer_ids: string[];        // Empty = all payers, or specific ones

  // Custom requirements for this action type
  required_documents?: string[];         // Override payer defaults if needed
  required_fields?: string[];            // Additional fields needed for this action

  // Task templates
  task_templates: TaskTemplate[];        // Pre-defined tasks for this action

  is_system_template: boolean;           // Can't be deleted if true
  created_at: Date;
}

interface TaskTemplate {
  title: string;
  description: string;
  type: 'document' | 'field' | 'submission' | 'approval' | 'custom';
  priority: number;
  estimated_days?: number;
  required_for_payers?: string[];        // Which payers need this task
}
```

### 2. Provider Actions (History/Tracking)
**Tracks each action taken for a provider - keeps history separate**

```typescript
interface ProviderAction {
  id: string;
  provider_id: string;
  organization_id: string;
  action_template_id: string;

  // What this action is about
  action_type: 'initial_credentialing' | 'name_change' | 'address_change' | 're_credentialing' | 'custom';
  action_name: string;                   // "Name Change: Smith → Jones"

  // Context specific to this action
  metadata: {
    old_name?: string;
    new_name?: string;
    effective_date?: string;
    reason?: string;
    notes?: string;
  };

  // Which payers are involved in this action
  payer_ids: string[];

  // Status
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled';
  started_at?: Date;
  completed_at?: Date;

  // Progress tracking
  total_tasks: number;
  completed_tasks: number;

  created_at: Date;
  updated_at: Date;
}
```

### 3. Enhanced Tasks
**Links tasks to specific actions**

```typescript
interface Task {
  id: string;
  provider_id: string;
  organization_id: string;

  // Link to the action this task belongs to
  provider_action_id?: string;           // NEW: Groups tasks by action

  // Task details
  title: string;
  description: string;
  type: 'document' | 'field' | 'submission' | 'approval' | 'notification' | 'custom';

  // Priority (auto-calculated)
  computed_priority: number;
  priority_factors: {
    blocks_payer_count: number;
    dependency_depth: number;
    days_overdue: number;
  };

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  // Context
  payer_id?: string;                     // Which payer this task is for
  required_document?: string;
  required_field?: string;

  due_date?: Date;
  completed_at?: Date;
  assigned_to?: string;

  created_at: Date;
  updated_at: Date;
}
```

### 4. Enhanced Payers (Same as before)
```typescript
interface Payer {
  id: string;
  name: string;

  // Initial Credentialing Requirements
  initial_required_documents: string[];
  initial_required_fields: string[];

  // Re-credentialing Requirements (might be different)
  reauth_required_documents?: string[];
  reauth_required_fields?: string[];
  reauth_interval_months?: number;

  // Name Change Requirements (might be different)
  name_change_required_documents?: string[];
  name_change_required_fields?: string[];

  // Dependencies
  dependent_on_payer_ids: string[];

  // Timelines
  days_to_approve: number;
  days_to_load: number;

  // Priority
  priority_base: number;
  is_foundation_payer: boolean;
}
```

---

## User Experience

### Providers Page

**Provider Card:**
```
Dr. Jane Smith

Actions:
  ✅ Initial Credentialing (Jan 2024) - 4 payers complete
  🔄 Name Change: Smith → Jones (In Progress) - 2/4 payers submitted

[+ Start New Action]
```

**Click "+ Start New Action":**
```
┌─────────────────────────────────────────┐
│ Select Action Type                      │
├─────────────────────────────────────────┤
│ ○ Initial Credentialing                 │
│ ○ Provider Name Change                  │
│ ○ Provider Address Change               │
│ ○ Re-credentialing                      │
│ ○ Add Single Payer                      │
│ ○ Custom Action                         │
└─────────────────────────────────────────┘

[Select "Provider Name Change"]

┌─────────────────────────────────────────┐
│ Provider Name Change Details            │
├─────────────────────────────────────────┤
│ Previous Name: Jane Smith               │
│ New Name: [____________________]        │
│ Effective Date: [___________]           │
│ Reason: ○ Marriage ○ Divorce ○ Other   │
│                                         │
│ Select Payers to Update:                │
│ ☑ Medicare                              │
│ ☑ AHCCCS                                │
│ ☑ PTPN                                  │
│ ☑ BCBS                                  │
│                                         │
│ This will create:                       │
│ • 12 tasks across 4 payers              │
│ • Notify payers of name change          │
│ • Update all applications               │
│ • Track submission dates                │
└─────────────────────────────────────────┘

[Start Name Change Action]
```

### Tasks Page (Filtered by Action)

```
Filter: [All Actions ▾] [Provider Name Change: Smith → Jones]

🔴 URGENT - Submit Medicare name change form
   Action: Name Change: Smith → Jones
   → Blocking 2 dependent payers (AHCCCS, PTPN)
   → Due: 3 days ago
   [View Details]

🟡 HIGH - Upload marriage certificate
   Action: Name Change: Smith → Jones
   → Required by: Medicare, AHCCCS, BCBS
   → Due: Today
   [Upload Document]

🟢 READY - AHCCCS name change ready to submit
   Action: Name Change: Smith → Jones
   ✓ All documents collected
   ✓ Medicare name change approved (2 days ago)
   [Submit to AHCCCS]

---

Filter: [All Actions ▾] [Initial Credentialing]

🔴 URGENT - Complete Graduate School info for Dr. Brown
   Action: Initial Credentialing
   → Blocks: Medicare, AHCCCS, PTPN, BCBS (4 payers)
   [Complete Info]
```

### Provider Detail Page

```
┌─────────────────────────────────────────────────┐
│ Dr. Jane Smith - Active                         │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Profile] [Payers] [Actions] [Documents] [Tasks]│
│                                                 │
└─────────────────────────────────────────────────┘

[Actions Tab - Selected]

Timeline:
─────────────────────────────────────────────────

Jan 15, 2024 - Initial Credentialing Started
├─ Medicare (Approved: Feb 20, 2024)
├─ AHCCCS (Approved: Mar 5, 2024)
├─ PTPN (Approved: Mar 12, 2024)
└─ BCBS (Approved: Feb 28, 2024)
✅ Completed: Mar 12, 2024

─────────────────────────────────────────────────

Nov 3, 2024 - Name Change: Smith → Jones
├─ Medicare (Submitted: Nov 5, Approved: Nov 15)
├─ AHCCCS (Submitted: Nov 16, Pending...)
├─ PTPN (Waiting for AHCCCS)
└─ BCBS (Ready to submit)
🔄 In Progress - 50% complete (2/4 payers)

[View Details] [Cancel Action]

─────────────────────────────────────────────────
[+ Start New Action]
```

---

## How It Works

### Scenario: Provider Name Change

**Step 1: User assigns "Provider Name Change" action**
```typescript
async function startNameChangeAction(providerId: string, details: {
  old_name: string,
  new_name: string,
  effective_date: string,
  payer_ids: string[]
}) {
  // 1. Create the action record
  const action = await createProviderAction({
    provider_id: providerId,
    action_type: 'name_change',
    action_name: `Name Change: ${details.old_name} → ${details.new_name}`,
    metadata: details,
    payer_ids: details.payer_ids,
    status: 'in_progress'
  });

  // 2. Get the name change template
  const template = await getActionTemplate('provider_name_change');

  // 3. Generate tasks for each payer
  for (const payerId of details.payer_ids) {
    const payer = await getPayer(payerId);

    // Use payer-specific name change requirements
    const requiredDocs = payer.name_change_required_documents || payer.initial_required_documents;
    const requiredFields = payer.name_change_required_fields || payer.initial_required_fields;

    // Create tasks
    await generateTasksForAction(action.id, payer, requiredDocs, requiredFields, template);
  }

  return action;
}
```

**Step 2: System generates smart tasks**
```typescript
Tasks Created:

HIGH PRIORITY (Foundation payer):
- Obtain updated license with new name (blocks Medicare)
- Complete legal name change date field (blocks Medicare)
- Submit Medicare name change form (blocks AHCCCS, PTPN)
- Track Medicare name change approval (blocks AHCCCS, PTPN)

MEDIUM PRIORITY (Dependent payers):
- Submit AHCCCS name change form (after Medicare, blocks PTPN)
- Submit PTPN name change form (after AHCCCS)
- Submit BCBS name change form

AUTO-GENERATED:
- [NOTIFICATION] Upload marriage certificate for name change
- [NOTIFICATION] Medicare name change ready to submit
- [NOTIFICATION] AHCCCS name change ready to submit
```

**Step 3: As tasks complete, action tracks progress**
```typescript
// When license uploaded
→ Marks "Obtain updated license" as complete
→ Checks if Medicare requirements met
→ If yes, creates "READY TO SUBMIT" notification

// When Medicare approved
→ Marks approval task complete
→ Unblocks AHCCCS and PTPN tasks
→ Recalculates priorities
→ Checks if AHCCCS/PTPN ready to submit

// When all payers done
→ Marks entire action as completed
→ Updates provider timeline
→ Archives to history
```

---

## System Templates (Built-in)

### 1. Initial Credentialing Template
```javascript
{
  name: "Initial Credentialing",
  category: "credentialing",
  applies_to_payer_ids: [], // All payers
  task_templates: [
    {
      title: "Collect provider demographics",
      type: "field",
      priority: 1,
      description: "Gather all required provider information"
    },
    {
      title: "Obtain required documents",
      type: "document",
      priority: 1,
      description: "Collect all payer-required documentation"
    },
    {
      title: "Submit application",
      type: "submission",
      priority: 2,
      description: "Submit completed application to payer"
    },
    {
      title: "Track approval",
      type: "approval",
      priority: 3,
      description: "Monitor application status and approval"
    }
  ]
}
```

### 2. Provider Name Change Template
```javascript
{
  name: "Provider Name Change",
  category: "change",
  applies_to_payer_ids: [],
  required_documents: [
    "Marriage Certificate",
    "Divorce Decree",
    "Court Order",
    "Updated License"
  ],
  required_fields: [
    "legal_name_change_date",
    "previous_legal_name",
    "name_change_reason"
  ],
  task_templates: [
    {
      title: "Obtain legal documentation",
      type: "document",
      priority: 1
    },
    {
      title: "Update provider profile",
      type: "field",
      priority: 1
    },
    {
      title: "Notify all payers",
      type: "custom",
      priority: 2,
      description: "Submit name change notifications to all credentialed payers"
    },
    {
      title: "Update applications",
      type: "submission",
      priority: 2
    },
    {
      title: "Obtain updated credentials",
      type: "document",
      priority: 3,
      description: "Get updated approval letters with new name"
    }
  ]
}
```

### 3. Re-credentialing Template
```javascript
{
  name: "Re-credentialing",
  category: "renewal",
  applies_to_payer_ids: [],
  task_templates: [
    {
      title: "Review and update information",
      type: "field",
      priority: 1,
      description: "Verify all information is current"
    },
    {
      title: "Renew expiring documents",
      type: "document",
      priority: 1,
      description: "Update any expired licenses, certifications, etc."
    },
    {
      title: "Submit re-credentialing application",
      type: "submission",
      priority: 2
    }
  ]
}
```

---

## Benefits

✅ **Simpler**: No workflows to design - just assign actions
✅ **Flexible**: Different requirements per action type (name change vs initial)
✅ **Organized**: Actions keep history separate and trackable
✅ **Smart**: Still gets automatic priority calculation and notifications
✅ **Customizable**: Can create custom action templates as needed
✅ **Historical**: Complete audit trail of all provider changes
✅ **Reusable**: Templates can be used across providers

---

## Migration Path

1. Keep existing tables temporarily
2. Add new action templates and provider_actions tables
3. Build new UI alongside old
4. Migrate existing data to new structure
5. Remove old workflow/subflow tables

---

## Questions?

- Does this give you the control you need?
- Should action templates be editable or just pre-defined system templates?
- Any other action types to consider (address change, reauth, etc.)?
