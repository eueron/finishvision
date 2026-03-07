'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reportsApi, estimatesApi } from '@/lib/api';

interface Report {
  id: string;
  name: string;
  type: string;
  format: string;
  fileSize: number;
  createdAt: string;
  downloadUrl?: string;
}

interface Estimate {
  id: string;
  name: string;
  status: string;
  totalAmount: string;
}

const TYPE_LABELS: Record<string, string> = {
  TAKEOFF_SUMMARY: 'Takeoff Summary',
  ESTIMATE_SUMMARY: 'Estimate Summary',
  PROPOSAL: 'Proposal',
};

const TYPE_ICONS: Record<string, string> = {
  TAKEOFF_SUMMARY: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  ESTIMATE_SUMMARY: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  PROPOSAL: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
};

const FORMAT_COLORS: Record<string, string> = {
  PDF: 'bg-red-100 text-red-700',
  CSV: 'bg-green-100 text-green-700',
  JSON: 'bg-blue-100 text-blue-700',
};

export default function ReportsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [reports, setReports] = useState<Report[]>([]);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genForm, setGenForm] = useState({
    type: 'TAKEOFF_SUMMARY' as 'TAKEOFF_SUMMARY' | 'ESTIMATE_SUMMARY' | 'PROPOSAL',
    format: 'PDF' as 'PDF' | 'CSV' | 'JSON',
    estimateId: '',
    name: '',
  });

  const fetchReports = useCallback(async () => {
    try {
      const res: any = await reportsApi.getByProject(projectId);
      const data = res.data || res;
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchEstimates = useCallback(async () => {
    try {
      const res: any = await estimatesApi.getByProject(projectId);
      const data = res.data || res;
      setEstimates(Array.isArray(data) ? data : []);
    } catch {
      setEstimates([]);
    }
  }, [projectId]);

  useEffect(() => {
    fetchReports();
    fetchEstimates();
  }, [fetchReports, fetchEstimates]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const payload: any = {
        type: genForm.type,
        format: genForm.format,
      };
      if (genForm.name.trim()) payload.name = genForm.name;
      if (genForm.estimateId) payload.estimateId = genForm.estimateId;

      await reportsApi.generate(projectId, payload);
      setShowGenModal(false);
      setGenForm({ type: 'TAKEOFF_SUMMARY', format: 'PDF', estimateId: '', name: '' });
      fetchReports();
    } catch (err: any) {
      alert(err?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report: Report) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('fv_token') : null;
    const url = reportsApi.getDownloadUrl(report.id);
    // Open in new tab with auth
    const a = document.createElement('a');
    a.href = `${url}?token=${token}`;
    a.target = '_blank';
    a.download = `${report.name}.${report.format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (id: string) => {
    try {
      await reportsApi.delete(id);
      fetchReports();
    } catch (err) {
      console.error('Failed to delete report', err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const needsEstimate = genForm.type === 'ESTIMATE_SUMMARY' || genForm.type === 'PROPOSAL';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/dashboard/projects/${projectId}`)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
        <button
          onClick={() => setShowGenModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Generate Report
        </button>
      </div>

      {/* Quick Generate Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { type: 'TAKEOFF_SUMMARY' as const, label: 'Takeoff Summary', desc: 'Summary of all counted items by category', color: 'border-amber-300 bg-amber-50' },
          { type: 'ESTIMATE_SUMMARY' as const, label: 'Estimate Summary', desc: 'Detailed cost breakdown with totals', color: 'border-blue-300 bg-blue-50' },
          { type: 'PROPOSAL' as const, label: 'Client Proposal', desc: 'Professional proposal with signature lines', color: 'border-emerald-300 bg-emerald-50' },
        ].map((card) => (
          <button
            key={card.type}
            onClick={() => {
              setGenForm({ ...genForm, type: card.type, format: card.type === 'PROPOSAL' ? 'PDF' : 'PDF' });
              setShowGenModal(true);
            }}
            className={`p-5 rounded-xl border-2 ${card.color} text-left hover:shadow-md transition-shadow`}
          >
            <svg className="w-8 h-8 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={TYPE_ICONS[card.type]} />
            </svg>
            <h3 className="font-semibold text-gray-900">{card.label}</h3>
            <p className="text-xs text-gray-600 mt-1">{card.desc}</p>
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Generated Reports</h2>
        </div>
        {reports.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="font-medium">No reports generated yet</p>
            <p className="text-sm mt-1">Generate your first report using the button above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={TYPE_ICONS[report.type] || TYPE_ICONS.TAKEOFF_SUMMARY} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{report.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{TYPE_LABELS[report.type] || report.type}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${FORMAT_COLORS[report.format] || 'bg-gray-100'}`}>
                        {report.format}
                      </span>
                      <span className="text-xs text-gray-400">{formatSize(report.fileSize)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => handleDownload(report)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Report</h3>
            <div className="space-y-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select
                  value={genForm.type}
                  onChange={(e) => setGenForm({ ...genForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="TAKEOFF_SUMMARY">Takeoff Summary</option>
                  <option value="ESTIMATE_SUMMARY">Estimate Summary</option>
                  <option value="PROPOSAL">Client Proposal</option>
                </select>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <div className="flex gap-2">
                  {['PDF', 'CSV', 'JSON'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setGenForm({ ...genForm, format: fmt as any })}
                      disabled={genForm.type === 'PROPOSAL' && fmt !== 'PDF'}
                      className={`px-4 py-2 text-sm rounded-lg border ${
                        genForm.format === fmt
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                {genForm.type === 'PROPOSAL' && (
                  <p className="text-xs text-gray-500 mt-1">Proposals are only available as PDF.</p>
                )}
              </div>

              {/* Estimate Selector */}
              {needsEstimate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Estimate</label>
                  {estimates.length === 0 ? (
                    <p className="text-sm text-red-500">No estimates available. Create one first.</p>
                  ) : (
                    <select
                      value={genForm.estimateId}
                      onChange={(e) => setGenForm({ ...genForm, estimateId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Choose an estimate...</option>
                      {estimates.map((est) => (
                        <option key={est.id} value={est.id}>
                          {est.name} — ${parseFloat(est.totalAmount).toLocaleString()} ({est.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Custom Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Name (optional)</label>
                <input
                  type="text"
                  value={genForm.name}
                  onChange={(e) => setGenForm({ ...genForm, name: e.target.value })}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGenModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={handleGenerate}
                disabled={generating || (needsEstimate && !genForm.estimateId)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
