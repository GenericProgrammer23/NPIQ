import React from 'react';
import { AuthWrapper } from './components/AuthWrapper';
import { Dashboard } from './components/Dashboard';
import { ProvidersPage } from './components/ProvidersPage';
import { LocationsPage } from './components/LocationsPage';
import { WorkflowsPage } from './components/WorkflowsPage';
import { TasksPage } from './components/TasksPage';
import { Navigation } from './components/Navigation';
import { DatabaseService } from './lib/supabase';
import Diagnostics from './components/Diagnostics';

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
    <AuthWrapper>
      <div className="min-h-screen bg-cream">
        <Navigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          isOnline={isOnline}
        />
        <main className="pt-16">
          {renderPage()}
        </main>
        <Diagnostics />
      </div>
    </AuthWrapper>
  );
}

export default App;