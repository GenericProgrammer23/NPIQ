import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface DocumentUploadProps {
  providerId: string;
  organizationId: string;
  onUploadComplete?: () => void;
  categories?: string[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  providerId,
  organizationId,
  onUploadComplete,
  categories = []
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('Other');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCategories = [
    'License',
    'Certification',
    'Insurance',
    'Identification',
    'Education',
    'References',
    'Background Check',
    'Immunization',
    'Other'
  ];

  const availableCategories = categories.length > 0 ? categories : defaultCategories;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size must be less than 10MB');
        setUploadStatus('error');
        return;
      }
      setSelectedFile(file);
      setUploadStatus('idle');
      setErrorMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadStatus('idle');
    setErrorMessage('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure user is in org_members before uploading
      const { error: orgMemberError1 } = await supabase.rpc('ensure_user_in_org_members');
      if (orgMemberError1) {
      }

      // Also try auto_add_user_to_provider_org as fallback
      const { error: orgMemberError2 } = await supabase.rpc('auto_add_user_to_provider_org');
      if (orgMemberError2) {
      }

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${selectedFile.name}`;
      const filePath = `${organizationId}/${providerId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('provider-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { error: dbError } = await supabase
        .from('provider_documents')
        .insert({
          provider_id: providerId,
          organization_id: organizationId,
          file_name: selectedFile.name,
          file_path: filePath,
          file_size: selectedFile.size,
          file_type: selectedFile.type,
          category: category,
          description: description,
          expiry_date: expiryDate || null,
          uploaded_by: user.id
        });

      if (dbError) {
        await supabase.storage
          .from('provider-documents')
          .remove([filePath]);
        throw dbError;
      }

      setUploadStatus('success');
      setSelectedFile(null);
      setDescription('');
      setExpiryDate('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => {
        setUploadStatus('idle');
        if (onUploadComplete) {
          onUploadComplete();
        }
      }, 2000);

    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to upload document');
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-600" />
        Upload Document
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Choose File
            </label>
            {selectedFile && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{selectedFile.name}</span>
                <span className="text-gray-400">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add any notes about this document..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date (Optional)
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {uploadStatus === 'success' && (
          <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            Document uploaded successfully!
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload Document
            </>
          )}
        </button>
      </div>
    </div>
  );
};