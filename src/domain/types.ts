export type AngleUnit = 'degrees' | 'mils';

export function generateId(): string {
  return Math.random().toString(36).slice(2);
}

export interface Segment {
  id: string;
  magneticAzimuth: number; // Stored in degrees [0, 360) — MAGNETIC
  length: number;          // Positive, unitless
  label: string;           // Destination point label, max 20 chars
}

export interface Point {
  index: number;
  x: number;
  y: number;
  label: string;
}

export interface Selection {
  fromIndex: number;
  toIndex: number;
}
