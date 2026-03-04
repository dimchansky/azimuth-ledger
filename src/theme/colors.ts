/** Resolve a CSS custom property from :root at call time (respects dark mode). */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function fromColor(): string { return cssVar('--from-color'); }
export function toColor(): string { return cssVar('--to-color'); }
export function pointColor(): string { return cssVar('--point-color'); }
export function segmentColor(): string { return cssVar('--segment-color'); }
export function gridColor(): string { return cssVar('--grid-color'); }

/** Resolve the badge color for a point given the current FROM/TO selection. */
export function getPointColor(
  pointIndex: number,
  selection: { fromIndex: number; toIndex: number },
): string {
  if (pointIndex === selection.fromIndex) return fromColor();
  if (pointIndex === selection.toIndex) return toColor();
  return pointColor();
}
