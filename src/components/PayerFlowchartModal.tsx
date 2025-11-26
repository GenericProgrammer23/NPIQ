import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X } from 'lucide-react';
import { PayerFlowchartService } from '../services/PayerFlowchartService';

interface PayerFlowchartModalProps {
  payerId: string;
  payerName: string;
  providerId?: string;
  onClose: () => void;
}

const nodeColor = (status?: string) => {
  switch (status) {
    case 'completed':
      return '#10b981'; // green
    case 'in_progress':
      return '#3b82f6'; // blue
    case 'pending':
      return '#f59e0b'; // yellow
    case 'not_created':
      return '#9ca3af'; // gray
    default:
      return '#6b7280';
  }
};

export const PayerFlowchartModal: React.FC<PayerFlowchartModalProps> = ({
  payerId,
  payerName,
  providerId,
  onClose,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFlowchart();
  }, [payerId, providerId]);

  const loadFlowchart = async () => {
    setLoading(true);
    try {
      const { nodes: flowNodes, edges: flowEdges } = await PayerFlowchartService.generateFlowchartForPayer(
        payerId,
        providerId
      );

      // Convert to ReactFlow nodes with proper styling
      const reactFlowNodes: Node[] = flowNodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          ...node.data,
          label: (
            <div className="px-3 py-2">
              <div className="font-semibold text-sm">{node.data.label}</div>
              {node.data.description && (
                <div className="text-xs text-gray-600 mt-1">{node.data.description}</div>
              )}
              {node.data.status && node.data.status !== 'not_created' && (
                <div className={`text-xs mt-1 font-medium ${
                  node.data.status === 'completed' ? 'text-green-600' :
                  node.data.status === 'in_progress' ? 'text-blue-600' :
                  node.data.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  {node.data.status.replace('_', ' ').toUpperCase()}
                </div>
              )}
            </div>
          )
        },
        style: {
          background: nodeColor(node.data.status),
          color: node.data.status === 'not_created' ? '#374151' : 'white',
          border: '2px solid',
          borderColor: node.data.status === 'not_created' ? '#d1d5db' : 'transparent',
          borderRadius: '8px',
          padding: 0,
          minWidth: '200px',
        },
      }));

      const reactFlowEdges: Edge[] = flowEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edge.type || 'smoothstep',
        animated: edge.animated || false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          stroke: edge.animated ? '#3b82f6' : '#9ca3af',
          strokeWidth: edge.animated ? 2 : 1,
        },
      }));

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
    } catch (error) {
      console.error('Error loading flowchart:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-light rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-navy/10 dark:border-dark-cyan/30">
          <div>
            <h2 className="text-2xl font-bold text-navy dark:text-white">
              {payerName} Workflow
            </h2>
            <p className="text-sm text-navy/70 dark:text-cream/70 mt-1">
              {providerId ? 'Provider-specific status shown in color' : 'Template workflow view'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-navy/60 hover:text-navy dark:text-cream/60 dark:hover:text-cream"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-navy dark:text-cream">Loading flowchart...</div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              attributionPosition="bottom-left"
            >
              <Background />
              <Controls />
            </ReactFlow>
          )}
        </div>

        <div className="p-4 border-t border-navy/10 dark:border-dark-cyan/30 bg-gray-50 dark:bg-navy-dark">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-navy dark:text-cream">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-navy dark:text-cream">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-navy dark:text-cream">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-400 border-2 border-gray-300"></div>
              <span className="text-navy dark:text-cream">Not Created Yet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
