import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Dashboard } from './components/Dashboard';
import { ProvidersPage } from './components/ProvidersPage';
import { LocationsPage } from './components/LocationsPage';
import { PayersPage } from './components/PayersPage';
import { WorkflowsPage } from './components/WorkflowsPage';
import { SubflowsPage } from './components/SubflowsPage';
import { TasksPage } from './components/TasksPage';
import { AdminSettingsPage } from './components/AdminSettingsPage';
import { Sidebar } from './components/Sidebar';
import { WorkflowEngine } from './components/WorkflowEngine';
import { DatabaseService } from './lib/supabase';
import { initLocalDatabase, seedLocalDatabase } from './lib/localdb';
import Diagnostics from './components/Diagnostics';
import { DarkModeToggle } from './components/DarkModeToggle';
import { useProviders } from './hooks/useDatabase';

function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [pageFilter, setPageFilter] = React.useState<{ type: string; value: string } | null>(null);
  const [isOnline] = React.useState(DatabaseService.isConfigured());
  const [dbInitialized, setDbInitialized] = React.useState(false);
  const { providers } = useProviders();

  React.useEffect(() => {
    const initDB = async () => {
      if (import.meta.env.VITE_USE_LOCAL_DB === 'true') {
        await initLocalDatabase();
        await seedLocalDatabase();
        console.log('Local database initialized and seeded');
      }
      setDbInitialized(true);
    };
    initDB();
  }, []);

  const handlePageChange = (page: string, filter?: { type: string; value: string }) => {
    setCurrentPage(page);
    setPageFilter(filter || null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'providers':
        return <ProvidersPage initialFilter={pageFilter} />;
      case 'locations':
        return <LocationsPage initialFilter={pageFilter} />;
      case 'payers':
        return <PayersPage initialFilter={pageFilter} />;
      case 'workflows':
        return <WorkflowsPage initialFilter={pageFilter} />;
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