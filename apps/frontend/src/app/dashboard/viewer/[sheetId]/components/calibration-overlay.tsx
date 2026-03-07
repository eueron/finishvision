'use client';

import { useState, useCallback } from 'react';
import { annotationsApi, sheetsApi } from '@/lib/api';

interface Point {
  x: number;
  y: number;
}

interface CalibrationOverlayProps {
  sheetId: string;
  zoom: number;
  panX: number;
  panY: number;
  onComplete: (scaleFactor: number, scaleText: string) => void;
  onCancel: () => void;
}

export function CalibrationOverlay({ sheetId, zoom, panX, panY, onComplete, onCancel }: CalibrationOverlayProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [knownLength, setKnownLength] = useState('');
  const [unit, setUnit] = useState<'ft' | 'in'>('ft');

  const handleCanvasClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length >= 2) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    // Convert screen coords to image coords
    const x = (e.clientX - rect.left - panX) / zoom;
    const y = (e.clientY - rect.top - panY) / zoom;

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);

    if (newPoints.length === 2) {
      setShowDialog(true);
    }
  }, [points, zoom, panX, panY]);

  const pixelDistance = points.length === 2
    ? Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2))
    : 0;

  const handleConfirm = async () => {
    const lengthValue = parseFloat(knownLength);
    if (!lengthValue || lengthValue <= 0) return;

    const lengthInInches = unit === 'ft' ? lengthValue * 12 : lengthValue;
    const scaleFactor = lengthInInches / pixelDistance;
    const scaleText = unit === 'ft'
      ? `${lengthValue} ft = ${Math.round(pixelDistance)} px`
      : `${lengthValue} in = ${Math.round(pixelDistance)} px`;

    try {
      // Save calibration annotation
      await annotationsApi.create(sheetId, {
        type: 'CALIBRATION',
        label: scaleText,
        data: {
          points,
          pixelDistance,
          knownLength: lengthValue,
          unit,
          scaleFactor,
          scaleText,
        },
        color: '#10B981',
      });

      // Update sheet scale
      await sheetsApi.updateScale(sheetId, { scaleText, scaleFactor });

      onComplete(scaleFactor, scaleText);
    } catch (err) {
      console.error('Failed to save calibration', err);
    }
  };

  const handleReset = () => {
    setPoints([]);
    setShowDialog(false);
    setKnownLength('');
  };

  return (
    <>
      {/* SVG overlay for drawing calibration line */}
      <svg
        className="absolute inset-0 w-full h-full z-10"
        style={{ cursor: points.length < 2 ? 'crosshair' : 'default' }}
        onClick={handleCanvasClick}
      >
        {/* Calibration line */}
        {points.length >= 1 && (
          <>
            {/* First point */}
            <circle
              cx={points[0].x * zoom + panX}
              cy={points[0].y * zoom + panY}
              r={6}
              fill="#10B981"
              stroke="white"
              strokeWidth={2}
            />
          </>
        )}
        {points.length === 2 && (
          <>
            {/* Line between points */}
            <line
              x1={points[0].x * zoom + panX}
              y1={points[0].y * zoom + panY}
              x2={points[1].x * zoom + panX}
              y2={points[1].y * zoom + panY}
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="6 3"
            />
            {/* Second point */}
            <circle
              cx={points[1].x * zoom + panX}
              cy={points[1].y * zoom + panY}
              r={6}
              fill="#10B981"
              stroke="white"
              strokeWidth={2}
            />
            {/* Pixel distance label */}
            <text
              x={(points[0].x + points[1].x) / 2 * zoom + panX}
              y={(points[0].y + points[1].y) / 2 * zoom + panY - 10}
              textAnchor="middle"
              fill="#10B981"
              fontSize={12}
              fontWeight="bold"
              className="select-none"
            >
              {Math.round(pixelDistance)} px
            </text>
          </>
        )}
      </svg>

      {/* Instruction bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-white rounded-xl shadow-lg border border-gray-200 px-6 py-3 flex items-center gap-4">
        {points.length === 0 && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-brand-600">Step 1:</span> Click the first point of a known dimension
          </p>
        )}
        {points.length === 1 && (
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-brand-600">Step 2:</span> Click the second point of the known dimension
          </p>
        )}
        {points.length === 2 && !showDialog && (
          <p className="text-sm text-gray-700">Calculating...</p>
        )}
        <button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-700 underline">
          Reset
        </button>
        <button onClick={onCancel} className="text-xs text-red-500 hover:text-red-700 underline">
          Cancel
        </button>
      </div>

      {/* Known length dialog */}
      {showDialog && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Set Known Dimension</h3>
            <p className="text-sm text-gray-500 mb-4">
              Pixel distance: <span className="font-mono font-medium">{Math.round(pixelDistance)} px</span>
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                value={knownLength}
                onChange={(e) => setKnownLength(e.target.value)}
                placeholder="Enter length"
                className="input-field flex-1"
                autoFocus
                min="0"
                step="0.1"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as 'ft' | 'in')}
                className="input-field w-20"
              >
                <option value="ft">ft</option>
                <option value="in">in</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleConfirm} className="btn-primary flex-1" disabled={!knownLength}>
                Confirm Scale
              </button>
              <button onClick={handleReset} className="btn-secondary flex-1">
                Redo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
