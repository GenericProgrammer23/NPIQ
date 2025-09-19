import React from 'react';
import { useDashboardStats } from '../hooks/useDatabase';
import { Users, MapPin, Workflow, CheckSquare, Plus, TrendingUp } from 'lucide-react';

interface DashboardProps {
  onPageChange: (page: string, filter?: { type: string; value: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const { stats, loading, error } = useDashboardStats();

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-navy/10 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-navy/10 p-6">
                <div className="h-4 bg-navy/10 rounded w-20 mb-2"></div>
                <div className="h-8 bg-navy/10 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading dashboard: {error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Providers',
      value: stats.totalProviders,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      onClick: () => onPageChange('providers')
    },
    {
      title: 'Active Workflows',
      value: stats.activeWorkflows,
      icon: Workflow,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      onClick: () => onPageChange('workflows', { type: 'status', value: 'active' })
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      onClick: () => onPageChange('tasks', { type: 'status', value: 'completed' })
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      onClick: () => onPageChange('tasks', { type: 'status', value: 'pending' })
    }
  ];

  return (
    <div className="p-6 bg-cream dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Dashboard</h1>
        <p className="text-navy/70 dark:text-gray-300">Overview of your healthcare credentialing system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className={`${stat.bgColor} dark:bg-gray-800 ${stat.borderColor} dark:border-gray-600 border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer`}
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy/70 dark:text-gray-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-navy dark:text-white">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600 p-6">
        <h2 className="text-xl font-semibold text-navy dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => onPageChange('providers', { type: 'action', value: 'add' })}
            className="flex items-center p-4 bg-navy/5 dark:bg-gray-700 hover:bg-navy/10 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <Plus className="h-5 w-5 text-navy dark:text-white mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy dark:text-white group-hover:text-dark-cyan font-medium">Add Provider</span>
          </button>
          <button 
            onClick={() => onPageChange('locations', { type: 'action', value: 'add' })}
            className="flex items-center p-4 bg-navy/5 dark:bg-gray-700 hover:bg-navy/10 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <MapPin className="h-5 w-5 text-navy dark:text-white mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy dark:text-white group-hover:text-dark-cyan font-medium">Add Location</span>
          </button>
          <button 
            onClick={() => onPageChange('workflows', { type: 'action', value: 'add' })}
            className="flex items-center p-4 bg-navy/5 dark:bg-gray-700 hover:bg-navy/10 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <Workflow className="h-5 w-5 text-navy dark:text-white mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy dark:text-white group-hover:text-dark-cyan font-medium">Create Workflow</span>
          </button>
          <button 
            onClick={() => onPageChange('tasks', { type: 'action', value: 'add' })}
            className="flex items-center p-4 bg-navy/5 dark:bg-gray-700 hover:bg-navy/10 dark:hover:bg-gray-600 rounded-lg transition-colors group"
          >
            <CheckSquare className="h-5 w-5 text-navy dark:text-white mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy dark:text-white group-hover:text-dark-cyan font-medium">Create Task</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg border border-navy/10 dark:border-gray-600 p-6">
        <h2 className="text-xl font-semibold text-navy dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {stats.totalProviders > 0 ? (
            <>
              <div className="flex items-center p-3 bg-navy/5 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span className="text-navy dark:text-white">System initialized with {stats.totalProviders} providers</span>
                <span className="text-navy/50 dark:text-gray-400 text-sm ml-auto">Today</span>
              </div>
              {stats.activeWorkflows > 0 && (
                <div className="flex items-center p-3 bg-navy/5 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-navy dark:text-white">{stats.activeWorkflows} active workflows running</span>
                  <span className="text-navy/50 dark:text-gray-400 text-sm ml-auto">Today</span>
                </div>
              )}
              {stats.pendingTasks > 0 && (
                <div className="flex items-center p-3 bg-navy/5 dark:bg-gray-700 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-navy dark:text-white">{stats.pendingTasks} tasks awaiting attention</span>
                  <span className="text-navy/50 dark:text-gray-400 text-sm ml-auto">Today</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-2 h-2 bg-gray-400 rounded-full mx-auto mb-3"></div>
              <span className="text-navy/60 dark:text-gray-400">No recent activity. Start by adding providers and creating workflows.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};