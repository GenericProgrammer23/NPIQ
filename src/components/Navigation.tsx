import React from 'react';
import { Home, Users, MapPin, Workflow, CheckSquare, Wifi, WifiOff } from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  isOnline: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, isOnline }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'providers', label: 'Providers', icon: Users },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'workflows', label: 'Workflows', icon: Workflow },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-navy border-b border-navy-light z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-cream">NPIQ</h1>
              <div className="ml-3 flex items-center">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-dark-cyan" />
                ) : (
                  <WifiOff className="h-4 w-4 text-goldenrod" />
                )}
              </div>
            </div>
            
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentPage === item.id
                      ? 'bg-dark-cyan text-white'
                      : 'text-cream/80 hover:text-cream hover:bg-navy-light'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};