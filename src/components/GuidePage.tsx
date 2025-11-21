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
        <div className="p-6 pt-0 prose prose-sm max-w-none dark:prose-invert">
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