import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, XCircle, Clock, Calendar, Users, FileText } from 'lucide-react';
import { ProviderActionService, ProviderAction } from '../services/ProviderActionService';
import { supabase } from '../lib/supabase';

interface ProviderActionsTabProps {
  providerId: string;
  providerName: string;
  organizationId: string;
}

interface Payer {
  id: string;
  name: string;
}

export const ProviderActionsTab: React.FC<ProviderActionsTabProps> = ({
  providerId,
  providerName,
  organizationId
}) => {
  const [actions, setActions] = useState<ProviderAction[]>([]);
  const [payers, setPayers] = useState<Map<string, Payer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<ProviderAction | null>(null);

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actionsData, payersData] = await Promise.all([
        ProviderActionService.getProviderActions(providerId),
        loadPayers()
      ]);

      setActions(actionsData);
      setPayers(payersData);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadPayers = async (): Promise<Map<string, Payer>> => {
    try {
      const { data, error } = await supabase
        .from('payers')
        .select('id, name')
        .eq('organization_id', organizationId);

      if (error) throw error;

      const payerMap = new Map<string, Payer>();
      data?.forEach(payer => payerMap.set(payer.id, payer));
      return payerMap;
    } catch {
      return new Map();
    }
  };

  const getStatusIcon = (status: ProviderAction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'not_started':
        return <Play className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: ProviderAction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'not_started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPayerNames = (payerIds: string[]) => {
    return payerIds
      .map(id => payers.get(id)?.name || 'Unknown')
      .join(', ');
  };

  const getProgressPercentage = (action: ProviderAction) => {
    if (action.total_tasks === 0) return 0;
    return Math.round((action.completed_tasks / action.total_tasks) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No actions have been started for this provider yet.</p>
        <p className="text-sm text-gray-400 mt-2">
          Use the "Start New Action" button to begin credentialing or make changes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Action History</h3>
        <span className="text-sm text-gray-500">{actions.length} total actions</span>
      </div>

      <div className="space-y-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                {getStatusIcon(action.status)}
                <div>
                  <h4 className="font-medium text-gray-900">{action.action_name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {action.action_type.split('_').map(word =>
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                {action.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Started: {formatDate(action.started_at || action.created_at)}</span>
                </div>
                {action.completed_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Completed: {formatDate(action.completed_at)}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span className="truncate" title={getPayerNames(action.payer_ids)}>
                    {action.payer_ids.length} payer{action.payer_ids.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {action.status !== 'cancelled' && action.total_tasks > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium text-gray-900">
                    {action.completed_tasks} / {action.total_tasks} tasks ({getProgressPercentage(action)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage(action)}%` }}
                  ></div>
                </div>
              </div>
            )}

            {action.metadata && Object.keys(action.metadata).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Details:</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(action.metadata).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <span className="text-gray-500">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-gray-900 ml-1">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Payers:</strong> {getPayerNames(action.payer_ids)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
