'use client';

import { useRouter } from 'next/navigation';

interface Sheet {
  id: string;
  pageNumber: number;
  sheetName: string | null;
  sheetType: string;
  thumbnailPath: string | null;
}

interface SheetSidebarProps {
  sheets: Sheet[];
  currentSheetId: string;
  collapsed: boolean;
  onToggle: () => void;
}

const typeColors: Record<string, string> = {
  FLOOR_PLAN: 'bg-blue-500',
  DOOR_SCHEDULE: 'bg-amber-500',
  WINDOW_SCHEDULE: 'bg-cyan-500',
  ELEVATION: 'bg-purple-500',
  DETAIL: 'bg-pink-500',
  COVER: 'bg-gray-500',
  OTHER: 'bg-gray-400',
};

export function SheetSidebar({ sheets, currentSheetId, collapsed, onToggle }: SheetSidebarProps) {
  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const getThumbUrl = (path: string | null) => {
    if (!path) return null;
    return `${apiBase}/storage/files/${encodeURIComponent(path)}`;
  };

  return (
    <div className={`h-full bg-white border-r border-gray-200 flex flex-col transition-all ${collapsed ? 'w-12' : 'w-64'}`}>
      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b border-gray-200 flex items-center gap-2"
      >
        <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
        {!collapsed && <span className="text-sm font-medium">Sheets</span>}
      </button>

      {/* Sheet list */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sheets.map((sheet) => {
            const isActive = sheet.id === currentSheetId;
            const thumbUrl = getThumbUrl(sheet.thumbnailPath);

            return (
              <button
                key={sheet.id}
                onClick={() => router.push(`/dashboard/viewer/${sheet.id}`)}
                className={`w-full text-left rounded-lg p-2 transition-colors ${
                  isActive ? 'bg-brand-50 border border-brand-200' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-gray-100 rounded overflow-hidden mb-2">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={sheet.sheetName || ''} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                      No preview
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${typeColors[sheet.sheetType] || typeColors.OTHER}`} />
                  <span className={`text-xs truncate ${isActive ? 'font-semibold text-brand-700' : 'text-gray-700'}`}>
                    {sheet.sheetName || `Page ${sheet.pageNumber}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Collapsed: show page numbers only */}
      {collapsed && (
        <div className="flex-1 overflow-y-auto py-2 space-y-1">
          {sheets.map((sheet) => {
            const isActive = sheet.id === currentSheetId;
            return (
              <button
                key={sheet.id}
                onClick={() => router.push(`/dashboard/viewer/${sheet.id}`)}
                className={`w-full flex items-center justify-center py-2 text-xs font-medium transition-colors ${
                  isActive ? 'text-brand-600 bg-brand-50' : 'text-gray-500 hover:bg-gray-50'
                }`}
                title={sheet.sheetName || `Page ${sheet.pageNumber}`}
              >
                {sheet.pageNumber}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
