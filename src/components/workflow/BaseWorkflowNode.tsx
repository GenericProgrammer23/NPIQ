import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import * as Icons from 'lucide-react';
import { WorkflowNodeType } from '../../types/workflow';
import { formatters } from '../../utils/formatters';

interface BaseWorkflowNodeProps extends NodeProps {
  icon: keyof typeof Icons;
  color: string;
  label: string;
  inputs?: string[];
  outputs?: string[];
  isSelected?: boolean;
}

export const BaseWorkflowNode: React.FC<BaseWorkflowNodeProps> = ({
  icon,
  color,
  label,
  inputs = ['default'],
  outputs = ['default'],
  isSelected = false,
  data
}) => {
  const Icon = Icons[icon] as React.ComponentType<{ className?: string }>;

  return (
    <div
      className={`relative bg-white rounded-lg border-2 shadow-md transition-all ${
        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200'
      }`}
      style={{ minWidth: '200px' }}
    >
      {inputs.length > 0 && inputs.map((input) => (
        <Handle
          key={input}
          type="target"
          position={Position.Top}
          id={input}
          className="w-3 h-3 !bg-gray-400 border-2 border-white"
          style={{
            left: input === 'default' ? '50%' : input === 'met' ? '30%' : '70%'
          }}
        />
      ))}

      <div className="flex items-center gap-3 p-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-800">{label}</div>
          {data?.config?.type && (
            <div className="text-xs text-gray-500 mt-1">
              {getConfigSummary(data.config)}
            </div>
          )}
        </div>
      </div>

      {outputs.length > 0 && outputs.map((output) => (
        <Handle
          key={output}
          type="source"
          position={Position.Bottom}
          id={output}
          className="w-3 h-3 !bg-gray-400 border-2 border-white"
          style={{
            left: output === 'default' ? '50%' :
                  output === 'met' || output === 'true' || output === 'date_entered' ? '30%' :
                  output === 'not_met' || output === 'false' || output === 'timeout' ? '70%' :
                  '50%'
          }}
        />
      ))}
    </div>
  );
};

function getConfigSummary(config: any): string {
  switch (config.type) {
    case 'prerequisite_check':
      const fieldCount = config.required_fields?.length || 0;
      if (fieldCount > 0 && fieldCount <= 2) {
        return `Check: ${config.required_fields.map((f: string) => formatters.fieldName(f)).join(', ')}`;
      }
      return `Check ${fieldCount} field${fieldCount !== 1 ? 's' : ''}`;
    case 'generate_task':
      return config.task_title || 'New task';
    case 'wait_for_date':
      return `Wait for ${formatters.fieldName(config.date_field || 'date')}`;
    case 'dependency_check':
      const depType = config.dependency_type || 'payer';
      const count = config[`required_${depType === 'payer' ? 'payers' : 'task_titles'}`]?.length || 0;
      return `Check ${count} ${depType === 'payer' ? 'payer' : 'task'}${count !== 1 ? 's' : ''}`;
    case 'auto_complete_task':
      return config.task_title_pattern || 'Auto-complete';
    case 'update_provider_field':
      return `Update ${formatters.fieldName(config.field_name || 'field')}`;
    default:
      return '';
  }
}
