# Production-Ready Credentialing Workflow System

## Overview

This system provides a visual, intuitive workflow designer for managing provider credentialing across multiple payers. The visual workflow creator is the primary interface, making it easy to design, manage, and execute complex credentialing processes.

---

## What's New in This Release

### ✅ **Clean Database**
- Started fresh with only demo data:
  - 1 sample provider (Dr. Jane Smith)
  - 1 sample location (Main Clinic)
  - 3 essential payers (Medicare, AHCCCS, Blue Cross Blue Shield)
  - No old workflows, subflows, or tasks

### ✅ **Removed Legacy Features**
- **Deleted:** Old flowchart system (PayerFlowchartModal)
- **Deleted:** Text-based subflow creation (CreateSubflowModal)
- **Removed:** Legacy flowchart button from payers
- **Simplified:** SubflowsPage now focuses entirely on visual designer

### ✅ **Visual-First Workflow System**
- **Everything is visual** - workflows, subflows, and nested subflows
- **Drag-and-drop** node-based designer
- **"Dive Into"** subflows to edit them visually
- **Breadcrumb navigation** for nested workflows
- **Reusable components** for efficient workflow design

---

## Getting Started as a New User

### Step 1: Add Your First Provider

1. Click **"Providers"** in the sidebar
2. Click **"Add Provider"**
3. Fill in provider details:
   - Name, Email, Phone
   - Specialty, License Number
   - NPI number
4. Click **"Add Provider"**

### Step 2: Create or Edit Payers

1. Click **"Payers"** in the sidebar
2. Review the 3 sample payers (Medicare, AHCCCS, BCBS)
3. Edit payer details as needed:
   - Days to approve/load
   - Required documents
   - Required provider fields
   - Dependencies on other payers

### Step 3: Design Your First Visual Workflow

1. From the **Payers** page, find a payer (e.g., "Medicare")
2. Click the green **"Design Credentialing Flow"** button (pencil icon)
3. You'll see the **Visual Workflow Designer** with:
   - **Left sidebar:** Node Palette (drag nodes to canvas)
   - **Center:** Canvas (your workflow)
   - **Right sidebar:** Node Configuration (when node selected)

#### **Build Your Workflow:**

1. **Add nodes from palette:**
   - Drag **"Start"** node to canvas (if not already there)
   - Drag **"Check Prerequisites"** node
   - Drag **"Generate Task"** node
   - Drag **"Complete"** node

2. **Connect nodes:**
   - Click and drag from bottom of one node to top of another
   - Creates a connection showing flow direction

3. **Configure each node:**
   - Click on a node
   - Right panel opens with configuration options
   - Fill in details (task names, prerequisites, etc.)

4. **Save your workflow:**
   - Click **"Save Workflow"** button in top toolbar
   - Workflow is now active for this payer!

### Step 4: Create Reusable Subflows

1. Click **"Subflows"** in sidebar
2. Click **"New Subflow"**
3. Enter name (e.g., "License Verification")
4. Enter purpose (optional description)
5. Click **"Create & Design"**
6. You're taken to the visual designer to build the subflow
7. Build it just like a workflow (drag nodes, connect, configure)
8. Click **"Save Workflow"** when done

### Step 5: Use Subflows in Workflows

1. Go back to a payer workflow designer
2. From the Node Palette, look for **"Reusable Components"** category
3. Drag **"Execute Subflow"** node to canvas
4. Click the node to configure it
5. Select your subflow from the dropdown
6. Click **"Dive Into Subflow"** button to view/edit the subflow
7. Click breadcrumbs to navigate back to parent workflow

### Step 6: Assign Payers to Providers

1. Go to **Payers** page
2. Click **"Assign to Providers"** link on a payer
3. Select which providers should be credentialed with this payer
4. Click **"Assign"**
5. The workflow will automatically start executing!

### Step 7: Monitor Tasks

1. Click **"Tasks"** in sidebar
2. See all generated tasks from running workflows
3. Tasks are automatically created by workflow nodes
4. Complete tasks to move workflows forward
5. Workflows automatically proceed when conditions are met

---

## Understanding the Visual Workflow System

### **Hierarchy:**

```
Payer Workflows (Top Level)
  ├─ High-level orchestration of credentialing process
  ├─ Can reference and execute subflows
  └─ Specific to each payer

Subflows (Reusable Components)
  ├─ Focused, modular workflow pieces
  ├─ Can be used in multiple payer workflows
  └─ Examples: "License Verification", "Demographics Collection"

Sub-Subflows (If Needed)
  ├─ Subflows can reference other subflows
  └─ Create deeply nested, modular workflows
```

### **Available Node Types:**

#### **Flow Control:**
- **Start** - Where workflow begins
- **Complete** - Marks workflow as done
- **Branch** - Conditional if/else logic

#### **Prerequisites:**
- **Check Prerequisites** - Verify required fields exist
- **Check Dependencies** - Verify other payers/subflows completed

#### **Task Generation:**
- **Generate Task** - Create task for user
- **Generate Task (Due Date)** - Create task with calculated due date
- **Parallel Tasks** - Create multiple tasks at once
- **Auto-Complete Task** - Automatically mark task done

#### **Date Operations:**
- **Wait for Date** - Pause until date field filled
- **Calculate Due Date** - Compute dates based on other dates

#### **Data Operations:**
- **Update Provider Data** - Modify provider fields

#### **Reusable Components:**
- **Execute Subflow** - Run a subflow (with "Dive In" button)
- **Check Subflow Status** - Verify subflows completed
- **Execute Workflow Template** - Run organization templates

---

## Example: Complete Medicare Workflow

Here's a sample workflow you can build:

```
START
  ↓
CHECK_PREREQUISITES
  Required fields: first_name, last_name, email, NPI, license_number
  ├─[met]─→ Continue
  └─[not_met]─→ GENERATE_TASK ("Complete Provider Information")
  ↓
EXECUTE_SUBFLOW ("License Verification")  ← Can "Dive In" to design this
  ↓
EXECUTE_SUBFLOW ("CAQH Registration")    ← Can "Dive In" to design this
  ↓
CHECK_SUBFLOW_STATUS
  Required: ["License Verification", "CAQH Registration"]
  Status: complete
  ├─[met]─→ Continue
  └─[not_met]─→ WAIT (pause workflow)
  ↓
GENERATE_TASK ("Submit Medicare Application")
  ↓
WAIT_FOR_DATE (application_submission_date)
  ↓
CALCULATE_DUE_DATE
  Base: application_submission_date
  Add: 30 days
  Store in: medicare_due_date
  ↓
GENERATE_TASK_WITH_DUE_DATE ("Track Medicare Approval")
  Due date: medicare_due_date
  ↓
WAIT_FOR_DATE (application_approved_date)
  ↓
BRANCH (Check if approved)
  ├─[yes]─→ GENERATE_TASK ("Schedule Loading")
  └─[no]──→ GENERATE_TASK ("Handle Rejection")
  ↓
COMPLETE ("Medicare credentialing complete")
```

---

## Tips for Production Use

### **1. Start Simple**
- Build basic workflows first (START → TASK → COMPLETE)
- Add complexity gradually as you understand the system
- Test workflows with one provider before bulk assignment

### **2. Use Subflows for Repetition**
- If multiple payers need "License Verification", make it a subflow
- Reuse across all payer workflows
- Change once, update everywhere

### **3. Name Things Clearly**
- Use descriptive names: "Submit Application" not "Task 1"
- Add descriptions to subflows explaining their purpose
- Future you will thank present you

### **4. Test Your Workflows**
- Assign to a test provider first
- Check that tasks generate correctly
- Verify due dates calculate properly
- Ensure dependencies work as expected

### **5. Use Prerequisites Wisely**
- Block workflows early if data is missing
- Generate info tasks to request missing data
- Don't let workflows proceed with incomplete information

### **6. Leverage Dependencies**
- Medicare requires CAQH? Add dependency check
- Block workflows until prerequisites met
- Clear error messages when dependencies fail

### **7. Monitor Execution**
- Check Tasks page regularly
- Look for stuck workflows (waiting for dates/dependencies)
- Complete tasks promptly to keep workflows moving

---

## Database Summary

### **Current Data (Clean Start):**

| Table | Count | Notes |
|-------|-------|-------|
| Providers | 1 | Dr. Jane Smith (demo) |
| Locations | 1 | Main Clinic (demo) |
| Payers | 3 | Medicare, AHCCCS, BCBS |
| Workflow Definitions | 0 | Create your own! |
| Subflows | 0 | Create your own! |
| Tasks | 0 | Generated by workflows |

### **Key Features:**

- **Visual workflow_data** stored in both workflows and subflows
- **Execution tracking** for running workflows
- **Task generation** from workflow nodes
- **Breadcrumb navigation** for nested editing
- **Reusability flags** for subflows

---

## Common Workflows to Build

### **1. Basic Credentialing**
```
START → CHECK_PREREQUISITES → GENERATE_TASK → WAIT_FOR_DATE → COMPLETE
```

### **2. With Dependencies**
```
START → DEPENDENCY_CHECK (CAQH) → SUBMIT_APPLICATION → TRACK_APPROVAL → COMPLETE
```

### **3. With Subflows**
```
START → EXECUTE_SUBFLOW (License) → EXECUTE_SUBFLOW (Demographics) → APPLICATION → COMPLETE
```

### **4. Conditional Logic**
```
START → BRANCH (Has NPI?) → [Yes: Continue | No: Request NPI] → COMPLETE
```

### **5. Complex Multi-Payer**
```
START → EXECUTE_SUBFLOW (CAQH) → PARALLEL_TASKS (Medicare, AHCCCS, BCBS) → COMPLETE
```

---

## Keyboard Shortcuts

### **Visual Designer:**

- **Drag nodes** - Click and drag from palette
- **Delete node** - Select node, press Delete or Backspace
- **Pan canvas** - Click and drag on empty space
- **Zoom** - Scroll wheel or pinch on trackpad
- **Select multiple** - Shift + click nodes
- **Undo** - Ctrl/Cmd + Z
- **Redo** - Ctrl/Cmd + Shift + Z

---

## Troubleshooting

### **Workflow Not Starting:**
- Check if provider has payer assigned
- Verify workflow has START node
- Ensure workflow is saved and active

### **Tasks Not Generating:**
- Check node configuration (click node, review settings)
- Verify connections between nodes
- Check execution log (if errors occurred)

### **Can't See Subflow in Dropdown:**
- Make sure subflow has `is_reusable` = true
- Check that subflow was saved
- Refresh the page

### **"Dive In" Button Not Working:**
- Ensure subflow has visual workflow_data
- Check browser console for errors
- Try refreshing the designer

### **Breadcrumbs Not Showing:**
- Make sure you navigated via "Dive In" button
- Check that subflowId is set in URL params
- Try navigating back and re-entering

---

## What's Different from Legacy System

### **Before (Text-Based):**
- Subflows were text fields (prerequisites, dependencies)
- Flowchart was read-only visualization
- No nesting or diving into subflows
- Hard to understand complex flows

### **After (Visual-First):**
- Everything designed visually with nodes
- "Dive Into" any subflow to edit
- Nested workflows with breadcrumbs
- Clear, intuitive visual representation
- Reusable components across workflows

---

## Next Steps

1. **Build your first workflow** for Medicare
2. **Create reusable subflows** for common tasks
3. **Test with one provider** before scaling
4. **Assign payers to multiple providers** when ready
5. **Monitor tasks page** to track progress
6. **Refine workflows** based on real-world use

---

## Support & Resources

- **Breadcrumb Navigation:** Always visible at top of designer
- **Node Help:** Hover over nodes to see descriptions
- **Configuration:** Click any node to see/edit settings
- **Save Often:** Click "Save Workflow" button regularly
- **Dive In:** Click "Dive Into Subflow" to edit subflows visually

---

## Summary

✅ **Clean database** with demo data
✅ **Visual-first** workflow system
✅ **Nested subflows** with "Dive In" navigation
✅ **Reusable components** for efficiency
✅ **Intuitive drag-and-drop** designer
✅ **Production-ready** and scalable

**You're ready to start building!**

The visual workflow designer is your primary tool for creating, managing, and executing credentialing workflows. Everything is visual, everything is intuitive, and everything connects seamlessly.

Happy workflow building! 🎉
