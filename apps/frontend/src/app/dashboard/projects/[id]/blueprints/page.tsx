'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { blueprintsApi } from '@/lib/api';

interface Blueprint {
  id: string;
  originalName: string;
  fileSize: number;
  status: string;
  pageCount: number;
  errorMessage?: string;
  createdAt: string;
  _count?: { sheets: number };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  UPLOADING: { label: 'Uploading', color: 'bg-blue-100 text-blue-800', icon: '⬆' },
  PROCESSING: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800', icon: '⏳' },
  READY: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: '✓' },
  ERROR: { label: 'Error', color: 'bg-red-100 text-red-800', icon: '✕' },
};

export default function BlueprintsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const fetchBlueprints = useCallback(async () => {
    try {
      const res: any = await blueprintsApi.getAll(projectId);
      setBlueprints(res.data);
    } catch (err) {
      console.error('Failed to fetch blueprints', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchBlueprints();
    // Poll for status updates while any blueprint is processing
    const interval = setInterval(() => {
      fetchBlueprints();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchBlueprints]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are accepted');
        continue;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert('File size exceeds 100MB limit');
        continue;
      }

      setUploading(true);
      setUploadProgress(0);
      try {
        await blueprintsApi.upload(projectId, file, (pct) => setUploadProgress(pct));
        fetchBlueprints();
      } catch (err) {
        console.error('Upload failed', err);
        alert('Upload failed. Please try again.');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleDelete = async (blueprintId: string, name: string) => {
    if (!confirm(`Delete "${name}" and all its sheets?`)) return;
    try {
      await blueprintsApi.delete(projectId, blueprintId);
      fetchBlueprints();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Project
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Blueprints</h1>
          <p className="text-gray-500 mt-1">{blueprints.length} blueprint{blueprints.length !== 1 ? 's' : ''} uploaded</p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors ${
          dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-brand-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700">Uploading... {uploadProgress}%</p>
            <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
              <div className="bg-brand-600 h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Drag and drop PDF blueprints here</p>
              <p className="text-xs text-gray-500 mt-1">or click to browse (max 100MB per file)</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
            >
              Select Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
        )}
      </div>

      {/* Blueprint List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      ) : blueprints.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No blueprints uploaded yet</p>
          <p className="text-sm mt-1">Upload a PDF to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {blueprints.map((bp) => {
            const status = statusConfig[bp.status] || statusConfig.ERROR;
            return (
              <div
                key={bp.id}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  if (bp.status === 'READY') {
                    router.push(`/dashboard/projects/${projectId}/blueprints/${bp.id}`);
                  }
                }}
              >
                {/* PDF Icon */}
                <div className="w-12 h-14 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z" />
                    <path d="M8 14h2v1H9v1h1v1H8v-3zm3 0h1.5c.28 0 .5.22.5.5v2c0 .28-.22.5-.5.5H11v-3zm1 2.5V14.5h-.5v2h.5zM14 14h2v.5h-1.5v.5H16v.5h-1.5v1.5H14v-3z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{bp.originalName}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{formatFileSize(bp.fileSize)}</span>
                    <span>{bp.pageCount} page{bp.pageCount !== 1 ? 's' : ''}</span>
                    <span>{bp._count?.sheets || 0} sheet{(bp._count?.sheets || 0) !== 1 ? 's' : ''}</span>
                    <span>{new Date(bp.createdAt).toLocaleDateString()}</span>
                  </div>
                  {bp.errorMessage && (
                    <p className="text-xs text-red-500 mt-1">{bp.errorMessage}</p>
                  )}
                </div>

                {/* Status Badge */}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                  {status.icon} {status.label}
                </span>

                {/* Actions */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(bp.id, bp.originalName); }}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete blueprint"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
