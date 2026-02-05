import { supabase } from './supabase';

export async function setupDocumentStorage() {
  try {
    // First ensure user is in org_members
    const { error: orgMemberError } = await supabase.rpc('ensure_user_in_org_members');

    if (orgMemberError) {
    }

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      return { success: false, error: listError.message };
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'provider-documents');

    if (bucketExists) {
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
    return { success: false, error: error.message };
  }
}

export async function initializeDocumentCategories(organizationId: string) {
  try {
    const { data, error } = await supabase.rpc('initialize_document_categories', {
      org_id: organizationId
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: 'Categories initialized' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}