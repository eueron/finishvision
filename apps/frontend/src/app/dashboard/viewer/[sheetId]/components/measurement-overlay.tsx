'use client';

import { useState, useCallback } from 'react';
import { annotationsApi } from '@/lib/api';

interface Point {
  x: number;
  y: number;
}

interface Measurement {
  id?: string;
  points: Point[];
  pixelDistance: number;
  realDistance: number | null;
  label: string;
  color: string;
}

interface MeasurementOverlayProps {
  sheetId: string;
  zoom: number;
  panX: number;
  panY: number;
  scaleFactor: number | null;
  measurements: Measurement[];
  onMeasurementsChange: (measurements: Measurement[]) => void;
}

export function MeasurementOverlay({
  sheetId, zoom, panX, panY, scaleFactor, measurements, onMeasurementsChange,
}: MeasurementOverlayProps) {
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);

  const handleClick = useCallback(async (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;

    if (currentPoints.length === 0) {
      setCurrentPoints([{ x, y }]);
    } else {
      const p1 = currentPoints[0];
      const p2 = { x, y };
      const pixelDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const realDist = scaleFactor ? pixelDist * scaleFactor : null;

      let label = `${Math.round(pixelDist)} px`;
      if (realDist !== null) {
        const feet = Math.floor(realDist / 12);
        const inches = Math.round(realDist % 12);
        label = feet > 0 ? `${feet}'-${inches}"` : `${inches}"`;
      }

      const newMeasurement: Measurement = {
        points: [p1, p2],
        pixelDistance: pixelDist,
        realDistance: realDist,
        label,
        color: '#2563EB',
      };

      // Save to backend
      try {
        const res: any = await annotationsApi.create(sheetId, {
          type: 'MEASUREMENT',
          label,
          data: { points: [p1, p2], pixelDistance: pixelDist, realDistance: realDist },
          color: '#2563EB',
        });
        newMeasurement.id = res.data.id;
      } catch (err) {
        console.error('Failed to save measurement', err);
      }

      onMeasurementsChange([...measurements, newMeasurement]);
      setCurrentPoints([]);
    }
  }, [currentPoints, zoom, panX, panY, scaleFactor, sheetId, measurements, onMeasurementsChange]);

  const handleDelete = async (index: number) => {
    const m = measurements[index];
    if (m.id) {
      try {
        await annotationsApi.delete(m.id);
      } catch (err) {
        console.error('Failed to delete measurement', err);
      }
    }
    const updated = measurements.filter((_, i) => i !== index);
    onMeasurementsChange(updated);
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full z-10"
      style={{ cursor: 'crosshair' }}
      onClick={handleClick}
    >
      {/* Existing measurements */}
      {measurements.map((m, i) => {
        const [p1, p2] = m.points;
        const sx1 = p1.x * zoom + panX;
        const sy1 = p1.y * zoom + panY;
        const sx2 = p2.x * zoom + panX;
        const sy2 = p2.y * zoom + panY;
        const midX = (sx1 + sx2) / 2;
        const midY = (sy1 + sy2) / 2;

        return (
          <g key={i}>
            <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke={m.color} strokeWidth={2} />
            <circle cx={sx1} cy={sy1} r={4} fill={m.color} stroke="white" strokeWidth={1.5} />
            <circle cx={sx2} cy={sy2} r={4} fill={m.color} stroke="white" strokeWidth={1.5} />
            {/* Label background */}
            <rect
              x={midX - 30}
              y={midY - 20}
              width={60}
              height={18}
              rx={4}
              fill="white"
              stroke={m.color}
              strokeWidth={1}
              opacity={0.9}
            />
            <text
              x={midX}
              y={midY - 8}
              textAnchor="middle"
              fill={m.color}
              fontSize={11}
              fontWeight="bold"
              className="select-none"
            >
              {m.label}
            </text>
            {/* Delete button (small X) */}
            <g
              onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
              className="cursor-pointer"
            >
              <circle cx={sx2 + 12} cy={sy2 - 12} r={8} fill="white" stroke="#EF4444" strokeWidth={1.5} />
              <text x={sx2 + 12} y={sy2 - 8} textAnchor="middle" fill="#EF4444" fontSize={10} fontWeight="bold">x</text>
            </g>
          </g>
        );
      })}

      {/* Current point being placed */}
      {currentPoints.length === 1 && (
        <circle
          cx={currentPoints[0].x * zoom + panX}
          cy={currentPoints[0].y * zoom + panY}
          r={5}
          fill="#2563EB"
          stroke="white"
          strokeWidth={2}
          className="animate-pulse"
        />
      )}

      {/* Instruction */}
      {currentPoints.length === 0 && (
        <foreignObject x="0" y="100%" width="100%" height="40" style={{ overflow: 'visible', transform: 'translateY(-60px)' }}>
          <div className="flex justify-center">
            <div className="bg-white/90 rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow border">
              Click to place first measurement point
            </div>
          </div>
        </foreignObject>
      )}
      {currentPoints.length === 1 && (
        <foreignObject x="0" y="100%" width="100%" height="40" style={{ overflow: 'visible', transform: 'translateY(-60px)' }}>
          <div className="flex justify-center">
            <div className="bg-white/90 rounded-lg px-3 py-1.5 text-xs text-gray-600 shadow border">
              Click to place second point and measure
            </div>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}
