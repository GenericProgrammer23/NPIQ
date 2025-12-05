import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const GuidePage: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const Section: React.FC<{ id: string; title: string; children: React.ReactNode }> = ({ id, title, children }) => (
    <div className="mb-6 bg-white dark:bg-navy-light rounded-lg border border-navy/10 dark:border-dark-cyan/30 overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-navy/5 dark:hover:bg-navy-dark/50 transition-colors"
      >
        <h2 className="text-xl font-bold text-navy dark:text-white flex items-center gap-2">
          {expandedSections[id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          {title}
        </h2>
      </button>
      {expandedSections[id] && (
        <div className="p-6 pt-0 prose prose-sm max-w-none prose-headings:text-navy dark:prose-headings:text-white prose-p:text-navy/80 dark:prose-p:text-white/90 prose-li:text-navy/80 dark:prose-li:text-white/90 prose-strong:text-navy dark:prose-strong:text-white">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="h-8 w-8 text-dark-cyan" />
          <h1 className="text-3xl font-bold text-navy dark:text-white">
            Credentialing System Guide
          </h1>
        </div>
        <p className="text-navy/70 dark:text-cream/70">
          Complete guide to using the payer-centric credentialing workflow system
        </p>
      </div>

      <Section id="overview" title="System Overview">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Core Concept</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                This system is <strong>payer-centric</strong>, meaning payers drive the workflow. Each payer defines its requirements,
                dependencies, and timelines, and the system automatically generates tasks and manages the credentialing process.
              </p>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-2">Key Entities</h3>
        <ul className="space-y-2">
          <li><strong>Payers:</strong> Insurance companies, credentialing organizations (Medicare, AHCCCS, commercial insurers)</li>
          <li><strong>Providers:</strong> Healthcare professionals who need credentialing</li>
          <li><strong>Locations:</strong> Practice locations (optional)</li>
          <li><strong>Subflows:</strong> Reusable workflow templates created from payers</li>
          <li><strong>Tasks:</strong> Automatically generated action items based on payer requirements</li>
          <li><strong>Workflows:</strong> Overall credentialing processes</li>
        </ul>
      </Section>

      <Section id="order" title="Recommended Setup Order">
        <div className="bg-goldenrod/10 border border-goldenrod/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-goldenrod flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-navy dark:text-white">Follow This Order</h3>
              <p className="text-sm text-navy/70 dark:text-cream/70">
                Setting things up in the correct order ensures smooth operation and proper dependency management.
              </p>
            </div>
          </div>
        </div>

        <ol className="space-y-4 list-decimal list-inside">
          <li className="font-semibold text-navy dark:text-white">
            Create Locations (Optional)
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Locations</strong> page and add your practice locations. This is optional but recommended if you have multiple offices.
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Create Providers
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Providers</strong> page and add all healthcare professionals who need credentialing.
              Include as much information as possible (email, phone, license number, specialty).
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Create Payers (Start with Foundation Payers)
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Payers</strong> page. <strong className="text-red-600">Important:</strong> Create foundation payers first (e.g., Medicare, CAQH)
              before creating payers that depend on them. See detailed instructions below.
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Accept Subflow Creation
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              After creating each payer, a modal will ask if you want to create a subflow. Click <strong>"Create Subflow"</strong> to
              automatically generate task templates for that payer.
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Assign Payers to Providers
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              In the <strong>Payers</strong> page, click a payer card's bottom section to bulk assign to providers.
              This creates applications and generates initial tasks.
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Work Through Tasks
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Tasks</strong> page. Tasks are sorted by priority. Work on high-priority tasks first.
              Click on a task to view provider details and complete missing information.
            </p>
          </li>
        </ol>
      </Section>

      <Section id="payers" title="Creating Payers - Detailed Guide">
        <h3 className="font-semibold text-lg mb-3">Understanding Payer Dependencies</h3>
        <p className="mb-4">
          Many payers require approval from other payers before you can apply. For example:
        </p>
        <ul className="space-y-2 mb-6">
          <li><strong>Medicare:</strong> No dependencies (foundation payer)</li>
          <li><strong>CAQH:</strong> No dependencies (foundation payer)</li>
          <li><strong>AHCCCS:</strong> Requires Medicare approval first</li>
          <li><strong>Commercial Insurers:</strong> May require CAQH and/or Medicare</li>
        </ul>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Critical: Create in Dependency Order</h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Always create foundation payers (Medicare, CAQH) BEFORE creating dependent payers (AHCCCS, commercial insurers).
                If you try to select a dependent payer that doesn't exist yet, you won't see it in the dropdown!
              </p>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-3">Step-by-Step: Creating a Payer</h3>
        <ol className="space-y-4 list-decimal list-inside">
          <li>
            <strong>Click "Add Payer" button</strong> on the Payers page
          </li>
          <li>
            <strong>Fill in Basic Information:</strong>
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li><strong>Payer Name:</strong> e.g., "Medicare", "AHCCCS", "Blue Cross Blue Shield"</li>
              <li><strong>Type:</strong> Insurance, Credentialing, Government, or Other</li>
              <li><strong>Workflow State:</strong> AZ, TX, or ALL</li>
              <li><strong>Description:</strong> Optional notes about the payer</li>
            </ul>
          </li>
          <li>
            <strong>Set Timeline Information:</strong>
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li><strong>Days to Approve:</strong> How long approval typically takes (e.g., 30 days)</li>
              <li><strong>Days to Load:</strong> How long loading into system takes (e.g., 60 days)</li>
            </ul>
          </li>
          <li>
            <strong>Set Priority:</strong>
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li><strong>Priority Base:</strong> Lower number = higher priority (Medicare = 1, others 50-100)</li>
              <li><strong>Always Required:</strong> Check for critical payers like Medicare</li>
            </ul>
          </li>
          <li>
            <strong>Add Required Documents:</strong>
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li>Type document name (e.g., "COI", "CV", "W9")</li>
              <li>Press Enter or click "Add"</li>
              <li>Remove by clicking × on tags</li>
            </ul>
          </li>
          <li>
            <strong>Select Required Provider Fields:</strong>
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li>Check boxes for fields providers must have completed</li>
              <li>Email, Phone, Specialty, License Number</li>
            </ul>
          </li>
          <li>
            <strong>Select Dependent Payers (if applicable):</strong>
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li>Hold Ctrl/Cmd and click multiple payers in the list</li>
              <li>These payers must be approved BEFORE this payer can be submitted</li>
              <li>Only shows payers you've already created</li>
            </ul>
          </li>
          <li>
            <strong>Click "Add Payer"</strong>
          </li>
          <li>
            <strong>Accept Subflow Creation:</strong>
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li>Modal appears asking to create subflow</li>
              <li>Review what will be created</li>
              <li>Click "Create Subflow" (recommended)</li>
              <li>System generates task templates automatically</li>
            </ul>
          </li>
        </ol>

        <h3 className="font-semibold text-lg mt-6 mb-3">Example: Creating Medicare</h3>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 font-mono text-sm">
          <p><strong>Name:</strong> Medicare</p>
          <p><strong>Type:</strong> Government</p>
          <p><strong>Days to Approve:</strong> 30</p>
          <p><strong>Days to Load:</strong> 90</p>
          <p><strong>Priority Base:</strong> 1</p>
          <p><strong>Always Required:</strong> ✓ Checked</p>
          <p><strong>Required Documents:</strong> COI, CV, W9, License Copy</p>
          <p><strong>Required Fields:</strong> Email, Phone, License Number</p>
          <p><strong>Dependent Payers:</strong> None (foundation payer)</p>
        </div>

        <h3 className="font-semibold text-lg mt-6 mb-3">Example: Creating AHCCCS (Depends on Medicare)</h3>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 font-mono text-sm">
          <p><strong>Name:</strong> AHCCCS</p>
          <p><strong>Type:</strong> Government</p>
          <p><strong>Days to Approve:</strong> 45</p>
          <p><strong>Days to Load:</strong> 60</p>
          <p><strong>Priority Base:</strong> 25</p>
          <p><strong>Always Required:</strong> ✗ Unchecked</p>
          <p><strong>Required Documents:</strong> AHCCCS Application, Medicare Card Copy</p>
          <p><strong>Required Fields:</strong> Email, License Number</p>
          <p><strong>Dependent Payers:</strong> Medicare (must be approved first)</p>
        </div>
      </Section>

      <Section id="subflows" title="Understanding Subflows">
        <p className="mb-4">
          <strong>Subflows</strong> are reusable workflow templates automatically generated from payers. When you accept
          subflow creation after creating a payer, the system creates:
        </p>

        <h3 className="font-semibold text-lg mb-3">What Gets Created</h3>
        <ol className="space-y-3 list-decimal list-inside">
          <li>
            <strong>Subflow Template:</strong> Named "{'{'}Payer Name{'}'} Application Process"
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-sm">
              <li>Reusable across multiple workflows</li>
              <li>Can be assigned to multiple providers</li>
              <li>Defines the complete process for that payer</li>
            </ul>
          </li>
          <li>
            <strong>Task Templates:</strong> Automatically generated based on payer configuration
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-sm">
              <li><strong>Document Tasks:</strong> One for each required document</li>
              <li><strong>Info Task:</strong> If required provider fields are specified</li>
              <li><strong>Submission Task:</strong> For submitting the application</li>
              <li><strong>Approval Tracking Task:</strong> With due date based on days_to_approve</li>
              <li><strong>Loading Task:</strong> With due date based on days_to_load</li>
            </ul>
          </li>
        </ol>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Why Create Subflows?</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                Subflows enable automatic task generation. When you assign a payer to a provider, the system:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-disc list-inside ml-4">
                <li>Uses the payer's subflow to know what tasks to create</li>
                <li>Generates tasks at the right time based on triggers</li>
                <li>Respects dependencies (creates submission tasks only when prerequisites met)</li>
                <li>Calculates priorities and due dates automatically</li>
              </ul>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-3 mt-6">Visualizing Workflows</h3>
        <p className="mb-4">
          After creating a payer and its subflow, you can view an interactive flowchart of the entire workflow:
        </p>
        <ol className="space-y-2 list-decimal list-inside mb-4">
          <li>Go to the <strong>Payers</strong> page</li>
          <li>Find your payer card</li>
          <li>Click the blue <strong>workflow icon</strong> (Git Branch) in the top-right corner</li>
          <li>Interactive flowchart opens showing:
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-sm">
              <li>Prerequisites (dependencies on other payers)</li>
              <li>Initial phase tasks (documents, info)</li>
              <li>Submission task</li>
              <li>Post-submission tasks (evidence, tracking)</li>
              <li>Approval phase tasks (loading, EMR entry)</li>
              <li>Color-coded status for each task (if viewing provider-specific workflow)</li>
            </ul>
          </li>
        </ol>
      </Section>

      <Section id="tasks" title="Working with Tasks">
        <h3 className="font-semibold text-lg mb-3">Task Priority System</h3>
        <p className="mb-4">
          Tasks are automatically sorted by <strong>computed priority</strong>, which considers:
        </p>
        <ul className="space-y-2 mb-6">
          <li><strong>Payer Priority:</strong> Medicare (1) appears before commercial insurers (50-100)</li>
          <li><strong>Blocking Impact:</strong> Tasks that block other payers get higher priority</li>
          <li><strong>Due Date:</strong> Overdue and soon-due tasks move to top</li>
          <li><strong>Task Type:</strong> Info gathering {">"} Documents {">"} Submission {">"} Tracking</li>
          <li><strong>Manual Priority:</strong> Urgent/High/Medium/Low adjustments</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">Visual Indicators</h3>
        <ul className="space-y-2 mb-6">
          <li><strong>! Badge:</strong> Urgent priority (≤20)</li>
          <li><strong>↑ Badge:</strong> High priority (≤50)</li>
          <li><strong>ⓘ Icon:</strong> Hover to see priority explanation</li>
          <li><strong>Red "Overdue":</strong> Past due date</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">Completing Tasks</h3>
        <ol className="space-y-4 list-decimal list-inside">
          <li>
            <strong>Click on a task</strong> to open provider details
          </li>
          <li>
            <strong>If fields are highlighted red:</strong> Provider is missing required information
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li>Click "Edit" button</li>
              <li>Fill in the missing fields</li>
              <li>Click "Save"</li>
              <li>Modal closes and refreshes</li>
            </ul>
          </li>
          <li>
            <strong>Change task status</strong> using the dropdown:
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside">
              <li>Pending → In Progress → Completed</li>
              <li>Completing tasks triggers dependent tasks</li>
            </ul>
          </li>
          <li>
            <strong>Update application status</strong> in Providers page to trigger next phase tasks
          </li>
        </ol>

        <div className="bg-goldenrod/10 border border-goldenrod/30 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-goldenrod flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-navy dark:text-white">Automatic Unlocking</h3>
              <p className="text-sm text-navy/70 dark:text-cream/70">
                When you mark a foundation payer as "Approved" (e.g., Medicare), the system automatically:
              </p>
              <ul className="text-sm text-navy/70 dark:text-cream/70 mt-2 space-y-1 list-disc list-inside ml-4">
                <li>Finds all dependent payers (e.g., AHCCCS)</li>
                <li>Checks if their prerequisites are now met</li>
                <li>Generates submission tasks for newly unlocked payers</li>
                <li>You'll see new high-priority tasks appear automatically!</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section id="workflows" title="Creating Workflows (Optional)">
        <p className="mb-4">
          <strong>Note:</strong> With the payer-centric system, workflows are optional. The system works by assigning
          payers directly to providers. However, you can still create workflows for organizational purposes.
        </p>

        <h3 className="font-semibold text-lg mb-3">When to Use Workflows</h3>
        <ul className="space-y-2 mb-6">
          <li><strong>Standardized Process:</strong> Define a standard credentialing process for all new providers</li>
          <li><strong>Multi-Payer Packages:</strong> Group multiple payers that always go together</li>
          <li><strong>Reporting:</strong> Track progress of a specific initiative</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">How Workflows Work Now</h3>
        <p className="mb-4">
          Workflows serve as containers that can reference multiple payers. The actual work is driven by payer
          assignments and their subflows.
        </p>
      </Section>

      <Section id="bestpractices" title="Best Practices">
        <h3 className="font-semibold text-lg mb-3">Payer Setup</h3>
        <ul className="space-y-2 mb-6">
          <li>✓ Create foundation payers first (Medicare, CAQH)</li>
          <li>✓ Always accept subflow creation</li>
          <li>✓ Set realistic timeline expectations (days_to_approve, days_to_load)</li>
          <li>✓ Mark truly critical payers as "Always Required"</li>
          <li>✓ Use lower priority numbers (1-10) sparingly for only the most important payers</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">Provider Data</h3>
        <ul className="space-y-2 mb-6">
          <li>✓ Enter as much provider information as possible upfront</li>
          <li>✓ Include email, phone, and license number at minimum</li>
          <li>✓ Keep license expiry dates current</li>
          <li>✓ Link providers to locations when applicable</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">Task Management</h3>
        <ul className="space-y-2 mb-6">
          <li>✓ Work tasks in priority order (system sorts automatically)</li>
          <li>✓ Review priority tooltips to understand why tasks are prioritized</li>
          <li>✓ Complete info-gathering tasks first (they block everything)</li>
          <li>✓ Update application statuses promptly to trigger next phase</li>
          <li>✓ Use task status to track progress accurately</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">Dependency Management</h3>
        <ul className="space-y-2">
          <li>✓ Understand which payers depend on others</li>
          <li>✓ Focus on foundation payer approvals first</li>
          <li>✓ Watch for automatic task generation when dependencies unlock</li>
          <li>✓ Don't manually create tasks for dependent payers (system does it automatically)</li>
        </ul>
      </Section>

      <Section id="technical" title="Technical Manual - System Architecture">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">For Developers & Technical Staff</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                This section provides detailed technical documentation of the system architecture, data models, and core services.
              </p>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-3">1. System Architecture Overview</h3>
        <p className="mb-4">
          The credentialing system is built on a modern stack with clear separation of concerns:
        </p>
        <ul className="space-y-2 mb-6">
          <li><strong>Frontend:</strong> React + TypeScript + Vite</li>
          <li><strong>Backend:</strong> Supabase (PostgreSQL + RLS + Edge Functions)</li>
          <li><strong>Visualization:</strong> ReactFlow for visual workflow designer</li>
          <li><strong>Authentication:</strong> Supabase Auth with Row Level Security</li>
          <li><strong>Storage:</strong> Supabase Storage for document management</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">2. Database Schema & Entity Relationships</h3>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Core Entities</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p><strong>organizations</strong> - Multi-tenant organization accounts</p>
          <p className="ml-4">├─ org_members - Organization membership and roles</p>
          <p className="ml-4">├─ providers - Healthcare professionals</p>
          <p className="ml-4">├─ payers - Insurance companies/credentialing orgs</p>
          <p className="ml-4">├─ locations - Practice locations</p>
          <p className="ml-4">├─ workflows - Workflow containers (optional)</p>
          <p className="ml-4">├─ subflows - Reusable workflow templates</p>
          <p className="ml-4">└─ documents - Document storage records</p>
        </div>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Payer System (Core)</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p><strong>payers</strong></p>
          <p className="ml-2">- priority_base (1-1000, lower = higher priority)</p>
          <p className="ml-2">- is_always_required (boolean, foundation payers)</p>
          <p className="ml-2">- days_to_approve (integer, timeline expectations)</p>
          <p className="ml-2">- days_to_load (integer, post-approval timeline)</p>
          <p className="ml-2">- required_documents (jsonb array)</p>
          <p className="ml-2">- required_provider_fields (jsonb array)</p>
          <p className="ml-2">- dependent_on_payer_ids (uuid array)</p>
        </div>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Application & Task System</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p><strong>provider_payer_applications</strong> - Junction table tracking provider-payer pairs</p>
          <p className="ml-2">- status: not_started | submitted | approved | loaded</p>
          <p className="ml-2">- application_submission_date, application_approved_date</p>
          <p className="ml-2">- effective_date (when active in system)</p>
          <br/>
          <p><strong>tasks</strong> - Individual action items</p>
          <p className="ml-2">- computed_priority (1-1000, auto-calculated)</p>
          <p className="ml-2">- priority_reason (explanation string)</p>
          <p className="ml-2">- blocks_payers (array of payer IDs this task unblocks)</p>
          <p className="ml-2">- task_template_id (link to template if auto-generated)</p>
        </div>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Workflow System</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p><strong>workflow_definitions</strong> - Visual workflow blueprints</p>
          <p className="ml-2">- payer_id (which payer this workflow belongs to)</p>
          <p className="ml-2">- workflow_data (jsonb): nodes[], edges[]</p>
          <p className="ml-2">- is_active (boolean, only one active per payer)</p>
          <br/>
          <p><strong>workflow_execution_instances</strong> - Running workflow instances</p>
          <p className="ml-2">- provider_id, payer_id (specific to one provider-payer pair)</p>
          <p className="ml-2">- status: pending | running | completed | failed</p>
          <p className="ml-2">- execution_context (variables, state)</p>
          <br/>
          <p><strong>node_executions</strong> - Individual node execution records</p>
          <p className="ml-2">- Tracks each node's execution within an instance</p>
          <p className="ml-2">- Records results and next handle (routing)</p>
        </div>

        <h3 className="font-semibold text-lg mb-3 mt-6">3. Workflow Execution Engine</h3>
        <p className="mb-4">
          <strong>Location:</strong> <code className="bg-navy/10 px-2 py-0.5 rounded">src/services/WorkflowExecutionService.ts</code>
        </p>
        <p className="mb-4">
          The Workflow Execution Engine orchestrates the execution of visual workflows defined in the workflow designer.
        </p>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Key Components:</h4>
        <ol className="space-y-2 list-decimal list-inside mb-4">
          <li>
            <strong>startWorkflow(providerId, payerId, organizationId)</strong>
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Retrieves active workflow definition for payer</li>
              <li>Creates workflow execution instance</li>
              <li>Finds START node and begins execution</li>
            </ul>
          </li>
          <li>
            <strong>executeNode(instanceId, nodeId)</strong>
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Routes to appropriate handler based on node type</li>
              <li>Creates node execution record</li>
              <li>Updates execution context with results</li>
              <li>Follows edges to next nodes</li>
            </ul>
          </li>
          <li>
            <strong>Node Type Handlers</strong>
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>prerequisite_check - Validates dependencies are met</li>
              <li>generate_task - Creates tasks from templates</li>
              <li>wait_for_date - Pauses until date reached</li>
              <li>wait_for_document - Waits for document upload</li>
              <li>wait_for_profile_field - Waits for provider data</li>
              <li>send_notification - Sends emails/notifications</li>
              <li>auto_complete_task - Marks tasks as done</li>
              <li>update_provider_field - Modifies provider data</li>
              <li>parallel_tasks - Spawns multiple task branches</li>
            </ul>
          </li>
        </ol>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Execution Flow:</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>1. START node found → executeNode()</p>
          <p>2. Node handler processes logic</p>
          <p>3. Result stored with nextHandle (e.g., "success", "failed")</p>
          <p>4. Find edges matching source node + handle</p>
          <p>5. Follow edges to target nodes → executeNode() recursively</p>
          <p>6. Continue until COMPLETE node or no more edges</p>
          <p>7. Mark instance as completed/failed</p>
        </div>

        <h3 className="font-semibold text-lg mb-3 mt-6">4. Task Generation System</h3>
        <p className="mb-4">
          <strong>Location:</strong> <code className="bg-navy/10 px-2 py-0.5 rounded">src/services/TaskGenerationService.ts</code>
        </p>
        <p className="mb-4">
          Automatically generates tasks when providers are assigned to payers, based on task templates stored in the database.
        </p>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Task Template Structure:</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p><strong>payer_task_templates</strong></p>
          <p className="ml-2">- title_template (string)</p>
          <p className="ml-2">- description_template (string, supports variables)</p>
          <p className="ml-2">- task_type (info | document | submission | approval | loading)</p>
          <p className="ml-2">- trigger_condition (when to create the task):</p>
          <p className="ml-4">• on_provider_assign - Immediately on assignment</p>
          <p className="ml-4">• prerequisites_met - When dependencies satisfied</p>
          <p className="ml-4">• on_submission - When application submitted</p>
          <p className="ml-4">• on_approval - When application approved</p>
          <p className="ml-2">- due_date_offset_days (integer, relative to trigger)</p>
          <p className="ml-2">- prevents_duplication (boolean, check for existing)</p>
        </div>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Generation Process:</h4>
        <ol className="space-y-2 list-decimal list-inside mb-4">
          <li>Provider assigned to payer → generates provider_payer_application record</li>
          <li>System fetches all task templates for that payer</li>
          <li>For each template, evaluates trigger_condition</li>
          <li>If condition met, creates task with calculated priority and due date</li>
          <li>Duplicate prevention checks if prevents_duplication = true</li>
        </ol>

        <h3 className="font-semibold text-lg mb-3 mt-6">5. Priority Calculation Engine</h3>
        <p className="mb-4">
          <strong>Location:</strong> <code className="bg-navy/10 px-2 py-0.5 rounded">src/services/PriorityCalculationService.ts</code>
        </p>
        <p className="mb-4">
          Intelligent multi-factor priority calculation ensuring critical tasks surface to the top.
        </p>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Priority Factors (in order of impact):</h4>
        <ol className="space-y-3 list-decimal list-inside mb-4">
          <li>
            <strong>Payer Base Priority</strong> (weight: 1.0)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Foundation payers (Medicare): priority_base = 1</li>
              <li>Critical payers (AHCCCS): priority_base = 25</li>
              <li>Commercial payers: priority_base = 50-100</li>
              <li>is_always_required flag → forces to top 5 priority</li>
            </ul>
          </li>
          <li>
            <strong>Dependency Blocking</strong> (weight: 2.0)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Tasks blocking other payers get -10 per blocked payer</li>
              <li>Transitive dependencies counted (if A blocks B, B blocks C)</li>
              <li>Stored in task.blocks_payers array</li>
            </ul>
          </li>
          <li>
            <strong>Due Date Urgency</strong> (weight: 1.5)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Overdue: -50 priority penalty</li>
              <li>Due today: -30</li>
              <li>Due in 1-3 days: -20</li>
              <li>Due in 4-7 days: -10</li>
              <li>Due in 8-14 days: 0</li>
              <li>Due later: +10</li>
            </ul>
          </li>
          <li>
            <strong>Task Type Weighting</strong> (weight: 1.0)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Info gathering: -15 (most blocking)</li>
              <li>Document collection: -10</li>
              <li>Submission: -5</li>
              <li>Tracking: 0</li>
              <li>Loading/confirmation: +5</li>
            </ul>
          </li>
          <li>
            <strong>Manual Priority Override</strong>
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Urgent: -40 (overrides everything)</li>
              <li>High: -20</li>
              <li>Medium: 0</li>
              <li>Low: +20</li>
            </ul>
          </li>
        </ol>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Priority Rules System:</h4>
        <p className="mb-2">
          Administrators can customize priority calculation via the <strong>priority_rules</strong> table:
        </p>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>rule_type: payer_base | dependency_count | due_date | task_type</p>
          <p>weight: float (multiplier for that factor)</p>
          <p>is_active: boolean</p>
        </div>

        <h3 className="font-semibold text-lg mb-3 mt-6">6. Document Management System</h3>
        <p className="mb-4">
          <strong>Location:</strong> Documents page, Supabase Storage bucket
        </p>
        <p className="mb-4">
          Secure document storage with RLS policies ensuring users only access their organization's files.
        </p>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Storage Structure:</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>Bucket: <strong>documents</strong></p>
          <p>Path structure: /organization_id/provider_id/payer_id/filename</p>
          <p>Example: /org-abc/provider-123/payer-medicare/license.pdf</p>
        </div>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Document Record (documents table):</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>- file_name, file_path (storage path), file_size, mime_type</p>
          <p>- uploaded_by (user_id), organization_id</p>
          <p>- provider_id, payer_id (for filtering and association)</p>
          <p>- document_type (COI, CV, W9, License, etc.)</p>
          <p>- status (pending | approved | rejected | expired)</p>
        </div>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">RLS Security:</h4>
        <ul className="space-y-1 list-disc list-inside text-sm mb-4">
          <li>Users can only upload documents if they're members of the organization</li>
          <li>Users can only view/download documents from their organization</li>
          <li>Storage bucket policies enforce path-based access control</li>
          <li>Prevents cross-organization data leaks</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3 mt-6">7. Visual Workflow Designer</h3>
        <p className="mb-4">
          <strong>Location:</strong> <code className="bg-navy/10 px-2 py-0.5 rounded">src/components/workflow/WorkflowDesignerPage.tsx</code>
        </p>
        <p className="mb-4">
          Drag-and-drop visual workflow builder powered by ReactFlow library.
        </p>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Node Types Available:</h4>
        <ul className="space-y-2 mb-4">
          <li><strong>start</strong> - Entry point (one per workflow)</li>
          <li><strong>complete</strong> - Exit point (can have multiple)</li>
          <li><strong>task</strong> - Manual task creation</li>
          <li><strong>prerequisite_check</strong> - Validate dependencies</li>
          <li><strong>generate_task</strong> - Auto-create tasks from templates</li>
          <li><strong>wait_for_date</strong> - Pause until date</li>
          <li><strong>wait_for_document</strong> - Pause until document uploaded</li>
          <li><strong>wait_for_profile_field</strong> - Pause until provider field populated</li>
          <li><strong>send_notification</strong> - Email/notification dispatch</li>
          <li><strong>decision</strong> - Conditional branching</li>
          <li><strong>parallel</strong> - Execute multiple branches simultaneously</li>
          <li><strong>subflow</strong> - Embed another workflow</li>
          <li><strong>auto_complete_task</strong> - Mark tasks as complete</li>
          <li><strong>update_provider_field</strong> - Modify provider data</li>
        </ul>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Auto-Layout Algorithm:</h4>
        <p className="mb-2">Improved topological sort with smart positioning:</p>
        <ol className="space-y-1 list-decimal list-inside text-sm mb-4">
          <li>Calculate in-degree for each node (number of incoming edges)</li>
          <li>Group nodes into layers using breadth-first traversal</li>
          <li>Nodes with zero in-degree go in first layer</li>
          <li>Subsequent layers contain nodes whose dependencies are satisfied</li>
          <li>Align nodes horizontally within layers with proper spacing (280px + 150px gap)</li>
          <li>Vertical spacing between layers: 180px</li>
          <li>Use smoothstep edges for clean right-angle connections</li>
        </ol>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Workflow Data Storage:</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>workflow_data (jsonb):</p>
          <p>{`{`}</p>
          <p className="ml-2">"nodes": [{"{"} id, type, position: {"{"}x, y{"}"}, data: {"{"}config{"}"} {"}"}], </p>
          <p className="ml-2">"edges": [{"{"} id, source, target, type: "smoothstep" {"}"}]</p>
          <p>{`}`}</p>
        </div>

        <h3 className="font-semibold text-lg mb-3 mt-6">8. Authentication & Security (RLS)</h3>
        <p className="mb-4">
          <strong>Supabase Authentication</strong> with <strong>Row Level Security (RLS)</strong> enforced at database level.
        </p>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Multi-Tenant Security Model:</h4>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Critical Security Design</h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                Every table (except auth.users) has an organization_id column. RLS policies ensure users only
                access data from organizations they belong to via org_members table.
              </p>
            </div>
          </div>
        </div>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">RLS Policy Pattern:</h4>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>-- Example for providers table</p>
          <p>CREATE POLICY "Users can view org providers"</p>
          <p className="ml-2">ON providers FOR SELECT</p>
          <p className="ml-2">TO authenticated</p>
          <p className="ml-2">USING (</p>
          <p className="ml-4">organization_id IN (</p>
          <p className="ml-6">SELECT organization_id FROM org_members</p>
          <p className="ml-6">WHERE user_id = auth.uid()</p>
          <p className="ml-4">)</p>
          <p className="ml-2">);</p>
        </div>

        <h4 className="font-semibold mb-2 text-navy dark:text-white">Preventing Recursive RLS Issues:</h4>
        <p className="mb-2">
          The org_members table RLS must NOT query itself (causes infinite recursion). Solution:
        </p>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>-- ✓ CORRECT: Only check own user_id</p>
          <p>CREATE POLICY "Users can view own membership"</p>
          <p className="ml-2">ON org_members FOR SELECT</p>
          <p className="ml-2">USING (auth.uid() = user_id);</p>
          <br/>
          <p>-- ✗ WRONG: Creates recursion!</p>
          <p>CREATE POLICY "Users can view org members"</p>
          <p className="ml-2">ON org_members FOR SELECT</p>
          <p className="ml-2">USING (organization_id IN (</p>
          <p className="ml-4">SELECT organization_id FROM org_members -- RECURSION!</p>
          <p className="ml-4">WHERE user_id = auth.uid()</p>
          <p className="ml-2">));</p>
        </div>

        <h3 className="font-semibold text-lg mb-3 mt-6">9. Service Layer Architecture</h3>
        <p className="mb-4">Services are stateless classes with static methods, organized by domain:</p>

        <ul className="space-y-2 mb-4">
          <li>
            <strong>DatabaseService</strong> (src/lib/supabase.ts)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>CRUD operations for all entities</li>
              <li>Query helpers and filters</li>
              <li>Relationship loading</li>
            </ul>
          </li>
          <li>
            <strong>WorkflowDatabaseService</strong> (src/lib/workflowDatabase.ts)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Workflow definition CRUD</li>
              <li>Workflow instance management</li>
              <li>Node execution tracking</li>
            </ul>
          </li>
          <li>
            <strong>WorkflowExecutionService</strong> (src/services/WorkflowExecutionService.ts)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Orchestrates workflow execution</li>
              <li>Node type handlers</li>
              <li>Context management</li>
            </ul>
          </li>
          <li>
            <strong>TaskGenerationService</strong> (src/services/TaskGenerationService.ts)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Auto-generates tasks from templates</li>
              <li>Evaluates trigger conditions</li>
              <li>Calculates due dates</li>
            </ul>
          </li>
          <li>
            <strong>PriorityCalculationService</strong> (src/services/PriorityCalculationService.ts)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Multi-factor priority calculation</li>
              <li>Dependency graph analysis</li>
              <li>Blocking impact calculation</li>
            </ul>
          </li>
          <li>
            <strong>DynamicTaskUpdateService</strong> (src/services/DynamicTaskUpdateService.ts)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Watches for application status changes</li>
              <li>Triggers task generation on state transitions</li>
              <li>Unlocks dependent payers</li>
            </ul>
          </li>
          <li>
            <strong>SubflowMigrationService</strong> (src/services/SubflowMigrationService.ts)
            <ul className="ml-6 mt-1 space-y-1 list-disc list-inside text-sm">
              <li>Converts legacy subflows to visual format</li>
              <li>Backward compatibility layer</li>
            </ul>
          </li>
        </ul>

        <h3 className="font-semibold text-lg mb-3 mt-6">10. Data Flow - Provider Assignment</h3>
        <p className="mb-2">Step-by-step flow when assigning a payer to a provider:</p>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>1. User clicks "Assign to Providers" on payer card</p>
          <p>2. System creates provider_payer_application record (status: not_started)</p>
          <p>3. TaskGenerationService.generateTasksForProviderPayer() called</p>
          <p>4. Service checks if prerequisites met (dependent payers approved?)</p>
          <p>5. Fetches payer_task_templates for this payer</p>
          <p>6. For each template, evaluates trigger_condition:</p>
          <p className="ml-4">- on_provider_assign → create immediately</p>
          <p className="ml-4">- prerequisites_met → only if dependencies satisfied</p>
          <p>7. Creates tasks with:</p>
          <p className="ml-4">- computed_priority (calculated by PriorityCalculationService)</p>
          <p className="ml-4">- due_date (base_date + offset_days)</p>
          <p className="ml-4">- blocks_payers (which payers this task unblocks)</p>
          <p className="ml-4">- priority_reason (human-readable explanation)</p>
          <p>8. Tasks appear in Tasks page, sorted by computed_priority ASC</p>
        </div>

        <h3 className="font-semibold text-lg mb-3 mt-6">11. Data Flow - Dependency Unlocking</h3>
        <p className="mb-2">What happens when a foundation payer gets approved:</p>
        <div className="bg-navy/5 dark:bg-navy-dark/50 rounded-lg p-4 mb-4 font-mono text-xs">
          <p>1. User updates application status: not_started → approved</p>
          <p>2. DynamicTaskUpdateService detects status change</p>
          <p>3. Service queries all payers with dependent_on_payer_ids containing this payer</p>
          <p>4. For each dependent payer (e.g., AHCCCS depends on Medicare):</p>
          <p className="ml-4">- Check if ALL dependencies now satisfied</p>
          <p className="ml-4">- If yes, generate submission tasks</p>
          <p>5. PriorityCalculationService recalculates all task priorities</p>
          <p>6. Newly unlocked tasks appear at top (high priority)</p>
          <p>7. User sees notification: "Medicare approved → AHCCCS submission now available"</p>
        </div>

        <h3 className="font-semibold text-lg mb-3 mt-6">12. Performance Considerations</h3>
        <ul className="space-y-2 mb-4">
          <li><strong>Database Indexes:</strong> All foreign keys indexed, organization_id indexed on every table</li>
          <li><strong>RLS Optimization:</strong> Policies use indexed columns (user_id, organization_id)</li>
          <li><strong>Query Batching:</strong> Services fetch related data in single queries where possible</li>
          <li><strong>React Optimizations:</strong> useCallback, useMemo used to prevent unnecessary re-renders</li>
          <li><strong>ReactFlow:</strong> Node virtualization for large workflows ({">"} 100 nodes)</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3 mt-6">13. Extension Points</h3>
        <p className="mb-2">Areas designed for customization:</p>
        <ul className="space-y-2 mb-4">
          <li><strong>Custom Node Types:</strong> Add new workflow node types in CustomNodes.tsx</li>
          <li><strong>Priority Rules:</strong> Modify weights via priority_rules table</li>
          <li><strong>Task Templates:</strong> Create custom templates for specialized workflows</li>
          <li><strong>Document Types:</strong> Add new document types in document_type enum</li>
          <li><strong>Notification Channels:</strong> Extend send_notification to support SMS, Slack, etc.</li>
        </ul>

        <div className="bg-goldenrod/10 border border-goldenrod/30 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-goldenrod flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-navy dark:text-white">Development Best Practices</h3>
              <ul className="text-sm text-navy/70 dark:text-cream/70 mt-2 space-y-1 list-disc list-inside ml-4">
                <li>Always test RLS policies with different user roles</li>
                <li>Use migrations for schema changes, never modify database directly</li>
                <li>Document all priority rule weight changes</li>
                <li>Test workflow execution in isolated test organization</li>
                <li>Validate task generation logic before deploying to production</li>
                <li>Monitor computed_priority distribution to ensure balance</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section id="troubleshooting" title="Common Issues & Solutions">
        <div className="space-y-4">
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold text-navy dark:text-white">Issue: Can't select dependent payer in dropdown</h4>
            <p className="text-sm text-navy/70 dark:text-cream/70">
              <strong>Solution:</strong> Create the foundation payer first, then create the dependent payer.
              The dropdown only shows payers that already exist.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold text-navy dark:text-white">Issue: Tasks not appearing after assigning payer</h4>
            <p className="text-sm text-navy/70 dark:text-cream/70">
              <strong>Solution:</strong> Make sure you accepted subflow creation for that payer. Without a subflow,
              the system doesn't know what tasks to create. You can recreate the subflow by editing the payer.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold text-navy dark:text-white">Issue: Submission task not appearing for dependent payer</h4>
            <p className="text-sm text-navy/70 dark:text-cream/70">
              <strong>Solution:</strong> Check if the prerequisite payers are marked as "Approved" in the Providers page.
              The system only creates submission tasks when all dependencies are satisfied.
            </p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-semibold text-navy dark:text-white">Issue: Provider info saved but still shows as missing</h4>
            <p className="text-sm text-navy/70 dark:text-cream/70">
              <strong>Solution:</strong> The modal will now close automatically after save and refresh. Open it again
              to see the updated information without red highlights.
            </p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-semibold text-navy dark:text-white">Issue: Duplicate assignment error</h4>
            <p className="text-sm text-navy/70 dark:text-cream/70">
              <strong>Solution:</strong> This is normal if a provider already has that payer assigned. The system
              will now skip duplicates gracefully and show you how many were actually assigned.
            </p>
          </div>
        </div>
      </Section>

      <div className="mt-8 p-6 bg-gradient-to-r from-dark-cyan/10 to-goldenrod/10 rounded-lg border border-dark-cyan/30">
        <h3 className="font-semibold text-lg mb-2 text-navy dark:text-white">Quick Start Checklist</h3>
        <ol className="space-y-2 list-decimal list-inside text-navy/80 dark:text-cream/80">
          <li>Create locations (if needed)</li>
          <li>Add all providers with complete information</li>
          <li>Create Medicare payer + accept subflow</li>
          <li>Create CAQH payer + accept subflow</li>
          <li>Create other foundation payers + accept subflows</li>
          <li>Create dependent payers (AHCCCS, etc.) + accept subflows</li>
          <li>Assign payers to providers</li>
          <li>Work through tasks in priority order</li>
          <li>Update application statuses as you progress</li>
          <li>Watch system automatically unlock dependent payers!</li>
        </ol>
      </div>
    </div>
  );
};