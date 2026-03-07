import { useState, useCallback, useRef } from 'react';

export interface ViewerState {
  zoom: number;
  panX: number;
  panY: number;
  isPanning: boolean;
}

export type ViewerTool = 'pan' | 'calibrate' | 'measure' | 'count' | 'linear' | 'area';

export function useViewerState() {
  const [state, setState] = useState<ViewerState>({
    zoom: 1,
    panX: 0,
    panY: 0,
    isPanning: false,
  });
  const [activeTool, setActiveTool] = useState<ViewerTool>('pan');
  const lastMousePos = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.min(s.zoom * 1.25, 10) }));
  }, []);

  const zoomOut = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.max(s.zoom / 1.25, 0.1) }));
  }, []);

  const zoomToFit = useCallback(() => {
    setState((s) => ({ ...s, zoom: 1, panX: 0, panY: 0 }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setState((s) => ({ ...s, zoom: Math.max(0.1, Math.min(10, zoom)) }));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setState((s) => ({
      ...s,
      zoom: Math.max(0.1, Math.min(10, s.zoom * delta)),
    }));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool === 'pan' || e.button === 1) { // Middle click always pans
      setState((s) => ({ ...s, isPanning: true }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, [activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (state.isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setState((s) => ({
        ...s,
        panX: s.panX + dx,
        panY: s.panY + dy,
      }));
    }
  }, [state.isPanning]);

  const handleMouseUp = useCallback(() => {
    setState((s) => ({ ...s, isPanning: false }));
  }, []);

  return {
    state,
    activeTool,
    setActiveTool,
    zoomIn,
    zoomOut,
    zoomToFit,
    setZoom,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
