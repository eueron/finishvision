'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { sheetsApi, annotationsApi, takeoffItemsApi, aiApi } from '@/lib/api';
import { AiDetectionOverlay } from './components/ai-detection-overlay';
import { useViewerState } from './components/use-viewer-state';
import { ViewerToolbar } from './components/viewer-toolbar';
import { SheetSidebar } from './components/sheet-sidebar';
import { CalibrationOverlay } from './components/calibration-overlay';
import { MeasurementOverlay } from './components/measurement-overlay';
import { CountToolOverlay } from './components/count-tool-overlay';
import { LinearToolOverlay } from './components/linear-tool-overlay';
import { AreaToolOverlay } from './components/area-tool-overlay';
import { TakeoffPanel } from './components/takeoff-panel';

interface Sheet {
  id: string;
  blueprintId: string;
  pageNumber: number;
  sheetName: string | null;
  sheetType: string;
  thumbnailPath: string | null;
  imagePath: string | null;
  width: number | null;
  height: number | null;
  scaleText: string | null;
  scaleFactor: number | null;
}

interface TakeoffCategory {
  id: string;
  name: string;
  code: string;
  color: string;
  measureType: string;
  unit: string;
  sortOrder?: number;
}

interface Measurement {
  id?: string;
  points: { x: number; y: number }[];
  pixelDistance: number;
  realDistance: number | null;
  label: string;
  color: string;
}

interface CountMarker {
  id?: string;
  tempId: string;
  categoryId: string;
  color: string;
  label: string;
  x: number;
  y: number;
  quantity: number;
}

interface LinearItem {
  id?: string;
  tempId: string;
  categoryId: string;
  color: string;
  label: string;
  points: { x: number; y: number }[];
  totalPixelLength: number;
  totalRealLength: number | null;
}

interface AreaItem {
  id?: string;
  tempId: string;
  categoryId: string;
  color: string;
  label: string;
  points: { x: number; y: number }[];
  pixelArea: number;
  realArea: number | null;
}

export default function ViewerPage() {
  const params = useParams();
  const router = useRouter();
  const sheetId = params.sheetId as string;

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [siblingSheets, setSiblingSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [showTakeoffPanel, setShowTakeoffPanel] = useState(true);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Takeoff state
  const [activeCategory, setActiveCategory] = useState<TakeoffCategory | null>(null);
  const [countMarkers, setCountMarkers] = useState<CountMarker[]>([]);
  const [linearItems, setLinearItems] = useState<LinearItem[]>([]);
  const [areaItems, setAreaItems] = useState<AreaItem[]>([]);
  const [showAiOverlay, setShowAiOverlay] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [itemCount, setItemCount] = useState(0);

  const viewer = useViewerState();
  const containerRef = useRef<HTMLDivElement>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

  const fetchSheet = useCallback(async () => {
    try {
      setLoading(true);
      setImageLoaded(false);
      const res: any = await sheetsApi.getOne(sheetId);
      setSheet(res.data);

      // Get project ID from blueprint
      if (res.data.blueprint?.projectId) {
        setProjectId(res.data.blueprint.projectId);
      }

      // Fetch sibling sheets
      const siblingsRes: any = await sheetsApi.getByBlueprint(res.data.blueprintId);
      setSiblingSheets(siblingsRes.data);

      // Fetch annotations (measurements)
      try {
        const annoRes: any = await annotationsApi.getBySheet(sheetId);
        const existingMeasurements = (annoRes.data || [])
          .filter((a: any) => a.type === 'MEASUREMENT')
          .map((a: any) => ({
            id: a.id,
            points: a.data.points,
            pixelDistance: a.data.pixelDistance,
            realDistance: a.data.realDistance,
            label: a.label,
            color: a.color || '#2563EB',
          }));
        setMeasurements(existingMeasurements);
      } catch {
        setMeasurements([]);
      }

      // Fetch existing takeoff items on this sheet
      try {
        const itemsRes: any = await takeoffItemsApi.getBySheet(sheetId);
        const items = itemsRes.data || [];
        const counts: CountMarker[] = [];
        const lines: LinearItem[] = [];
        const areas: AreaItem[] = [];

        for (const item of items) {
          if (!item.coordinates) continue;
          const coords = item.coordinates;
          if (coords.type === 'point') {
            counts.push({
              id: item.id,
              tempId: item.id,
              categoryId: item.categoryId,
              color: item.category?.color || '#2563EB',
              label: item.label || item.category?.name || '',
              x: coords.points[0].x,
              y: coords.points[0].y,
              quantity: item.quantity,
            });
          } else if (coords.type === 'polyline') {
            lines.push({
              id: item.id,
              tempId: item.id,
              categoryId: item.categoryId,
              color: item.category?.color || '#8B5CF6',
              label: item.label || item.category?.name || '',
              points: coords.points,
              totalPixelLength: coords.pixelLength || 0,
              totalRealLength: item.length || null,
            });
          } else if (coords.type === 'polygon') {
            areas.push({
              id: item.id,
              tempId: item.id,
              categoryId: item.categoryId,
              color: item.category?.color || '#10B981',
              label: item.label || item.category?.name || '',
              points: coords.points,
              pixelArea: coords.pixelArea || 0,
              realArea: item.area || null,
            });
          }
        }
        setCountMarkers(counts);
        setLinearItems(lines);
        setAreaItems(areas);
      } catch {
        // ignore
      }
    } catch (err) {
      console.error('Failed to fetch sheet', err);
    } finally {
      setLoading(false);
    }
  }, [sheetId]);

  useEffect(() => {
    fetchSheet();
  }, [fetchSheet]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      switch (e.key.toLowerCase()) {
        case 'v': viewer.setActiveTool('pan'); break;
        case 'c': viewer.setActiveTool('calibrate'); break;
        case 'm': viewer.setActiveTool('measure'); break;
        case 'n': viewer.setActiveTool('count'); break;
        case 'l': viewer.setActiveTool('linear'); break;
        case 'a': viewer.setActiveTool('area'); break;
        case 't': setShowTakeoffPanel((p) => !p); break;
        case '=':
        case '+': viewer.zoomIn(); break;
        case '-': viewer.zoomOut(); break;
        case '0': viewer.zoomToFit(); break;
        case 'escape': viewer.setActiveTool('pan'); setActiveCategory(null); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewer]);

  const handleCalibrationComplete = (scaleFactor: number, scaleText: string) => {
    if (sheet) setSheet({ ...sheet, scaleFactor, scaleText });
    viewer.setActiveTool('pan');
  };

  // Count tool handlers
  const handleAddCountMarker = useCallback(async (x: number, y: number) => {
    if (!activeCategory || !projectId) return;
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const marker: CountMarker = {
      tempId,
      categoryId: activeCategory.id,
      color: activeCategory.color,
      label: activeCategory.name,
      x, y,
      quantity: 1,
    };
    setCountMarkers((prev) => [...prev, marker]);

    try {
      const res: any = await takeoffItemsApi.create(projectId, {
        categoryId: activeCategory.id,
        sheetId,
        label: activeCategory.name,
        quantity: 1,
        unit: 'ea',
        coordinates: { type: 'point', points: [{ x, y }] },
      });
      setCountMarkers((prev) => prev.map((m) => m.tempId === tempId ? { ...m, id: res.data.id } : m));
      setItemCount((c) => c + 1);
    } catch (err) {
      console.error('Failed to save count marker', err);
    }
  }, [activeCategory, projectId, sheetId]);

  const handleDeleteCountMarker = useCallback(async (tempId: string) => {
    const marker = countMarkers.find((m) => m.tempId === tempId);
    if (marker?.id) {
      try { await takeoffItemsApi.delete(marker.id); } catch {}
    }
    setCountMarkers((prev) => prev.filter((m) => m.tempId !== tempId));
    setItemCount((c) => c + 1);
  }, [countMarkers]);

  // Linear tool handlers
  const handleAddLine = useCallback(async (
    points: { x: number; y: number }[],
    totalPixelLength: number,
    totalRealLength: number | null,
  ) => {
    if (!activeCategory || !projectId) return;
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const line: LinearItem = {
      tempId,
      categoryId: activeCategory.id,
      color: activeCategory.color,
      label: activeCategory.name,
      points, totalPixelLength, totalRealLength,
    };
    setLinearItems((prev) => [...prev, line]);

    try {
      const lengthInches = totalRealLength || totalPixelLength;
      const res: any = await takeoffItemsApi.create(projectId, {
        categoryId: activeCategory.id,
        sheetId,
        label: activeCategory.name,
        quantity: 1,
        unit: 'lf',
        length: lengthInches,
        coordinates: { type: 'polyline', points, pixelLength: totalPixelLength },
      });
      setLinearItems((prev) => prev.map((l) => l.tempId === tempId ? { ...l, id: res.data.id } : l));
      setItemCount((c) => c + 1);
    } catch (err) {
      console.error('Failed to save linear item', err);
    }
  }, [activeCategory, projectId, sheetId]);

  const handleDeleteLine = useCallback(async (tempId: string) => {
    const line = linearItems.find((l) => l.tempId === tempId);
    if (line?.id) {
      try { await takeoffItemsApi.delete(line.id); } catch {}
    }
    setLinearItems((prev) => prev.filter((l) => l.tempId !== tempId));
    setItemCount((c) => c + 1);
  }, [linearItems]);

  // Area tool handlers
  const handleAddArea = useCallback(async (
    points: { x: number; y: number }[],
    pixelArea: number,
    realArea: number | null,
  ) => {
    if (!activeCategory || !projectId) return;
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const area: AreaItem = {
      tempId,
      categoryId: activeCategory.id,
      color: activeCategory.color,
      label: activeCategory.name,
      points, pixelArea, realArea,
    };
    setAreaItems((prev) => [...prev, area]);

    try {
      const areaValue = realArea || pixelArea;
      const res: any = await takeoffItemsApi.create(projectId, {
        categoryId: activeCategory.id,
        sheetId,
        label: activeCategory.name,
        quantity: 1,
        unit: 'sf',
        area: areaValue,
        coordinates: { type: 'polygon', points, pixelArea },
      });
      setAreaItems((prev) => prev.map((a) => a.tempId === tempId ? { ...a, id: res.data.id } : a));
      setItemCount((c) => c + 1);
    } catch (err) {
      console.error('Failed to save area item', err);
    }
  }, [activeCategory, projectId, sheetId]);

  const handleDeleteArea = useCallback(async (tempId: string) => {
    const area = areaItems.find((a) => a.tempId === tempId);
    if (area?.id) {
      try { await takeoffItemsApi.delete(area.id); } catch {}
    }
    setAreaItems((prev) => prev.filter((a) => a.tempId !== tempId));
    setItemCount((c) => c + 1);
  }, [areaItems]);

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    return `${apiBase}/storage/files/${encodeURIComponent(path)}`;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
      </div>
    );
  }

  if (!sheet) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Sheet not found</h2>
          <button onClick={() => router.back()} className="btn-primary mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl(sheet.imagePath);
  const isTakeoffTool = ['count', 'linear', 'area'].includes(viewer.activeTool);

  return (
    <div className="h-screen flex bg-gray-900 overflow-hidden">
      {/* Sheet Sidebar */}
      <SheetSidebar
        sheets={siblingSheets}
        currentSheetId={sheetId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Viewer Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toolbar */}
        <ViewerToolbar
          zoom={viewer.state.zoom}
          activeTool={viewer.activeTool}
          scaleFactor={sheet.scaleFactor}
          scaleText={sheet.scaleText}
          onZoomIn={viewer.zoomIn}
          onZoomOut={viewer.zoomOut}
          onZoomToFit={viewer.zoomToFit}
          onSetTool={viewer.setActiveTool}
        />

        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="w-full h-full"
          onWheel={viewer.handleWheel}
          onMouseDown={viewer.activeTool === 'pan' ? viewer.handleMouseDown : undefined}
          onMouseMove={viewer.activeTool === 'pan' ? viewer.handleMouseMove : undefined}
          onMouseUp={viewer.activeTool === 'pan' ? viewer.handleMouseUp : undefined}
          onMouseLeave={viewer.activeTool === 'pan' ? viewer.handleMouseUp : undefined}
          style={{ cursor: viewer.activeTool === 'pan' ? (viewer.state.isPanning ? 'grabbing' : 'grab') : 'default' }}
        >
          {/* Blueprint Image */}
          <div
            className="absolute"
            style={{
              transform: `translate(${viewer.state.panX}px, ${viewer.state.panY}px) scale(${viewer.state.zoom})`,
              transformOrigin: '0 0',
              transition: viewer.state.isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={sheet.sheetName || `Page ${sheet.pageNumber}`}
                onLoad={() => setImageLoaded(true)}
                className={`max-w-none ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                draggable={false}
              />
            ) : (
              <div className="w-[800px] h-[600px] bg-gray-800 flex items-center justify-center text-gray-500">
                No image available
              </div>
            )}
          </div>

          {/* Loading overlay */}
          {!imageLoaded && imageUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
          )}

          {/* Calibration Overlay */}
          {viewer.activeTool === 'calibrate' && (
            <CalibrationOverlay
              sheetId={sheetId}
              zoom={viewer.state.zoom}
              panX={viewer.state.panX}
              panY={viewer.state.panY}
              onComplete={handleCalibrationComplete}
              onCancel={() => viewer.setActiveTool('pan')}
            />
          )}

          {/* Measurement Overlay */}
          {viewer.activeTool === 'measure' && (
            <MeasurementOverlay
              sheetId={sheetId}
              zoom={viewer.state.zoom}
              panX={viewer.state.panX}
              panY={viewer.state.panY}
              scaleFactor={sheet.scaleFactor}
              measurements={measurements}
              onMeasurementsChange={setMeasurements}
            />
          )}

          {/* Count Tool Overlay */}
          {viewer.activeTool === 'count' && (
            <CountToolOverlay
              zoom={viewer.state.zoom}
              panX={viewer.state.panX}
              panY={viewer.state.panY}
              activeCategory={activeCategory}
              markers={countMarkers}
              onAddMarker={handleAddCountMarker}
              onDeleteMarker={handleDeleteCountMarker}
            />
          )}

          {/* Linear Tool Overlay */}
          {viewer.activeTool === 'linear' && (
            <LinearToolOverlay
              zoom={viewer.state.zoom}
              panX={viewer.state.panX}
              panY={viewer.state.panY}
              scaleFactor={sheet.scaleFactor}
              activeCategory={activeCategory}
              lines={linearItems}
              onAddLine={handleAddLine}
              onDeleteLine={handleDeleteLine}
            />
          )}

          {/* Area Tool Overlay */}
          {viewer.activeTool === 'area' && (
            <AreaToolOverlay
              zoom={viewer.state.zoom}
              panX={viewer.state.panX}
              panY={viewer.state.panY}
              scaleFactor={sheet.scaleFactor}
              activeCategory={activeCategory}
              areas={areaItems}
              onAddArea={handleAddArea}
              onDeleteArea={handleDeleteArea}
            />
          )}

          {/* AI Detection Overlay */}
          <AiDetectionOverlay
            sheetId={sheetId}
            projectId={projectId || ''}
            zoom={viewer.state.zoom}
            panX={viewer.state.panX}
            panY={viewer.state.panY}
            visible={showAiOverlay}
          />

          {/* Show all takeoff markers in pan mode (read-only) */}
          {viewer.activeTool === 'pan' && (countMarkers.length > 0 || linearItems.length > 0 || areaItems.length > 0) && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              {/* Count markers */}
              {countMarkers.map((m, i) => {
                const sx = m.x * viewer.state.zoom + viewer.state.panX;
                const sy = m.y * viewer.state.zoom + viewer.state.panY;
                return (
                  <g key={`c-${m.tempId}`} opacity={0.7}>
                    <circle cx={sx} cy={sy} r={10} fill={m.color} stroke="white" strokeWidth={1.5} />
                    <text x={sx} y={sy + 3.5} textAnchor="middle" fill="white" fontSize={9} fontWeight="bold" className="select-none">{i + 1}</text>
                  </g>
                );
              })}
              {/* Linear items */}
              {linearItems.map((line) => {
                const pts = line.points.map((p) => ({ x: p.x * viewer.state.zoom + viewer.state.panX, y: p.y * viewer.state.zoom + viewer.state.panY }));
                const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                return (
                  <g key={`l-${line.tempId}`} opacity={0.6}>
                    <path d={pathD} fill="none" stroke={line.color} strokeWidth={2} />
                  </g>
                );
              })}
              {/* Area items */}
              {areaItems.map((area) => {
                const pts = area.points.map((p) => ({ x: p.x * viewer.state.zoom + viewer.state.panX, y: p.y * viewer.state.zoom + viewer.state.panY }));
                const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
                return (
                  <g key={`a-${area.tempId}`} opacity={0.4}>
                    <path d={pathD} fill={area.color} fillOpacity={0.1} stroke={area.color} strokeWidth={1.5} />
                  </g>
                );
              })}
              {/* Measurements */}
              {measurements.map((m, i) => {
                const [p1, p2] = m.points;
                const sx1 = p1.x * viewer.state.zoom + viewer.state.panX;
                const sy1 = p1.y * viewer.state.zoom + viewer.state.panY;
                const sx2 = p2.x * viewer.state.zoom + viewer.state.panX;
                const sy2 = p2.y * viewer.state.zoom + viewer.state.panY;
                return (
                  <g key={`m-${i}`} opacity={0.5}>
                    <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke={m.color} strokeWidth={1.5} />
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-4 right-4 z-20 bg-white/90 rounded-lg shadow-lg border border-gray-200 px-4 py-2 text-xs text-gray-600 flex items-center gap-4">
          <span>{sheet.sheetName || `Page ${sheet.pageNumber}`}</span>
          {sheet.width && sheet.height && <span>{sheet.width} x {sheet.height} px</span>}
          {activeCategory && isTakeoffTool && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: activeCategory.color }} />
              {activeCategory.name}
            </span>
          )}
          <span>{countMarkers.length + linearItems.length + areaItems.length} takeoff items</span>
          <span className="border-l pl-4 flex items-center gap-2">
            <button
              onClick={() => setShowAiOverlay(!showAiOverlay)}
              className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                showAiOverlay ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              }`}
            >
              AI Overlay {showAiOverlay ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={async () => {
                if (!projectId) return;
                setAiAnalyzing(true);
                try {
                  await aiApi.triggerAnalysis(projectId, sheetId);
                  setShowAiOverlay(true);
                  setTimeout(() => setAiAnalyzing(false), 3000);
                } catch (err) {
                  console.error('AI analysis failed:', err);
                  setAiAnalyzing(false);
                }
              }}
              disabled={aiAnalyzing}
              className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              {aiAnalyzing ? 'Analyzing...' : 'Run AI'}
            </button>
          </span>
        </div>
      </div>

      {/* Takeoff Panel */}
      {showTakeoffPanel && (
        <TakeoffPanel
          sheetId={sheetId}
          projectId={projectId}
          activeTool={viewer.activeTool}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          itemCount={itemCount}
          onRefreshItems={() => setItemCount((c) => c + 1)}
        />
      )}
    </div>
  );
}
