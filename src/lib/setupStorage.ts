import { supabase } from './supabase';

export async function setupDocumentStorage() {
  try {
    // First ensure user is in org_members
    const { error: orgMemberError } = await supabase.rpc('ensure_user_in_org_members');

    if (orgMemberError) {
      console.error('Error ensuring user in org_members:', orgMemberError);
    }

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, error: listError.message };
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'provider-documents');

    if (bucketExists) {
      console.log('Storage bucket "provider-documents" already exists');
      return { success: true, message: 'Bucket already exists' };
    }

    // Storage bucket creation requires admin/service role permissions
    // Return instructions instead
    return {
      success: false,
      error: 'Storage bucket must be created manually. Please follow the instructions in the admin panel.',
      requiresManualSetup: true
    };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

export async function initializeDocumentCategories(organizationId: string) {
  try {
    const { data, error } = await supabase.rpc('initialize_document_categories', {
      org_id: organizationId
    });

    if (error) {
      console.error('Error initializing document categories:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully initialized document categories');
    return { success: true, message: 'Categories initialized' };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
}