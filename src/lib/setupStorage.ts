import { supabase } from './supabase';

export async function setupDocumentStorage() {
  try {
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

    const { data, error } = await supabase.storage.createBucket('provider-documents', {
      public: false,
      fileSizeLimit: 10485760,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ]
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return { success: false, error: error.message };
    }

    console.log('Successfully created storage bucket "provider-documents"');
    return { success: true, message: 'Bucket created successfully' };
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