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
import { ActionsPage } from './components/ActionsPage';
import { AdminSettingsPage } from './components/AdminSettingsPage';
import { Sidebar } from './components/Sidebar';
import { WorkflowEngine } from './components/WorkflowEngine';
import { WorkflowDesignerPage } from './components/workflow/WorkflowDesignerPage';
import { DatabaseService, supabase } from './lib/supabase';
import Diagnostics from './components/Diagnostics';
import { DarkModeToggle } from './components/DarkModeToggle';
import { useProviders } from './hooks/useDatabase';

function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const [pageFilter, setPageFilter] = React.useState<any>(null);
  const [isOnline] = React.useState(DatabaseService.isConfigured());
  const [organizationId, setOrganizationId] = React.useState<string>('');
  const { providers } = useProviders();

  React.useEffect(() => {
    const loadOrganizationId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('org_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        if (data) {
          setOrganizationId(data.organization_id);
        }
      }
    };
    loadOrganizationId();
  }, []);

  const handlePageChange = (page: string, filter?: any) => {
    setCurrentPage(page);
    setPageFilter(filter || null);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'guide':
        return <GuidePage />;
      case 'providers':
        return <ProvidersPage initialFilter={pageFilter} />;
      case 'actions':
        return <ActionsPage organizationId={organizationId} />;
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
            subflowId={pageFilter?.subflowId}
            editMode={pageFilter?.editMode as 'payer' | 'subflow'}
            mode={pageFilter?.mode as 'view' | 'edit'}
            onBack={() => handlePageChange(pageFilter?.editMode === 'subflow' ? 'subflows' : 'payers')}
          />
        );
      case 'subflows':
        return <SubflowsPage onNavigate={handlePageChange} />;
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