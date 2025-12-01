import React from 'react';
import { NodeProps } from 'reactflow';
import { BaseWorkflowNode } from './BaseWorkflowNode';
import { NODE_TYPE_DEFINITIONS } from '../../types/workflow';

export const StartNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.start;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const CompleteNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.complete;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const PrerequisiteCheckNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.prerequisite_check;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const DependencyCheckNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.dependency_check;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const GenerateTaskNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.generate_task;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const GenerateTaskWithDueDateNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.generate_task_with_due_date;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const WaitForDateNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.wait_for_date;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const CalculateDueDateNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.calculate_due_date;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const BranchNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.branch;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const ParallelTasksNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.parallel_tasks;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const AutoCompleteTaskNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.auto_complete_task;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const UpdateProviderFieldNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.update_provider_field;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const ExecuteSubflowNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.execute_subflow;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const CheckSubflowStatusNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.check_subflow_status;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const ExecuteWorkflowTemplateNode: React.FC<NodeProps> = (props) => {
  const def = NODE_TYPE_DEFINITIONS.execute_workflow_template;
  return (
    <BaseWorkflowNode
      {...props}
      icon={def.icon as any}
      color={def.color}
      label={def.label}
      inputs={def.inputs}
      outputs={def.outputs}
      isSelected={props.selected}
    />
  );
};

export const nodeTypes = {
  start: StartNode,
  complete: CompleteNode,
  prerequisite_check: PrerequisiteCheckNode,
  dependency_check: DependencyCheckNode,
  generate_task: GenerateTaskNode,
  generate_task_with_due_date: GenerateTaskWithDueDateNode,
  wait_for_date: WaitForDateNode,
  calculate_due_date: CalculateDueDateNode,
  branch: BranchNode,
  parallel_tasks: ParallelTasksNode,
  auto_complete_task: AutoCompleteTaskNode,
  update_provider_field: UpdateProviderFieldNode,
  execute_subflow: ExecuteSubflowNode,
  check_subflow_status: CheckSubflowStatusNode,
  execute_workflow_template: ExecuteWorkflowTemplateNode
};
