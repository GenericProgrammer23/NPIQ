import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Dashboard } from './components/Dashboard';
import { GuidePage } from './components/GuidePage';
import { ProvidersPage } from './components/ProvidersPage';
import { LocationsPage } from './components/LocationsPage';
import { PayersPage } from './components/PayersPage';
import { WorkflowsPage } from './components/WorkflowsPage';
import { SubflowsPage } from './components/SubflowsPage';
import { TasksPage } from './components/TasksPage';
import { AdminSettingsPage } from './components/AdminSettingsPage';
import { Sidebar } from './components/Sidebar';
import { WorkflowEngine } from './components/WorkflowEngine';
import { WorkflowDesignerPage } from './components/workflow/WorkflowDesignerPage';
import { DatabaseService } from './lib/supabase';
import Diagnostics from './components/Diagnostics';
import { DarkModeToggle } from './components/DarkModeToggle';
import { useProviders } from './hooks/useDatabase';

function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [pageFilter, setPageFilter] = React.useState<{ type: string; value: string; mode?: string } | null>(null);
  const [isOnline] = React.useState(DatabaseService.isConfigured());
  const { providers } = useProviders();

  const handlePageChange = (page: string, filter?: { type: string; value: string; mode?: string }) => {
    setCurrentPage(page);
    setPageFilter(filter || null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'guide':
        return <GuidePage />;
      case 'providers':
        return <ProvidersPage initialFilter={pageFilter} />;
      case 'locations':
        return <LocationsPage initialFilter={pageFilter} />;
      case 'payers':
        return <PayersPage initialFilter={pageFilter} onNavigate={handlePageChange} />;
      case 'workflows':
        return <WorkflowsPage initialFilter={pageFilter} />;
      case 'workflow-designer':
        return (
          <WorkflowDesignerPage
            payerId={pageFilter?.value}
            mode={pageFilter?.mode as 'view' | 'edit'}
            onBack={() => handlePageChange('payers')}
          />
        );
      case 'subflows':
        return <SubflowsPage initialFilter={pageFilter} />;
      case 'tasks':
        return <TasksPage initialFilter={pageFilter} />;
      case 'admin':
        return <AdminSettingsPage />;
      default:
        return <Dashboard onPageChange={handlePageChange} />;
    }
  };

  return (
    <ThemeProvider>
      <AuthWrapper>
        <div className="min-h-screen bg-cream dark:bg-gray-900 transition-colors">
          <Sidebar 
            currentPage={currentPage} 
            onPageChange={(page) => handlePageChange(page)}
            isOnline={isOnline}
          />
          <main className="ml-64 transition-all">
            {renderPage()}
          </main>
          <WorkflowEngine providers={providers} />
          <DarkModeToggle />
          <Diagnostics />
        </div>
      </AuthWrapper>
    </ThemeProvider>
  );
}

export default App;