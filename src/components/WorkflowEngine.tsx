import React, { useEffect, useRef } from 'react';
import { DatabaseService } from '../lib/supabase';

interface WorkflowEngineProps {
  providers: any[];
}

export const WorkflowEngine: React.FC<WorkflowEngineProps> = ({ providers }) => {
  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current) return;

    processingRef.current = true;
    checkWorkflowTriggers().finally(() => {
      processingRef.current = false;
    });
  }, [providers]);

  const checkWorkflowTriggers = async () => {
    for (const provider of providers) {
      await checkNewProviderWorkflow(provider);
      await checkIncompleteDataWorkflow(provider);
    }
  };

  const checkNewProviderWorkflow = async (provider: any) => {
    const createdAt = new Date(provider.created_at);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation <= 24) {
      try {
        const existingInstances = await DatabaseService.getWorkflowInstances({
          entityType: 'provider',
          entityId: provider.id
        });

        if (existingInstances.length > 0) return;

        const workflowTemplates = await DatabaseService.getWorkflows(provider.organization_id, true);
        const newProviderTemplate = workflowTemplates.find(t =>
          t.name.toLowerCase().includes('new provider') ||
          t.name.toLowerCase().includes('onboarding')
        );

        if (newProviderTemplate) {
          await DatabaseService.instantiateWorkflow(
            newProviderTemplate.id,
            'provider',
            provider.id
          );
          console.log(`Created workflow instance for new provider: ${provider.first_name} ${provider.last_name}`);
        }
      } catch (error) {
        console.error('Failed to create new provider workflow instance:', error);
      }
    }
  };

  const checkIncompleteDataWorkflow = async (provider: any) => {
    const missingFields = [];

    if (!provider.email) missingFields.push('email');
    if (!provider.phone) missingFields.push('phone');
    if (!provider.specialty) missingFields.push('specialty');
    if (!provider.license_number) missingFields.push('license_number');
    if (!provider.license_expiry) missingFields.push('license_expiry');

    if (missingFields.length > 0) {
      await createIncompleteDataTasks(provider, missingFields);
    } else {
      await autoCompleteProviderInfoTask(provider);
    }
  };

  const createIncompleteDataTasks = async (provider: any, missingFields: string[]) => {
    try {
      const fieldLabels: { [key: string]: string } = {
        email: 'Email Address',
        phone: 'Phone Number',
        specialty: 'Medical Specialty',
        license_number: 'License Number',
        license_expiry: 'License Expiry Date'
      };

      const missingFieldsList = missingFields.map(field => fieldLabels[field]).join(', ');
      const newDescription = `Missing required information for ${provider.first_name} ${provider.last_name}: ${missingFieldsList}`;

      const existingTasks = await DatabaseService.getTasks({ providerId: provider.id });
      const existingTask = existingTasks.find(t =>
        t.title === 'Obtain Provider Information' &&
        (t.status === 'pending' || t.status === 'in_progress')
      );

      if (existingTask) {
        if (existingTask.description !== newDescription) {
          await DatabaseService.updateTask(existingTask.id, {
            description: newDescription
          });
          console.log(`Updated task for provider ${provider.first_name} ${provider.last_name} with current missing fields`);
        }
        return;
      }

      await DatabaseService.createTask({
        provider_id: provider.id,
        title: 'Obtain Provider Information',
        description: newDescription,
        status: 'pending',
        priority: 'medium',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    } catch (error) {
      console.error('Failed to create or update incomplete data tasks:', error);
    }
  };

  const autoCompleteProviderInfoTask = async (provider: any) => {
    try {
      const existingTasks = await DatabaseService.getTasks({ providerId: provider.id });
      const dataCollectionTasks = existingTasks.filter(t =>
        t.title.includes('Obtain Provider Information') &&
        (t.status === 'pending' || t.status === 'in_progress')
      );

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

  return null;
};
