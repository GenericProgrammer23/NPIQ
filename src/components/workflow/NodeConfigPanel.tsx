import React, { useState, useEffect } from 'react';
import { Node } from 'reactflow';
import { X } from 'lucide-react';
import {
  PrerequisiteCheckConfig,
  GenerateTaskConfig,
  WaitForDateConfig,
  CalculateDueDateConfig,
  AutoCompleteTaskConfig,
  UpdateProviderFieldConfig,
  CompleteNodeConfig,
  ExecuteSubflowConfig,
  CheckSubflowStatusConfig,
  ExecuteWorkflowTemplateConfig,
  DependencyCheckConfig
} from '../../types/workflow';
import { supabase } from '../../lib/supabase';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
  onDiveIntoSubflow?: (subflowId: string) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onClose,
  onSave,
  onDiveIntoSubflow
}) => {
  const [config, setConfig] = useState<any>({});

  useEffect(() => {
    if (selectedNode?.data?.config) {
      setConfig(selectedNode.data.config);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex items-center justify-center p-8">
        <div className="text-center text-gray-500">
          <div className="text-sm">Select a node to configure</div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    onSave(selectedNode.id, config);
  };

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig({ ...config, ...updates });
  };

  const renderConfigForm = () => {
    switch (selectedNode.type) {
      case 'prerequisite_check':
        return <PrerequisiteCheckForm config={config} updateConfig={updateConfig} />;
      case 'generate_task':
      case 'generate_task_with_due_date':
        return <GenerateTaskForm config={config} updateConfig={updateConfig} isDueDateVersion={selectedNode.type === 'generate_task_with_due_date'} />;
      case 'wait_for_date':
        return <WaitForDateForm config={config} updateConfig={updateConfig} />;
      case 'wait_for_document':
        return <WaitForDocumentForm config={config} updateConfig={updateConfig} />;
      case 'wait_for_profile_field':
        return <WaitForProfileFieldForm config={config} updateConfig={updateConfig} />;
      case 'calculate_due_date':
        return <CalculateDueDateForm config={config} updateConfig={updateConfig} />;
      case 'auto_complete_task':
        return <AutoCompleteTaskForm config={config} updateConfig={updateConfig} />;
      case 'update_provider_field':
        return <UpdateProviderFieldForm config={config} updateConfig={updateConfig} />;
      case 'send_notification':
        return <SendNotificationForm config={config} updateConfig={updateConfig} />;
      case 'complete':
        return <CompleteNodeForm config={config} updateConfig={updateConfig} />;
      case 'dependency_check':
        return <DependencyCheckForm config={config} updateConfig={updateConfig} />;
      case 'execute_subflow':
        return <ExecuteSubflowForm config={config} updateConfig={updateConfig} onDiveIntoSubflow={onDiveIntoSubflow} />;
      case 'check_subflow_status':
        return <CheckSubflowStatusForm config={config} updateConfig={updateConfig} />;
      case 'execute_workflow_template':
        return <ExecuteWorkflowTemplateForm config={config} updateConfig={updateConfig} />;
      case 'start':
        return <div className="text-sm text-gray-600">Start node has no configuration options.</div>;
      default:
        return <div className="text-sm text-gray-600">Configuration not yet implemented for this node type.</div>;
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Configure Node</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
            {selectedNode.type}
          </div>
        </div>

        {renderConfigForm()}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const PrerequisiteCheckForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  const availableFields = [
    'first_name', 'last_name', 'email', 'phone', 'license_number',
    'specialty', 'npi', 'dea', 'state_license', 'cds_number'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Fields
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded p-2">
          {availableFields.map(field => (
            <label key={field} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.required_fields?.includes(field) || false}
                onChange={(e) => {
                  const current = config.required_fields || [];
                  const updated = e.target.checked
                    ? [...current, field]
                    : current.filter((f: string) => f !== field);
                  updateConfig({ required_fields: updated });
                }}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">{field}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Check Type
        </label>
        <select
          value={config.check_type || 'all'}
          onChange={(e) => updateConfig({ check_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All must be satisfied</option>
          <option value="any">Any one must be satisfied</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.generate_info_task_if_missing || false}
            onChange={(e) => updateConfig({ generate_info_task_if_missing: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Generate task if prerequisites not met
          </span>
        </label>
      </div>

      {config.generate_info_task_if_missing && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </label>
            <input
              type="text"
              value={config.info_task_title || ''}
              onChange={(e) => updateConfig({ info_task_title: e.target.value })}
              placeholder="Complete Provider Information"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Description
            </label>
            <textarea
              value={config.info_task_description || ''}
              onChange={(e) => updateConfig({ info_task_description: e.target.value })}
              placeholder="Enter missing fields..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
};

const GenerateTaskForm: React.FC<{ config: any; updateConfig: (u: any) => void; isDueDateVersion: boolean }> = ({ config, updateConfig, isDueDateVersion }) => {
  const [showVariables, setShowVariables] = React.useState(false);

  const templateVariables = [
    { var: '{{provider.full_name}}', desc: 'Provider full name' },
    { var: '{{provider.first_name}}', desc: 'Provider first name' },
    { var: '{{provider.last_name}}', desc: 'Provider last name' },
    { var: '{{payer.name}}', desc: 'Payer name (e.g., Medicare)' },
    { var: '{{location.name}}', desc: 'Location name' },
    { var: '{{current_date}}', desc: 'Current date' }
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Title *
        </label>
        <input
          type="text"
          value={config.task_title || ''}
          onChange={(e) => updateConfig({ task_title: e.target.value })}
          placeholder="{{provider.full_name}} {{payer.name}} Application"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">Use template variables like {`{{provider.full_name}}`}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Description
        </label>
        <textarea
          value={config.task_description || ''}
          onChange={(e) => updateConfig({ task_description: e.target.value })}
          placeholder="Complete {{payer.name}} application for {{provider.full_name}}"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <button
          type="button"
          onClick={() => setShowVariables(!showVariables)}
          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
        >
          {showVariables ? 'Hide' : 'Show'} available variables
        </button>
        {showVariables && (
          <div className="mt-2 p-3 bg-blue-50 rounded-lg space-y-1">
            {templateVariables.map((tv, idx) => (
              <div key={idx} className="text-xs">
                <code className="text-blue-700 font-medium">{tv.var}</code>
                <span className="text-gray-600 ml-2">- {tv.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Type *
        </label>
        <select
          value={config.task_type || 'document'}
          onChange={(e) => updateConfig({ task_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="document">Document</option>
          <option value="info">Information</option>
          <option value="submit">Submit</option>
          <option value="approval">Approval</option>
          <option value="loading">Loading</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Priority
        </label>
        <select
          value={config.priority || 'medium'}
          onChange={(e) => updateConfig({ priority: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {isDueDateVersion && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base Date Field
            </label>
            <select
              value={config.due_date_base_field || 'application_submission_date'}
              onChange={(e) => updateConfig({ due_date_base_field: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="application_submission_date">Submission Date</option>
              <option value="application_approved_date">Approval Date</option>
              <option value="provider_loaded_date">Loading Date</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Offset Days
            </label>
            <input
              type="number"
              value={config.due_date_offset_days || 30}
              onChange={(e) => updateConfig({ due_date_offset_days: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </>
      )}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.prevent_duplicates !== false}
            onChange={(e) => updateConfig({ prevent_duplicates: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Prevent duplicate tasks
          </span>
        </label>
      </div>
    </div>
  );
};

const WaitForDateForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date Field to Wait For *
        </label>
        <select
          value={config.date_field || 'application_submission_date'}
          onChange={(e) => updateConfig({ date_field: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="application_submission_date">Application Submission Date</option>
          <option value="application_approved_date">Application Approved Date</option>
          <option value="provider_loaded_date">Provider Loaded Date</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Data Source
        </label>
        <select
          value={config.table || 'provider_payer_applications'}
          onChange={(e) => updateConfig({ table: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="provider_payer_applications">Provider-Payer Application</option>
          <option value="providers">Provider Record</option>
        </select>
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
        ℹ️ Workflow will pause at this node until the specified date field is filled.
      </div>
    </div>
  );
};

const CalculateDueDateForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Base Date Field
        </label>
        <input
          type="text"
          value={config.base_date_field || ''}
          onChange={(e) => updateConfig({ base_date_field: e.target.value })}
          placeholder="application_submission_date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Operation
        </label>
        <select
          value={config.operation || 'add'}
          onChange={(e) => updateConfig({ operation: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="add">Add Days</option>
          <option value="subtract">Subtract Days</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Offset Days
        </label>
        <input
          type="number"
          value={config.offset_value || 30}
          onChange={(e) => updateConfig({ offset_value: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Store Result In Variable
        </label>
        <input
          type="text"
          value={config.store_in_variable || ''}
          onChange={(e) => updateConfig({ store_in_variable: e.target.value })}
          placeholder="calculated_due_date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
    </div>
  );
};

const AutoCompleteTaskForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Title Pattern
        </label>
        <input
          type="text"
          value={config.task_title_pattern || ''}
          onChange={(e) => updateConfig({ task_title_pattern: e.target.value })}
          placeholder="Submit Medicare Application"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Completion Date Field
        </label>
        <input
          type="text"
          value={config.completion_date_field || ''}
          onChange={(e) => updateConfig({ completion_date_field: e.target.value })}
          placeholder="application_submission_date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-200">
        ℹ️ This will automatically mark the matching task as complete when the date field is filled.
      </div>
    </div>
  );
};

const UpdateProviderFieldForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Field Name
        </label>
        <input
          type="text"
          value={config.field_name || ''}
          onChange={(e) => updateConfig({ field_name: e.target.value })}
          placeholder="credentialing_loaded_date"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Value Source
        </label>
        <select
          value={config.value_source || 'current_date'}
          onChange={(e) => updateConfig({ value_source: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="current_date">Current Date</option>
          <option value="static">Static Value</option>
          <option value="variable">From Variable</option>
        </select>
      </div>

      {config.value_source === 'static' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Static Value
          </label>
          <input
            type="text"
            value={config.static_value || ''}
            onChange={(e) => updateConfig({ static_value: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      )}

      {config.value_source === 'variable' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Variable Name
          </label>
          <input
            type="text"
            value={config.variable_name || ''}
            onChange={(e) => updateConfig({ variable_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      )}
    </div>
  );
};

const DependencyCheckForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  const [payers, setPayers] = React.useState<any[]>([]);
  const [subflows, setSubflows] = React.useState<any[]>([]);
  const [workflows, setWorkflows] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    const { data: payersData } = await supabase.from('payers').select('id, name').eq('status', 'active');
    const { data: subflowsData } = await supabase.from('subflows').select('id, name').eq('is_reusable', true);
    const { data: workflowsData } = await supabase.from('workflows').select('id, name').eq('is_template', true);

    setPayers(payersData || []);
    setSubflows(subflowsData || []);
    setWorkflows(workflowsData || []);
  };

  const dependencyType = config.dependency_type || 'payer';

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dependency Type
        </label>
        <select
          value={dependencyType}
          onChange={(e) => updateConfig({ dependency_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="payer">Other Payers</option>
          <option value="subflow">Subflows</option>
          <option value="workflow_template">Workflow Templates</option>
          <option value="task">Tasks</option>
        </select>
      </div>

      {dependencyType === 'payer' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Payers
            </label>
            <select
              multiple
              value={config.required_payers || []}
              onChange={(e) => updateConfig({
                required_payers: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
            >
              {payers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Status
            </label>
            <select
              value={config.required_payer_status || 'approved'}
              onChange={(e) => updateConfig({ required_payer_status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="approved">Approved</option>
              <option value="loaded">Loaded</option>
            </select>
          </div>
        </>
      )}

      {dependencyType === 'subflow' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Subflows
            </label>
            <select
              multiple
              value={config.required_subflows || []}
              onChange={(e) => updateConfig({
                required_subflows: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
            >
              {subflows.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Status
            </label>
            <select
              value={config.required_subflow_status || 'complete'}
              onChange={(e) => updateConfig({ required_subflow_status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </>
      )}

      {dependencyType === 'workflow_template' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Workflow Templates
            </label>
            <select
              multiple
              value={config.required_workflow_templates || []}
              onChange={(e) => updateConfig({
                required_workflow_templates: Array.from(e.target.selectedOptions, option => option.value)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[100px]"
            >
              {workflows.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {dependencyType === 'task' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Required Task Titles (one per line)
            </label>
            <textarea
              value={(config.required_task_titles || []).join('\n')}
              onChange={(e) => updateConfig({
                required_task_titles: e.target.value.split('\n').filter(t => t.trim())
              })}
              placeholder="Submit Application\nUpload Documents"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Check Type
        </label>
        <select
          value={config.check_type || 'all'}
          onChange={(e) => updateConfig({ check_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All must be met</option>
          <option value="any">Any one must be met</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.block_if_not_met !== false}
            onChange={(e) => updateConfig({ block_if_not_met: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Block workflow if not met
          </span>
        </label>
      </div>
    </div>
  );
};

const ExecuteSubflowForm: React.FC<{ config: any; updateConfig: (u: any) => void; onDiveIntoSubflow?: (subflowId: string) => void }> = ({ config, updateConfig, onDiveIntoSubflow }) => {
  const [subflows, setSubflows] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadSubflows();
  }, []);

  const loadSubflows = async () => {
    const { data } = await supabase
      .from('subflows')
      .select('id, name, purpose, payer_id, payers(name)')
      .eq('is_reusable', true)
      .order('name');
    setSubflows(data || []);
  };

  const selectedSubflow = subflows.find(s => s.id === config.subflow_id);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Subflow
        </label>
        <select
          value={config.subflow_id || ''}
          onChange={(e) => {
            const subflow = subflows.find(s => s.id === e.target.value);
            updateConfig({
              subflow_id: e.target.value,
              subflow_name: subflow?.name
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">-- Select a subflow --</option>
          {subflows.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.payers?.name ? `(${s.payers.name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedSubflow && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <div className="font-medium text-blue-900 mb-1">Subflow Details</div>
            <div className="text-blue-700">{selectedSubflow.purpose || 'No description'}</div>
          </div>

          {onDiveIntoSubflow && config.subflow_id && (
            <button
              type="button"
              onClick={() => onDiveIntoSubflow(config.subflow_id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              Dive Into Subflow
            </button>
          )}
        </div>
      )}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.wait_for_completion !== false}
            onChange={(e) => updateConfig({ wait_for_completion: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Wait for subflow completion
          </span>
        </label>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.pass_context !== false}
            onChange={(e) => updateConfig({ pass_context: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Pass context variables to subflow
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Timeout (days)
        </label>
        <input
          type="number"
          value={config.timeout_days || ''}
          onChange={(e) => updateConfig({ timeout_days: parseInt(e.target.value) || undefined })}
          placeholder="Optional"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
    </div>
  );
};

const CheckSubflowStatusForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  const [subflows, setSubflows] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadSubflows();
  }, []);

  const loadSubflows = async () => {
    const { data } = await supabase
      .from('subflows')
      .select('id, name, payer_id, payers(name)')
      .eq('is_reusable', true)
      .order('name');
    setSubflows(data || []);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Subflows to Check
        </label>
        <select
          multiple
          value={config.required_subflows || []}
          onChange={(e) => updateConfig({
            required_subflows: Array.from(e.target.selectedOptions, option => option.value)
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[120px]"
        >
          {subflows.map(s => (
            <option key={s.id} value={s.id}>
              {s.name} {s.payers?.name ? `(${s.payers.name})` : ''}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Required Status
        </label>
        <select
          value={config.required_status || 'complete'}
          onChange={(e) => updateConfig({ required_status: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="complete">Complete</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Check Type
        </label>
        <select
          value={config.check_type || 'all'}
          onChange={(e) => updateConfig({ check_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All subflows must match</option>
          <option value="any">Any subflow must match</option>
        </select>
      </div>
    </div>
  );
};

const ExecuteWorkflowTemplateForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  const [workflows, setWorkflows] = React.useState<any[]>([]);

  React.useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    const { data } = await supabase
      .from('workflows')
      .select('id, name, description, type')
      .eq('is_template', true)
      .eq('status', 'active')
      .order('name');
    setWorkflows(data || []);
  };

  const selectedWorkflow = workflows.find(w => w.id === config.workflow_template_id);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Workflow Template
        </label>
        <select
          value={config.workflow_template_id || ''}
          onChange={(e) => {
            const workflow = workflows.find(w => w.id === e.target.value);
            updateConfig({
              workflow_template_id: e.target.value,
              workflow_template_name: workflow?.name
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">-- Select a workflow template --</option>
          {workflows.map(w => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.type})
            </option>
          ))}
        </select>
      </div>

      {selectedWorkflow && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm">
          <div className="font-medium text-blue-900 mb-1">Template Details</div>
          <div className="text-blue-700">{selectedWorkflow.description || 'No description'}</div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.wait_for_completion !== false}
            onChange={(e) => updateConfig({ wait_for_completion: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Wait for workflow completion
          </span>
        </label>
      </div>
    </div>
  );
};

const CompleteNodeForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Completion Message
        </label>
        <textarea
          value={config.completion_message || ''}
          onChange={(e) => updateConfig({ completion_message: e.target.value })}
          placeholder="Workflow completed successfully"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.trigger_notifications || false}
            onChange={(e) => updateConfig({ trigger_notifications: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Trigger notifications on completion
          </span>
        </label>
      </div>
    </div>
  );
};

const WaitForDocumentForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Type *
        </label>
        <input
          type="text"
          value={config.document_type || ''}
          onChange={(e) => updateConfig({ document_type: e.target.value })}
          placeholder="e.g., License, CV, Certificate"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Document Name (Optional)
        </label>
        <input
          type="text"
          value={config.document_name || ''}
          onChange={(e) => updateConfig({ document_name: e.target.value })}
          placeholder="Specific document name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.auto_complete_task_on_upload !== false}
            onChange={(e) => updateConfig({ auto_complete_task_on_upload: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Auto-complete task when document uploaded
          </span>
        </label>
      </div>

      {config.auto_complete_task_on_upload !== false && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Title Pattern (to match)
          </label>
          <input
            type="text"
            value={config.task_title_pattern || ''}
            onChange={(e) => updateConfig({ task_title_pattern: e.target.value })}
            placeholder="e.g., Upload {{document_type}}"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Use template variables for dynamic matching</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeout (days)
          </label>
          <input
            type="number"
            value={config.timeout_days || ''}
            onChange={(e) => updateConfig({ timeout_days: parseInt(e.target.value) || undefined })}
            placeholder="30"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeout Action
          </label>
          <select
            value={config.timeout_action || 'alert'}
            onChange={(e) => updateConfig({ timeout_action: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="alert">Alert</option>
            <option value="continue">Continue</option>
            <option value="fail">Fail Workflow</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const WaitForProfileFieldForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  const [newField, setNewField] = React.useState('');
  const [showAvailableFields, setShowAvailableFields] = React.useState(false);

  const entityType = config.entity_type || 'provider';

  const providerFields = [
    { value: 'first_name', label: 'First Name', type: 'text' },
    { value: 'last_name', label: 'Last Name', type: 'text' },
    { value: 'email', label: 'Email', type: 'email' },
    { value: 'phone', label: 'Phone', type: 'text' },
    { value: 'phone_number', label: 'Phone Number', type: 'text' },
    { value: 'specialty', label: 'Specialty', type: 'text' },
    { value: 'license_number', label: 'License Number', type: 'text' },
    { value: 'license_expiry', label: 'License Expiry', type: 'date' },
    { value: 'status', label: 'Status', type: 'text' },
  ];

  const locationFields = [
    { value: 'name', label: 'Name', type: 'text' },
    { value: 'address', label: 'Address', type: 'text' },
    { value: 'phone_number', label: 'Phone Number', type: 'text' },
    { value: 'departments', label: 'Departments', type: 'number' },
    { value: 'status', label: 'Status', type: 'text' },
  ];

  const providerPayerFields = [
    { value: 'application_submission_date', label: 'Submission Date', type: 'date' },
    { value: 'application_approved_date', label: 'Approval Date', type: 'date' },
    { value: 'provider_loaded_date', label: 'Loaded Date', type: 'date' },
    { value: 'effective_date', label: 'Effective Date', type: 'date' },
    { value: 'status', label: 'Application Status', type: 'text' },
  ];

  const locationPayerFields = [
    { value: 'application_submission_date', label: 'Submission Date', type: 'date' },
    { value: 'application_approved_date', label: 'Approval Date', type: 'date' },
    { value: 'location_loaded_date', label: 'Loaded Date', type: 'date' },
    { value: 'status', label: 'Application Status', type: 'text' },
  ];

  const availableFields =
    entityType === 'provider' ? providerFields :
    entityType === 'location' ? locationFields :
    entityType === 'provider_payer' ? providerPayerFields :
    locationPayerFields;

  const addField = (fieldValue?: string) => {
    const fieldToAdd = fieldValue || newField.trim();
    if (fieldToAdd) {
      const currentFields = config.required_fields || [];
      if (!currentFields.includes(fieldToAdd)) {
        updateConfig({ required_fields: [...currentFields, fieldToAdd] });
      }
      setNewField('');
    }
  };

  const removeField = (index: number) => {
    const currentFields = [...(config.required_fields || [])];
    currentFields.splice(index, 1);
    updateConfig({ required_fields: currentFields });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Entity Type
        </label>
        <select
          value={entityType}
          onChange={(e) => updateConfig({ entity_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="provider">Provider</option>
          <option value="location">Location</option>
          <option value="provider_payer">Provider-Payer Application</option>
          <option value="location_payer">Location-Payer Application</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Fields
        </label>

        <button
          onClick={() => setShowAvailableFields(!showAvailableFields)}
          className="mb-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          {showAvailableFields ? '▼' : '▶'} Show available fields
        </button>

        {showAvailableFields && (
          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-900 mb-2">Click to add:</p>
            <div className="flex flex-wrap gap-2">
              {availableFields.map((field) => (
                <button
                  key={field.value}
                  onClick={() => addField(field.value)}
                  className="px-2 py-1 bg-white border border-blue-300 rounded text-xs hover:bg-blue-100 transition-colors"
                  disabled={(config.required_fields || []).includes(field.value)}
                >
                  <span className="font-medium">{field.label}</span>
                  <span className="text-gray-500 ml-1">({field.value})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 mb-2">
          {(config.required_fields || []).map((field: string, index: number) => {
            const fieldInfo = availableFields.find(f => f.value === field);
            return (
              <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded">
                <code className="text-sm flex-1">
                  {fieldInfo ? `${fieldInfo.label} (${field})` : field}
                </code>
                <button
                  onClick={() => removeField(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newField}
            onChange={(e) => setNewField(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addField()}
            placeholder="Or type custom field name"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={() => addField()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Check Type
        </label>
        <select
          value={config.check_type || 'all'}
          onChange={(e) => updateConfig({ check_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">All fields required</option>
          <option value="any">Any field required</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.auto_complete_task_on_fill !== false}
            onChange={(e) => updateConfig({ auto_complete_task_on_fill: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Auto-complete task when fields filled
          </span>
        </label>
      </div>

      {config.auto_complete_task_on_fill !== false && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task Title Pattern (to match)
          </label>
          <input
            type="text"
            value={config.task_title_pattern || ''}
            onChange={(e) => updateConfig({ task_title_pattern: e.target.value })}
            placeholder="e.g., Complete {{provider.first_name}} profile"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeout (days)
          </label>
          <input
            type="number"
            value={config.timeout_days || ''}
            onChange={(e) => updateConfig({ timeout_days: parseInt(e.target.value) || undefined })}
            placeholder="30"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeout Action
          </label>
          <select
            value={config.timeout_action || 'alert'}
            onChange={(e) => updateConfig({ timeout_action: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="alert">Alert</option>
            <option value="continue">Continue</option>
            <option value="fail">Fail Workflow</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const SendNotificationForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notification Type
        </label>
        <select
          value={config.notification_type || 'in_app'}
          onChange={(e) => updateConfig({ notification_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="in_app">In-App Only</option>
          <option value="email">Email Only</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Recipient Type
        </label>
        <select
          value={config.recipient_type || 'assigned_user'}
          onChange={(e) => updateConfig({ recipient_type: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="assigned_user">Assigned User</option>
          <option value="role">By Role</option>
          <option value="specific_user">Specific User</option>
        </select>
      </div>

      {config.recipient_type === 'role' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={config.recipient_role || 'admin'}
            onChange={(e) => updateConfig({ recipient_role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subject
        </label>
        <input
          type="text"
          value={config.subject || ''}
          onChange={(e) => updateConfig({ subject: e.target.value })}
          placeholder="e.g., Task Ready: {{payer.name}} Application"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">Supports template variables</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
        </label>
        <textarea
          value={config.message || ''}
          onChange={(e) => updateConfig({ message: e.target.value })}
          placeholder="e.g., The {{payer.name}} application for {{provider.full_name}} is ready for review."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">Supports template variables</p>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.include_task_link || false}
            onChange={(e) => updateConfig({ include_task_link: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Include link to related task
          </span>
        </label>
      </div>
    </div>
  );
};
