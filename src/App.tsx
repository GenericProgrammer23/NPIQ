import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Dashboard } from './components/Dashboard';
import { ProvidersPage } from './components/ProvidersPage';
import { LocationsPage } from './components/LocationsPage';
import { WorkflowsPage } from './components/WorkflowsPage';
import { TasksPage } from './components/TasksPage';
import { Sidebar } from './components/Sidebar';
import { DatabaseService } from './lib/supabase';
import Diagnostics from './components/Diagnostics';
import { DarkModeToggle } from './components/DarkModeToggle';

function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [isOnline] = React.useState(DatabaseService.isConfigured());

  const renderPage = () => {
    switch (currentPage) {
      case 'providers':
        return <ProvidersPage />;
      case 'locations':
        return <LocationsPage />;
      case 'workflows':
        return <WorkflowsPage />;
      case 'tasks':
        return <TasksPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <AuthWrapper>
        <div className="min-h-screen bg-cream dark:bg-gray-900 transition-colors">
          <Sidebar 
            currentPage={currentPage} 
            onPageChange={setCurrentPage}
            isOnline={isOnline}
          />
          <main className="ml-64 transition-all">
            {renderPage()}
          </main>
          <DarkModeToggle />
          <Diagnostics />
        </div>
      </AuthWrapper>
    </ThemeProvider>
  );
}

export default App;