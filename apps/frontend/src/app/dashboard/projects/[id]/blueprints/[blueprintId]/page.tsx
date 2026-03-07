'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { blueprintsApi, sheetsApi } from '@/lib/api';

interface Sheet {
  id: string;
  pageNumber: number;
  sheetName: string | null;
  sheetType: string;
  thumbnailPath: string | null;
  imagePath: string | null;
  width: number | null;
  height: number | null;
  scaleText: string | null;
  scaleFactor: number | null;
}

interface BlueprintDetail {
  id: string;
  originalName: string;
  fileSize: number;
  status: string;
  pageCount: number;
  sheets: Sheet[];
}

const SHEET_TYPES = [
  { value: 'FLOOR_PLAN', label: 'Floor Plan' },
  { value: 'DOOR_SCHEDULE', label: 'Door Schedule' },
  { value: 'WINDOW_SCHEDULE', label: 'Window Schedule' },
  { value: 'ELEVATION', label: 'Elevation' },
  { value: 'DETAIL', label: 'Detail' },
  { value: 'COVER', label: 'Cover' },
  { value: 'OTHER', label: 'Other' },
];

const sheetTypeColors: Record<string, string> = {
  FLOOR_PLAN: 'bg-blue-100 text-blue-800',
  DOOR_SCHEDULE: 'bg-amber-100 text-amber-800',
  WINDOW_SCHEDULE: 'bg-cyan-100 text-cyan-800',
  ELEVATION: 'bg-purple-100 text-purple-800',
  DETAIL: 'bg-pink-100 text-pink-800',
  COVER: 'bg-gray-100 text-gray-800',
  OTHER: 'bg-gray-100 text-gray-600',
};

export default function BlueprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const blueprintId = params.blueprintId as string;

  const [blueprint, setBlueprint] = useState<BlueprintDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSheet, setEditingSheet] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ sheetName: string; sheetType: string }>({ sheetName: '', sheetType: '' });

  const fetchBlueprint = useCallback(async () => {
    try {
      const res: any = await blueprintsApi.getOne(projectId, blueprintId);
      setBlueprint(res.data);
    } catch (err) {
      console.error('Failed to fetch blueprint', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, blueprintId]);

  useEffect(() => {
    fetchBlueprint();
  }, [fetchBlueprint]);

  const handleEditSheet = (sheet: Sheet) => {
    setEditingSheet(sheet.id);
    setEditValues({
      sheetName: sheet.sheetName || '',
      sheetType: sheet.sheetType || 'OTHER',
    });
  };

  const handleSaveSheet = async (sheetId: string) => {
    try {
      await sheetsApi.update(sheetId, editValues);
      setEditingSheet(null);
      fetchBlueprint();
    } catch (err) {
      console.error('Failed to update sheet', err);
    }
  };

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const getImageUrl = (storagePath: string | null) => {
    if (!storagePath) return null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('fv_token') : '';
    return `${apiBase}/storage/files/${encodeURIComponent(storagePath)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Blueprint not found</h2>
        <button onClick={() => router.back()} className="btn-primary mt-4">Go Back</button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => router.push(`/dashboard/projects/${projectId}/blueprints`)}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blueprints
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{blueprint.originalName}</h1>
          <p className="text-gray-500 mt-1">{blueprint.pageCount} pages — {blueprint.sheets.length} sheets</p>
        </div>
      </div>

      {/* Sheets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {blueprint.sheets.map((sheet) => {
          const isEditing = editingSheet === sheet.id;
          const thumbUrl = getImageUrl(sheet.thumbnailPath);
          const typeColor = sheetTypeColors[sheet.sheetType] || sheetTypeColors.OTHER;

          return (
            <div key={sheet.id} className="card overflow-hidden group">
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={sheet.sheetName || `Page ${sheet.pageNumber}`}
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                {/* Page number overlay */}
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-0.5 rounded">
                  Page {sheet.pageNumber}
                </div>
                {/* Type badge */}
                <div className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded ${typeColor}`}>
                  {SHEET_TYPES.find((t) => t.value === sheet.sheetType)?.label || sheet.sheetType}
                </div>
              </div>

              {/* Sheet Info */}
              <div className="p-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      value={editValues.sheetName}
                      onChange={(e) => setEditValues({ ...editValues, sheetName: e.target.value })}
                      className="input-field text-sm"
                      placeholder="Sheet name"
                    />
                    <select
                      value={editValues.sheetType}
                      onChange={(e) => setEditValues({ ...editValues, sheetType: e.target.value })}
                      className="input-field text-sm"
                    >
                      {SHEET_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveSheet(sheet.id)} className="btn-primary text-xs py-1">Save</button>
                      <button onClick={() => setEditingSheet(null)} className="btn-secondary text-xs py-1">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {sheet.sheetName || `Sheet ${sheet.pageNumber}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      {sheet.width && sheet.height && <span>{sheet.width}x{sheet.height}</span>}
                      {sheet.scaleText && <span>{sheet.scaleText}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => handleEditSheet(sheet)}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/viewer/${sheet.id}`)}
                        className="text-xs text-green-600 hover:text-green-700 font-medium"
                      >
                        Open in Viewer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
