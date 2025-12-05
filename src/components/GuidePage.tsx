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
        <div className="p-6 pt-0 [&_*]:text-navy/80 [&_*]:dark:text-white/90 [&_h3]:text-navy [&_h3]:dark:text-white [&_strong]:text-navy [&_strong]:dark:text-white [&_.text-blue-700]:dark:!text-blue-300 [&_.text-blue-800]:dark:!text-blue-200 [&_.text-navy\\/70]:dark:!text-cream/80">
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
          Complete guide to using the action-based credentialing system
        </p>
      </div>

      <Section id="overview" title="System Overview">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">Core Concept</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                This system is <strong>action-centric</strong>. Instead of complex workflow trees, you simply assign
                <strong>action templates</strong> to providers. Each action template (like Initial Credentialing, Name Change, etc.)
                automatically generates the appropriate tasks for the selected payers.
              </p>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-2">Key Entities</h3>
        <ul className="space-y-2">
          <li><strong>Providers:</strong> Healthcare professionals who need credentialing</li>
          <li><strong>Payers:</strong> Insurance companies, credentialing organizations (Medicare, AHCCCS, commercial insurers)</li>
          <li><strong>Action Templates:</strong> Pre-defined bundles of tasks (Initial Credentialing, Name Change, Re-credentialing, etc.)</li>
          <li><strong>Provider Actions:</strong> Instances of action templates assigned to specific providers</li>
          <li><strong>Tasks:</strong> Individual action items that track work to be done</li>
          <li><strong>Workflow Definitions:</strong> Optional visual blueprints for payer-specific processes</li>
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
            Create Providers
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Providers</strong> page and add all healthcare professionals who need credentialing.
              Include as much information as possible (email, phone, license number, specialty).
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Create Payers
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Payers</strong> page and add insurance companies and credentialing organizations.
              Define requirements, timelines, and dependencies for each payer.
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Review Action Templates
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Action Templates</strong> page. The system includes default templates for common actions:
              Initial Credentialing, Name Change, Re-credentialing, and Add Single Payer. Create custom templates if needed.
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Assign Actions to Providers
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Actions</strong> page and click "Start Action". Select an action template, provider(s), and payer(s).
              The system automatically generates all required tasks.
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Work Through Tasks
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              Go to <strong>Tasks</strong> page. Tasks are sorted by priority. Work on high-priority tasks first.
              Complete tasks to advance the action's progress.
            </p>
          </li>

          <li className="font-semibold text-navy dark:text-white">
            Optional: Design Visual Workflows
            <p className="text-sm text-navy/70 dark:text-cream/70 font-normal ml-6 mt-1">
              For payers with complex processes, you can design visual workflows. Go to <strong>Payers</strong> page,
              click the workflow icon on a payer card, and use the visual designer to create custom workflows for specific
              action categories (credentialing, change, renewal, custom).
            </p>
          </li>
        </ol>
      </Section>

      <Section id="actions" title="Understanding Actions">
        <p className="mb-4">
          <strong>Actions</strong> are the heart of the system. Each action represents a specific task you need to complete
          for a provider (like credentialing them with payers or updating their information).
        </p>

        <h3 className="font-semibold text-lg mb-3">System Action Templates</h3>
        <p className="mb-4">The system includes these pre-configured action templates:</p>

        <ul className="space-y-3 mb-6">
          <li>
            <strong>Initial Credentialing:</strong> Complete credentialing process for all selected payers
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-sm">
              <li>Collects provider demographics</li>
              <li>Obtains required documents</li>
              <li>Submits applications</li>
              <li>Tracks approval</li>
            </ul>
          </li>
          <li>
            <strong>Provider Name Change:</strong> Update provider name across all selected payers
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-sm">
              <li>Obtains legal documentation (marriage certificate, court order, etc.)</li>
              <li>Updates provider profile</li>
              <li>Notifies all payers</li>
              <li>Submits updated applications</li>
            </ul>
          </li>
          <li>
            <strong>Re-credentialing:</strong> Renew credentialing for existing payers
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-sm">
              <li>Reviews and updates information</li>
              <li>Renews expiring documents</li>
              <li>Submits re-credentialing application</li>
            </ul>
          </li>
          <li>
            <strong>Add Single Payer:</strong> Add one payer to already credentialed provider
            <ul className="ml-6 mt-2 space-y-1 list-disc list-inside text-sm">
              <li>Verifies existing information</li>
              <li>Obtains payer-specific documents</li>
              <li>Submits application</li>
              <li>Tracks approval</li>
            </ul>
          </li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">How Actions Work</h3>
        <ol className="space-y-2 list-decimal list-inside">
          <li>You select an action template (e.g., Initial Credentialing)</li>
          <li>Choose which provider(s) to apply it to</li>
          <li>Select which payer(s) are involved</li>
          <li>The system automatically creates all necessary tasks based on the template</li>
          <li>Tasks track progress and completed/total counts update automatically</li>
        </ol>
      </Section>

      <Section id="payers" title="Creating Payers">
        <h3 className="font-semibold text-lg mb-3">Payer Configuration</h3>
        <p className="mb-4">
          When creating a payer, you define:
        </p>

        <ul className="space-y-2 mb-6">
          <li><strong>Basic Info:</strong> Name, type, description</li>
          <li><strong>Timelines:</strong> Days to approve, days to load</li>
          <li><strong>Requirements:</strong> Required documents and provider fields</li>
          <li><strong>Priority:</strong> Base priority and whether always required</li>
        </ul>

        <p className="mb-4">
          Each payer can have different requirements for different action types. For example, a name change
          might require different documents than initial credentialing.
        </p>
      </Section>

      <Section id="workflows" title="Visual Workflow Designer (Optional)">
        <p className="mb-4">
          For payers with complex processes, you can optionally design visual workflows. These workflows are specific
          to a <strong>payer + action category</strong> combination.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300">When to Use Workflows</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Visual workflows are optional. Action templates work great for most cases. Use workflows when you need:
              </p>
              <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 space-y-1 list-disc list-inside ml-4">
                <li>Complex conditional logic</li>
                <li>Automated task generation based on prerequisites</li>
                <li>Date-based triggers and waiting periods</li>
                <li>Document upload detection and auto-completion</li>
              </ul>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-3">Available Node Types</h3>
        <ul className="space-y-2">
          <li><strong>Flow Control:</strong> Start, Complete, Branch</li>
          <li><strong>Prerequisites:</strong> Check Prerequisites, Check Dependencies, Wait for Document, Wait for Profile Field</li>
          <li><strong>Task Generation:</strong> Generate Task, Generate Task with Due Date, Parallel Tasks, Auto-Complete Task</li>
          <li><strong>Date Operations:</strong> Wait for Date, Calculate Due Date</li>
          <li><strong>Data Operations:</strong> Update Provider Data, Send Notification</li>
        </ul>
      </Section>

      <Section id="tasks" title="Working with Tasks">
        <h3 className="font-semibold text-lg mb-3">Task Priority System</h3>
        <p className="mb-4">
          Tasks are automatically sorted by <strong>computed priority</strong>, which considers:
        </p>
        <ul className="space-y-2 mb-6">
          <li><strong>Payer Priority:</strong> Higher priority payers surface first</li>
          <li><strong>Due Date:</strong> Overdue and soon-due tasks move to top</li>
          <li><strong>Task Type:</strong> Info gathering tasks get higher priority</li>
          <li><strong>Manual Priority:</strong> Urgent/High/Medium/Low adjustments</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">Completing Tasks</h3>
        <ol className="space-y-4 list-decimal list-inside">
          <li>
            <strong>Click on a task</strong> to open details
          </li>
          <li>
            <strong>Complete required work</strong> (upload documents, fill in fields, submit applications, etc.)
          </li>
          <li>
            <strong>Update task status</strong> using the dropdown: Pending → In Progress → Completed
          </li>
          <li>
            <strong>Track action progress</strong> in the Actions page as tasks are completed
          </li>
        </ol>
      </Section>

      <Section id="bestpractices" title="Best Practices">
        <h3 className="font-semibold text-lg mb-3">Provider Setup</h3>
        <ul className="space-y-2 mb-6">
          <li>✓ Enter as much provider information as possible upfront</li>
          <li>✓ Include email, phone, and license number at minimum</li>
          <li>✓ Keep license expiry dates current</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">Action Management</h3>
        <ul className="space-y-2 mb-6">
          <li>✓ Use system action templates when possible</li>
          <li>✓ Create custom templates for organization-specific processes</li>
          <li>✓ Select multiple payers when starting an action to work efficiently</li>
          <li>✓ Monitor action progress on the Actions page</li>
        </ul>

        <h3 className="font-semibold text-lg mb-3">Task Management</h3>
        <ul className="space-y-2">
          <li>✓ Work tasks in priority order (system sorts automatically)</li>
          <li>✓ Complete prerequisite tasks first (they often block other work)</li>
          <li>✓ Use task status to track progress accurately</li>
          <li>✓ Review the dashboard calendar for upcoming due dates</li>
        </ul>
      </Section>

      <Section id="troubleshooting" title="Common Issues & Solutions">
        <div className="space-y-4">
          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold text-navy dark:text-white">Issue: No tasks appearing after starting an action</h4>
            <p className="text-sm text-navy/70 dark:text-cream/70">
              <strong>Solution:</strong> Make sure the action template has task templates defined. Go to Action Templates
              page and edit the template to add task definitions.
            </p>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h4 className="font-semibold text-navy dark:text-white">Issue: Action shows 0% progress even though I completed tasks</h4>
            <p className="text-sm text-navy/70 dark:text-cream/70">
              <strong>Solution:</strong> Make sure the tasks are linked to the action (check provider_action_id).
              The action's progress updates automatically when linked tasks are marked complete.
            </p>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h4 className="font-semibold text-navy dark:text-white">Issue: Can't find the Workflows page</h4>
            <p className="text-sm text-navy/70 dark:text-cream/70">
              <strong>Solution:</strong> The system no longer has a separate Workflows page. Visual workflows are now
              accessed through the Payers page by clicking the workflow icon on a payer card.
            </p>
          </div>
        </div>
      </Section>

      <div className="mt-8 p-6 bg-gradient-to-r from-dark-cyan/10 to-goldenrod/10 rounded-lg border border-dark-cyan/30">
        <h3 className="font-semibold text-lg mb-2 text-navy dark:text-white">Quick Start Checklist</h3>
        <ol className="space-y-2 list-decimal list-inside text-navy/80 dark:text-cream/80">
          <li>Add all providers with complete information</li>
          <li>Create payers and define their requirements</li>
          <li>Review the system action templates</li>
          <li>Start an action: Select template, provider(s), and payer(s)</li>
          <li>Work through generated tasks in priority order</li>
          <li>Monitor progress on the Actions and Dashboard pages</li>
          <li>Optionally design visual workflows for complex payer processes</li>
        </ol>
      </div>
    </div>
  );
};
