'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { estimatesApi, takeoffItemsApi } from '@/lib/api';

interface EstimateLine {
  id: string;
  description: string;
  unit: string;
  quantity: string;
  materialCost: string;
  laborCost: string;
  totalCost: string;
  categoryCode?: string;
  notes?: string;
}

interface Estimate {
  id: string;
  name: string;
  version: number;
  status: string;
  subtotal: string;
  markupPercent: string;
  markupAmount: string;
  taxPercent: string;
  taxAmount: string;
  totalAmount: string;
  notes?: string;
  lines: EstimateLine[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function EstimatesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [genForm, setGenForm] = useState({ name: '', markupPercent: 20, taxPercent: 8.25 });
  const [addLineForm, setAddLineForm] = useState({
    description: '', unit: 'ea', quantity: 1, materialCost: 0, laborCost: 0, notes: '',
  });
  const [takeoffCount, setTakeoffCount] = useState(0);

  const fetchEstimates = useCallback(async () => {
    try {
      const res: any = await estimatesApi.getByProject(projectId);
      const data = res.data || res;
      setEstimates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch estimates', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchTakeoffCount = useCallback(async () => {
    try {
      const res: any = await takeoffItemsApi.getByProject(projectId);
      const data = res.data || res;
      setTakeoffCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setTakeoffCount(0);
    }
  }, [projectId]);

  useEffect(() => {
    fetchEstimates();
    fetchTakeoffCount();
  }, [fetchEstimates, fetchTakeoffCount]);

  const selectEstimate = async (id: string) => {
    try {
      const res: any = await estimatesApi.getOne(id);
      setSelectedEstimate(res.data || res);
    } catch (err) {
      console.error('Failed to fetch estimate detail', err);
    }
  };

  const handleGenerate = async () => {
    if (!genForm.name.trim()) return;
    setGenerating(true);
    try {
      const res: any = await estimatesApi.generateFromTakeoff(projectId, genForm);
      const est = res.data || res;
      setSelectedEstimate(est);
      setShowGenModal(false);
      fetchEstimates();
    } catch (err: any) {
      alert(err?.message || 'Failed to generate estimate');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddLine = async () => {
    if (!selectedEstimate || !addLineForm.description.trim()) return;
    try {
      await estimatesApi.addLine(selectedEstimate.id, {
        ...addLineForm,
        quantity: Number(addLineForm.quantity),
        materialCost: Number(addLineForm.materialCost),
        laborCost: Number(addLineForm.laborCost),
      });
      setShowAddLineModal(false);
      setAddLineForm({ description: '', unit: 'ea', quantity: 1, materialCost: 0, laborCost: 0, notes: '' });
      selectEstimate(selectedEstimate.id);
      fetchEstimates();
    } catch (err) {
      console.error('Failed to add line', err);
    }
  };

  const handleDeleteLine = async (lineId: string) => {
    if (!selectedEstimate) return;
    try {
      await estimatesApi.deleteLine(lineId);
      selectEstimate(selectedEstimate.id);
      fetchEstimates();
    } catch (err) {
      console.error('Failed to delete line', err);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedEstimate) return;
    try {
      await estimatesApi.update(selectedEstimate.id, { status });
      selectEstimate(selectedEstimate.id);
      fetchEstimates();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDeleteEstimate = async (id: string) => {
    try {
      await estimatesApi.delete(id);
      if (selectedEstimate?.id === id) setSelectedEstimate(null);
      fetchEstimates();
    } catch (err) {
      console.error('Failed to delete estimate', err);
    }
  };

  const fmt = (val: string | number) => {
    const n = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/dashboard/projects/${projectId}`)} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenModal(true)}
            disabled={takeoffCount === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Generate from Takeoff ({takeoffCount} items)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Estimates List */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {estimates.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-sm">No estimates yet.</p>
                <p className="text-xs mt-1">Generate one from your takeoff data.</p>
              </div>
            ) : (
              estimates.map((est) => (
                <button
                  key={est.id}
                  onClick={() => selectEstimate(est.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedEstimate?.id === est.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{est.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">v{est.version} &middot; {est.lines?.length || 0} lines</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[est.status] || 'bg-gray-100'}`}>
                      {est.status}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{fmt(est.totalAmount)}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(est.createdAt).toLocaleDateString()}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Estimate Detail */}
        <div className="col-span-8">
          {selectedEstimate ? (
            <div className="bg-white rounded-xl border border-gray-200">
              {/* Detail Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedEstimate.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">Version {selectedEstimate.version}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedEstimate.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="REVIEW">Review</option>
                      <option value="APPROVED">Approved</option>
                      <option value="SENT">Sent</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                    <button
                      onClick={() => handleDeleteEstimate(selectedEstimate.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Qty</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Unit</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Material</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Labor</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedEstimate.lines.map((line, idx) => (
                      <tr key={line.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{line.description}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{parseFloat(line.quantity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{line.unit}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(line.materialCost)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{fmt(line.laborCost)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{fmt(line.totalCost)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteLine(line.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Line Button */}
              <div className="px-4 py-3 border-t border-gray-100">
                <button
                  onClick={() => setShowAddLineModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Line Item
                </button>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-6 rounded-b-xl">
                <div className="max-w-xs ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{fmt(selectedEstimate.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Markup ({selectedEstimate.markupPercent}%)</span>
                    <span className="font-medium text-gray-900">{fmt(selectedEstimate.markupAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({selectedEstimate.taxPercent}%)</span>
                    <span className="font-medium text-gray-900">{fmt(selectedEstimate.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t border-gray-300">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-blue-600">{fmt(selectedEstimate.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <p className="font-medium">Select an estimate</p>
              <p className="text-sm mt-1">Choose from the list or generate a new one.</p>
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Estimate from Takeoff</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will automatically create an estimate based on your {takeoffCount} takeoff items and matching assemblies.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimate Name</label>
                <input
                  type="text"
                  value={genForm.name}
                  onChange={(e) => setGenForm({ ...genForm, name: e.target.value })}
                  placeholder="e.g., Bid Estimate v1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Markup %</label>
                  <input
                    type="number"
                    value={genForm.markupPercent}
                    onChange={(e) => setGenForm({ ...genForm, markupPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax %</label>
                  <input
                    type="number"
                    value={genForm.taxPercent}
                    onChange={(e) => setGenForm({ ...genForm, taxPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowGenModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={handleGenerate}
                disabled={generating || !genForm.name.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                {generating ? 'Generating...' : 'Generate Estimate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Line Modal */}
      {showAddLineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Line Item</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={addLineForm.description}
                  onChange={(e) => setAddLineForm({ ...addLineForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={addLineForm.quantity}
                    onChange={(e) => setAddLineForm({ ...addLineForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={addLineForm.unit}
                    onChange={(e) => setAddLineForm({ ...addLineForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="ea">ea</option>
                    <option value="lf">lf</option>
                    <option value="sf">sf</option>
                    <option value="set">set</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost</label>
                  <input
                    type="number"
                    value={addLineForm.materialCost}
                    onChange={(e) => setAddLineForm({ ...addLineForm, materialCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost</label>
                  <input
                    type="number"
                    value={addLineForm.laborCost}
                    onChange={(e) => setAddLineForm({ ...addLineForm, laborCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowAddLineModal(false)} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={handleAddLine}
                disabled={!addLineForm.description.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Add Line
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
