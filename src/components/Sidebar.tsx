import React from 'react';
import { Home, Users, MapPin, Workflow, CheckSquare, Wifi, WifiOff, Building, Settings, GitBranch, CreditCard } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, isOnline }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'providers', label: 'Providers', icon: Users },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'payers', label: 'Payers', icon: CreditCard },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'subflows', label: 'Subflows', icon: GitBranch },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'admin', label: 'Admin Settings', icon: Settings },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-sidebar-navy border-r border-navy-light dark:border-dark-cyan/30 z-40">
      <div className="p-6">
        <div className="flex items-center mb-8">
          <Building className="h-8 w-8 text-goldenrod mr-3" />
          <h1 className="text-2xl font-bold text-cream dark:text-white">NPIQ</h1>
        </div>
        
        <div className="flex items-center mb-6 p-3 bg-navy-light dark:bg-navy-light rounded-lg">
          {isOnline ? (
            <>
              <Wifi className="h-4 w-4 text-dark-cyan mr-2" />
              <span className="text-dark-cyan text-sm">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-goldenrod mr-2" />
              <span className="text-goldenrod text-sm">Local Mode</span>
            </>
          )}
        </div>
        
        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                currentPage === item.id
                  ? 'bg-dark-cyan text-white'
                  : 'text-cream/80 dark:text-cream/80 hover:text-cream dark:hover:text-white hover:bg-navy-light dark:hover:bg-navy-light'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};