import type { Point } from '../../domain/types';

export interface Camera {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export function worldToScreen(
  wx: number,
  wy: number,
  cam: Camera,
  canvasW: number,
  canvasH: number,
): { sx: number; sy: number } {
  return {
    sx: (wx - cam.offsetX) * cam.scale + canvasW / 2,
    sy: (cam.offsetY - wy) * cam.scale + canvasH / 2, // Y flipped
  };
}

export function screenToWorld(
  sx: number,
  sy: number,
  cam: Camera,
  canvasW: number,
  canvasH: number,
): { wx: number; wy: number } {
  return {
    wx: (sx - canvasW / 2) / cam.scale + cam.offsetX,
    wy: cam.offsetY - (sy - canvasH / 2) / cam.scale,
  };
}

export function fitBounds(
  points: Point[],
  canvasW: number,
  canvasH: number,
  padding = 60,
): Camera {
  if (points.length === 0) {
    return { offsetX: 0, offsetY: 0, scale: 1 };
  }

  if (points.length === 1) {
    return { offsetX: points[0].x, offsetY: points[0].y, scale: 1 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const worldW = maxX - minX || 1;
  const worldH = maxY - minY || 1;
  const availW = Math.max(canvasW - padding * 2, 1);
  const availH = Math.max(canvasH - padding * 2, 1);

  const scale = Math.min(availW / worldW, availH / worldH);
  const offsetX = (minX + maxX) / 2;
  const offsetY = (minY + maxY) / 2;

  return { offsetX, offsetY, scale };
}
