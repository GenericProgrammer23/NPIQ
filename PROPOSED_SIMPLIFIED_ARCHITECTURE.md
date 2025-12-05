# Proposed Simplified System Architecture

## Problem with Current Design

The current system has **unnecessary complexity**:
- Payers → Workflows → Subflows → Tasks
- Users must understand what subflows are
- Visual workflow designer is required for basic credentialing
- Too many abstractions between "I need to credential this provider" and "here's what to do"

## Proposed Simplified Architecture

### Core Principle
**The workflow is IMPLICIT in the requirements, not something to be designed.**

When you assign Medicare to a provider, the system should automatically know:
1. What documents are needed
2. What fields are needed
3. What priority they have
4. When to notify that it's ready to submit

---

## New Data Model

### 1. Payers (Enhanced)
```typescript
interface Payer {
  id: string;
  name: string;
  type: 'insurance' | 'credentialing' | 'government';

  // Requirements
  required_documents: string[];        // ['CV', 'License', 'Diploma', 'COI']
  required_provider_fields: string[];  // ['first_name', 'last_name', 'ssn', 'home_address']

  // Dependencies
  dependent_on_payer_ids: string[];   // ['medicare-id']

  // Timelines
  days_to_approve: number;
  days_to_load: number;

  // Priority
  priority_base: number;               // 1 = highest, 100 = lowest
  is_always_required: boolean;         // foundation payers

  // Auto-submission settings
  auto_notify_when_ready: boolean;     // NEW: notify when all requirements met
  submission_url?: string;             // NEW: optional link to application portal
}
```

### 2. Smart Task Generation (Automatic)

**When a provider is assigned to a payer:**

```typescript
// System automatically creates tasks for:
for (const doc of payer.required_documents) {
  if (!provider.hasDocument(doc)) {
    createTask({
      title: `Obtain ${doc} for ${payer.name}`,
      type: 'document_collection',
      computed_priority: calculatePriority(payer, doc),
      blocks_payers: getPayersThatDependOnThis(payer.id)
    });
  }
}

for (const field of payer.required_provider_fields) {
  if (!provider[field]) {
    createTask({
      title: `Complete ${field} for ${provider.name}`,
      type: 'info_gathering',
      computed_priority: calculatePriority(payer, field),
      blocks_payers: getPayersThatDependOnThis(payer.id)
    });
  }
}

// Check if all requirements met
if (allRequirementsMet(provider, payer)) {
  createTask({
    title: `READY: Submit ${payer.name} application for ${provider.name}`,
    type: 'submission_ready',
    computed_priority: 1,  // HIGHEST PRIORITY
    is_notification: true
  });
}
```

### 3. Dynamic Priority Calculation

**SSN Example:**
- AHCCCS requires SSN
- AHCCCS depends on Medicare
- PTPN depends on Medicare

Therefore: SSN task gets HIGH priority because:
1. Blocks AHCCCS (priority boost: +1 dependent)
2. AHCCCS blocks PTPN (transitive dependency boost)
3. Total blocking impact: 2 payers

**Graduate School Info Example:**
- Required by ALL payers (Medicare, AHCCCS, PTPN, BCBS)
- Blocks everything
- Priority: HIGHEST

---

## User Experience Improvements

### Tasks Page (Simplified)
```
🔴 URGENT - Complete Graduate School info for Dr. Smith
   → Blocks: Medicare, AHCCCS (→PTPN), BCBS
   → This field is required by 4 payers

🔴 URGENT - Obtain SSN for Dr. Smith
   → Blocks: AHCCCS (→PTPN)
   → Required by AHCCCS which blocks 1 other payer

🟢 READY TO SUBMIT - Medicare application for Dr. Smith
   → All requirements met! Click to view submission checklist
   → Portal: https://medicare.gov/apply

🟡 HIGH - Obtain Home Address for Dr. Smith
   → Required by: PTPN
   → Cannot submit until Medicare approved
```

### Payers Page (Simplified)
```
[Medicare Card]
Status: ✅ All requirements met
● First Name ✓
● Last Name ✓
● License# ✓
● NPI ✓
● DOB ✓
● Graduate School ✓
● Graduate School Start Date ✓
● Graduate School End Date ✓

[Submit Application] ← Big green button

---

[AHCCCS Card]
Status: ⚠️ Waiting for SSN
Depends on: Medicare (approved ✓)
● All base requirements ✓
● SSN ✗ ← Missing

[View Requirements]

---

[PTPN Card]
Status: 🔒 Blocked by AHCCCS
Depends on: Medicare (approved ✓)
● All base requirements ✓
● Home Address ✗ ← Missing
● Waiting for AHCCCS approval

[View Requirements]
```

---

## What Happens to Workflows/Subflows?

### Option A: Make Them Optional (Recommended)
- **Default behavior**: Simple payer requirements → automatic task generation
- **Advanced users**: Can optionally create visual workflows for:
  - Complex approval processes with multiple steps
  - Custom automation (send emails, update fields, etc.)
  - Special handling for specific payers

### Option B: Keep for Advanced Use Cases Only
- The visual workflow designer becomes a "power user" feature
- 90% of users never need it - they just assign payers and work tasks
- 10% of users with complex needs can build custom workflows

---

## Implementation Plan

### Phase 1: Enhanced Payer Requirements
1. Add `auto_notify_when_ready` to payers table
2. Add `submission_url` to payers table
3. Update payer creation UI to include all fields from your table

### Phase 2: Smart Task Generation
1. Enhance TaskGenerationService to:
   - Create document collection tasks for missing docs
   - Create info gathering tasks for missing fields
   - Create "READY TO SUBMIT" notification tasks
   - Calculate transitive dependency impact

2. Create new task types:
   - `info_gathering` - Complete provider field
   - `document_collection` - Obtain document
   - `submission_ready` - Notification that payer is ready
   - `submission` - Actually submit application
   - `approval_tracking` - Wait for approval
   - `loading` - Post-approval loading

### Phase 3: Real-Time Requirements Checker
```typescript
// Runs every time provider data changes or document uploads
async function checkPayerReadiness(providerId: string, payerId: string) {
  const provider = await getProvider(providerId);
  const payer = await getPayer(payerId);

  const missingDocs = payer.required_documents.filter(
    doc => !provider.hasDocument(doc)
  );

  const missingFields = payer.required_provider_fields.filter(
    field => !provider[field]
  );

  const dependenciesMet = await checkDependencies(payer);

  if (missingDocs.length === 0 &&
      missingFields.length === 0 &&
      dependenciesMet) {
    // CREATE NOTIFICATION TASK
    await createReadyToSubmitTask(provider, payer);
  }
}
```

### Phase 4: Simplified UI
1. Remove confusing "Subflows" page
2. Make Workflows page optional/advanced
3. Focus on: Payers → Requirements → Tasks
4. Add "Requirements Checklist" view per payer

---

## Benefits

✅ **Simpler mental model**: Payers have requirements, system generates tasks
✅ **Automatic notifications**: No need to check if ready manually
✅ **Better priorities**: System understands transitive dependencies
✅ **Less configuration**: No need to create subflows/workflows for basic use
✅ **Clearer UI**: Users see exactly what's missing and why it matters
✅ **Faster onboarding**: New users understand immediately
✅ **Power user option**: Advanced workflows still available if needed

---

## Migration Path

1. Keep existing system working
2. Build new simplified layer alongside it
3. Add toggle in settings: "Simple Mode" vs "Advanced Mode"
4. Gradually migrate users to simple mode
5. Eventually deprecate workflow/subflow UI for basic users

---

## Example: Complete Flow

**User Action:** Assign Medicare, AHCCCS, PTPN to Dr. Smith

**System Response:**
```
Creating tasks...

HIGH PRIORITY (blocks 4 payers):
- Complete Graduate School info for Dr. Smith
- Complete Graduate School Start Date for Dr. Smith
- Complete Graduate School End Date for Dr. Smith
- Obtain CV for Dr. Smith
- Obtain License for Dr. Smith
- Obtain Diploma for Dr. Smith
- Obtain Location W9 for Dr. Smith
- Obtain COI for Dr. Smith

MEDIUM PRIORITY (blocks 2 payers):
- Complete SSN for Dr. Smith (blocks AHCCCS → PTPN)

MEDIUM PRIORITY (blocks 1 payer):
- Complete Home Address for Dr. Smith (blocks PTPN)

✓ 11 tasks created
✓ Watching for requirement completion
✓ Will notify when each payer is ready to submit
```

**Later, when SSN is added:**
```
🎉 SSN completed for Dr. Smith!
  → Unblocked AHCCCS
  → Recalculating priorities...

⚠️ AHCCCS still needs Medicare approval before submission
```

**Later, when all Medicare requirements met:**
```
🎉 READY TO SUBMIT: Medicare for Dr. Smith
  ✓ All documents collected
  ✓ All fields complete
  ✓ No dependencies blocking

  [View Submission Checklist] [Submit Application]
```

---

## Questions for You

1. **Does this simpler model match your mental model better?**
2. **Should we keep visual workflows as an advanced feature, or remove them entirely?**
3. **Would you prefer a gradual migration or a clean break?**
4. **Any other requirements or edge cases I'm missing?**
