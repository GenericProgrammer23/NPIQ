import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { NODE_TYPE_DEFINITIONS, WorkflowNodeType } from '../../types/workflow';
import { Search } from 'lucide-react';

interface NodePaletteProps {
  onDragStart: (event: React.DragEvent, nodeType: WorkflowNodeType) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onDragStart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['flow', 'prerequisites', 'tasks', 'dates', 'data', 'components'])
  );

  const categories = {
    flow: 'Flow Control',
    prerequisites: 'Prerequisites',
    tasks: 'Task Generation',
    dates: 'Date Operations',
    data: 'Data Operations',
    components: 'Reusable Components'
  };

  const nodesByCategory = Object.entries(NODE_TYPE_DEFINITIONS).reduce((acc, [key, def]) => {
    const category = def.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key: key as WorkflowNodeType, ...def });
    return acc;
  }, {} as Record<string, any[]>);

  const filteredNodes = Object.entries(nodesByCategory).reduce((acc, [category, nodes]) => {
    const filtered = nodes.filter(node =>
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      acc[category] = filtered;
    }
    return acc;
  }, {} as Record<string, any[]>);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Node Palette</h3>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {Object.entries(filteredNodes).map(([category, nodes]) => (
          <div key={category} className="space-y-2">
            <button
              onClick={() => toggleCategory(category)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-600 uppercase tracking-wide hover:text-gray-800"
            >
              <span>{categories[category as keyof typeof categories]}</span>
              <Icons.ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedCategories.has(category) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedCategories.has(category) && (
              <div className="space-y-2">
                {nodes.map((node) => {
                  const Icon = Icons[node.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
                  return (
                    <div
                      key={node.key}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.key)}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-move hover:border-gray-300 hover:shadow-sm transition-all group"
                      title={node.description}
                    >
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0"
                        style={{ backgroundColor: `${node.color}20` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: node.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">
                          {node.label}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {node.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="font-semibold mb-1">💡 Quick Tip</div>
          <div>Drag nodes onto the canvas to add them to your workflow.</div>
        </div>
      </div>
    </div>
  );
};
