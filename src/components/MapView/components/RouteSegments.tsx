import { Group, Arrow, Shape } from 'react-konva';
import type { Point, Segment, AngleUnit } from '../../../domain/types';
import { degreesToMils } from '../../../domain/navigation';

const ROUTE_COLOR = '#22c55e';
const SELECTED_LEG_COLOR = '#4ade80';

interface RouteSegmentsProps {
  points: Point[];
  selectedLegIndex: number | null;
  scale: number;
}

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
const MIN_ROUTE_WIDTH_PX = 3;

export function RouteSegments({
  points,
  selectedLegIndex,
  scale,
}: RouteSegmentsProps) {
  if (points.length < 2) return null;

  const lineWidth = worldSize(BASE_ROUTE_WIDTH, scale, MIN_ROUTE_WIDTH_PX);
  const arrowLen = worldSize(BASE_ARROWHEAD_LEN, scale, 10);

  const legs: React.ReactNode[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const isSelected = i === selectedLegIndex;
    const color = isSelected ? SELECTED_LEG_COLOR : ROUTE_COLOR;
    const w = isSelected ? lineWidth * 2 : lineWidth;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLen = Math.sqrt(dx * dx + dy * dy) * scale;
    const showArrow = segLen > arrowLen * 1.5;

    legs.push(
      <Arrow
        key={`leg-${i}`}
        points={[p1.x, -p1.y, p2.x, -p2.y]}
        stroke={color}
        strokeWidth={w / scale}
        fill={color}
        pointerLength={showArrow ? arrowLen / scale : 0}
        pointerWidth={showArrow ? arrowLen / scale : 0}
        lineCap="round"
        hitStrokeWidth={20 / scale}
        name={`leg-${i}`}
      />,
    );
  }

  return <Group>{legs}</Group>;
}

interface SelectedLegCardProps {
  points: Point[];
  selectedLegIndex: number | null;
  scale: number;
  segments: Segment[];
  segmentAzimuths: { magneticAzimuth: number; trueAzimuth: number }[];
  angleUnit: AngleUnit;
  milsPerCircle: number;
  unitsLabel: string;
  stageWidth: number;
  stageHeight: number;
  offsetX: number;
  offsetY: number;
}

export function SelectedLegCard({
  points,
  selectedLegIndex,
  scale,
  segments,
  segmentAzimuths,
  angleUnit,
  milsPerCircle,
  unitsLabel,
  stageWidth,
  stageHeight,
  offsetX,
  offsetY,
}: SelectedLegCardProps) {
  if (selectedLegIndex === null || selectedLegIndex >= points.length - 1) return null;

  const p1 = points[selectedLegIndex];
  const p2 = points[selectedLegIndex + 1];

  // Compute screen-space midpoint
  const midWx = (p1.x + p2.x) / 2;
  const midWy = (p1.y + p2.y) / 2;
  const mx = (midWx - offsetX) * scale + stageWidth / 2;
  const my = (offsetY - midWy) * scale + stageHeight / 2;

  const az = segmentAzimuths[selectedLegIndex];
  const azStr = formatAzimuth(az.magneticAzimuth, angleUnit, milsPerCircle);
  const lengthVal = formatNum(segments[selectedLegIndex].length);
  const lengthPart = unitsLabel ? `${lengthVal}\u00A0${unitsLabel}` : lengthVal;
  const label = `MAG ${azStr} \u00B7 ${lengthPart}`;

  const fontSize = worldSize(9, scale, 10);

  return (
    <Shape
      sceneFunc={(context) => {
        const ctx = context._context;
        ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textW = ctx.measureText(label).width;
        const padX = 8, padY = 5;
        const boxW = textW + padX * 2;
        const boxH = fontSize + padY * 2;

        ctx.fillStyle = 'rgba(0,30,0,0.7)';
        ctx.beginPath();
        ctx.roundRect(mx - boxW / 2, my - boxH / 2, boxW, boxH, 6);
        ctx.fill();

        ctx.strokeStyle = 'rgba(74,222,128,0.4)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.fillStyle = SELECTED_LEG_COLOR;
        ctx.fillText(label, mx, my + 1);
      }}
      listening={false}
    />
  );
}
