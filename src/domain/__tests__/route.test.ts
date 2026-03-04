import { describe, it, expect } from 'vitest';
import { reverseRoute, clearRoute } from '../route';
import { magneticToTrue, normalizeDeg, trueToMagnetic } from '../navigation';

describe('reverseRoute', () => {
  it('reverses azimuths via TRUE+180°', () => {
    const segments = [
      { id: '1', magneticAzimuth: 45, length: 100, label: 'P1' },
      { id: '2', magneticAzimuth: 90, length: 200, label: 'P2' },
    ];
    const decl = 10;
    const result = reverseRoute(segments, 'P0', decl);

    // Segment 2 (was mag=90, true=100) → reversed true=280 → reversed mag=270
    const true2 = magneticToTrue(90, decl); // 100
    const revTrue2 = normalizeDeg(true2 + 180); // 280
    const revMag2 = trueToMagnetic(revTrue2, decl); // 270
    expect(result.segments[0].magneticAzimuth).toBeCloseTo(revMag2);

    // Segment 1 (was mag=45, true=55) → reversed true=235 → reversed mag=225
    const true1 = magneticToTrue(45, decl); // 55
    const revTrue1 = normalizeDeg(true1 + 180); // 235
    const revMag1 = trueToMagnetic(revTrue1, decl); // 225
    expect(result.segments[1].magneticAzimuth).toBeCloseTo(revMag1);
  });

  it('reverses labels', () => {
    const segments = [
      { id: '1', magneticAzimuth: 0, length: 100, label: 'Camp' },
      { id: '2', magneticAzimuth: 90, length: 50, label: 'River' },
    ];
    const result = reverseRoute(segments, 'Start', 0);

    expect(result.originLabel).toBe('River');
    expect(result.segments[0].label).toBe('Camp');
    expect(result.segments[1].label).toBe('Start');
  });

  it('preserves lengths', () => {
    const segments = [
      { id: '1', magneticAzimuth: 0, length: 100, label: 'P1' },
      { id: '2', magneticAzimuth: 90, length: 200, label: 'P2' },
    ];
    const result = reverseRoute(segments, 'P0', 0);
    expect(result.segments[0].length).toBe(200);
    expect(result.segments[1].length).toBe(100);
  });

  it('handles empty segments', () => {
    const result = reverseRoute([], 'P0', 0);
    expect(result.segments).toEqual([]);
    expect(result.originLabel).toBe('P0');
  });

  it('handles zero declination', () => {
    const segments = [
      { id: '1', magneticAzimuth: 30, length: 100, label: 'P1' },
    ];
    const result = reverseRoute(segments, 'P0', 0);
    expect(result.segments[0].magneticAzimuth).toBeCloseTo(210);
  });
});

describe('clearRoute', () => {
  it('returns empty segments and default origin', () => {
    const result = clearRoute();
    expect(result.segments).toEqual([]);
    expect(result.originLabel).toBe('');
  });
});
