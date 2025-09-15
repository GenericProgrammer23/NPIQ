import React from 'react';
import { useDashboardStats } from '../hooks/useDatabase';
import { Users, MapPin, Workflow, CheckSquare, Plus, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
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
      borderColor: 'border-blue-200'
    },
    {
      title: 'Active Workflows',
      value: stats.activeWorkflows,
      icon: Workflow,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Pending Tasks',
      value: stats.pendingTasks,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy mb-2">Dashboard</h1>
        <p className="text-navy/70">Overview of your healthcare credentialing system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-navy/70 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-navy">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-navy/10 p-6">
        <h2 className="text-xl font-semibold text-navy mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex items-center p-4 bg-navy/5 hover:bg-navy/10 rounded-lg transition-colors group">
            <Plus className="h-5 w-5 text-navy mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy group-hover:text-dark-cyan font-medium">Add Provider</span>
          </button>
          <button className="flex items-center p-4 bg-navy/5 hover:bg-navy/10 rounded-lg transition-colors group">
            <MapPin className="h-5 w-5 text-navy mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy group-hover:text-dark-cyan font-medium">Add Location</span>
          </button>
          <button className="flex items-center p-4 bg-navy/5 hover:bg-navy/10 rounded-lg transition-colors group">
            <Workflow className="h-5 w-5 text-navy mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy group-hover:text-dark-cyan font-medium">Create Workflow</span>
          </button>
          <button className="flex items-center p-4 bg-navy/5 hover:bg-navy/10 rounded-lg transition-colors group">
            <CheckSquare className="h-5 w-5 text-navy mr-3 group-hover:text-dark-cyan" />
            <span className="text-navy group-hover:text-dark-cyan font-medium">Assign Task</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg border border-navy/10 p-6">
        <h2 className="text-xl font-semibold text-navy mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-navy/5 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
            <span className="text-navy">New provider application submitted</span>
            <span className="text-navy/50 text-sm ml-auto">2 hours ago</span>
          </div>
          <div className="flex items-center p-3 bg-navy/5 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-navy">Credentialing workflow updated</span>
            <span className="text-navy/50 text-sm ml-auto">4 hours ago</span>
          </div>
          <div className="flex items-center p-3 bg-navy/5 rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
            <span className="text-navy">License verification pending</span>
            <span className="text-navy/50 text-sm ml-auto">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};