import type { Point, Selection, Segment } from '../../domain/types';
import type { Camera } from './camera';
import { worldToScreen } from './camera';
import { computeVector, degreesToMils } from '../../domain/navigation';
import type { AngleUnit } from '../../domain/types';
import { getPointColor, gridColor } from '../../theme/colors';

interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  cam: Camera;
  canvasW: number;
  canvasH: number;
  points: Point[];
  selection: Selection;
  declinationDeg: number;
  angleUnit: AngleUnit;
  milsPerCircle: number;
  gridStep: number;
  segmentAzimuths: { magneticAzimuth: number; trueAzimuth: number }[];
  selectedLegIndex: number | null;
  selectedPointIndex: number | null;
  segments: Segment[];
  unitsLabel: string;
}

const ROUTE_COLOR = '#22c55e';
const VECTOR_COLOR = '#8b5cf6';

// Base sizes in world units — these scale with zoom
const BASE_BADGE_RADIUS = 8;
const BASE_FONT_SIZE = 10;
const BASE_LABEL_FONT_SIZE = 9;
const BASE_ROUTE_WIDTH = 3;
const BASE_ARROWHEAD_LEN = 12;

// Minimum screen-pixel sizes so things remain visible when zoomed out
const MIN_BADGE_RADIUS_PX = 10;
const MIN_FONT_SIZE_PX = 10;
const MIN_ROUTE_WIDTH_PX = 3;

function worldSize(base: number, scale: number, minPx: number): number {
  return Math.max(base * scale, minPx);
}

function formatNum(n: number): string {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

function formatAzimuth(deg: number, unit: AngleUnit, M: number): string {
  if (unit === 'mils') {
    return `${Math.round(degreesToMils(deg, M))} mil`;
  }
  return `${formatNum(deg)}°`;
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  toX: number,
  toY: number,
  fromX: number,
  fromY: number,
  headLen: number,
  color: string,
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function drawGrid(opts: RenderOptions) {
  const { ctx, cam, canvasW, canvasH, gridStep } = opts;
  if (gridStep <= 0) return;

  const topLeftW = { wx: cam.offsetX - canvasW / 2 / cam.scale, wy: cam.offsetY + canvasH / 2 / cam.scale };
  const botRightW = { wx: cam.offsetX + canvasW / 2 / cam.scale, wy: cam.offsetY - canvasH / 2 / cam.scale };

  let step = gridStep;
  const screenStep = step * cam.scale;
  const dpr = window.devicePixelRatio || 1;
  const minSpacing = 40 * dpr;
  if (screenStep < minSpacing) {
    const factor = Math.ceil(minSpacing / screenStep);
    step = gridStep * factor;
  }

  ctx.strokeStyle = gridColor();
  ctx.lineWidth = 0.5;
  ctx.beginPath();

  const startX = Math.floor(topLeftW.wx / step) * step;
  for (let wx = startX; wx <= botRightW.wx; wx += step) {
    const { sx } = worldToScreen(wx, 0, cam, canvasW, canvasH);
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, canvasH);
  }

  const startY = Math.floor(botRightW.wy / step) * step;
  for (let wy = startY; wy <= topLeftW.wy; wy += step) {
    const { sy } = worldToScreen(0, wy, cam, canvasW, canvasH);
    ctx.moveTo(0, sy);
    ctx.lineTo(canvasW, sy);
  }

  ctx.stroke();
}

const SELECTED_LEG_COLOR = '#4ade80';

function drawRouteSegments(opts: RenderOptions) {
  const { ctx, cam, canvasW, canvasH, points, selectedLegIndex } = opts;
  if (points.length < 2) return;

  const lineWidth = worldSize(BASE_ROUTE_WIDTH, cam.scale, MIN_ROUTE_WIDTH_PX);
  const arrowLen = worldSize(BASE_ARROWHEAD_LEN, cam.scale, 10);
  ctx.lineCap = 'round';

  // Pass 1: draw non-selected legs
  for (let i = 0; i < points.length - 1; i++) {
    if (i === selectedLegIndex) continue;
    const p1 = worldToScreen(points[i].x, points[i].y, cam, canvasW, canvasH);
    const p2 = worldToScreen(points[i + 1].x, points[i + 1].y, cam, canvasW, canvasH);

    ctx.strokeStyle = ROUTE_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(p1.sx, p1.sy);
    ctx.lineTo(p2.sx, p2.sy);
    ctx.stroke();

    const dx = p2.sx - p1.sx;
    const dy = p2.sy - p1.sy;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (segLen > arrowLen * 1.5) {
      drawArrowhead(ctx, p2.sx, p2.sy, p1.sx, p1.sy, arrowLen, ROUTE_COLOR);
    }
  }

  // Pass 2: draw selected leg on top (thicker, lighter green)
  if (selectedLegIndex !== null && selectedLegIndex < points.length - 1) {
    const p1 = worldToScreen(points[selectedLegIndex].x, points[selectedLegIndex].y, cam, canvasW, canvasH);
    const p2 = worldToScreen(points[selectedLegIndex + 1].x, points[selectedLegIndex + 1].y, cam, canvasW, canvasH);

    ctx.strokeStyle = SELECTED_LEG_COLOR;
    ctx.lineWidth = lineWidth * 2;
    ctx.beginPath();
    ctx.moveTo(p1.sx, p1.sy);
    ctx.lineTo(p2.sx, p2.sy);
    ctx.stroke();

    const dx = p2.sx - p1.sx;
    const dy = p2.sy - p1.sy;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (segLen > arrowLen * 1.5) {
      drawArrowhead(ctx, p2.sx, p2.sy, p1.sx, p1.sy, arrowLen, SELECTED_LEG_COLOR);
    }
  }
}

function drawSelectedLegCard(opts: RenderOptions) {
  const { ctx, cam, canvasW, canvasH, points, selectedLegIndex, segments, segmentAzimuths, angleUnit, milsPerCircle, unitsLabel } = opts;
  if (selectedLegIndex === null || selectedLegIndex >= points.length - 1) return;

  const p1 = worldToScreen(points[selectedLegIndex].x, points[selectedLegIndex].y, cam, canvasW, canvasH);
  const p2 = worldToScreen(points[selectedLegIndex + 1].x, points[selectedLegIndex + 1].y, cam, canvasW, canvasH);

  const mx = (p1.sx + p2.sx) / 2;
  const my = (p1.sy + p2.sy) / 2;

  const az = segmentAzimuths[selectedLegIndex];
  const azStr = formatAzimuth(az.magneticAzimuth, angleUnit, milsPerCircle);
  const lengthVal = formatNum(segments[selectedLegIndex].length);
  const lengthPart = unitsLabel ? `${lengthVal}\u00A0${unitsLabel}` : lengthVal;
  const label = `MAG ${azStr} \u00B7 ${lengthPart}`;

  const fontSize = worldSize(BASE_LABEL_FONT_SIZE, cam.scale, MIN_FONT_SIZE_PX);

  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textW = ctx.measureText(label).width;
  const padX = 8, padY = 5;

  const boxW = textW + padX * 2;
  const boxH = fontSize + padY * 2;
  const boxX = mx - boxW / 2;
  const boxY = my - boxH / 2;

  // Background
  ctx.fillStyle = 'rgba(0,30,0,0.7)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 6);
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(74,222,128,0.4)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Text
  ctx.fillStyle = SELECTED_LEG_COLOR;
  ctx.fillText(label, mx, my + 1);
}

const SELECTED_POINT_COLOR = '#fbbf24';

function drawPointBadges(opts: RenderOptions) {
  const { ctx, cam, canvasW, canvasH, points, selection, selectedPointIndex } = opts;

  const badgeR = worldSize(BASE_BADGE_RADIUS, cam.scale, MIN_BADGE_RADIUS_PX);
  const fontSize = Math.max(badgeR * 1.2, MIN_FONT_SIZE_PX);
  const labelFontSize = Math.max(badgeR * 0.7, MIN_FONT_SIZE_PX * 0.85);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const p of points) {
    const { sx, sy } = worldToScreen(p.x, p.y, cam, canvasW, canvasH);
    const color = getPointColor(p.index, selection);

    // Highlight ring for map-selected point
    if (selectedPointIndex === p.index) {
      ctx.beginPath();
      ctx.arc(sx, sy, badgeR + 6, 0, Math.PI * 2);
      ctx.strokeStyle = SELECTED_POINT_COLOR;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Outer ring for FROM/TO
    if (p.index === selection.fromIndex || p.index === selection.toIndex) {
      ctx.beginPath();
      ctx.arc(sx, sy, badgeR + 3, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Badge circle
    ctx.beginPath();
    ctx.arc(sx, sy, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Index number
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    ctx.fillText(String(p.index), sx, sy + 1);

    // Point label (only if user provided a custom one)
    if (p.label) {
      ctx.font = `${labelFontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'left';
      // Background pill
      const textW = ctx.measureText(p.label).width;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.roundRect(sx + badgeR + 4, sy - labelFontSize / 2 - 2, textW + 8, labelFontSize + 4, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(p.label, sx + badgeR + 8, sy + 1);
      ctx.textAlign = 'center';
    }
  }
}

function drawFromToVector(opts: RenderOptions) {
  const { ctx, cam, canvasW, canvasH, points, selection, declinationDeg, angleUnit, milsPerCircle, unitsLabel } = opts;
  if (selection.fromIndex === selection.toIndex) return;

  const from = points[selection.fromIndex];
  const to = points[selection.toIndex];
  if (!from || !to) return;

  const vec = computeVector(from, to, declinationDeg);
  if (vec.distance < 1e-10) return;

  const p1 = worldToScreen(from.x, from.y, cam, canvasW, canvasH);
  const p2 = worldToScreen(to.x, to.y, cam, canvasW, canvasH);

  const lineWidth = worldSize(BASE_ROUTE_WIDTH * 0.8, cam.scale, 2);
  const arrowLen = worldSize(BASE_ARROWHEAD_LEN * 1.2, cam.scale, 14);
  const fontSize = worldSize(BASE_FONT_SIZE, cam.scale, MIN_FONT_SIZE_PX);

  // Dashed line
  ctx.strokeStyle = VECTOR_COLOR;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash([lineWidth * 4, lineWidth * 3]);
  ctx.beginPath();
  ctx.moveTo(p1.sx, p1.sy);
  ctx.lineTo(p2.sx, p2.sy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowhead
  const segLen = Math.hypot(p2.sx - p1.sx, p2.sy - p1.sy);
  if (segLen > arrowLen * 1.5) {
    drawArrowhead(ctx, p2.sx, p2.sy, p1.sx, p1.sy, arrowLen, VECTOR_COLOR);
  }

  // Label at midpoint — single compact line
  const mx = (p1.sx + p2.sx) / 2;
  const my = (p1.sy + p2.sy) / 2;

  const azStr = formatAzimuth(vec.magneticAz, angleUnit, milsPerCircle);
  const distStr = formatNum(vec.distance);
  const distDisplay = unitsLabel ? `${distStr}\u00A0${unitsLabel}` : distStr;
  const labelText = `MAG ${azStr} \u00B7 ${distDisplay}`;

  const labelFontSize = fontSize * 0.9;
  ctx.font = `bold ${labelFontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const textW = ctx.measureText(labelText).width;
  const padX = 5, padY = 2;

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.roundRect(
    mx - textW / 2 - padX,
    my - labelFontSize / 2 - padY,
    textW + padX * 2,
    labelFontSize + padY * 2,
    3,
  );
  ctx.fill();

  ctx.fillStyle = VECTOR_COLOR;
  ctx.fillText(labelText, mx, my + 1);
}

function drawNorthArrow(ctx: CanvasRenderingContext2D, canvasW: number, _canvasH: number) {
  const cx = canvasW - 30;
  const cy = 40;
  const len = 24;

  ctx.strokeStyle = '#c00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + len / 2);
  ctx.lineTo(cx, cy - len / 2);
  ctx.stroke();

  ctx.fillStyle = '#c00';
  ctx.beginPath();
  ctx.moveTo(cx, cy - len / 2 - 4);
  ctx.lineTo(cx - 5, cy - len / 2 + 6);
  ctx.lineTo(cx + 5, cy - len / 2 + 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#c00';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy - len / 2 - 10);
}

export function render(opts: RenderOptions) {
  const { ctx, canvasW, canvasH } = opts;

  ctx.clearRect(0, 0, canvasW, canvasH);

  drawGrid(opts);
  drawRouteSegments(opts);
  drawSelectedLegCard(opts);
  drawFromToVector(opts);
  drawPointBadges(opts);
  drawNorthArrow(ctx, canvasW, canvasH);
}
