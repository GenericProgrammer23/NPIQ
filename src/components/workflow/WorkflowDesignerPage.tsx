import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, Eye, Edit3, ArrowLeft, Undo, Redo, ChevronRight, Home, GitBranch } from 'lucide-react';

import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import { nodeTypes } from './CustomNodes';
import { WorkflowNodeType, NODE_TYPE_DEFINITIONS } from '../../types/workflow';
import { WorkflowDatabaseService } from '../../lib/workflowDatabase';

interface BreadcrumbItem {
  label: string;
  type: 'home' | 'workflow' | 'subflow';
  id?: string;
}

interface WorkflowDesignerPageProps {
  payerId?: string;
  subflowId?: string;
  mode?: 'view' | 'edit';
  editMode?: 'payer' | 'subflow';
  onBack?: () => void;
  onNavigateToSubflow?: (subflowId: string) => void;
}

export const WorkflowDesignerPage: React.FC<WorkflowDesignerPageProps> = ({
  payerId: initialPayerId,
  subflowId: initialSubflowId,
  mode: initialMode = 'edit',
  editMode: initialEditMode = 'payer',
  onBack,
  onNavigateToSubflow
}) => {
  const [payerId, setPayerId] = useState(initialPayerId);
  const [subflowId, setSubflowId] = useState(initialSubflowId);
  const [editMode, setEditMode] = useState(initialEditMode);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isViewMode, setIsViewMode] = useState(initialMode === 'view');
  const [isSaving, setIsSaving] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [payerName, setPayerName] = useState('');
  const [payers, setPayers] = useState<any[]>([]);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const nodeIdCounter = useRef(1);

  useEffect(() => {
    loadPayers();
  }, []);

  useEffect(() => {
    if (payerId) {
      loadPayerInfo();
    }
  }, [payerId]);

  useEffect(() => {
    loadWorkflow();
  }, [payerId, subflowId, editMode]);

  const loadPayers = async () => {
    try {
      const { DatabaseService } = await import('../../lib/supabase');
      const allPayers = await DatabaseService.getPayers();
      setPayers(allPayers);
    } catch (error) {
      console.error('Error loading payers:', error);
    }
  };

  const loadPayerInfo = async () => {
    if (!payerId) return;
    try {
      const { DatabaseService } = await import('../../lib/supabase');
      const payer = await DatabaseService.getPayer(payerId);
      if (payer) {
        setPayerName(payer.name);
      }
    } catch (error) {
      console.error('Error loading payer:', error);
    }
  };

  const loadWorkflow = async () => {
    if (editMode === 'subflow' && subflowId) {
      await loadSubflow();
    } else if (editMode === 'payer' && payerId) {
      await loadPayerWorkflow();
    }
  };

  const loadPayerWorkflow = async () => {
    if (!payerId) return;

    try {
      const workflow = await WorkflowDatabaseService.getActiveWorkflowForPayer(payerId);

      if (workflow && workflow.workflow_data) {
        setNodes(workflow.workflow_data.nodes || []);
        setEdges(workflow.workflow_data.edges || []);
        setWorkflowName(workflow.name);
        setWorkflowId(workflow.id);

        const maxId = workflow.workflow_data.nodes.reduce((max, node) => {
          const idNum = parseInt(node.id.replace('node_', ''));
          return idNum > max ? idNum : max;
        }, 0);
        nodeIdCounter.current = maxId + 1;
      } else {
        setWorkflowName(`${payerName} Workflow`);
        setNodes([]);
        setEdges([]);
      }

      updateBreadcrumbs();
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
  };

  const loadSubflow = async () => {
    if (!subflowId) return;

    try {
      const { supabase } = await import('../../lib/supabase');
      const { data: subflow, error } = await supabase
        .from('subflows')
        .select('*')
        .eq('id', subflowId)
        .single();

      if (error) throw error;

      if (subflow) {
        if (subflow.workflow_data) {
          setNodes(subflow.workflow_data.nodes || []);
          setEdges(subflow.workflow_data.edges || []);
        } else {
          const { SubflowMigrationService } = await import('../../services/SubflowMigrationService');
          const { nodes: migratedNodes, edges: migratedEdges } = await SubflowMigrationService.migrateSubflowToVisual(subflow);
          setNodes(migratedNodes);
          setEdges(migratedEdges);
        }

        setWorkflowName(subflow.name);
        setWorkflowId(subflow.id);

        const maxId = (subflow.workflow_data?.nodes || []).reduce((max: number, node: any) => {
          const idNum = parseInt(node.id.replace('node_', '').replace('start-', '').replace('complete-', '').replace('task-', '').replace('prereq-', '').replace('dep-', ''));
          return idNum > max ? idNum : max;
        }, 0);
        nodeIdCounter.current = maxId + 1;
      }

      updateBreadcrumbs();
    } catch (error) {
      console.error('Error loading subflow:', error);
    }
  };

  const updateBreadcrumbs = () => {
    const crumbs: BreadcrumbItem[] = [
      { label: 'Workflows', type: 'home' }
    ];

    if (editMode === 'payer' && payerName) {
      crumbs.push({
        label: payerName,
        type: 'workflow',
        id: payerId
      });
    } else if (editMode === 'subflow' && workflowName) {
      if (payerName) {
        crumbs.push({
          label: payerName,
          type: 'workflow',
          id: payerId
        });
      }
      crumbs.push({
        label: workflowName,
        type: 'subflow',
        id: subflowId
      });
    }

    setBreadcrumbs(crumbs);
  };

  const handleDiveIntoSubflow = async (targetSubflowId: string) => {
    if (onNavigateToSubflow) {
      onNavigateToSubflow(targetSubflowId);
    } else {
      setSubflowId(targetSubflowId);
      setEditMode('subflow');
      await loadSubflow();
    }
  };

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    if (isViewMode) return;
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, [isViewMode]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    if (isViewMode) return;
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, [isViewMode]);

  const onConnect = useCallback((connection: Connection) => {
    if (isViewMode) return;

    const edge: Edge = {
      ...connection,
      id: `edge_${Date.now()}`,
      type: 'smoothstep',
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20
      }
    };

    setEdges((eds) => addEdge(edge, eds));
  }, [isViewMode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      if (isViewMode) return;
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as WorkflowNodeType;
      if (!type || !reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeDefinition = NODE_TYPE_DEFINITIONS[type];
      const newNode: Node = {
        id: `node_${nodeIdCounter.current++}`,
        type,
        position,
        data: {
          label: nodeDefinition.label,
          config: { ...nodeDefinition.defaultConfig }
        }
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, isViewMode]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleSaveNodeConfig = useCallback((nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config
            }
          };
        }
        return node;
      })
    );
    setSelectedNode(null);
  }, []);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length === 0) return;

    const nodeWidth = 280;
    const nodeHeight = 100;
    const horizontalSpacing = 150;
    const verticalSpacing = 180;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const layers: string[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    nodes.forEach(node => {
      inDegree.set(node.id, 0);
    });

    edges.forEach(edge => {
      const count = inDegree.get(edge.target) || 0;
      inDegree.set(edge.target, count + 1);
    });

    const queue: string[] = [];
    nodes.forEach(node => {
      if ((inDegree.get(node.id) || 0) === 0) {
        queue.push(node.id);
      }
    });

    while (queue.length > 0) {
      const currentLayer: string[] = [];
      const nextQueue: string[] = [];

      queue.forEach(nodeId => {
        if (!visited.has(nodeId)) {
          visited.add(nodeId);
          currentLayer.push(nodeId);

          edges.forEach(edge => {
            if (edge.source === nodeId) {
              const targetCount = inDegree.get(edge.target) || 0;
              inDegree.set(edge.target, targetCount - 1);
              if (targetCount - 1 === 0) {
                nextQueue.push(edge.target);
              }
            }
          });
        }
      });

      if (currentLayer.length > 0) {
        layers.push(currentLayer);
      }
      queue.length = 0;
      queue.push(...nextQueue);
    }

    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        layers.push([node.id]);
      }
    });

    const layoutedNodes = nodes.map(node => {
      let layerIndex = 0;
      let positionInLayer = 0;

      for (let i = 0; i < layers.length; i++) {
        const pos = layers[i].indexOf(node.id);
        if (pos !== -1) {
          layerIndex = i;
          positionInLayer = pos;
          break;
        }
      }

      const nodesInLayer = layers[layerIndex].length;
      const totalLayerWidth = nodesInLayer * nodeWidth + (nodesInLayer - 1) * horizontalSpacing;
      const startX = -totalLayerWidth / 2;
      const xPosition = startX + positionInLayer * (nodeWidth + horizontalSpacing);

      return {
        ...node,
        position: {
          x: xPosition,
          y: 100 + layerIndex * (nodeHeight + verticalSpacing)
        }
      };
    });

    const updatedEdges = edges.map(edge => ({
      ...edge,
      type: 'smoothstep'
    }));

    setNodes(layoutedNodes);
    setEdges(updatedEdges);
  }, [nodes, edges]);

  const handleSaveWorkflow = async () => {
    setIsSaving(true);
    try {
      const workflowData = {
        nodes,
        edges
      };

      if (editMode === 'subflow' && subflowId) {
        const { supabase } = await import('../../lib/supabase');
        const { error } = await supabase
          .from('subflows')
          .update({
            workflow_data: workflowData,
            metadata: {
              ...{ viewport: reactFlowInstance?.getViewport() },
              last_edited_at: new Date().toISOString(),
              version: 1
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', subflowId);

        if (error) throw error;
        alert('Subflow saved successfully!');
      } else if (editMode === 'payer' && payerId) {
        const { DatabaseService } = await import('../../lib/supabase');
        const organizationId = 'default-org';

        if (workflowId) {
          await WorkflowDatabaseService.updateWorkflowDefinition(workflowId, {
            workflow_data: workflowData,
            name: workflowName,
            updated_at: new Date().toISOString()
          });
        } else {
          const newWorkflow = await WorkflowDatabaseService.createWorkflowDefinition({
            payer_id: payerId,
            organization_id: organizationId,
            name: workflowName || `${payerName} Workflow`,
            workflow_data: workflowData,
            version: 1,
            effective_from_date: new Date().toISOString().split('T')[0],
            is_active: true
          });
          setWorkflowId(newWorkflow.id);
        }

        alert('Workflow saved successfully!');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Error saving workflow');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragStart = (event: React.DragEvent, nodeType: WorkflowNodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const toggleMode = () => {
    setIsViewMode(!isViewMode);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}

            {!payerId && !subflowId ? (
              <div className="flex items-center gap-3 flex-1">
                <label className="text-sm font-medium text-gray-700">Select Payer:</label>
                <select
                  value={payerId || ''}
                  onChange={(e) => setPayerId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[200px]"
                >
                  <option value="">Choose a payer...</option>
                  {payers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <h1 className="text-xl font-semibold text-gray-800">
                  {workflowName || `${payerName} ${editMode === 'subflow' ? 'Subflow' : 'Workflow'}`}
                </h1>
                <div className="text-sm text-gray-500">
                  {editMode === 'subflow' ? 'Subflow' : payerName} • {isViewMode ? 'View Mode' : 'Edit Mode'}
                </div>
              </div>
            )}
          </div>

          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <button
                    onClick={() => {
                      if (crumb.type === 'home' && onBack) {
                        onBack();
                      } else if (crumb.type === 'workflow' && crumb.id) {
                        setEditMode('payer');
                        setSubflowId(undefined);
                        loadPayerWorkflow();
                      }
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 transition-colors ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-600'
                    }`}
                  >
                    {crumb.type === 'home' && <Home className="w-3 h-3" />}
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleMode}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {isViewMode ? (
              <>
                <Edit3 className="w-4 h-4" />
                Edit Mode
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                View Mode
              </>
            )}
          </button>

          {!isViewMode && (
            <>
              <button
                onClick={handleAutoLayout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Auto-arrange nodes"
              >
                <GitBranch className="w-4 h-4" />
                Auto Layout
              </button>
              <button
                onClick={handleSaveWorkflow}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Workflow'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {!isViewMode && <NodePalette onDragStart={handleDragStart} />}

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={!isViewMode}
            nodesConnectable={!isViewMode}
            elementsSelectable={!isViewMode}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>

        {!isViewMode && selectedNode && (
          <NodeConfigPanel
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onSave={handleSaveNodeConfig}
            onDiveIntoSubflow={handleDiveIntoSubflow}
          />
        )}
      </div>
    </div>
  );
};
