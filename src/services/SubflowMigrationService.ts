import { supabase } from '../lib/supabase';
import { Node, Edge } from 'reactflow';

interface Subflow {
  id: string;
  name: string;
  purpose?: string;
  prerequisites?: string[];
  dependencies?: string[];
  exit_conditions?: string[];
  workflow_data?: { nodes: Node[]; edges: Edge[] };
  metadata?: any;
}

export class SubflowMigrationService {
  static async migrateSubflowToVisual(subflow: Subflow): Promise<{ nodes: Node[]; edges: Edge[] }> {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yPosition = 50;
    const xPosition = 250;
    const nodeSpacing = 120;

    nodes.push({
      id: 'start-1',
      type: 'start',
      position: { x: xPosition, y: yPosition },
      data: {
        label: 'Start',
        config: {
          type: 'start',
          trigger: 'on_execution'
        }
      }
    });

    let lastNodeId = 'start-1';
    yPosition += nodeSpacing;

    if (subflow.prerequisites && subflow.prerequisites.length > 0) {
      const prereqNodeId = 'prereq-1';
      nodes.push({
        id: prereqNodeId,
        type: 'prerequisite_check',
        position: { x: xPosition, y: yPosition },
        data: {
          label: 'Check Prerequisites',
          config: {
            type: 'prerequisite_check',
            required_fields: subflow.prerequisites,
            check_type: 'all',
            generate_info_task_if_missing: true,
            info_task_title: `Complete Prerequisites for ${subflow.name}`,
            info_task_description: `Please complete the following fields: ${subflow.prerequisites.join(', ')}`
          }
        }
      });

      edges.push({
        id: `e-${lastNodeId}-${prereqNodeId}`,
        source: lastNodeId,
        target: prereqNodeId,
        sourceHandle: 'default',
        targetHandle: 'default'
      });

      lastNodeId = prereqNodeId;
      yPosition += nodeSpacing;
    }

    if (subflow.dependencies && subflow.dependencies.length > 0) {
      const depNodeId = 'dep-1';
      nodes.push({
        id: depNodeId,
        type: 'dependency_check',
        position: { x: xPosition, y: yPosition },
        data: {
          label: 'Check Dependencies',
          config: {
            type: 'dependency_check',
            dependency_type: 'subflow',
            required_subflows: subflow.dependencies,
            required_subflow_status: 'complete',
            check_type: 'all',
            block_if_not_met: true
          }
        }
      });

      edges.push({
        id: `e-${lastNodeId}-${depNodeId}`,
        source: lastNodeId,
        target: depNodeId,
        sourceHandle: lastNodeId.startsWith('prereq') ? 'met' : 'default',
        targetHandle: 'default'
      });

      lastNodeId = depNodeId;
      yPosition += nodeSpacing;
    }

    const taskNodeId = 'task-1';
    nodes.push({
      id: taskNodeId,
      type: 'generate_task',
      position: { x: xPosition, y: yPosition },
      data: {
        label: subflow.name,
        config: {
          type: 'generate_task',
          task_title: subflow.name,
          task_description: subflow.purpose || `Complete ${subflow.name}`,
          task_type: 'document',
          priority: 'medium',
          prevent_duplicates: true
        }
      }
    });

    edges.push({
      id: `e-${lastNodeId}-${taskNodeId}`,
      source: lastNodeId,
      target: taskNodeId,
      sourceHandle: lastNodeId.startsWith('dep') ? 'met' : (lastNodeId.startsWith('prereq') ? 'met' : 'default'),
      targetHandle: 'default'
    });

    lastNodeId = taskNodeId;
    yPosition += nodeSpacing;

    const completeNodeId = 'complete-1';
    nodes.push({
      id: completeNodeId,
      type: 'complete',
      position: { x: xPosition, y: yPosition },
      data: {
        label: 'Complete',
        config: {
          type: 'complete',
          completion_message: `${subflow.name} completed successfully`,
          trigger_notifications: false
        }
      }
    });

    edges.push({
      id: `e-${lastNodeId}-${completeNodeId}`,
      source: lastNodeId,
      target: completeNodeId,
      sourceHandle: 'default',
      targetHandle: 'default'
    });

    return { nodes, edges };
  }

  static async migrateAllSubflows(): Promise<{ migrated: number; skipped: number; errors: number }> {
    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const { data: subflows, error } = await supabase
        .from('subflows')
        .select('*')
        .is('workflow_data', null);

      if (error) throw error;

      for (const subflow of subflows || []) {
        try {
          const { nodes, edges } = await this.migrateSubflowToVisual(subflow);

          const { error: updateError } = await supabase
            .from('subflows')
            .update({
              workflow_data: { nodes, edges },
              metadata: {
                migrated: true,
                migrated_at: new Date().toISOString(),
                version: 1
              }
            })
            .eq('id', subflow.id);

          if (updateError) {
            console.error(`Error migrating subflow ${subflow.id}:`, updateError);
            errors++;
          } else {
            console.log(`Migrated subflow: ${subflow.name}`);
            migrated++;
          }
        } catch (err) {
          console.error(`Error processing subflow ${subflow.id}:`, err);
          errors++;
        }
      }
    } catch (err) {
      console.error('Error fetching subflows:', err);
      errors++;
    }

    return { migrated, skipped, errors };
  }

  static async migrateSingleSubflow(subflowId: string): Promise<boolean> {
    try {
      const { data: subflow, error } = await supabase
        .from('subflows')
        .select('*')
        .eq('id', subflowId)
        .single();

      if (error || !subflow) {
        console.error('Error fetching subflow:', error);
        return false;
      }

      if (subflow.workflow_data) {
        console.log('Subflow already has visual workflow data, skipping migration');
        return true;
      }

      const { nodes, edges } = await this.migrateSubflowToVisual(subflow);

      const { error: updateError } = await supabase
        .from('subflows')
        .update({
          workflow_data: { nodes, edges },
          metadata: {
            migrated: true,
            migrated_at: new Date().toISOString(),
            version: 1
          }
        })
        .eq('id', subflowId);

      if (updateError) {
        console.error('Error updating subflow:', updateError);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error migrating subflow:', err);
      return false;
    }
  }

  static createEmptyVisualWorkflow(): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 250, y: 50 },
        data: {
          label: 'Start',
          config: {
            type: 'start',
            trigger: 'on_execution'
          }
        }
      },
      {
        id: 'complete-1',
        type: 'complete',
        position: { x: 250, y: 200 },
        data: {
          label: 'Complete',
          config: {
            type: 'complete',
            completion_message: 'Subflow completed',
            trigger_notifications: false
          }
        }
      }
    ];

    const edges: Edge[] = [
      {
        id: 'e-start-1-complete-1',
        source: 'start-1',
        target: 'complete-1',
        sourceHandle: 'default',
        targetHandle: 'default'
      }
    ];

    return { nodes, edges };
  }
}
