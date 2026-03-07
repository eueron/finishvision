'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { aiApi, sheetsApi } from '@/lib/api';

interface AiJob {
  id: string;
  sheetId: string;
  status: string;
  processingMs?: number;
  createdAt: string;
  completedAt?: string;
  ocrMetadata?: any;
  sheet?: { id: string; sheetName: string; pageNumber: number };
  _count?: { detections: number };
}

interface Detection {
  id: string;
  type: string;
  label: string;
  confidence: number;
  status: string;
  boundingBox: any;
  metadata?: any;
  reviewedAt?: string;
  category?: { id: string; name: string; color: string };
  sheet?: { id: string; sheetName: string; pageNumber: number };
}

interface DetectionSummary {
  totalDetections: number;
  pendingReview: number;
  accepted: number;
  rejected: number;
  byType: {
    type: string;
    label: string;
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    avgConfidence: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  MODIFIED: 'bg-blue-100 text-blue-800',
  QUEUED: 'bg-gray-100 text-gray-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const TYPE_LABELS: Record<string, string> = {
  DOOR_SINGLE: 'Single Door',
  DOOR_DOUBLE: 'Double Door',
  DOOR_SLIDING: 'Sliding Door',
  DOOR_POCKET: 'Pocket Door',
  DOOR_BIFOLD: 'Bifold Door',
  DOOR_METAL: 'Metal Door',
  WINDOW: 'Window',
  CLOSET: 'Closet',
  CABINET_RUN: 'Cabinet Run',
  ROOM_LABEL: 'Room Label',
  DIMENSION: 'Dimension',
  SCHEDULE_ENTRY: 'Schedule Entry',
  SYMBOL_OTHER: 'Other Symbol',
};

export default function AiDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [summary, setSummary] = useState<DetectionSummary | null>(null);
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [sumRes, jobsRes, detsRes] = await Promise.all([
        aiApi.getDetectionSummary(projectId),
        aiApi.getJobsByProject(projectId),
        aiApi.getDetectionsByProject(projectId, filter === 'ALL' ? undefined : filter),
      ]);
      setSummary((sumRes as any).data);
      setJobs((jobsRes as any).data || []);
      setDetections((detsRes as any).data || []);
    } catch (err) {
      console.error('Failed to load AI data:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReview = async (detectionId: string, status: string) => {
    try {
      await aiApi.reviewDetection(detectionId, { status });
      fetchData();
    } catch (err) {
      console.error('Review failed:', err);
    }
  };

  const handleBulkReview = async (status: string) => {
    if (selectedIds.size === 0) return;
    try {
      await aiApi.bulkReview({ detectionIds: Array.from(selectedIds), status });
      setSelectedIds(new Set());
      fetchData();
    } catch (err) {
      console.error('Bulk review failed:', err);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const pending = detections.filter((d) => d.status === 'PENDING');
    if (selectedIds.size === pending.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map((d) => d.id)));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push(`/dashboard/projects/${projectId}`)} className="text-sm text-gray-500 hover:text-gray-700 mb-1">
            &larr; Back to Project
          </button>
          <h1 className="text-2xl font-bold text-gray-900">AI Detection Dashboard</h1>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Total Detections</p>
            <p className="text-3xl font-bold text-gray-900">{summary.totalDetections}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-600">{summary.pendingReview}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Accepted</p>
            <p className="text-3xl font-bold text-green-600">{summary.accepted}</p>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Rejected</p>
            <p className="text-3xl font-bold text-red-600">{summary.rejected}</p>
          </div>
        </div>
      )}

      {/* Detection Summary by Type */}
      {summary && summary.byType.length > 0 && (
        <div className="bg-white rounded-lg border mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Detections by Type</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="p-3">Type</th>
                <th className="p-3 text-center">Total</th>
                <th className="p-3 text-center">Pending</th>
                <th className="p-3 text-center">Accepted</th>
                <th className="p-3 text-center">Rejected</th>
                <th className="p-3 text-center">Avg Confidence</th>
              </tr>
            </thead>
            <tbody>
              {summary.byType.map((row) => (
                <tr key={row.type} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3 font-medium">{TYPE_LABELS[row.type] || row.type}</td>
                  <td className="p-3 text-center">{row.total}</td>
                  <td className="p-3 text-center">
                    {row.pending > 0 && <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">{row.pending}</span>}
                  </td>
                  <td className="p-3 text-center">
                    {row.accepted > 0 && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">{row.accepted}</span>}
                  </td>
                  <td className="p-3 text-center">
                    {row.rejected > 0 && <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">{row.rejected}</span>}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs font-medium ${row.avgConfidence >= 0.8 ? 'text-green-600' : row.avgConfidence >= 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {(row.avgConfidence * 100).toFixed(0)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AI Jobs */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-lg border mb-6">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Analysis Jobs</h2>
          </div>
          <div className="divide-y">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium text-sm">
                    {job.sheet?.sheetName || `Sheet ${job.sheet?.pageNumber || '?'}`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(job.createdAt).toLocaleString()}
                    {job.processingMs && ` - ${(job.processingMs / 1000).toFixed(1)}s`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">{job._count?.detections || 0} detections</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[job.status] || 'bg-gray-100'}`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detections List */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">All Detections</h2>
          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="MODIFIED">Modified</option>
            </select>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{selectedIds.size} selected</span>
                <button
                  onClick={() => handleBulkReview('ACCEPTED')}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Accept All
                </button>
                <button
                  onClick={() => handleBulkReview('REJECTED')}
                  className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Reject All
                </button>
              </div>
            )}
          </div>
        </div>

        {detections.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No AI detections yet</p>
            <p className="text-sm">Upload blueprints and run AI analysis to detect construction elements.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="p-3 w-8">
                  <input type="checkbox" onChange={selectAll} checked={selectedIds.size > 0 && selectedIds.size === detections.filter((d) => d.status === 'PENDING').length} />
                </th>
                <th className="p-3">Type</th>
                <th className="p-3">Label</th>
                <th className="p-3">Sheet</th>
                <th className="p-3 text-center">Confidence</th>
                <th className="p-3 text-center">Category</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {detections.map((det) => (
                <tr key={det.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-3">
                    {det.status === 'PENDING' && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(det.id)}
                        onChange={() => toggleSelect(det.id)}
                      />
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-medium bg-gray-100 px-2 py-0.5 rounded">
                      {TYPE_LABELS[det.type] || det.type}
                    </span>
                  </td>
                  <td className="p-3 text-sm font-medium">{det.label}</td>
                  <td className="p-3 text-sm text-gray-500">
                    {det.sheet?.sheetName || `Page ${det.sheet?.pageNumber || '?'}`}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${Number(det.confidence) >= 0.8 ? 'bg-green-500' : Number(det.confidence) >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${Number(det.confidence) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs">{(Number(det.confidence) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {det.category ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ backgroundColor: det.category.color + '20', color: det.category.color }}
                      >
                        {det.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[det.status] || 'bg-gray-100'}`}>
                      {det.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {det.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleReview(det.id, 'ACCEPTED')}
                          className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleReview(det.id, 'REJECTED')}
                          className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
