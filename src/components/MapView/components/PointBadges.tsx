import { Group, Circle, Text, Shape } from 'react-konva';
import type { Point, Selection } from '../../../domain/types';
import { getPointColor, selectionGlowColor } from '../../../theme/colors';

interface PointBadgesProps {
  points: Point[];
  selection: Selection;
  selectedPointIndex: number | null;
  scale: number;
}

const BASE_BADGE_RADIUS = 8;
const MIN_BADGE_RADIUS_PX = 10;
const MIN_FONT_SIZE_PX = 10;

function worldSize(base: number, scale: number, minPx: number): number {
  return Math.max(base * scale, minPx);
}

export function PointBadges({ points, selection, selectedPointIndex, scale }: PointBadgesProps) {
  const badgeR = worldSize(BASE_BADGE_RADIUS, scale, MIN_BADGE_RADIUS_PX);
  const screenR = badgeR / scale;
  const fontSize = Math.max(badgeR * 1.2, MIN_FONT_SIZE_PX);
  const screenFontSize = fontSize / scale;
  const labelFontSize = Math.max(badgeR * 0.7, MIN_FONT_SIZE_PX * 0.85);
  const screenLabelFontSize = labelFontSize / scale;

  return (
    <Group>
      {points.map((p) => {
        const color = getPointColor(p.index, selection);
        const isSelected = selectedPointIndex === p.index;
        const r = isSelected ? screenR * 1.4 : screenR;
        const hasOuterRing = p.index === selection.fromIndex || p.index === selection.toIndex;

        return (
          <Group key={p.index} x={p.x} y={-p.y}>
            {/* Outer ring for FROM/TO */}
            {hasOuterRing && (
              <Circle
                radius={r + 3 / scale}
                stroke={color}
                strokeWidth={2 / scale}
                listening={false}
              />
            )}
            {/* Badge circle */}
            <Circle
              radius={r}
              fill={color}
              shadowColor={isSelected ? selectionGlowColor() : undefined}
              shadowBlur={isSelected ? badgeR : 0}
              shadowEnabled={isSelected}
              hitStrokeWidth={10 / scale}
              name={`point-${p.index}`}
            />
            {/* Index number */}
            <Text
              text={String(p.index)}
              fontSize={screenFontSize}
              fontFamily="system-ui, sans-serif"
              fontStyle="bold"
              fill="#fff"
              align="center"
              verticalAlign="middle"
              offsetX={screenFontSize * 0.3}
              offsetY={screenFontSize * 0.45}
              listening={false}
            />
            {/* Point label */}
            {p.label && (
              <PointLabel
                label={p.label}
                badgeR={screenR}
                fontSize={screenLabelFontSize}
              />
            )}
          </Group>
        );
      })}
    </Group>
  );
}

interface PointLabelProps {
  label: string;
  badgeR: number;
  fontSize: number;
}

function PointLabel({ label, badgeR, fontSize }: PointLabelProps) {
  return (
    <Shape
      sceneFunc={(context) => {
        // All coordinates here are in the shape's local space (world units).
        // The layer's scale transform converts to screen pixels.
        const ctx = context._context;
        ctx.save();
        ctx.font = `${fontSize}px system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const textW = ctx.measureText(label).width;
        const pillX = badgeR + fontSize * 0.4;
        const pillY = -fontSize / 2 - fontSize * 0.2;
        const pillW = textW + fontSize * 0.8;
        const pillH = fontSize + fontSize * 0.4;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, fontSize * 0.3);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(label, pillX + fontSize * 0.4, fontSize * 0.1);
        ctx.restore();
      }}
      listening={false}
    />
  );
}
