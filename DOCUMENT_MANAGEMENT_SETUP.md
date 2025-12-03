# Document Management System Setup Guide

This application now includes a complete document management system for provider profiles. Follow these steps to complete the setup.

## Features

- Upload documents to provider profiles
- Organize documents by category (License, Certification, Insurance, etc.)
- Track document expiry dates
- Set required documents in workflow nodes
- Secure storage with Row Level Security (RLS)

## Setup Steps

### 1. Database Migration (✅ Already Applied)

The database tables have been created:
- `provider_documents` - Stores document metadata
- `document_categories` - Stores custom document categories per organization

### 2. Create Supabase Storage Bucket

You need to create a storage bucket in your Supabase project:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Configure the bucket:
   - **Name**: `provider-documents`
   - **Public**: ❌ Off (keep private)
   - **File size limit**: 10 MB
   - **Allowed MIME types**:
     - application/pdf
     - application/msword
     - application/vnd.openxmlformats-officedocument.wordprocessingml.document
     - image/jpeg
     - image/png
     - image/jpg

5. Click **Create Bucket**

#### Option B: Programmatically (Alternative)

Run this in your browser console while logged into the app:

```javascript
import { setupDocumentStorage } from './src/lib/setupStorage';
await setupDocumentStorage();
```

### 3. Initialize Document Categories

Document categories are automatically created when an organization first accesses documents. Default categories include:
- License
- Certification
- Insurance
- Identification
- Education
- References
- Background Check
- Immunization
- Other

To manually initialize categories for an organization:

```javascript
import { initializeDocumentCategories } from './src/lib/setupStorage';
await initializeDocumentCategories('your-org-id');
```

### 4. Configure Storage Policies (Optional)

For additional security, you can add RLS policies to the storage bucket:

1. Go to **Storage** > **Policies**
2. Add policies for `provider-documents` bucket:

**SELECT Policy:**
```sql
(bucket_id = 'provider-documents'::text)
AND
EXISTS (
  SELECT 1 FROM org_members
  WHERE org_members.user_id = auth.uid()
  AND org_members.organization_id = (storage.foldername(name))[1]::uuid
)
```

**INSERT Policy:**
```sql
(bucket_id = 'provider-documents'::text)
AND
EXISTS (
  SELECT 1 FROM org_members
  WHERE org_members.user_id = auth.uid()
  AND org_members.organization_id = (storage.foldername(name))[1]::uuid
)
```

**DELETE Policy:**
```sql
(bucket_id = 'provider-documents'::text)
AND
EXISTS (
  SELECT 1 FROM org_members
  WHERE org_members.user_id = auth.uid()
  AND org_members.organization_id = (storage.foldername(name))[1]::uuid
  AND org_members.role IN ('admin', 'manager')
)
```

## Usage

### Uploading Documents

1. Open a provider's detail page
2. Click **Show Documents**
3. Select a file, choose a category, and optionally add a description and expiry date
4. Click **Upload Document**

### Document Categories in Workflows

When configuring "Wait for Profile Field" nodes in the workflow designer:

1. Select **Entity Type**: "Document Categories"
2. Choose which document categories are required
3. The workflow will pause until documents of those categories are uploaded

### Supported File Types

- PDF documents (.pdf)
- Microsoft Word (.doc, .docx)
- Images (.jpg, .jpeg, .png)

Maximum file size: 10 MB per file

### Document Expiry Tracking

- Documents with expiry dates will show warnings:
  - **Yellow warning**: Expires within 30 days
  - **Red warning**: Already expired

## Security

- All documents are stored securely in Supabase Storage
- Row Level Security (RLS) ensures users can only access documents in their organization
- Only admins and managers can delete documents
- File paths are organized by organization and provider: `{org_id}/{provider_id}/{filename}`

## Troubleshooting

### "Bucket not found" error

If you see this error when uploading:
1. Verify the bucket `provider-documents` exists in your Supabase project
2. Check that the bucket name is exactly `provider-documents` (lowercase with hyphen)
3. Ensure the bucket is not set to public

### Documents not appearing

1. Check browser console for errors
2. Verify RLS policies allow your user to SELECT from `provider_documents`
3. Ensure your user is a member of the organization

### Upload fails

1. Check file size (must be under 10 MB)
2. Verify file type is supported
3. Check Supabase Storage quotas in your dashboard

## Next Steps

- Customize document categories per organization
- Set up automated reminders for expiring documents
- Configure workflow nodes to require specific documents before proceeding
