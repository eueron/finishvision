'use client';

import { useState, useEffect } from 'react';
import { takeoffCategoriesApi, takeoffItemsApi } from '@/lib/api';

interface TakeoffCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  measureType: string;
  unit: string;
  sortOrder?: number;
}

interface TakeoffItem {
  id: string;
  categoryId: string;
  label: string | null;
  quantity: number;
  unit: string;
  verified: boolean;
  source: string;
  category: TakeoffCategory;
}

interface TakeoffPanelProps {
  sheetId: string;
  projectId: string | null;
  activeTool: string;
  activeCategory: TakeoffCategory | null;
  onSelectCategory: (cat: TakeoffCategory | null) => void;
  itemCount: number;
  onRefreshItems: () => void;
}

const CATEGORY_GROUPS: Record<string, string[]> = {
  'Doors': ['INT_SINGLE_DOOR', 'INT_DOUBLE_DOOR', 'EXT_DOOR', 'SLIDING_DOOR', 'POCKET_DOOR', 'BIFOLD_DOOR'],
  'Windows': ['WINDOW', 'WINDOW_CASING', 'WINDOW_SILL'],
  'Trim': ['BASE_TRIM', 'CROWN_MOLDING', 'CHAIR_RAIL', 'CASING_TRIM', 'SHOE_MOLDING'],
  'Closets': ['CLOSET_SHELF', 'CLOSET_ROD', 'CLOSET_SYSTEM'],
  'Cabinets': ['BASE_CABINET', 'UPPER_CABINET', 'TALL_CABINET', 'VANITY_CABINET'],
  'Hardware': ['DOOR_HARDWARE', 'CABINET_HARDWARE'],
  'Other': ['STAIR_PARTS', 'WAINSCOTING'],
};

export function TakeoffPanel({
  sheetId, projectId, activeTool, activeCategory, onSelectCategory, itemCount, onRefreshItems,
}: TakeoffPanelProps) {
  const [categories, setCategories] = useState<TakeoffCategory[]>([]);
  const [sheetItems, setSheetItems] = useState<TakeoffItem[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>('Doors');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catsRes, itemsRes] = await Promise.all([
          takeoffCategoriesApi.getAll(),
          takeoffItemsApi.getBySheet(sheetId),
        ]) as any[];
        setCategories(catsRes.data);
        setSheetItems(itemsRes.data);
      } catch (err) {
        console.error('Failed to load takeoff data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [sheetId, itemCount]);

  const isTakeoffTool = ['count', 'linear', 'area'].includes(activeTool);

  // Group categories
  const grouped = Object.entries(CATEGORY_GROUPS).map(([group, codes]) => ({
    group,
    items: categories.filter((c) => codes.includes(c.code)),
  }));
  // Add custom categories
  const systemCodes = Object.values(CATEGORY_GROUPS).flat();
  const customCats = categories.filter((c) => !systemCodes.includes(c.code));
  if (customCats.length > 0) {
    grouped.push({ group: 'Custom', items: customCats });
  }

  // Count items per category on this sheet
  const itemsByCategory = new Map<string, number>();
  for (const item of sheetItems) {
    const current = itemsByCategory.get(item.categoryId) || 0;
    itemsByCategory.set(item.categoryId, current + item.quantity);
  }

  if (loading) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded" />
          <div className="h-8 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm">Takeoff Panel</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {sheetItems.length} items on this sheet
        </p>
      </div>

      {/* Category selector (visible when takeoff tool is active) */}
      {isTakeoffTool && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 mb-2">
              Select Category
            </p>
            {grouped.map(({ group, items }) => {
              if (items.length === 0) return null;
              const isExpanded = expandedGroup === group;
              return (
                <div key={group} className="mb-1">
                  <button
                    onClick={() => setExpandedGroup(isExpanded ? null : group)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded"
                  >
                    <span>{group}</span>
                    <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isExpanded && (
                    <div className="ml-1 space-y-0.5">
                      {items.map((cat) => {
                        const isActive = activeCategory?.id === cat.id;
                        const count = itemsByCategory.get(cat.id) || 0;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => onSelectCategory(isActive ? null : cat)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                              isActive ? 'bg-gray-100 ring-1 ring-gray-300' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className={`flex-1 text-left truncate ${isActive ? 'font-semibold' : ''}`}>
                              {cat.name}
                            </span>
                            {count > 0 && (
                              <span className="bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Item list (visible when not in takeoff tool) */}
      {!isTakeoffTool && (
        <div className="flex-1 overflow-y-auto">
          {sheetItems.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">
              No takeoff items on this sheet yet. Use Count, Linear, or Area tools to start.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sheetItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-xs"
                >
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.category.color }} />
                  <span className="flex-1 truncate text-gray-700">
                    {item.label || item.category.name}
                  </span>
                  <span className="text-gray-500 font-mono">
                    {item.quantity} {item.unit}
                  </span>
                  {item.verified && (
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {item.source === 'AI_DETECTED' && (
                    <span className="bg-purple-100 text-purple-700 rounded px-1 py-0.5 text-[9px] font-medium">AI</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Items</span>
            <span className="ml-1 font-semibold text-gray-900">{sheetItems.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Verified</span>
            <span className="ml-1 font-semibold text-green-600">{sheetItems.filter((i) => i.verified).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
