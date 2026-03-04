import { describe, it, expect } from 'vitest';
import {
  normalizeDeg,
  normalizeMils,
  magneticToTrue,
  trueToMagnetic,
  degreesToMils,
  milsToDegrees,
  azimuthToVector,
  computePoints,
  computeVector,
} from '../navigation';

describe('normalizeDeg', () => {
  it('normalizes negative values', () => {
    expect(normalizeDeg(-1)).toBeCloseTo(359);
    expect(normalizeDeg(-360)).toBeCloseTo(0);
  });

  it('normalizes values >= 360', () => {
    expect(normalizeDeg(360)).toBeCloseTo(0);
    expect(normalizeDeg(361)).toBeCloseTo(1);
  });

  it('keeps 0 as 0', () => {
    expect(normalizeDeg(0)).toBe(0);
  });

  it('keeps decimals', () => {
    expect(normalizeDeg(359.5)).toBeCloseTo(359.5);
  });
});

describe('normalizeMils', () => {
  it('normalizes with M=6000', () => {
    expect(normalizeMils(-1, 6000)).toBeCloseTo(5999);
    expect(normalizeMils(0, 6000)).toBe(0);
    expect(normalizeMils(6000, 6000)).toBeCloseTo(0);
    expect(normalizeMils(6001, 6000)).toBeCloseTo(1);
  });

  it('normalizes with M=6400', () => {
    expect(normalizeMils(-1, 6400)).toBeCloseTo(6399);
    expect(normalizeMils(6400, 6400)).toBeCloseTo(0);
  });

  it('handles decimals', () => {
    expect(normalizeMils(5999.5, 6000)).toBeCloseTo(5999.5);
  });
});

describe('magneticToTrue / trueToMagnetic', () => {
  it('round-trips with positive declination', () => {
    const mag = 45;
    const decl = 10;
    const trueDeg = magneticToTrue(mag, decl);
    expect(trueDeg).toBeCloseTo(55);
    expect(trueToMagnetic(trueDeg, decl)).toBeCloseTo(mag);
  });

  it('round-trips with negative declination', () => {
    const mag = 10;
    const decl = -15;
    const trueDeg = magneticToTrue(mag, decl);
    expect(trueDeg).toBeCloseTo(355);
    expect(trueToMagnetic(trueDeg, decl)).toBeCloseTo(mag);
  });

  it('handles wrap-around', () => {
    expect(magneticToTrue(350, 20)).toBeCloseTo(10);
    expect(trueToMagnetic(5, 20)).toBeCloseTo(345);
  });
});

describe('degreesToMils / milsToDegrees', () => {
  it('converts with M=6000', () => {
    expect(degreesToMils(90, 6000)).toBeCloseTo(1500);
    expect(milsToDegrees(1500, 6000)).toBeCloseTo(90);
  });

  it('converts with M=6400', () => {
    expect(degreesToMils(90, 6400)).toBeCloseTo(1600);
    expect(milsToDegrees(1600, 6400)).toBeCloseTo(90);
  });

  it('round-trips', () => {
    const deg = 123.45;
    expect(milsToDegrees(degreesToMils(deg, 6000), 6000)).toBeCloseTo(deg);
  });
});

describe('azimuthToVector', () => {
  it('0° → due North (dx=0, dy=len)', () => {
    const { dx, dy } = azimuthToVector(0, 100);
    expect(dx).toBeCloseTo(0);
    expect(dy).toBeCloseTo(100);
  });

  it('90° → due East (dx=len, dy=0)', () => {
    const { dx, dy } = azimuthToVector(90, 100);
    expect(dx).toBeCloseTo(100);
    expect(dy).toBeCloseTo(0);
  });

  it('180° → due South (dx=0, dy=-len)', () => {
    const { dx, dy } = azimuthToVector(180, 100);
    expect(dx).toBeCloseTo(0);
    expect(dy).toBeCloseTo(-100);
  });

  it('270° → due West (dx=-len, dy=0)', () => {
    const { dx, dy } = azimuthToVector(270, 100);
    expect(dx).toBeCloseTo(-100);
    expect(dy).toBeCloseTo(0);
  });
});

describe('computePoints', () => {
  it('computes multi-segment route', () => {
    const segments = [
      { id: '1', magneticAzimuth: 0, length: 100, label: 'P1' },
      { id: '2', magneticAzimuth: 90, length: 50, label: 'P2' },
    ];
    const points = computePoints(segments, 'P0', 0);

    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ index: 0, x: 0, y: 0, label: 'P0' });
    expect(points[1].x).toBeCloseTo(0);
    expect(points[1].y).toBeCloseTo(100);
    expect(points[2].x).toBeCloseTo(50);
    expect(points[2].y).toBeCloseTo(100);
  });

  it('accounts for declination', () => {
    const segments = [
      { id: '1', magneticAzimuth: 0, length: 100, label: 'P1' },
    ];
    // With declination of 10°, mag 0° → true 10°
    const points = computePoints(segments, 'P0', 10);
    expect(points[1].x).toBeCloseTo(100 * Math.sin((10 * Math.PI) / 180));
    expect(points[1].y).toBeCloseTo(100 * Math.cos((10 * Math.PI) / 180));
  });
});

describe('computeVector', () => {
  it('computes azimuth to the East = 90°', () => {
    const from = { index: 0, x: 0, y: 0, label: 'A' };
    const to = { index: 1, x: 1, y: 0, label: 'B' };
    const result = computeVector(from, to, 0);
    expect(result.trueAz).toBeCloseTo(90);
    expect(result.distance).toBeCloseTo(1);
  });

  it('computes azimuth to the North = 0°', () => {
    const from = { index: 0, x: 0, y: 0, label: 'A' };
    const to = { index: 1, x: 0, y: 1, label: 'B' };
    const result = computeVector(from, to, 0);
    expect(result.trueAz).toBeCloseTo(0);
  });

  it('computes azimuth to the West = 270°', () => {
    const from = { index: 0, x: 0, y: 0, label: 'A' };
    const to = { index: 1, x: -1, y: 0, label: 'B' };
    const result = computeVector(from, to, 0);
    expect(result.trueAz).toBeCloseTo(270);
  });

  it('applies declination to magnetic azimuth', () => {
    const from = { index: 0, x: 0, y: 0, label: 'A' };
    const to = { index: 1, x: 1, y: 0, label: 'B' };
    const result = computeVector(from, to, 5);
    expect(result.trueAz).toBeCloseTo(90);
    expect(result.magneticAz).toBeCloseTo(85);
  });
});
