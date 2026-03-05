import { Shape } from 'react-konva';
import { gridColor } from '../../../theme/colors';

interface GridLayerProps {
  offsetX: number;
  offsetY: number;
  scale: number;
  width: number;
  height: number;
  gridStep: number;
}

export function GridLayer({ offsetX, offsetY, scale, width, height, gridStep }: GridLayerProps) {
  if (gridStep <= 0 || width === 0 || height === 0) return null;

  return (
    <Shape
      sceneFunc={(context, shape) => {
        const ctx = context._context;
        // Compute visible world bounds
        const topLeftWx = offsetX - width / 2 / scale;
        const topLeftWy = offsetY + height / 2 / scale;
        const botRightWx = offsetX + width / 2 / scale;
        const botRightWy = offsetY - height / 2 / scale;

        let step = gridStep;
        const screenStep = step * scale;
        const minSpacing = 40;
        if (screenStep < minSpacing) {
          const factor = Math.ceil(minSpacing / screenStep);
          step = gridStep * factor;
        }

        ctx.strokeStyle = gridColor();
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Vertical lines
        const startX = Math.floor(topLeftWx / step) * step;
        for (let wx = startX; wx <= botRightWx; wx += step) {
          const sx = (wx - offsetX) * scale + width / 2;
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, height);
        }

        // Horizontal lines
        const startY = Math.floor(botRightWy / step) * step;
        for (let wy = startY; wy <= topLeftWy; wy += step) {
          const sy = (offsetY - wy) * scale + height / 2;
          ctx.moveTo(0, sy);
          ctx.lineTo(width, sy);
        }

        ctx.stroke();
        context.fillStrokeShape(shape);
      }}
      listening={false}
    />
  );
}
