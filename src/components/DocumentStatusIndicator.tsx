import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DocumentStatusIndicatorProps {
  providerId: string;
  organizationId: string;
}

interface DocumentStatus {
  name: string;
  uploaded: boolean;
  required: boolean;
}

const REQUIRED_DOCUMENTS = [
  'Facesheet',
  'License',
  'CV',
  'Credentialing Forms',
  'Diploma',
  'SSN'
];

export const DocumentStatusIndicator: React.FC<DocumentStatusIndicatorProps> = ({
  providerId,
  organizationId
}) => {
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocumentStatus();
  }, [providerId]);

  const loadDocumentStatus = async () => {
    try {
      const { data: documents, error } = await supabase
        .from('documents')
        .select('document_type')
        .eq('entity_type', 'provider')
        .eq('entity_id', providerId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      const uploadedTypes = new Set(documents?.map(d => d.document_type) || []);

      const statuses = REQUIRED_DOCUMENTS.map(docName => ({
        name: docName,
        uploaded: uploadedTypes.has(docName),
        required: true
      }));

      setDocumentStatuses(statuses);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const completedCount = documentStatuses.filter(d => d.uploaded).length;
  const totalCount = documentStatuses.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="flex items-center gap-4">
      <div className="flex gap-1" title="Document Status">
        {documentStatuses.map((doc, index) => (
          <div
            key={index}
            className="relative group"
          >
            {doc.uploaded ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-navy dark:bg-navy-light text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
              {doc.name}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-navy dark:text-white">
          {completedCount}/{totalCount} Documents
        </div>
        {completionPercentage < 100 && (
          <AlertCircle className="w-4 h-4 text-orange-500" title="Incomplete documentation" />
        )}
      </div>
    </div>
  );
};
