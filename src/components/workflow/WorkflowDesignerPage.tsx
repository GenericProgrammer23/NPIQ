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
import { Save, Play, Eye, Edit3, ArrowLeft, Undo, Redo } from 'lucide-react';

import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import { nodeTypes } from './CustomNodes';
import { WorkflowNodeType, NODE_TYPE_DEFINITIONS } from '../../types/workflow';
import { WorkflowDatabaseService } from '../../lib/workflowDatabase';

interface WorkflowDesignerPageProps {
  payerId?: string;
  mode?: 'view' | 'edit';
  onBack?: () => void;
}

export const WorkflowDesignerPage: React.FC<WorkflowDesignerPageProps> = ({
  payerId: initialPayerId,
  mode: initialMode = 'edit',
  onBack
}) => {
  const [payerId, setPayerId] = useState(initialPayerId);

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
      loadWorkflow();
      loadPayerInfo();
    }
  }, [payerId]);

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
    } catch (error) {
      console.error('Error loading workflow:', error);
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
      type: 'default',
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

  const handleSaveWorkflow = async () => {
    if (!payerId) return;

    setIsSaving(true);
    try {
      const workflowData = {
        nodes,
        edges
      };

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
        <div className="flex items-center gap-4 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {!payerId ? (
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
                {workflowName || `${payerName} Workflow`}
              </h1>
              <div className="text-sm text-gray-500">
                {payerName} • {isViewMode ? 'View Mode' : 'Edit Mode'}
              </div>
            </div>
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
            <button
              onClick={handleSaveWorkflow}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Workflow'}
            </button>
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
          />
        )}
      </div>
    </div>
  );
};
