# Document Upload Fix

## Issue
Provider documents cannot be uploaded. Error likely: "Bucket not found" or "RLS policy violation"

## Root Causes

### 1. Storage Bucket Not Created
The `provider-documents` bucket might not exist in your Supabase project.

### 2. Storage RLS Policies Missing
Even if the bucket exists, it needs RLS policies that match the database policies.

## Solution

### Step 1: Create Storage Bucket
Go to Supabase Dashboard → Storage → Create a new bucket:
- Name: `provider-documents`
- Public: **NO** (keep private)
- File size limit: 10 MB
- Allowed MIME types: PDF, DOC, DOCX, JPG, PNG

### Step 2: Add Storage RLS Policies

In Supabase Dashboard → Storage → provider-documents → Policies, add these:

#### Policy 1: Users can upload in their org
```sql
CREATE POLICY "Users can upload documents in their org"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'provider-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM org_members
    WHERE user_id = auth.uid()
  )
);
```

#### Policy 2: Users can view documents in their org
```sql
CREATE POLICY "Users can view documents in their org"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM org_members
    WHERE user_id = auth.uid()
  )
);
```

#### Policy 3: Users can delete documents in their org
```sql
CREATE POLICY "Users can delete documents in their org"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'provider-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM org_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);
```

### Step 3: Verify User is in org_members
Make sure your user account exists in the `org_members` table:

```sql
-- Check if you're in org_members
SELECT * FROM org_members WHERE user_id = auth.uid();

-- If not, insert yourself (replace with your org ID)
INSERT INTO org_members (user_id, organization_id, role)
VALUES (auth.uid(), 'your-organization-id', 'admin');
```

### Step 4: Test Upload
Try uploading a document again. Check browser console for specific errors.

## Alternative: Programmatic Setup

We can also add a "Setup Storage" button in the app that runs the setupDocumentStorage() function automatically.

Let me know if you need me to implement an automatic setup button!
