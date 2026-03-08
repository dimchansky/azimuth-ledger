import { Group, Circle, Text, Shape } from 'react-konva';
import type { Point, Selection } from '../../../domain/types';
import { getPointColor, selectionGlowColor } from '../../../theme/colors';

interface PointBadgesProps {
  points: Point[];
  selection: Selection;
  selectedPointIndex: number | null;
  scale: number;
  sizeScale: number;
}

const BADGE_RADIUS_PX = 10;
const FONT_SIZE_PX = 12;
const LABEL_FONT_SIZE_PX = 8.5;

export function PointBadges({ points, selection, selectedPointIndex, scale, sizeScale }: PointBadgesProps) {
  const sw = sizeScale;
  const screenR = BADGE_RADIUS_PX * sw / scale;
  const screenFontSize = FONT_SIZE_PX * sw / scale;
  const screenLabelFontSize = LABEL_FONT_SIZE_PX * sw / scale;

  return (
    <Group>
      {points.map((p) => {
        const color = getPointColor(p.index, selection);
        const isSelected = selectedPointIndex === p.index;
        const r = isSelected ? screenR * 1.4 : screenR;
        const fontSize = isSelected ? screenFontSize * 1.4 : screenFontSize;
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
              shadowBlur={isSelected ? BADGE_RADIUS_PX * sw / scale : 0}
              shadowEnabled={isSelected}
              hitStrokeWidth={10 / scale}
              name={`point-${p.index}`}
            />
            {/* Index number */}
            <Text
              text={String(p.index)}
              fontSize={fontSize}
              fontFamily="system-ui, sans-serif"
              fontStyle="bold"
              fill="#fff"
              align="center"
              verticalAlign="middle"
              offsetX={fontSize * 0.3}
              offsetY={fontSize * 0.45}
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
