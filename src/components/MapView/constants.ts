import type { Selection } from '../../domain/types';

export const BADGE_RADIUS_PX = 10;
export const FROM_TO_RING_EXTRA_PX = 4; // ring offset(3) + half strokeWidth(1)

export function pointInsetRadius(
  pointIndex: number,
  selection: Selection,
  scale: number,
  sizeScale: number,
): number {
  const baseR = BADGE_RADIUS_PX * sizeScale / scale;
  const isFromOrTo = pointIndex === selection.fromIndex || pointIndex === selection.toIndex;
  return isFromOrTo ? baseR + FROM_TO_RING_EXTRA_PX / scale : baseR;
}

export function insetSegment(
  x1: number, y1: number, x2: number, y2: number,
  r1: number, r2: number,
): { x1: number; y1: number; x2: number; y2: number; len: number } | null {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1e-10) return null;
  const remaining = len - r1 - r2;
  if (remaining <= 0) return null;
  const ux = dx / len, uy = dy / len;
  return {
    x1: x1 + ux * r1, y1: y1 + uy * r1,
    x2: x2 - ux * r2, y2: y2 - uy * r2,
    len: remaining,
  };
}
