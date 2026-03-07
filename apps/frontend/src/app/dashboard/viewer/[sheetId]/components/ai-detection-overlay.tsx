'use client';

import { useEffect, useState } from 'react';
import { aiApi } from '@/lib/api';

interface Detection {
  id: string;
  type: string;
  label: string;
  confidence: number;
  status: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  category?: { id: string; name: string; color: string };
}

interface AiDetectionOverlayProps {
  sheetId: string;
  projectId: string;
  zoom: number;
  panX: number;
  panY: number;
  visible: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#EAB308',
  ACCEPTED: '#22C55E',
  REJECTED: '#EF4444',
  MODIFIED: '#3B82F6',
};

const TYPE_ICONS: Record<string, string> = {
  DOOR_SINGLE: 'D',
  DOOR_DOUBLE: 'DD',
  DOOR_SLIDING: 'DS',
  DOOR_POCKET: 'DP',
  DOOR_BIFOLD: 'DB',
  DOOR_METAL: 'DM',
  WINDOW: 'W',
  CLOSET: 'CL',
  CABINET_RUN: 'CB',
  ROOM_LABEL: 'R',
  DIMENSION: 'DIM',
  SCHEDULE_ENTRY: 'S',
  SYMBOL_OTHER: '?',
};

export function AiDetectionOverlay({ sheetId, projectId, zoom, panX, panY, visible }: AiDetectionOverlayProps) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !sheetId) return;
    loadDetections();
  }, [sheetId, visible]);

  const loadDetections = async () => {
    setLoading(true);
    try {
      const res = await aiApi.getDetectionsBySheet(sheetId);
      setDetections((res as any).data || []);
    } catch (err) {
      console.error('Failed to load detections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (detectionId: string, status: string) => {
    try {
      await aiApi.reviewDetection(detectionId, { status });
      loadDetections();
    } catch (err) {
      console.error('Review failed:', err);
    }
  };

  if (!visible || detections.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
      }}
    >
      {detections.map((det) => {
        const color = STATUS_COLORS[det.status] || '#6B7280';
        const x = det.boundingBox.x * zoom + panX;
        const y = det.boundingBox.y * zoom + panY;
        const w = det.boundingBox.width * zoom;
        const h = det.boundingBox.height * zoom;
        const isHovered = hoveredId === det.id;

        return (
          <g key={det.id}>
            {/* Bounding box */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color + '15'}
              stroke={color}
              strokeWidth={isHovered ? 3 : 2}
              strokeDasharray={det.status === 'PENDING' ? '6 3' : 'none'}
              className="pointer-events-auto cursor-pointer"
              onMouseEnter={() => setHoveredId(det.id)}
              onMouseLeave={() => setHoveredId(null)}
            />

            {/* Type badge */}
            <rect
              x={x}
              y={y - 18}
              width={28}
              height={16}
              rx={3}
              fill={color}
            />
            <text
              x={x + 14}
              y={y - 7}
              textAnchor="middle"
              fill="white"
              fontSize={9}
              fontWeight="bold"
            >
              {TYPE_ICONS[det.type] || '?'}
            </text>

            {/* Confidence badge */}
            <rect
              x={x + 30}
              y={y - 18}
              width={32}
              height={16}
              rx={3}
              fill="rgba(0,0,0,0.7)"
            />
            <text
              x={x + 46}
              y={y - 7}
              textAnchor="middle"
              fill="white"
              fontSize={9}
            >
              {(Number(det.confidence) * 100).toFixed(0)}%
            </text>

            {/* Hover tooltip */}
            {isHovered && (
              <foreignObject x={x + w + 8} y={y} width={220} height={120}>
                <div className="bg-white rounded-lg shadow-lg border p-2 pointer-events-auto" style={{ fontSize: 11 }}>
                  <p className="font-bold text-gray-900 mb-1">{det.label}</p>
                  <p className="text-gray-500 mb-1">
                    Confidence: {(Number(det.confidence) * 100).toFixed(1)}%
                  </p>
                  {det.category && (
                    <p className="text-gray-500 mb-2">
                      Category: {det.category.name}
                    </p>
                  )}
                  {det.status === 'PENDING' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleReview(det.id, 'ACCEPTED')}
                        className="bg-green-500 text-white px-2 py-0.5 rounded text-xs hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReview(det.id, 'REJECTED')}
                        className="bg-red-500 text-white px-2 py-0.5 rounded text-xs hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </foreignObject>
            )}
          </g>
        );
      })}
    </svg>
  );
}
