import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Play, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Subflow {
  id: string;
  name: string;
  purpose?: string;
  status: string;
  payer_id?: string;
  is_reusable: boolean;
  execution_count: number;
  last_executed_at?: string;
  tags?: string[];
  workflow_data?: any;
  created_at: string;
  payers?: {
    name: string;
  };
}

interface SubflowsPageProps {
  onNavigate?: (page: string, params: any) => void;
}

export const SubflowsPage: React.FC<SubflowsPageProps> = ({ onNavigate }) => {
  const [subflows, setSubflows] = React.useState<Subflow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSubflowName, setNewSubflowName] = useState('');
  const [newSubflowPurpose, setNewSubflowPurpose] = useState('');

  React.useEffect(() => {
    loadSubflows();
  }, []);

  const loadSubflows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subflows')
        .select('*, payers(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubflows(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubflow = async () => {
    if (!newSubflowName.trim()) {
      alert('Please enter a subflow name');
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        alert('You must be logged in to create subflows');
        return;
      }

      const { data: membership, error: membershipError } = await supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', user.data.user.id)
        .maybeSingle();

      if (membershipError || !membership) {
        alert('Could not find your organization membership');
        return;
      }

      const { SubflowMigrationService } = await import('../services/SubflowMigrationService');
      const emptyWorkflow = SubflowMigrationService.createEmptyVisualWorkflow();

      const { data, error } = await supabase
        .from('subflows')
        .insert({
          name: newSubflowName,
          purpose: newSubflowPurpose || null,
          organization_id: membership.organization_id,
          status: 'not_started',
          is_reusable: true,
          workflow_data: emptyWorkflow,
          metadata: {
            created_visually: true,
            version: 1
          }
        })
        .select()
        .single();

      if (error) throw error;

      setShowAddModal(false);
      setNewSubflowName('');
      setNewSubflowPurpose('');

      if (data && onNavigate) {
        onNavigate('workflow-designer', {
          subflowId: data.id,
          editMode: 'subflow',
          mode: 'edit'
        });
      } else {
        loadSubflows();
      }
    } catch (err) {
      alert('Failed to create subflow');
    }
  };

  const handleDesignSubflow = (subflow: Subflow) => {
    if (onNavigate) {
      onNavigate('workflow-designer', {
        subflowId: subflow.id,
        editMode: 'subflow',
        mode: 'edit'
      });
    }
  };

  const handleDeleteSubflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subflow? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('subflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadSubflows();
    } catch (err) {
      alert('Failed to delete subflow');
    }
  };

  const filteredSubflows = subflows.filter(subflow =>
    subflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subflow.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'in_progress':
        return <Clock className="h-3 w-3 mr-1" />;
      default:
        return <Play className="h-3 w-3 mr-1" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-gray-600 dark:text-gray-400">Loading subflows...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cream dark:bg-navy-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-navy dark:text-cream">Subflows</h1>
            <p className="text-navy/60 dark:text-gray-400 mt-1">
              Reusable workflow components
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-navy dark:bg-dark-cyan text-white rounded-lg hover:bg-navy/90 dark:hover:bg-dark-cyan/80 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Subflow
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-navy/40 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search subflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-light dark:text-cream"
            />
          </div>
        </div>

        {filteredSubflows.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-navy-light rounded-lg">
            <Play className="h-16 w-16 text-navy/20 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-navy/60 dark:text-gray-400 text-lg">
              {searchTerm ? 'No subflows match your search' : 'No subflows yet'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-dark-cyan dark:text-dark-cyan hover:underline"
              >
                Create your first subflow
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubflows.map((subflow) => (
              <div
                key={subflow.id}
                className="bg-white dark:bg-navy-light rounded-lg p-6 border border-navy/10 dark:border-dark-cyan/20 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-navy dark:text-cream">
                        {subflow.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subflow.status)}`}>
                        {getStatusIcon(subflow.status)}
                        {subflow.status.replace('_', ' ')}
                      </span>
                      {subflow.is_reusable && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                          Reusable
                        </span>
                      )}
                    </div>
                    {subflow.purpose && (
                      <p className="text-sm text-navy/70 dark:text-gray-400 mb-2">
                        {subflow.purpose}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-navy/50 dark:text-gray-500">
                      {subflow.payers?.name && (
                        <span>Payer: {subflow.payers.name}</span>
                      )}
                      <span>
                        Executions: {subflow.execution_count || 0}
                      </span>
                      {subflow.workflow_data && (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ Visual Workflow
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDesignSubflow(subflow)}
                      className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                      title="Design Subflow"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubflow(subflow.id)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete Subflow"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {subflow.tags && subflow.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {subflow.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-navy/5 dark:bg-dark-cyan/10 text-navy dark:text-cream rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-navy-light rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-navy dark:text-white mb-4">Create New Subflow</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Subflow Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newSubflowName}
                  onChange={(e) => setNewSubflowName(e.target.value)}
                  placeholder="e.g., License Verification"
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy dark:text-gray-300 mb-1">
                  Purpose (Optional)
                </label>
                <textarea
                  value={newSubflowPurpose}
                  onChange={(e) => setNewSubflowPurpose(e.target.value)}
                  placeholder="Brief description of what this subflow does..."
                  rows={3}
                  className="w-full px-3 py-2 border border-navy/20 dark:border-dark-cyan/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-cyan dark:bg-navy-dark dark:text-white"
                />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                After creating the subflow, you'll be taken to the visual designer to build its workflow.
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateSubflow}
                  className="flex-1 px-4 py-2 bg-navy dark:bg-dark-cyan text-white rounded-lg hover:bg-navy/90 dark:hover:bg-dark-cyan/80 transition-colors"
                >
                  Create & Design
                </button>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setNewSubflowName('');
                    setNewSubflowPurpose('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-navy-dark text-navy dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-navy transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
