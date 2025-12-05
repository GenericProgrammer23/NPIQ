import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, Clock, XCircle, Calendar, Users, FileText, Filter, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ProviderActionService, ProviderAction } from '../services/ProviderActionService';

interface ActionsPageProps {
  organizationId: string;
}

interface Provider {
  id: string;
  first_name: string;
  last_name: string;
}

interface Payer {
  id: string;
  name: string;
}

export const ActionsPage: React.FC<ActionsPageProps> = ({ organizationId }) => {
  const [actions, setActions] = useState<ProviderAction[]>([]);
  const [providers, setProviders] = useState<Map<string, Provider>>(new Map());
  const [payers, setPayers] = useState<Map<string, Payer>>(new Map());
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [actionsData, providersData, payersData] = await Promise.all([
        loadActions(),
        loadProviders(),
        loadPayers()
      ]);

      setActions(actionsData);
      setProviders(providersData);
      setPayers(payersData);
    } catch (error) {
      console.error('Error loading actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActions = async (): Promise<ProviderAction[]> => {
    const { data, error } = await supabase
      .from('provider_actions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading actions:', error);
      return [];
    }

    return data || [];
  };

  const loadProviders = async (): Promise<Map<string, Provider>> => {
    const { data, error } = await supabase
      .from('providers')
      .select('id, first_name, last_name')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error loading providers:', error);
      return new Map();
    }

    const providerMap = new Map<string, Provider>();
    data?.forEach(provider => providerMap.set(provider.id, provider));
    return providerMap;
  };

  const loadPayers = async (): Promise<Map<string, Payer>> => {
    const { data, error } = await supabase
      .from('payers')
      .select('id, name')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error loading payers:', error);
      return new Map();
    }

    const payerMap = new Map<string, Payer>();
    data?.forEach(payer => payerMap.set(payer.id, payer));
    return payerMap;
  };

  const getStatusIcon = (status: ProviderAction['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
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

  const getProviderName = (providerId: string) => {
    const provider = providers.get(providerId);
    return provider ? `${provider.first_name} ${provider.last_name}` : 'Unknown Provider';
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

  const filteredActions = actions.filter(action => {
    const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
    const matchesType = typeFilter === 'all' || action.action_type === typeFilter;
    const providerName = getProviderName(action.provider_id).toLowerCase();
    const matchesSearch = searchTerm === '' ||
      action.action_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      providerName.includes(searchTerm.toLowerCase());

    return matchesStatus && matchesType && matchesSearch;
  });

  const getActionTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'initial_credentialing':
        return 'bg-blue-100 text-blue-800';
      case 'name_change':
        return 'bg-purple-100 text-purple-800';
      case 'address_change':
        return 'bg-orange-100 text-orange-800';
      case 're_credentialing':
        return 'bg-green-100 text-green-800';
      case 'add_single_payer':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Actions</h1>
        <p className="text-navy/70 dark:text-gray-400">
          Track all provider actions including credentialing, name changes, and re-credentialing
        </p>
      </div>

      <div className="bg-white dark:bg-navy-dark rounded-lg shadow-sm border border-navy/10 dark:border-dark-cyan/30 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search actions or providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-dark-cyan/30 rounded-lg bg-white dark:bg-navy text-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="initial_credentialing">Initial Credentialing</option>
            <option value="name_change">Name Change</option>
            <option value="address_change">Address Change</option>
            <option value="re_credentialing">Re-credentialing</option>
            <option value="add_single_payer">Add Single Payer</option>
            <option value="custom">Custom</option>
          </select>

          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {filteredActions.length} action{filteredActions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {filteredActions.length === 0 ? (
        <div className="bg-white dark:bg-navy-dark rounded-lg shadow-sm border border-navy/10 dark:border-dark-cyan/30 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No actions found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start a new action from a provider\'s detail page'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActions.map((action) => (
            <div
              key={action.id}
              className="bg-white dark:bg-navy-dark rounded-lg shadow-sm border border-navy/10 dark:border-dark-cyan/30 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(action.status)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {action.action_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Provider: {getProviderName(action.provider_id)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                    {action.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionTypeBadgeColor(action.action_type)}`}>
                    {formatActionType(action.action_type)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Started</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate(action.started_at || action.created_at)}
                  </p>
                </div>

                {action.completed_at && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {formatDate(action.completed_at)}
                    </p>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>Payers</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                    {action.payer_ids.length}
                  </p>
                </div>

                {action.status !== 'cancelled' && action.total_tasks > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span>Progress</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                      {action.completed_tasks} / {action.total_tasks} ({getProgressPercentage(action)}%)
                    </p>
                  </div>
                )}
              </div>

              {action.status !== 'cancelled' && action.total_tasks > 0 && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage(action)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Payers:</strong> {getPayerNames(action.payer_ids)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
