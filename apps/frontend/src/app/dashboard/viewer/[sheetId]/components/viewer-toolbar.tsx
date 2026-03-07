'use client';

import type { ViewerTool } from './use-viewer-state';

interface ViewerToolbarProps {
  zoom: number;
  activeTool: ViewerTool;
  scaleFactor: number | null;
  scaleText: string | null;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onSetTool: (tool: ViewerTool) => void;
}

const tools: { id: ViewerTool; label: string; icon: string; shortcut: string }[] = [
  { id: 'pan', label: 'Pan', icon: 'M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122', shortcut: 'V' },
  { id: 'calibrate', label: 'Calibrate Scale', icon: 'M3 6h18M3 6v12h18V6M9 6v12M15 6v12M3 12h18', shortcut: 'C' },
  { id: 'measure', label: 'Measure', icon: 'M3 3h18v18H3V3zm4 4v10m4-10v10m4-10v10', shortcut: 'M' },
  { id: 'count', label: 'Count', icon: 'M12 4v16m8-8H4', shortcut: 'N' },
  { id: 'linear', label: 'Linear', icon: 'M4 20L20 4M4 20h4m-4 0v-4M20 4h-4m4 0v4', shortcut: 'L' },
  { id: 'area', label: 'Area', icon: 'M4 4h16v16H4V4zM8 8h8v8H8V8z', shortcut: 'A' },
];

export function ViewerToolbar(props: ViewerToolbarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
      {/* Left: Tools */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1 pointer-events-auto">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => props.onSetTool(tool.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              props.activeTool === tool.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
            </svg>
            <span className="hidden lg:inline">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Center: Scale Info */}
      {props.scaleFactor && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-2 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-gray-700">
              Scale: {props.scaleText || `1:${props.scaleFactor}`}
            </span>
          </div>
        </div>
      )}

      {/* Right: Zoom Controls */}
      <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1 pointer-events-auto">
        <button
          onClick={props.onZoomOut}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom Out (-)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">
          {Math.round(props.zoom * 100)}%
        </span>
        <button
          onClick={props.onZoomIn}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Zoom In (+)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button
          onClick={props.onZoomToFit}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Fit to Screen (0)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
