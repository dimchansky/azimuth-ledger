import type { Segment, Point, AngleUnit } from './types';

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function normalizeMils(mils: number, M: number): number {
  return ((mils % M) + M) % M;
}

export function normalizeAngle(value: number, unit: AngleUnit, M = 6000): number {
  return unit === 'degrees' ? normalizeDeg(value) : normalizeMils(value, M);
}

export function magneticToTrue(mag: number, decl: number): number {
  return normalizeDeg(mag + decl);
}

export function trueToMagnetic(trueDeg: number, decl: number): number {
  return normalizeDeg(trueDeg - decl);
}

export function formatNum(n: number): string {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

export function degreesToMils(deg: number, M: number): number {
  return deg * M / 360;
}

export function milsToDegrees(mils: number, M: number): number {
  return mils * 360 / M;
}

export function azimuthToVector(trueDeg: number, length: number): { dx: number; dy: number } {
  const rad = (trueDeg * Math.PI) / 180;
  return {
    dx: length * Math.sin(rad),
    dy: length * Math.cos(rad),
  };
}

export function computePoints(
  segments: Segment[],
  originLabel: string,
  decl: number,
): Point[] {
  const points: Point[] = [{ index: 0, x: 0, y: 0, label: originLabel }];
  let x = 0;
  let y = 0;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const trueDeg = magneticToTrue(seg.magneticAzimuth, decl);
    const { dx, dy } = azimuthToVector(trueDeg, seg.length);
    x += dx;
    y += dy;
    points.push({ index: i + 1, x, y, label: seg.label });
  }

  return points;
}

export function computeVector(
  from: Point,
  to: Point,
  decl: number,
): { distance: number; trueAz: number; magneticAz: number } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // atan2(dx, dy) gives angle from North (Y-axis) clockwise
  const trueAz = distance < 1e-10 ? 0 : normalizeDeg((Math.atan2(dx, dy) * 180) / Math.PI);
  const magneticAz = trueToMagnetic(trueAz, decl);

  return { distance, trueAz, magneticAz };
}
