import { Node } from 'reactflow';
import {
  PrerequisiteCheckConfig,
  DependencyCheckConfig,
  CheckSubflowStatusConfig,
  ExecuteSubflowConfig,
  WaitForProfileFieldConfig
} from '../types/workflow';

export interface SubflowRequirements {
  requiredFields: Array<{ entity: string; field: string }>;
  requiredSubflows: Array<{ subflowId: string; subflowName?: string; status?: string }>;
  requiredPayers: Array<{ payerId: string; status?: string }>;
  executesSubflows: Array<{ subflowId: string; subflowName?: string }>;
}

export function analyzeSubflowNodes(workflowData: { nodes: Node[]; edges: any[] } | null): SubflowRequirements {
  const requirements: SubflowRequirements = {
    requiredFields: [],
    requiredSubflows: [],
    requiredPayers: [],
    executesSubflows: []
  };

  if (!workflowData || !workflowData.nodes) {
    return requirements;
  }

  for (const node of workflowData.nodes) {
    const config = node.data?.config;
    if (!config) continue;

    switch (config.type) {
      case 'prerequisite_check': {
        const prereqConfig = config as PrerequisiteCheckConfig;
        if (prereqConfig.required_fields) {
          prereqConfig.required_fields.forEach((field: string) => {
            const parts = field.split('.');
            if (parts.length === 2) {
              requirements.requiredFields.push({
                entity: parts[0],
                field: parts[1]
              });
            }
          });
        }
        break;
      }

      case 'wait_for_profile_field': {
        const waitConfig = config as WaitForProfileFieldConfig;
        if (waitConfig.required_fields) {
          waitConfig.required_fields.forEach((field: string) => {
            const parts = field.split('.');
            if (parts.length === 2) {
              requirements.requiredFields.push({
                entity: parts[0],
                field: parts[1]
              });
            } else {
              requirements.requiredFields.push({
                entity: waitConfig.entity_type,
                field: field
              });
            }
          });
        }
        break;
      }

      case 'dependency_check': {
        const depConfig = config as DependencyCheckConfig;

        if (depConfig.dependency_type === 'payer' && depConfig.required_payers) {
          depConfig.required_payers.forEach((payerId: string) => {
            requirements.requiredPayers.push({
              payerId,
              status: depConfig.required_payer_status
            });
          });
        }

        if (depConfig.dependency_type === 'subflow' && depConfig.required_subflows) {
          depConfig.required_subflows.forEach((subflowId: string) => {
            requirements.requiredSubflows.push({
              subflowId,
              status: depConfig.required_subflow_status
            });
          });
        }
        break;
      }

      case 'check_subflow_status': {
        const checkConfig = config as CheckSubflowStatusConfig;
        if (checkConfig.required_subflows) {
          checkConfig.required_subflows.forEach((subflowId: string) => {
            requirements.requiredSubflows.push({
              subflowId,
              status: checkConfig.required_status
            });
          });
        }
        break;
      }

      case 'execute_subflow': {
        const execConfig = config as ExecuteSubflowConfig;
        if (execConfig.subflow_id) {
          requirements.executesSubflows.push({
            subflowId: execConfig.subflow_id,
            subflowName: execConfig.subflow_name
          });
        }
        break;
      }
    }
  }

  return requirements;
}

export function aggregateWorkflowRequirements(
  subflowsWithRequirements: Array<{
    id: string;
    name: string;
    requirements: SubflowRequirements;
  }>
): {
  fields: Array<{ entity: string; field: string; requiredBy: string[] }>;
  subflows: Array<{ subflowId: string; subflowName?: string; requiredBy: string[]; status?: string }>;
  payers: Array<{ payerId: string; requiredBy: string[]; status?: string }>;
} {
  const fieldMap = new Map<string, { entity: string; field: string; requiredBy: string[] }>();
  const subflowMap = new Map<string, { subflowId: string; subflowName?: string; requiredBy: string[]; status?: string }>();
  const payerMap = new Map<string, { payerId: string; requiredBy: string[]; status?: string }>();

  for (const subflow of subflowsWithRequirements) {
    subflow.requirements.requiredFields.forEach(field => {
      const key = `${field.entity}.${field.field}`;
      if (!fieldMap.has(key)) {
        fieldMap.set(key, { ...field, requiredBy: [] });
      }
      fieldMap.get(key)!.requiredBy.push(subflow.name);
    });

    subflow.requirements.requiredSubflows.forEach(req => {
      const key = req.subflowId;
      if (!subflowMap.has(key)) {
        subflowMap.set(key, { ...req, requiredBy: [] });
      }
      subflowMap.get(key)!.requiredBy.push(subflow.name);
    });

    subflow.requirements.requiredPayers.forEach(req => {
      const key = req.payerId;
      if (!payerMap.has(key)) {
        payerMap.set(key, { ...req, requiredBy: [] });
      }
      payerMap.get(key)!.requiredBy.push(subflow.name);
    });
  }

  return {
    fields: Array.from(fieldMap.values()),
    subflows: Array.from(subflowMap.values()),
    payers: Array.from(payerMap.values())
  };
}
