'use client';

import { useCallback } from 'react';

interface TakeoffCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  measureType: string;
}

interface TakeoffMarker {
  id?: string;
  tempId?: string;
  categoryId: string;
  color: string;
  label: string;
  x: number;
  y: number;
  quantity: number;
}

interface CountToolOverlayProps {
  zoom: number;
  panX: number;
  panY: number;
  activeCategory: TakeoffCategory | null;
  markers: TakeoffMarker[];
  onAddMarker: (x: number, y: number) => void;
  onDeleteMarker: (tempId: string) => void;
}

export function CountToolOverlay({
  zoom, panX, panY, activeCategory, markers, onAddMarker, onDeleteMarker,
}: CountToolOverlayProps) {

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!activeCategory) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    onAddMarker(x, y);
  }, [zoom, panX, panY, activeCategory, onAddMarker]);

  return (
    <svg
      className="absolute inset-0 w-full h-full z-10"
      style={{ cursor: activeCategory ? 'crosshair' : 'default' }}
      onClick={handleClick}
    >
      {markers.map((m, i) => {
        const sx = m.x * zoom + panX;
        const sy = m.y * zoom + panY;
        return (
          <g key={m.tempId || m.id || i}>
            {/* Marker circle */}
            <circle cx={sx} cy={sy} r={12} fill={m.color} stroke="white" strokeWidth={2} opacity={0.9} />
            {/* Count number */}
            <text x={sx} y={sy + 4} textAnchor="middle" fill="white" fontSize={10} fontWeight="bold" className="select-none">
              {i + 1}
            </text>
            {/* Delete button */}
            <g
              onClick={(e) => { e.stopPropagation(); if (m.tempId) onDeleteMarker(m.tempId); }}
              className="cursor-pointer opacity-0 hover:opacity-100"
            >
              <circle cx={sx + 14} cy={sy - 14} r={7} fill="white" stroke="#EF4444" strokeWidth={1.5} />
              <text x={sx + 14} y={sy - 10.5} textAnchor="middle" fill="#EF4444" fontSize={9} fontWeight="bold">x</text>
            </g>
          </g>
        );
      })}

      {/* Instructions */}
      {!activeCategory && (
        <foreignObject x="0" y="0" width="100%" height="60" style={{ overflow: 'visible' }}>
          <div className="flex justify-center pt-16">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-xs text-yellow-800 shadow">
              Select a category from the takeoff panel to start counting
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
