import { useCallback, useRef } from 'react';
import type { Camera } from './camera';
import { MIN_SCALE, MAX_SCALE } from '../../store/viewStore';

interface Pointer {
  id: number;
  x: number;
  y: number;
}

interface UseCanvasInteractionOptions {
  getCamera: () => Camera;
  setCamera: (cam: Camera) => void;
  onInteraction: () => void;
  onClick?: (cssX: number, cssY: number) => void;
}

export function useCanvasInteraction({
  getCamera,
  setCamera,
  onInteraction,
  onClick,
}: UseCanvasInteractionOptions) {
  const pointers = useRef<Pointer[]>([]);
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchMid = useRef<{ x: number; y: number } | null>(null);
  const downPos = useRef<{ x: number; y: number } | null>(null);

  const updatePointer = (id: number, x: number, y: number) => {
    const p = pointers.current.find((p) => p.id === id);
    if (p) {
      p.x = x;
      p.y = y;
    }
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    pointers.current.push({ id: e.pointerId, x: e.clientX, y: e.clientY });
    lastPinchDist.current = null;
    lastPinchMid.current = null;
    // Record click start for single pointer; clear on pinch
    if (pointers.current.length === 1) {
      downPos.current = { x: e.clientX, y: e.clientY };
    } else {
      downPos.current = null;
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const idx = pointers.current.findIndex((p) => p.id === e.pointerId);
      if (idx === -1) return;

      if (pointers.current.length === 1) {
        // Single pointer drag → pan
        const prev = pointers.current[0];
        const dx = e.clientX - prev.x;
        const dy = e.clientY - prev.y;

        const cam = getCamera();
        setCamera({
          ...cam,
          offsetX: cam.offsetX - dx / cam.scale,
          offsetY: cam.offsetY + dy / cam.scale, // Y flipped
        });
        onInteraction();
        prev.x = e.clientX;
        prev.y = e.clientY;
      } else if (pointers.current.length === 2) {
        // Two pointer pinch → zoom + pan
        updatePointer(e.pointerId, e.clientX, e.clientY);
        const [p1, p2] = pointers.current;

        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;

        if (lastPinchDist.current !== null && lastPinchMid.current !== null) {
          const ratio = dist / lastPinchDist.current;
          const cam = getCamera();
          const newScale = Math.min(Math.max(cam.scale * ratio, MIN_SCALE), MAX_SCALE);

          const dmx = midX - lastPinchMid.current.x;
          const dmy = midY - lastPinchMid.current.y;

          setCamera({
            offsetX: cam.offsetX - dmx / newScale,
            offsetY: cam.offsetY + dmy / newScale,
            scale: newScale,
          });
          onInteraction();
        }

        lastPinchDist.current = dist;
        lastPinchMid.current = { x: midX, y: midY };
      }
    },
    [getCamera, setCamera, onInteraction],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Detect click: pointerDown + pointerUp within 5 CSS pixels
    if (downPos.current && onClick) {
      const dx = e.clientX - downPos.current.x;
      const dy = e.clientY - downPos.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < 5) {
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        onClick(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
    downPos.current = null;

    pointers.current = pointers.current.filter((p) => p.id !== e.pointerId);
    if (pointers.current.length < 2) {
      lastPinchDist.current = null;
      lastPinchMid.current = null;
    }
  }, [onClick]);

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const cam = getCamera();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(cam.scale * factor, MIN_SCALE), MAX_SCALE);

      // Zoom toward cursor
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const cx = (e.clientX - rect.left) * dpr;
      const cy = (e.clientY - rect.top) * dpr;
      const canvasW = rect.width * dpr;
      const canvasH = rect.height * dpr;

      // World position under cursor before zoom
      const wxBefore = (cx - canvasW / 2) / cam.scale + cam.offsetX;
      const wyBefore = cam.offsetY - (cy - canvasH / 2) / cam.scale;

      // World position under cursor after zoom
      const wxAfter = (cx - canvasW / 2) / newScale + cam.offsetX;
      const wyAfter = cam.offsetY - (cy - canvasH / 2) / newScale;

      setCamera({
        offsetX: cam.offsetX - (wxAfter - wxBefore),
        offsetY: cam.offsetY - (wyAfter - wyBefore),
        scale: newScale,
      });
      onInteraction();
    },
    [getCamera, setCamera, onInteraction],
  );

  return { onPointerDown, onPointerMove, onPointerUp, onWheel };
}
