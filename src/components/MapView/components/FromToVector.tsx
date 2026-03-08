import { Arrow, Shape } from 'react-konva';
import type { Point, Selection, AngleUnit } from '../../../domain/types';
import { computeVector, degreesToMils } from '../../../domain/navigation';
import { vectorColor, vectorLabelBg } from '../../../theme/colors';
import { pointInsetRadius, insetSegment } from '../constants';

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

const LINE_WIDTH_PX = 2.5;
const ARROW_PX = 14;
const LABEL_FONT_PX = 12;

interface FromToVectorArrowProps {
  points: Point[];
  selection: Selection;
  scale: number;
  sizeScale: number;
}

export function FromToVectorArrow({ points, selection, scale, sizeScale }: FromToVectorArrowProps) {
  if (selection.fromIndex === selection.toIndex) return null;

  const from = points[selection.fromIndex];
  const to = points[selection.toIndex];
  if (!from || !to) return null;

  const r1 = pointInsetRadius(from.index, selection, scale, sizeScale);
  const r2 = pointInsetRadius(to.index, selection, scale, sizeScale);
  const inset = insetSegment(from.x, -from.y, to.x, -to.y, r1, r2);
  if (!inset) return null;

  const vecCol = vectorColor();
  const sw = sizeScale;
  const screenLen = inset.len * scale;
  const showArrow = screenLen > ARROW_PX * sw * 1.5;

  const dashVal = LINE_WIDTH_PX * sw * 4 / scale;
  const gapVal = LINE_WIDTH_PX * sw * 3 / scale;

  return (
    <Arrow
      points={[inset.x1, inset.y1, inset.x2, inset.y2]}
      stroke={vecCol}
      strokeWidth={LINE_WIDTH_PX * sw / scale}
      fill={vecCol}
      dash={[dashVal, gapVal]}
      pointerLength={showArrow ? ARROW_PX * sw / scale : 0}
      pointerWidth={showArrow ? ARROW_PX * sw / scale : 0}
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
  sizeScale: number;
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
  sizeScale,
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

  const fontSize = LABEL_FONT_PX * sizeScale;

  return (
    <Shape
      sceneFunc={(context) => {
        const ctx = context._context;
        const vecLabelBgColor = vectorLabelBg();
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textW = ctx.measureText(labelText).width;
        const padX = 5, padY = 2;

        ctx.fillStyle = vecLabelBgColor;
        ctx.beginPath();
        ctx.roundRect(
          mx - textW / 2 - padX,
          my - fontSize / 2 - padY,
          textW + padX * 2,
          fontSize + padY * 2,
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
