import { Shape } from 'react-konva';

interface NorthArrowProps {
  stageWidth: number;
}

export function NorthArrow({ stageWidth }: NorthArrowProps) {
  return (
    <Shape
      sceneFunc={(context) => {
        const ctx = context._context;
        const cx = stageWidth - 30;
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
      }}
      listening={false}
    />
  );
}
