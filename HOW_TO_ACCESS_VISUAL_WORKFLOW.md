# How to Access the Visual Workflow Builder

## ✅ Everything Is Installed and Ready!

The complete visual workflow builder system has been implemented. Here's how to access it:

---

## 🎯 Step-by-Step Instructions

### **1. Start Your Development Server**
```bash
npm run dev
```

### **2. Navigate to the Payers Page**
- Click on **"Payers"** in the left sidebar
- Or go directly to the Payers section

### **3. Look for the New Workflow Buttons**
On each payer card, you'll now see **3 workflow buttons**:

```
┌──────────────────────────────────────────────────────┐
│ Medicare                    [🔷] [👁] [✏️] [⚙️] [🗑️] │
│ Insurance • Active                                   │
└──────────────────────────────────────────────────────┘
```

**Button Colors and Icons:**
- 🔷 **Blue** (GitBranch icon) - View Legacy Flowchart
- 👁 **Purple** (Eye icon) - **View Visual Workflow** ← NEW!
- ✏️ **Green** (Edit3 icon) - **Design Visual Workflow** ← NEW!
- ⚙️ Teal (Edit icon) - Edit Payer Settings
- 🗑️ Red (Trash icon) - Delete Payer

### **4. Click the Green Button (Design Visual Workflow)**
This opens the full-screen visual workflow designer!

---

## 🎨 What You'll See in the Designer

When you click the green **"Design Visual Workflow"** button, you'll see:

### **Left Panel - Node Palette**
- All 12 draggable node types organized by category
- Search filter at the top
- Expandable/collapsible categories:
  - Flow Control
  - Prerequisites
  - Task Generation
  - Date Operations
  - Data Operations

### **Center - Canvas**
- React Flow canvas with grid background
- Minimap in bottom right
- Zoom controls in bottom right
- Drag nodes from palette to here
- Draw connections between nodes

### **Right Panel - Configuration**
- Appears when you click a node
- Dynamic form based on node type
- Save/Cancel buttons

### **Top Toolbar**
- Back button (arrow left)
- Workflow name
- View Mode / Edit Mode toggle
- Save Workflow button

---

## 🚀 Quick Start - Create Your First Workflow

### **Step 1: Open Designer**
1. Go to Payers page
2. Click green **"Design Visual Workflow"** button on any payer

### **Step 2: Add Nodes**
1. **Drag START node** from left palette onto canvas
2. **Drag PREREQUISITE_CHECK node** onto canvas
3. **Drag GENERATE_TASK node** onto canvas
4. **Drag COMPLETE node** onto canvas

### **Step 3: Connect Nodes**
1. Click and drag from **START's bottom handle**
2. Connect to **PREREQUISITE_CHECK's top handle**
3. Click and drag from **PREREQUISITE_CHECK's "met" handle** (left bottom)
4. Connect to **GENERATE_TASK's top handle**
5. Click and drag from **GENERATE_TASK's bottom handle**
6. Connect to **COMPLETE's top handle**

### **Step 4: Configure Nodes**
1. **Click PREREQUISITE_CHECK node**
2. Right panel opens with configuration form
3. Check boxes for required fields (first_name, last_name, license_number)
4. Click **"Save"**

5. **Click GENERATE_TASK node**
6. Enter task title: "Submit Medicare Application"
7. Enter description
8. Select task type: "Submit"
9. Click **"Save"**

### **Step 5: Save Workflow**
1. Click **"Save Workflow"** button in top toolbar
2. You'll see "Workflow saved successfully!" alert
3. Done! The workflow is now active

---

## 🎯 What Happens Next?

Once you've saved a workflow:

### **Automatic Execution**
When a user assigns this payer to a provider:
1. **START node triggers automatically**
2. System checks prerequisites
3. If met → Generates "Submit Medicare Application" task
4. If not met → Generates "Complete Information" task
5. Continues through the workflow automatically
6. Marks complete at COMPLETE node

### **Real-Time Tracking**
- All executions are tracked in `workflow_execution_instances` table
- Each node execution is recorded in `workflow_node_executions` table
- Full audit trail of everything that happened

---

## 📊 Available Node Types

You can use these 12 node types in your workflows:

| Node | Color | What It Does |
|------|-------|--------------|
| **START** | Green | Triggers when payer assigned to provider |
| **COMPLETE** | Green | Marks workflow as complete |
| **PREREQUISITE_CHECK** | Blue | Checks if required fields are filled |
| **DEPENDENCY_CHECK** | Pink | Checks if other payers are approved |
| **GENERATE_TASK** | Purple | Creates a task for users |
| **GENERATE_TASK_WITH_DUE_DATE** | Purple | Creates task with calculated due date |
| **WAIT_FOR_DATE** | Amber | Pauses until a date is entered |
| **CALCULATE_DUE_DATE** | Cyan | Calculates a date based on another date |
| **BRANCH** | Teal | Conditional branching logic |
| **PARALLEL_TASKS** | Orange | Creates multiple tasks at once |
| **AUTO_COMPLETE_TASK** | Lime | Auto-marks a task as complete |
| **UPDATE_PROVIDER_FIELD** | Indigo | Updates provider data fields |

---

## 🔍 Troubleshooting

### **"I don't see the workflow buttons"**
- Make sure your dev server is running (`npm run dev`)
- Refresh the page (Ctrl+R or Cmd+R)
- Check browser console for errors (F12)

### **"The designer page is blank"**
- Select a payer from the dropdown at the top
- Or go back to Payers page and click the green button on a specific payer

### **"I can't drag nodes"**
- Make sure you're in **Edit Mode** (toggle in top toolbar)
- Check that you're dragging from the palette on the left

### **"Nodes won't connect"**
- Drag from the **bottom handle** of source node
- To the **top handle** of target node
- Make sure you're in Edit Mode

### **"My workflow isn't executing"**
- Check that you saved the workflow (green "Save Workflow" button)
- The workflow only executes when a payer is **assigned to a provider**
- Check `workflow_execution_instances` table in database to see executions

---

## 📂 Files Locations

All visual workflow files are in:

```
src/
├── types/workflow.ts                      ← Type definitions
├── lib/workflowDatabase.ts                ← Database service
├── services/WorkflowExecutionService.ts   ← Execution engine
└── components/workflow/
    ├── BaseWorkflowNode.tsx               ← Base node component
    ├── CustomNodes.tsx                    ← 12 node components
    ├── NodePalette.tsx                    ← Left sidebar
    ├── NodeConfigPanel.tsx                ← Right sidebar
    └── WorkflowDesignerPage.tsx           ← Main page
```

Database tables:
```
workflow_definitions          ← Stores workflows
workflow_nodes                ← Individual nodes
workflow_edges                ← Connections
workflow_execution_instances  ← Running workflows
workflow_node_executions      ← Node execution audit
workflow_version_history      ← Version tracking
```

---

## 🎉 That's It!

The visual workflow builder is **fully functional and ready to use**!

Just:
1. Go to Payers page
2. Click green button on any payer
3. Start designing workflows visually!

No coding required - just drag, drop, connect, and configure! 🚀