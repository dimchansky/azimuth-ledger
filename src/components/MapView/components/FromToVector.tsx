import { Arrow, Shape } from 'react-konva';
import type { Point, Selection, AngleUnit } from '../../../domain/types';
import { computeVector, degreesToMils } from '../../../domain/navigation';
import { vectorColor, vectorLabelBg } from '../../../theme/colors';

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
  return `${formatNum(deg)}\u00B0`;
}

const BASE_ROUTE_WIDTH = 3;
const BASE_ARROWHEAD_LEN = 12;
const BASE_FONT_SIZE = 10;
const MIN_FONT_SIZE_PX = 10;

interface FromToVectorArrowProps {
  points: Point[];
  selection: Selection;
  scale: number;
}

export function FromToVectorArrow({ points, selection, scale }: FromToVectorArrowProps) {
  if (selection.fromIndex === selection.toIndex) return null;

  const from = points[selection.fromIndex];
  const to = points[selection.toIndex];
  if (!from || !to) return null;

  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  if (dist < 1e-10) return null;

  const vecCol = vectorColor();
  const lineWidth = worldSize(BASE_ROUTE_WIDTH * 0.8, scale, 2);
  const arrowLen = worldSize(BASE_ARROWHEAD_LEN * 1.2, scale, 14);
  const segLen = dist * scale;
  const showArrow = segLen > arrowLen * 1.5;

  const dashVal = lineWidth * 4 / scale;
  const gapVal = lineWidth * 3 / scale;

  return (
    <Arrow
      points={[from.x, -from.y, to.x, -to.y]}
      stroke={vecCol}
      strokeWidth={lineWidth / scale}
      fill={vecCol}
      dash={[dashVal, gapVal]}
      pointerLength={showArrow ? arrowLen / scale : 0}
      pointerWidth={showArrow ? arrowLen / scale : 0}
      lineCap="round"
      listening={false}
    />
  );
}

interface FromToVectorLabelProps {
  points: Point[];
  selection: Selection;
  declinationDeg: number;
  angleUnit: AngleUnit;
  milsPerCircle: number;
  unitsLabel: string;
  scale: number;
  stageWidth: number;
  stageHeight: number;
  offsetX: number;
  offsetY: number;
}

export function FromToVectorLabel({
  points,
  selection,
  declinationDeg,
  angleUnit,
  milsPerCircle,
  unitsLabel,
  scale,
  stageWidth,
  stageHeight,
  offsetX,
  offsetY,
}: FromToVectorLabelProps) {
  if (selection.fromIndex === selection.toIndex) return null;

  const from = points[selection.fromIndex];
  const to = points[selection.toIndex];
  if (!from || !to) return null;

  const vec = computeVector(from, to, declinationDeg);
  if (vec.distance < 1e-10) return null;

  const vecCol = vectorColor();

  const midWx = (from.x + to.x) / 2;
  const midWy = (from.y + to.y) / 2;
  const mx = (midWx - offsetX) * scale + stageWidth / 2;
  const my = (offsetY - midWy) * scale + stageHeight / 2;

  const azStr = formatAzimuth(vec.magneticAz, angleUnit, milsPerCircle);
  const distStr = formatNum(vec.distance);
  const distDisplay = unitsLabel ? `${distStr}\u00A0${unitsLabel}` : distStr;
  const labelText = `MAG ${azStr} \u00B7 ${distDisplay}`;

  const fontSize = worldSize(BASE_FONT_SIZE, scale, MIN_FONT_SIZE_PX);

  return (
    <Shape
      sceneFunc={(context) => {
        const ctx = context._context;
        const vecLabelBgColor = vectorLabelBg();
        const labelFontSize = fontSize * 0.9;
        ctx.font = `bold ${labelFontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textW = ctx.measureText(labelText).width;
        const padX = 5, padY = 2;

        ctx.fillStyle = vecLabelBgColor;
        ctx.beginPath();
        ctx.roundRect(
          mx - textW / 2 - padX,
          my - labelFontSize / 2 - padY,
          textW + padX * 2,
          labelFontSize + padY * 2,
          3,
        );
        ctx.fill();

        ctx.fillStyle = vecCol;
        ctx.fillText(labelText, mx, my + 1);
      }}
      listening={false}
    />
  );
}
