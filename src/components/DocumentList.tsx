import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, Trash2, Calendar, AlertTriangle } from 'lucide-react';

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  category: string;
  description: string;
  expiry_date: string | null;
  created_at: string;
  uploaded_by: string;
}

interface DocumentListProps {
  providerId: string;
  organizationId: string;
  refreshTrigger?: number;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  providerId,
  organizationId,
  refreshTrigger = 0
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    loadDocuments();
    loadUserRole();
  }, [providerId, refreshTrigger]);

  const loadUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('org_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (data) {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('provider_documents')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      const { data, error } = await supabase.storage
        .from('provider-documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document');
    }
  };

  const deleteDocument = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.file_name}"?`)) {
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from('provider_documents')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from('provider-documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
      }

      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const isExpiringSoon = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  };

  const isExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
        <p>No documents uploaded yet</p>
      </div>
    );
  }

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedDocs).map(([category, docs]) => (
        <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="font-medium text-gray-700">{category}</h4>
          </div>
          <div className="divide-y divide-gray-200">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  isExpired(doc.expiry_date) ? 'bg-red-50' :
                  isExpiringSoon(doc.expiry_date) ? 'bg-yellow-50' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 truncate">
                        {doc.file_name}
                      </span>
                      {isExpired(doc.expiry_date) && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Expired
                        </span>
                      )}
                      {isExpiringSoon(doc.expiry_date) && !isExpired(doc.expiry_date) && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Expiring Soon
                        </span>
                      )}
                    </div>

                    {doc.description && (
                      <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>Uploaded {formatDate(doc.created_at)}</span>
                      {doc.expiry_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Expires {formatDate(doc.expiry_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {(userRole === 'admin' || userRole === 'manager') && (
                      <button
                        onClick={() => deleteDocument(doc)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};