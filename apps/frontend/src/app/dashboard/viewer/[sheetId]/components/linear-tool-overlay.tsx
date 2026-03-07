'use client';

import { useState, useCallback } from 'react';

interface Point { x: number; y: number; }

interface LinearMeasurement {
  id?: string;
  tempId: string;
  categoryId: string;
  color: string;
  label: string;
  points: Point[];
  totalPixelLength: number;
  totalRealLength: number | null;
}

interface LinearToolOverlayProps {
  zoom: number;
  panX: number;
  panY: number;
  scaleFactor: number | null;
  activeCategory: { id: string; name: string; color: string } | null;
  lines: LinearMeasurement[];
  onAddLine: (points: Point[], totalPixelLength: number, totalRealLength: number | null) => void;
  onDeleteLine: (tempId: string) => void;
}

function calcSegmentLength(p1: Point, p2: Point) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

function formatLength(inches: number): string {
  const feet = Math.floor(inches / 12);
  const rem = Math.round(inches % 12);
  return feet > 0 ? `${feet}'-${rem}"` : `${rem}"`;
}

export function LinearToolOverlay({
  zoom, panX, panY, scaleFactor, activeCategory, lines, onAddLine, onDeleteLine,
}: LinearToolOverlayProps) {
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
    if (currentPoints.length < 2) return;

    let totalPx = 0;
    for (let i = 1; i < currentPoints.length; i++) {
      totalPx += calcSegmentLength(currentPoints[i - 1], currentPoints[i]);
    }
    const totalReal = scaleFactor ? totalPx * scaleFactor : null;
    onAddLine(currentPoints, totalPx, totalReal);
    setCurrentPoints([]);
  }, [currentPoints, scaleFactor, onAddLine]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setCurrentPoints([]);
    if (e.key === 'Enter' && currentPoints.length >= 2) {
      let totalPx = 0;
      for (let i = 1; i < currentPoints.length; i++) {
        totalPx += calcSegmentLength(currentPoints[i - 1], currentPoints[i]);
      }
      const totalReal = scaleFactor ? totalPx * scaleFactor : null;
      onAddLine(currentPoints, totalPx, totalReal);
      setCurrentPoints([]);
    }
  }, [currentPoints, scaleFactor, onAddLine]);

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
      {/* Completed lines */}
      {lines.map((line) => {
        const pts = line.points.map(toScreen);
        const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const mid = pts[Math.floor(pts.length / 2)];
        const label = line.totalRealLength !== null ? formatLength(line.totalRealLength) : `${Math.round(line.totalPixelLength)} px`;

        return (
          <g key={line.tempId}>
            <path d={pathD} fill="none" stroke={line.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill={line.color} stroke="white" strokeWidth={1.5} />
            ))}
            {/* Label */}
            <rect x={mid.x - 30} y={mid.y - 20} width={60} height={18} rx={4} fill="white" stroke={line.color} strokeWidth={1} opacity={0.9} />
            <text x={mid.x} y={mid.y - 8} textAnchor="middle" fill={line.color} fontSize={11} fontWeight="bold" className="select-none">
              {label}
            </text>
            {/* Delete */}
            <g onClick={(e) => { e.stopPropagation(); onDeleteLine(line.tempId); }} className="cursor-pointer">
              <circle cx={pts[pts.length - 1].x + 14} cy={pts[pts.length - 1].y - 14} r={7} fill="white" stroke="#EF4444" strokeWidth={1.5} />
              <text x={pts[pts.length - 1].x + 14} y={pts[pts.length - 1].y - 10.5} textAnchor="middle" fill="#EF4444" fontSize={9} fontWeight="bold">x</text>
            </g>
          </g>
        );
      })}

      {/* Current line being drawn */}
      {currentPoints.length > 0 && (
        <g>
          {currentPoints.map((p, i) => {
            const sp = toScreen(p);
            return <circle key={i} cx={sp.x} cy={sp.y} r={4} fill={activeCategory?.color || '#2563EB'} stroke="white" strokeWidth={1.5} />;
          })}
          {currentPoints.length > 1 && (
            <path
              d={currentPoints.map((p, i) => { const sp = toScreen(p); return `${i === 0 ? 'M' : 'L'} ${sp.x} ${sp.y}`; }).join(' ')}
              fill="none"
              stroke={activeCategory?.color || '#2563EB'}
              strokeWidth={2}
              strokeDasharray="6 3"
            />
          )}
        </g>
      )}

      {/* Instructions */}
      {currentPoints.length > 0 && (
        <foreignObject x="0" y="100%" width="100%" height="40" style={{ overflow: 'visible', transform: 'translateY(-60px)' }}>
          <div className="flex justify-center">
            <div className="bg-white/90 rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow border">
              Click to add points. Double-click or press Enter to finish. Escape to cancel.
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
