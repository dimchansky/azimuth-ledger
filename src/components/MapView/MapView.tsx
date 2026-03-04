import { useRef, useEffect, useCallback, useState } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useViewStore } from '../../store/viewStore';
import { useMapSelectionStore } from '../../store/mapSelectionStore';
import { computePoints, magneticToTrue } from '../../domain/navigation';
import { render } from './renderer';
import { fitBounds, worldToScreen } from './camera';
import { useCanvasInteraction } from './useCanvasInteraction';
import mapStyles from './MapView.module.css';

function pointToSegmentDist(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function MapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const prevPointCountRef = useRef(0);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  const mapSelection = useMapSelectionStore((s) => s.mapSelection);
  const setMapSelection = useMapSelectionStore((s) => s.setMapSelection);
  const selectedLegIndex = mapSelection?.type === 'leg' ? mapSelection.index : null;
  const selectedPointIndex = mapSelection?.type === 'point' ? mapSelection.index : null;

  const segments = useRouteStore((s) => s.segments);
  const originLabel = useRouteStore((s) => s.originLabel);
  const selection = useRouteStore((s) => s.selection);
  const declinationDeg = useSettingsStore((s) => s.declinationDeg);
  const angleUnit = useSettingsStore((s) => s.angleUnit);
  const milsPerCircle = useSettingsStore((s) => s.milsPerCircle);
  const gridStep = useSettingsStore((s) => s.gridStep);
  const unitsLabel = useSettingsStore((s) => s.unitsLabel);

  const offsetX = useViewStore((s) => s.offsetX);
  const offsetY = useViewStore((s) => s.offsetY);
  const scale = useViewStore((s) => s.scale);
  const userHasInteracted = useViewStore((s) => s.userHasInteracted);
  const setView = useViewStore((s) => s.setView);
  const setUserInteracted = useViewStore((s) => s.setUserInteracted);

  const points = computePoints(segments, originLabel, declinationDeg);

  const segmentAzimuths = segments.map((seg) => ({
    magneticAzimuth: seg.magneticAzimuth,
    trueAzimuth: magneticToTrue(seg.magneticAzimuth, declinationDeg),
  }));

  const handleFit = useCallback(() => {
    const container = containerRef.current;
    const w = container?.clientWidth ?? window.innerWidth;
    const h = container?.clientHeight ?? window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const pad = 60 * dpr;
    const cam = fitBounds(points, w * dpr, h * dpr, pad);
    setView(cam.offsetX, cam.offsetY, cam.scale);
  }, [points, setView]);

  // Auto-fit when points count increases and user hasn't interacted
  useEffect(() => {
    if (canvasSize.w === 0) return; // wait for canvas to be sized

    const prevCount = prevPointCountRef.current;
    prevPointCountRef.current = points.length;

    if (points.length > prevCount && !userHasInteracted) {
      const dpr = window.devicePixelRatio || 1;
      const pad = 60 * dpr;
      const cam = fitBounds(points, canvasSize.w, canvasSize.h, pad);
      setView(cam.offsetX, cam.offsetY, cam.scale);
    }
  }, [points.length, userHasInteracted, setView, points, canvasSize]);

  const getCamera = useCallback(
    () => ({ offsetX, offsetY, scale }),
    [offsetX, offsetY, scale],
  );

  const setCamera = useCallback(
    (cam: { offsetX: number; offsetY: number; scale: number }) => {
      setView(cam.offsetX, cam.offsetY, cam.scale);
    },
    [setView],
  );

  const onInteraction = useCallback(() => {
    if (!userHasInteracted) setUserInteracted();
  }, [userHasInteracted, setUserInteracted]);

  const handleCanvasClick = useCallback(
    (cssX: number, cssY: number) => {
      const dpr = window.devicePixelRatio || 1;
      const cam = { offsetX, offsetY, scale };
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cW = canvas.width;
      const cH = canvas.height;

      // Check points first (smaller targets, higher priority)
      let bestPointDist = Infinity;
      let bestPointIdx: number | null = null;
      for (const p of points) {
        const s = worldToScreen(p.x, p.y, cam, cW, cH);
        const d = Math.hypot(cssX - s.sx / dpr, cssY - s.sy / dpr);
        if (d < bestPointDist) {
          bestPointDist = d;
          bestPointIdx = p.index;
        }
      }
      if (bestPointDist <= 20 && bestPointIdx !== null) {
        if (mapSelection?.type === 'point' && mapSelection.index === bestPointIdx) {
          setMapSelection(null);
        } else {
          setMapSelection({ type: 'point', index: bestPointIdx });
        }
        return;
      }

      // Check legs
      if (points.length >= 2) {
        let bestLegDist = Infinity;
        let bestLegIdx: number | null = null;
        for (let i = 0; i < points.length - 1; i++) {
          const s1 = worldToScreen(points[i].x, points[i].y, cam, cW, cH);
          const s2 = worldToScreen(points[i + 1].x, points[i + 1].y, cam, cW, cH);
          const d = pointToSegmentDist(
            cssX, cssY,
            s1.sx / dpr, s1.sy / dpr,
            s2.sx / dpr, s2.sy / dpr,
          );
          if (d < bestLegDist) {
            bestLegDist = d;
            bestLegIdx = i;
          }
        }
        if (bestLegDist <= 20 && bestLegIdx !== null) {
          if (mapSelection?.type === 'leg' && mapSelection.index === bestLegIdx) {
            setMapSelection(null);
          } else {
            setMapSelection({ type: 'leg', index: bestLegIdx });
          }
          return;
        }
      }

      // Empty space → deselect
      setMapSelection(null);
    },
    [points, offsetX, offsetY, scale, mapSelection, setMapSelection],
  );

  const interaction = useCanvasInteraction({ getCamera, setCamera, onInteraction, onClick: handleCanvasClick });

  // Reset selection when out of bounds
  useEffect(() => {
    if (mapSelection?.type === 'leg' && mapSelection.index >= segments.length) {
      setMapSelection(null);
    } else if (mapSelection?.type === 'point' && mapSelection.index >= points.length) {
      setMapSelection(null);
    }
  }, [mapSelection, segments.length, points.length, setMapSelection]);

  // Canvas resize — updates state to trigger re-render
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        const w = width * dpr;
        const h = height * dpr;

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = w;
          canvas.height = h;
          canvas.style.width = `${width}px`;
          canvas.style.height = `${height}px`;
        }

        setCanvasSize({ w, h });
      }
    });

    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // Render on every relevant state change
  useEffect(() => {
    if (canvasSize.w === 0 || canvasSize.h === 0) return;

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      render({
        ctx,
        cam: { offsetX, offsetY, scale },
        canvasW: canvas.width,
        canvasH: canvas.height,
        points,
        selection,
        declinationDeg,
        angleUnit,
        milsPerCircle,
        gridStep,
        segmentAzimuths,
        selectedLegIndex,
        selectedPointIndex,
        segments,
        unitsLabel,
      });
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasSize, offsetX, offsetY, scale, points, selection, declinationDeg, angleUnit, milsPerCircle, gridStep, segmentAzimuths, selectedLegIndex, selectedPointIndex, segments, unitsLabel]);

  return (
    <div ref={containerRef} data-map-container style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', touchAction: 'none' }}
        onPointerDown={interaction.onPointerDown}
        onPointerMove={interaction.onPointerMove}
        onPointerUp={interaction.onPointerUp}
        onPointerCancel={interaction.onPointerUp}
        onWheel={interaction.onWheel}
      />
      <button
        className={mapStyles.fitBtn}
        onClick={handleFit}
        disabled={segments.length === 0}
        title="Fit all points"
        aria-label="Fit all points"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="1,6 1,1 6,1" />
          <polyline points="12,1 17,1 17,6" />
          <polyline points="17,12 17,17 12,17" />
          <polyline points="6,17 1,17 1,12" />
        </svg>
      </button>
    </div>
  );
}
