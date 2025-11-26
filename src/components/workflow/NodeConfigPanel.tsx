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
  CompleteNodeConfig
} from '../../types/workflow';

interface NodeConfigPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onSave: (nodeId: string, config: any) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onClose,
  onSave
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
      case 'calculate_due_date':
        return <CalculateDueDateForm config={config} updateConfig={updateConfig} />;
      case 'auto_complete_task':
        return <AutoCompleteTaskForm config={config} updateConfig={updateConfig} />;
      case 'update_provider_field':
        return <UpdateProviderFieldForm config={config} updateConfig={updateConfig} />;
      case 'complete':
        return <CompleteNodeForm config={config} updateConfig={updateConfig} />;
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
          placeholder="Submit Application"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Task Description
        </label>
        <textarea
          value={config.task_description || ''}
          onChange={(e) => updateConfig({ task_description: e.target.value })}
          placeholder="Task details..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
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
