import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronRight, Play, FileText, CheckSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Resource {
  id: string;
  name: string;
  description?: string;
  type: string;
  metadata?: any;
}

interface ResourcesSidebarProps {
  onDragStart: (event: React.DragEvent, nodeType: string, config: any) => void;
}

export const ResourcesSidebar: React.FC<ResourcesSidebarProps> = ({ onDragStart }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    subflows: true,
    workflows: false,
    tasks: false
  });

  const [subflows, setSubflows] = useState<Resource[]>([]);
  const [workflows, setWorkflows] = useState<Resource[]>([]);
  const [taskTemplates, setTaskTemplates] = useState<Resource[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);

    const { data: subflowsData } = await supabase
      .from('subflows')
      .select('id, name, purpose, payer_id, payers(name), tags')
      .eq('is_reusable', true)
      .order('name');

    const { data: workflowsData } = await supabase
      .from('workflows')
      .select('id, name, description, type')
      .eq('is_template', true)
      .eq('status', 'active')
      .order('name');

    const { data: tasksData } = await supabase
      .from('payer_task_templates')
      .select('id, title_template, description_template, task_type, payer_id, payers(name)')
      .order('title_template');

    setSubflows((subflowsData || []).map(s => ({
      id: s.id,
      name: s.name,
      description: s.purpose,
      type: 'subflow',
      metadata: { payer: s.payers?.name, tags: s.tags }
    })));

    setWorkflows((workflowsData || []).map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      type: w.type,
      metadata: {}
    })));

    setTaskTemplates((tasksData || []).map(t => ({
      id: t.id,
      name: t.title_template,
      description: t.description_template,
      type: t.task_type,
      metadata: { payer: t.payers?.name }
    })));

    setLoading(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filterResources = (resources: Resource[]) => {
    if (!searchTerm) return resources;
    const term = searchTerm.toLowerCase();
    return resources.filter(r =>
      r.name.toLowerCase().includes(term) ||
      r.description?.toLowerCase().includes(term)
    );
  };

  const handleResourceDragStart = (event: React.DragEvent, resource: Resource, nodeType: string) => {
    const config: any = {
      type: nodeType
    };

    if (nodeType === 'execute_subflow') {
      config.subflow_id = resource.id;
      config.subflow_name = resource.name;
      config.wait_for_completion = true;
      config.pass_context = true;
    } else if (nodeType === 'execute_workflow_template') {
      config.workflow_template_id = resource.id;
      config.workflow_template_name = resource.name;
      config.wait_for_completion = true;
    } else if (nodeType === 'generate_task') {
      config.task_title = resource.name;
      config.task_description = resource.description || '';
      config.task_type = resource.type;
      config.priority = 'medium';
      config.prevent_duplicates = true;
    }

    onDragStart(event, nodeType, config);
  };

  const ResourceItem: React.FC<{ resource: Resource; nodeType: string; icon: React.ComponentType<any> }> = ({
    resource,
    nodeType,
    icon: Icon
  }) => (
    <div
      draggable
      onDragStart={(e) => handleResourceDragStart(e, resource, nodeType)}
      className="group cursor-move p-3 mb-2 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-2">
        <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {resource.name}
          </div>
          {resource.description && (
            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
              {resource.description}
            </div>
          )}
          {resource.metadata?.payer && (
            <div className="text-xs text-blue-600 mt-1">
              {resource.metadata.payer}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const Section: React.FC<{
    title: string;
    sectionKey: string;
    resources: Resource[];
    icon: React.ComponentType<any>;
    nodeType: string;
  }> = ({ title, sectionKey, resources, icon, nodeType }) => {
    const isExpanded = expandedSections[sectionKey];
    const filteredResources = filterResources(resources);

    return (
      <div className="mb-4">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-sm font-semibold text-gray-700">{title}</span>
            <span className="text-xs text-gray-500">({filteredResources.length})</span>
          </div>
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-1">
            {filteredResources.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">
                No {title.toLowerCase()} found
              </div>
            ) : (
              filteredResources.map(resource => (
                <ResourceItem
                  key={resource.id}
                  resource={resource}
                  nodeType={nodeType}
                  icon={icon}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Resources</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Drag items to the canvas to add them to your workflow
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Section
          title="Subflows"
          sectionKey="subflows"
          resources={subflows}
          icon={Play}
          nodeType="execute_subflow"
        />

        <Section
          title="Workflow Templates"
          sectionKey="workflows"
          resources={workflows}
          icon={FileText}
          nodeType="execute_workflow_template"
        />

        <Section
          title="Task Templates"
          sectionKey="tasks"
          resources={taskTemplates}
          icon={CheckSquare}
          nodeType="generate_task"
        />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500">
          <div className="font-medium mb-1">Drag & Drop</div>
          <div>Drag any resource to the canvas to automatically create a configured node.</div>
        </div>
      </div>
    </div>
  );
};
