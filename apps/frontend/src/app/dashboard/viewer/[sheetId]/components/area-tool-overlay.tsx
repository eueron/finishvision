'use client';

import { useState, useCallback } from 'react';

interface Point { x: number; y: number; }

interface AreaMeasurement {
  id?: string;
  tempId: string;
  categoryId: string;
  color: string;
  label: string;
  points: Point[];
  pixelArea: number;
  realArea: number | null;
}

interface AreaToolOverlayProps {
  zoom: number;
  panX: number;
  panY: number;
  scaleFactor: number | null;
  activeCategory: { id: string; name: string; color: string } | null;
  areas: AreaMeasurement[];
  onAddArea: (points: Point[], pixelArea: number, realArea: number | null) => void;
  onDeleteArea: (tempId: string) => void;
}

function calcPolygonArea(points: Point[]): number {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function centroid(points: Point[]): Point {
  const n = points.length;
  const cx = points.reduce((s, p) => s + p.x, 0) / n;
  const cy = points.reduce((s, p) => s + p.y, 0) / n;
  return { x: cx, y: cy };
}

function formatArea(sqInches: number): string {
  const sqFeet = sqInches / 144;
  return `${sqFeet.toFixed(1)} sf`;
}

export function AreaToolOverlay({
  zoom, panX, panY, scaleFactor, activeCategory, areas, onAddArea, onDeleteArea,
}: AreaToolOverlayProps) {
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!activeCategory) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;
    setCurrentPoints((prev) => [...prev, { x, y }]);
  }, [zoom, panX, panY, activeCategory]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentPoints.length < 3) return;

    const pixelArea = calcPolygonArea(currentPoints);
    const realArea = scaleFactor ? pixelArea * scaleFactor * scaleFactor : null;
    onAddArea(currentPoints, pixelArea, realArea);
    setCurrentPoints([]);
  }, [currentPoints, scaleFactor, onAddArea]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setCurrentPoints([]);
    if (e.key === 'Enter' && currentPoints.length >= 3) {
      const pixelArea = calcPolygonArea(currentPoints);
      const realArea = scaleFactor ? pixelArea * scaleFactor * scaleFactor : null;
      onAddArea(currentPoints, pixelArea, realArea);
      setCurrentPoints([]);
    }
  }, [currentPoints, scaleFactor, onAddArea]);

  const toScreen = (p: Point) => ({ x: p.x * zoom + panX, y: p.y * zoom + panY });

  return (
    <svg
      className="absolute inset-0 w-full h-full z-10 outline-none"
      style={{ cursor: activeCategory ? 'crosshair' : 'default' }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Completed areas */}
      {areas.map((area) => {
        const pts = area.points.map(toScreen);
        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
        const center = centroid(pts);
        const label = area.realArea !== null ? formatArea(area.realArea) : `${Math.round(area.pixelArea)} px²`;

        return (
          <g key={area.tempId}>
            <path d={pathD} fill={area.color} fillOpacity={0.15} stroke={area.color} strokeWidth={2} />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill={area.color} stroke="white" strokeWidth={1.5} />
            ))}
            {/* Label */}
            <rect x={center.x - 30} y={center.y - 10} width={60} height={20} rx={4} fill="white" stroke={area.color} strokeWidth={1} opacity={0.9} />
            <text x={center.x} y={center.y + 4} textAnchor="middle" fill={area.color} fontSize={11} fontWeight="bold" className="select-none">
              {label}
            </text>
            {/* Delete */}
            <g onClick={(e) => { e.stopPropagation(); onDeleteArea(area.tempId); }} className="cursor-pointer">
              <circle cx={pts[0].x + 14} cy={pts[0].y - 14} r={7} fill="white" stroke="#EF4444" strokeWidth={1.5} />
              <text x={pts[0].x + 14} y={pts[0].y - 10.5} textAnchor="middle" fill="#EF4444" fontSize={9} fontWeight="bold">x</text>
            </g>
          </g>
        );
      })}

      {/* Current polygon being drawn */}
      {currentPoints.length > 0 && (
        <g>
          {currentPoints.length >= 2 && (
            <path
              d={currentPoints.map((p, i) => { const sp = toScreen(p); return `${i === 0 ? 'M' : 'L'} ${sp.x} ${sp.y}`; }).join(' ')}
              fill={activeCategory?.color || '#2563EB'}
              fillOpacity={0.1}
              stroke={activeCategory?.color || '#2563EB'}
              strokeWidth={2}
              strokeDasharray="6 3"
            />
          )}
          {currentPoints.map((p, i) => {
            const sp = toScreen(p);
            return <circle key={i} cx={sp.x} cy={sp.y} r={4} fill={activeCategory?.color || '#2563EB'} stroke="white" strokeWidth={1.5} />;
          })}
        </g>
      )}

      {/* Instructions */}
      {currentPoints.length > 0 && (
        <foreignObject x="0" y="100%" width="100%" height="40" style={{ overflow: 'visible', transform: 'translateY(-60px)' }}>
          <div className="flex justify-center">
            <div className="bg-white/90 rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow border">
              Click to add polygon points ({currentPoints.length} placed). Double-click or Enter to close. Escape to cancel.
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
