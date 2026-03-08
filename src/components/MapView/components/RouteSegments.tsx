import { Group, Arrow, Shape } from 'react-konva';
import type { Point, Segment, AngleUnit } from '../../../domain/types';
import { degreesToMils } from '../../../domain/navigation';

const ROUTE_COLOR = '#22c55e';
const SELECTED_LEG_COLOR = '#4ade80';

interface RouteSegmentsProps {
  points: Point[];
  selectedLegIndex: number | null;
  scale: number;
  sizeScale: number;
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

const ROUTE_WIDTH_PX = 3;
const ARROWHEAD_PX = 12;
const LABEL_FONT_PX = 12;

export function RouteSegments({
  points,
  selectedLegIndex,
  scale,
  sizeScale,
}: RouteSegmentsProps) {
  if (points.length < 2) return null;

  const sw = sizeScale;
  const legs: React.ReactNode[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const isSelected = i === selectedLegIndex;
    const color = isSelected ? SELECTED_LEG_COLOR : ROUTE_COLOR;
    const w = isSelected ? ROUTE_WIDTH_PX * 2 : ROUTE_WIDTH_PX;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const segLen = Math.sqrt(dx * dx + dy * dy) * scale;
    const showArrow = segLen > ARROWHEAD_PX * sw * 1.5;

    legs.push(
      <Arrow
        key={`leg-${i}`}
        points={[p1.x, -p1.y, p2.x, -p2.y]}
        stroke={color}
        strokeWidth={w * sw / scale}
        fill={color}
        pointerLength={showArrow ? ARROWHEAD_PX * sw / scale : 0}
        pointerWidth={showArrow ? ARROWHEAD_PX * sw / scale : 0}
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
  sizeScale: number;
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
  sizeScale,
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

  const fontSize = LABEL_FONT_PX * sizeScale;

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
