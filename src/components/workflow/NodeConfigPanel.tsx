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
  DependencyCheckConfig
} from '../../types/workflow';
import { supabase } from '../../lib/supabase';
import { formatters } from '../../utils/formatters';

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
      case 'parallel_tasks':
        return <ParallelTasksForm config={config} updateConfig={updateConfig} />;
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
              <span className="text-sm text-gray-700">{formatters.fieldName(field)}</span>
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

const ParallelTasksForm: React.FC<{ config: any; updateConfig: (u: any) => void }> = ({ config, updateConfig }) => {
  const tasks = config.tasks || [];

  const addTask = () => {
    updateConfig({
      tasks: [...tasks, { title: '', description: '', type: 'document', priority: 'medium' }]
    });
  };

  const removeTask = (index: number) => {
    updateConfig({
      tasks: tasks.filter((_: any, i: number) => i !== index)
    });
  };

  const updateTask = (index: number, field: string, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    updateConfig({ tasks: newTasks });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Parallel Tasks ({tasks.length})
        </label>
        <button
          type="button"
          onClick={addTask}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          + Add Task
        </button>
      </div>

      {tasks.length === 0 && (
        <div className="text-sm text-gray-500 italic text-center py-4 border border-dashed border-gray-300 rounded">
          No tasks defined. Click "Add Task" to create parallel tasks.
        </div>
      )}

      {tasks.map((task: any, index: number) => (
        <div key={index} className="p-3 border border-gray-300 rounded-lg space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Task #{index + 1}</span>
            <button
              type="button"
              onClick={() => removeTask(index)}
              className="text-red-600 hover:text-red-700 text-xs"
            >
              Remove
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={task.title || ''}
              onChange={(e) => updateTask(index, 'title', e.target.value)}
              placeholder="Task title"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={task.description || ''}
              onChange={(e) => updateTask(index, 'description', e.target.value)}
              placeholder="Task description"
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select
                value={task.type || 'document'}
                onChange={(e) => updateTask(index, 'type', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="document">Document</option>
                <option value="info">Info</option>
                <option value="submit">Submit</option>
                <option value="approval">Approval</option>
                <option value="loading">Loading</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={task.priority || 'medium'}
                onChange={(e) => updateTask(index, 'priority', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.wait_for_all !== false}
            onChange={(e) => updateConfig({ wait_for_all: e.target.checked })}
            className="rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">
            Wait for all tasks to complete
          </span>
        </label>
        <p className="text-xs text-gray-500 ml-6 mt-1">
          If unchecked, workflow continues when any task is complete
        </p>
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

  React.useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    const { data: payersData } = await supabase.from('payers').select('id, name').eq('status', 'active');
    setPayers(payersData || []);
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
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple payers
            </p>
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
              placeholder="Submit Application&#10;Upload Documents"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter one task title per line
            </p>
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

  const documentFields = [
    { value: 'License', label: 'License', type: 'document' },
    { value: 'Certification', label: 'Certification', type: 'document' },
    { value: 'Insurance', label: 'Insurance (Malpractice)', type: 'document' },
    { value: 'Identification', label: 'Identification', type: 'document' },
    { value: 'Education', label: 'Education', type: 'document' },
    { value: 'References', label: 'References', type: 'document' },
    { value: 'Background Check', label: 'Background Check', type: 'document' },
    { value: 'Immunization', label: 'Immunization Records', type: 'document' },
    { value: 'Other', label: 'Other Documents', type: 'document' },
  ];

  const availableFields =
    entityType === 'provider' ? providerFields :
    entityType === 'location' ? locationFields :
    entityType === 'provider_payer' ? providerPayerFields :
    entityType === 'location_payer' ? locationPayerFields :
    documentFields;

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
          <option value="document">Document Categories</option>
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
                  {fieldInfo ? `${fieldInfo.label} (${field})` : formatters.fieldName(field)}
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
