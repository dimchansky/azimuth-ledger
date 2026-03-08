import { useRef, useEffect, useCallback, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useRouteStore } from '../../store/routeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useViewStore, MIN_SCALE, MAX_SCALE } from '../../store/viewStore';
import { useMapSelectionStore } from '../../store/mapSelectionStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { computePoints, magneticToTrue } from '../../domain/navigation';
import { fitBounds } from './camera';
import { GridLayer } from './components/GridLayer';
import { RouteSegments, SelectedLegCard } from './components/RouteSegments';
import { PointBadges } from './components/PointBadges';
import { FromToVectorArrow, FromToVectorLabel } from './components/FromToVector';
import { NorthArrow } from './components/NorthArrow';
import mapStyles from './MapView.module.css';

interface Pointer {
  id: number;
  x: number;
  y: number;
}

export function MapView() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevPointCountRef = useRef(0);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

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

  // Subscribe to theme changes to trigger re-render of Konva shapes that read CSS variables
  const themePreference = useSettingsStore((s) => s.themePreference);
  useMediaQuery('(prefers-color-scheme: dark)');
  void themePreference;

  const points = computePoints(segments, originLabel, declinationDeg);

  const segmentAzimuths = segments.map((seg) => ({
    magneticAzimuth: seg.magneticAzimuth,
    trueAzimuth: magneticToTrue(seg.magneticAzimuth, declinationDeg),
  }));

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  // Stage dimensions in CSS pixels — Konva handles DPR via pixelRatio
  const stageW = containerSize.w;
  const stageH = containerSize.h;
  const sizeScale = stageW > 768 ? 1.3 : 1;

  const handleFit = useCallback(() => {
    const container = containerRef.current;
    const w = container?.clientWidth ?? window.innerWidth;
    const h = container?.clientHeight ?? window.innerHeight;
    const cam = fitBounds(points, w, h, 60);
    setView(cam.offsetX, cam.offsetY, cam.scale);
  }, [points, setView]);

  // Auto-fit when points count increases and user hasn't interacted
  useEffect(() => {
    if (containerSize.w === 0) return;

    const prevCount = prevPointCountRef.current;
    prevPointCountRef.current = points.length;

    if (points.length > prevCount && !userHasInteracted) {
      const cam = fitBounds(points, containerSize.w, containerSize.h, 60);
      setView(cam.offsetX, cam.offsetY, cam.scale);
    }
  }, [points.length, userHasInteracted, setView, points, containerSize]);

  // Reset selection when out of bounds
  useEffect(() => {
    if (mapSelection?.type === 'leg' && mapSelection.index >= segments.length) {
      setMapSelection(null);
    } else if (mapSelection?.type === 'point' && mapSelection.index >= points.length) {
      setMapSelection(null);
    }
  }, [mapSelection, segments.length, points.length, setMapSelection]);

  // Container resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ w: width, h: height });
      }
    });

    obs.observe(container);
    return () => obs.disconnect();
  }, []);

  // --- Pointer interaction (pan, pinch, click) ---
  const pointersRef = useRef<Pointer[]>([]);
  const lastPinchDistRef = useRef<number | null>(null);
  const lastPinchMidRef = useRef<{ x: number; y: number } | null>(null);
  const downPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    pointersRef.current.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
    lastPinchDistRef.current = null;
    lastPinchMidRef.current = null;
    if (pointersRef.current.length === 1) {
      downPosRef.current = { x: e.clientX, y: e.clientY };
    } else {
      downPosRef.current = null;
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const idx = pointersRef.current.findIndex((p) => p.id === e.pointerId);
      if (idx === -1) return;

      if (pointersRef.current.length === 1) {
        // Single pointer drag → pan
        const prev = pointersRef.current[0];
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;
        prev.x = e.clientX;
        prev.y = e.clientY;

        // dx/dy in CSS pixels, scale is CSS pixels per world unit
        setView(
          offsetX - dx / scale,
          offsetY + dy / scale, // Y flipped
          scale,
        );
        if (!userHasInteracted) setUserInteracted();
      } else if (pointersRef.current.length === 2) {
        // Update the moved pointer
        const p = pointersRef.current[idx];
        p.x = e.clientX;
        p.y = e.clientY;

        const [p1, p2] = pointersRef.current;
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        if (lastPinchDistRef.current !== null && lastPinchMidRef.current !== null) {
          const ratio = dist / lastPinchDistRef.current;
          const newScale = Math.min(Math.max(scale * ratio, MIN_SCALE), MAX_SCALE);

          const dmx = midX - lastPinchMidRef.current.x;
          const dmy = midY - lastPinchMidRef.current.y;

          setView(
            offsetX - dmx / newScale,
            offsetY + dmy / newScale,
            newScale,
          );
          if (!userHasInteracted) setUserInteracted();
        }

        lastPinchDistRef.current = dist;
        lastPinchMidRef.current = { x: midX, y: midY };
      }
    },
    [offsetX, offsetY, scale, setView, userHasInteracted, setUserInteracted],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // Detect click: pointerDown + pointerUp within 5 CSS pixels
      if (downPosRef.current) {
        const dx = e.clientX - downPosRef.current.x;
        const dy = e.clientY - downPosRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) < 5) {
          const stage = stageRef.current;
          if (stage) {
            const rect = stage.container().getBoundingClientRect();
            const sx = e.clientX - rect.left;
            const sy = e.clientY - rect.top;
            const shape = stage.getIntersection({ x: sx, y: sy });

            if (shape) {
              const name = shape.name();
              if (name.startsWith('point-')) {
                const pidx = parseInt(name.replace('point-', ''), 10);
                if (mapSelection?.type === 'point' && mapSelection.index === pidx) {
                  setMapSelection(null);
                } else {
                  setMapSelection({ type: 'point', index: pidx });
                }
              } else if (name.startsWith('leg-')) {
                const lidx = parseInt(name.replace('leg-', ''), 10);
                if (mapSelection?.type === 'leg' && mapSelection.index === lidx) {
                  setMapSelection(null);
                } else {
                  setMapSelection({ type: 'leg', index: lidx });
                }
              } else {
                setMapSelection(null);
              }
            } else {
              setMapSelection(null);
            }
          }
        }
      }
      downPosRef.current = null;

      pointersRef.current = pointersRef.current.filter((p) => p.id !== e.pointerId);
      if (pointersRef.current.length < 2) {
        lastPinchDistRef.current = null;
        lastPinchMidRef.current = null;
      }
    },
    [mapSelection, setMapSelection],
  );

  // Wheel zoom — registered via useEffect for non-passive listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const curScale = useViewStore.getState().scale;
      const curOffsetX = useViewStore.getState().offsetX;
      const curOffsetY = useViewStore.getState().offsetY;
      const newScale = Math.min(Math.max(curScale * factor, MIN_SCALE), MAX_SCALE);

      const stage = stageRef.current;
      if (!stage) return;

      const rect = stage.container().getBoundingClientRect();
      // CSS pixel coordinates
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const sW = rect.width;
      const sH = rect.height;

      // World position under cursor before zoom
      const wxBefore = (cx - sW / 2) / curScale + curOffsetX;
      const wyBefore = curOffsetY - (cy - sH / 2) / curScale;

      // World position under cursor after zoom
      const wxAfter = (cx - sW / 2) / newScale + curOffsetX;
      const wyAfter = curOffsetY - (cy - sH / 2) / newScale;

      const { setView: sv, setUserInteracted: sui } = useViewStore.getState();
      sv(
        curOffsetX - (wxAfter - wxBefore),
        curOffsetY - (wyAfter - wyBefore),
        newScale,
      );
      if (!useViewStore.getState().userHasInteracted) sui();
    };

    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      data-map-container
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {stageW > 0 && stageH > 0 && (
        <Stage
          ref={stageRef}
          width={stageW}
          height={stageH}
          pixelRatio={dpr}
        >
          {/* Background layer: grid (non-transformed, raw screen coords) */}
          <Layer listening={false}>
            <GridLayer
              offsetX={offsetX}
              offsetY={offsetY}
              scale={scale}
              width={stageW}
              height={stageH}
              gridStep={gridStep}
            />
          </Layer>

          {/* Route layer: segments + badges (transformed to world coords) */}
          <Layer
            offsetX={offsetX - stageW / (2 * scale)}
            offsetY={-offsetY - stageH / (2 * scale)}
            scaleX={scale}
            scaleY={scale}
          >
            <RouteSegments
              points={points}
              selection={selection}
              selectedLegIndex={selectedLegIndex}
              scale={scale}
              sizeScale={sizeScale}
            />
            <FromToVectorArrow
              points={points}
              selection={selection}
              scale={scale}
              sizeScale={sizeScale}
            />
            <PointBadges
              points={points}
              selection={selection}
              selectedPointIndex={selectedPointIndex}
              scale={scale}
              sizeScale={sizeScale}
            />
          </Layer>

          {/* Overlay layer: labels/cards in screen space */}
          <Layer listening={false}>
            <FromToVectorLabel
              points={points}
              selection={selection}
              declinationDeg={declinationDeg}
              angleUnit={angleUnit}
              milsPerCircle={milsPerCircle}
              unitsLabel={unitsLabel}
              scale={scale}
              sizeScale={sizeScale}
              stageWidth={stageW}
              stageHeight={stageH}
              offsetX={offsetX}
              offsetY={offsetY}
            />
            <SelectedLegCard
              points={points}
              selectedLegIndex={selectedLegIndex}
              scale={scale}
              sizeScale={sizeScale}
              segments={segments}
              segmentAzimuths={segmentAzimuths}
              angleUnit={angleUnit}
              milsPerCircle={milsPerCircle}
              unitsLabel={unitsLabel}
              stageWidth={stageW}
              stageHeight={stageH}
              offsetX={offsetX}
              offsetY={offsetY}
            />
            <NorthArrow stageWidth={stageW} />
          </Layer>
        </Stage>
      )}
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
