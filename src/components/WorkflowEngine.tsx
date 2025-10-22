import React, { useEffect } from 'react';
import { DatabaseService } from '../lib/supabase';

interface WorkflowEngineProps {
  providers: any[];
}

export const WorkflowEngine: React.FC<WorkflowEngineProps> = ({ providers }) => {
  
  useEffect(() => {
    // Check for workflow triggers when providers change
    checkWorkflowTriggers();
  }, [providers]);

  const checkWorkflowTriggers = async () => {
    for (const provider of providers) {
      await checkNewProviderWorkflow(provider);
      await checkIncompleteDataWorkflow(provider);
    }
  };

  const checkNewProviderWorkflow = async (provider: any) => {
    // Check if this is a new provider (created recently)
    const createdAt = new Date(provider.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation <= 24) { // New provider within 24 hours
      await createNewProviderWorkflow(provider);
    }
  };

  const checkIncompleteDataWorkflow = async (provider: any) => {
    const missingFields = [];

    // Check required fields
    if (!provider.email) missingFields.push('email');
    if (!provider.phone) missingFields.push('phone');
    if (!provider.specialty) missingFields.push('specialty');
    if (!provider.license_number) missingFields.push('license_number');
    if (!provider.license_expiry) missingFields.push('license_expiry');

    if (missingFields.length > 0) {
      await createIncompleteDataTasks(provider, missingFields);
    } else {
      // All required fields are present, auto-complete any pending "Obtain Provider Information" tasks
      await autoCompleteProviderInfoTask(provider);
    }
  };

  const createNewProviderWorkflow = async (provider: any) => {
    try {
      // Check if workflow already exists for this provider
      const existingWorkflows = await DatabaseService.getWorkflows();
      const hasExistingWorkflow = existingWorkflows.some(w => 
        w.name.includes(`New Provider: ${provider.first_name} ${provider.last_name}`)
      );

      if (hasExistingWorkflow) return;

      // Create new provider workflow
      const workflow = await DatabaseService.createWorkflow({
        name: `New Provider: ${provider.first_name} ${provider.last_name}`,
        description: `Onboarding workflow for new provider ${provider.first_name} ${provider.last_name}`,
        type: 'credentialing',
        status: 'active',
        steps: [
          { name: 'Collect Provider Information', status: 'pending' },
          { name: 'Verify Credentials', status: 'pending' },
          { name: 'Background Check', status: 'pending' },
          { name: 'License Verification', status: 'pending' },
          { name: 'Final Approval', status: 'pending' }
        ],
        organization_id: provider.organization_id
      });

      // Create initial tasks
      await DatabaseService.createTask({
        workflow_id: workflow.id,
        provider_id: provider.id,
        title: 'Welcome New Provider',
        description: `Send welcome package to ${provider.first_name} ${provider.last_name}`,
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Due in 24 hours
      });

      await DatabaseService.createTask({
        workflow_id: workflow.id,
        provider_id: provider.id,
        title: 'Initial Document Collection',
        description: 'Collect required documents from new provider',
        status: 'pending',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // Due in 3 days
      });

    } catch (error) {
      console.error('Failed to create new provider workflow:', error);
    }
  };

  const createIncompleteDataTasks = async (provider: any, missingFields: string[]) => {
    try {
      // Check if tasks already exist for missing data
      const existingTasks = await DatabaseService.getTasks({ providerId: provider.id });
      const hasDataCollectionTask = existingTasks.some(t =>
        t.title.includes('Obtain Provider Information')
      );

      if (hasDataCollectionTask) return;

      const fieldLabels: { [key: string]: string } = {
        email: 'Email Address',
        phone: 'Phone Number',
        specialty: 'Medical Specialty',
        license_number: 'License Number',
        license_expiry: 'License Expiry Date'
      };

      const missingFieldsList = missingFields.map(field => fieldLabels[field]).join(', ');

      await DatabaseService.createTask({
        provider_id: provider.id,
        title: 'Obtain Provider Information',
        description: `Missing required information for ${provider.first_name} ${provider.last_name}: ${missingFieldsList}`,
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Due in 7 days
      });

    } catch (error) {
      console.error('Failed to create incomplete data tasks:', error);
    }
  };

  const autoCompleteProviderInfoTask = async (provider: any) => {
    try {
      // Find any pending "Obtain Provider Information" tasks for this provider
      const existingTasks = await DatabaseService.getTasks({ providerId: provider.id });
      const dataCollectionTasks = existingTasks.filter(t =>
        t.title.includes('Obtain Provider Information') &&
        (t.status === 'pending' || t.status === 'in_progress')
      );

      // Auto-complete these tasks since all required information is now present
      for (const task of dataCollectionTasks) {
        await DatabaseService.updateTask(task.id, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          description: `${task.description}\n\nAuto-completed: All required provider information has been obtained.`
        });
        console.log(`Auto-completed task: ${task.title} for provider ${provider.first_name} ${provider.last_name}`);
      }

    } catch (error) {
      console.error('Failed to auto-complete provider info task:', error);
    }
  };

  // Future feature: Provider change workflows
  // Commented out until we implement provider change detection
  // const createProviderChangeWorkflow = async (provider: any, changeType: 'name' | 'location') => {
  //   try {
  //     const workflowName = changeType === 'name'
  //       ? `Provider Name Change: ${provider.first_name} ${provider.last_name}`
  //       : `Provider Location Change: ${provider.first_name} ${provider.last_name}`;

  //     const workflow = await DatabaseService.createWorkflow({
  //       name: workflowName,
  //       description: `Handle ${changeType} change for provider ${provider.first_name} ${provider.last_name}`,
  //       type: 'compliance',
  //       status: 'active',
  //       steps: [
  //         { name: 'Document Change Request', status: 'pending' },
  //         { name: 'Update Records', status: 'pending' },
  //         { name: 'Notify Stakeholders', status: 'pending' },
  //         { name: 'Verify Compliance', status: 'pending' }
  //       ],
  //       organization_id: provider.organization_id
  //     });

  //     await DatabaseService.createTask({
  //       workflow_id: workflow.id,
  //       provider_id: provider.id,
  //       title: `Process ${changeType === 'name' ? 'Name' : 'Location'} Change`,
  //       description: `Update all systems and documentation for provider ${changeType} change`,
  //       status: 'pending',
  //       priority: 'medium',
  //       due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // Due in 5 days
  //     });

  //   } catch (error) {
  //     console.error(`Failed to create ${changeType} change workflow:`, error);
  //   }
  // };

  // This component doesn't render anything visible
  return null;
};