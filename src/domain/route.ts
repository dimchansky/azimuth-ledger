import { generateId } from './types';
import type { Segment } from './types';
import { magneticToTrue, normalizeDeg, trueToMagnetic } from './navigation';

export function reverseRoute(
  segments: Segment[],
  originLabel: string,
  decl: number,
): { segments: Segment[]; originLabel: string } {
  if (segments.length === 0) return { segments: [], originLabel };

  // Build full labels array: [originLabel, seg0.label, seg1.label, ...]
  const labels = [originLabel, ...segments.map((s) => s.label)];
  const reversedLabels = [...labels].reverse();

  const newOriginLabel = reversedLabels[0];
  const reversed = [...segments].reverse().map((seg, i) => {
    const trueDeg = magneticToTrue(seg.magneticAzimuth, decl);
    const reversedTrue = normalizeDeg(trueDeg + 180);
    const reversedMag = trueToMagnetic(reversedTrue, decl);

    return {
      id: generateId(),
      magneticAzimuth: reversedMag,
      length: seg.length,
      label: reversedLabels[i + 1],
    };
  });

  return { segments: reversed, originLabel: newOriginLabel };
}

export function clearRoute(): { segments: Segment[]; originLabel: string } {
  return { segments: [], originLabel: '' };
}
