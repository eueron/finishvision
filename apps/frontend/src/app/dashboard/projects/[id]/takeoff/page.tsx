'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, takeoffItemsApi } from '@/lib/api';

interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryCode: string;
  color: string;
  measureType: string;
  unit: string;
  totalCount: number;
  totalQuantity: number;
  totalLF: number;
  totalSF: number;
  verified: number;
  unverified: number;
}

interface TakeoffSummary {
  totalItems: number;
  totalVerified: number;
  categories: CategorySummary[];
}

interface TakeoffItem {
  id: string;
  categoryId: string;
  label: string | null;
  quantity: number;
  unit: string;
  length: number | null;
  area: number | null;
  verified: boolean;
  source: string;
  notes: string | null;
  roomId: string | null;
  category: { name: string; color: string; code: string };
}

export default function TakeoffSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<any>(null);
  const [summary, setSummary] = useState<TakeoffSummary | null>(null);
  const [items, setItems] = useState<TakeoffItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, summaryRes, itemsRes] = await Promise.all([
          projectsApi.getOne(projectId),
          takeoffItemsApi.getSummary(projectId),
          takeoffItemsApi.getByProject(projectId),
        ]) as any[];
        setProject(projRes.data);
        setSummary(summaryRes.data);
        setItems(itemsRes.data);
      } catch (err) {
        console.error('Failed to load takeoff data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const filteredItems = selectedCategory
    ? items.filter((i) => i.categoryId === selectedCategory)
    : items;

  const handleVerify = async (itemId: string, verified: boolean) => {
    try {
      await takeoffItemsApi.update(itemId, { verified });
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, verified } : i));
    } catch (err) {
      console.error('Failed to update item', err);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await takeoffItemsApi.delete(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete item', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push(`/dashboard/projects/${projectId}`)} className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Takeoff Summary</h1>
          </div>
          <p className="text-gray-500 ml-8">{project?.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{summary?.totalItems || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Verified</p>
          <p className="text-2xl font-bold text-green-600">{summary?.totalVerified || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Unverified</p>
          <p className="text-2xl font-bold text-amber-600">{(summary?.totalItems || 0) - (summary?.totalVerified || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Categories</p>
          <p className="text-2xl font-bold text-brand-600">{summary?.categories.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Categories</h2>
          </div>
          <div className="divide-y divide-gray-100">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 ${!selectedCategory ? 'bg-brand-50' : ''}`}
            >
              <span className="font-medium text-gray-700">All Items</span>
              <span className="text-gray-500">{items.length}</span>
            </button>
            {summary?.categories.map((cat) => (
              <button
                key={cat.categoryId}
                onClick={() => setSelectedCategory(cat.categoryId)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-50 ${selectedCategory === cat.categoryId ? 'bg-brand-50' : ''}`}
              >
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="flex-1 text-left text-gray-700">{cat.categoryName}</span>
                <div className="text-right">
                  <span className="font-medium text-gray-900">{cat.totalQuantity}</span>
                  <span className="text-gray-400 ml-1">{cat.unit}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Items {selectedCategory && `(${summary?.categories.find((c) => c.categoryId === selectedCategory)?.categoryName})`}
            </h2>
            <span className="text-sm text-gray-500">{filteredItems.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">Category</th>
                  <th className="text-left px-4 py-2 text-gray-500 font-medium">Label</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">Qty</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">Measure</th>
                  <th className="text-center px-4 py-2 text-gray-500 font-medium">Source</th>
                  <th className="text-center px-4 py-2 text-gray-500 font-medium">Status</th>
                  <th className="text-right px-4 py-2 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.category.color }} />
                        <span className="text-gray-700">{item.category.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{item.label || '-'}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-600">
                      {item.length ? `${(item.length / 12).toFixed(1)} ft` : item.area ? `${(item.area / 144).toFixed(1)} sf` : `${item.quantity} ${item.unit}`}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${
                        item.source === 'AI_DETECTED' ? 'bg-purple-100 text-purple-700' :
                        item.source === 'AI_CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {item.source === 'AI_DETECTED' ? 'AI' : item.source === 'AI_CONFIRMED' ? 'AI+' : 'Manual'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleVerify(item.id, !item.verified)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                          item.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.verified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                      No takeoff items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
