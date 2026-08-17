import { useEffect } from 'react';
import type { BattleTool } from '../../lib/pixelBattle';

type OwnerToolsProps = {
  brushSize: number;
  canUseLargeEraser: boolean;
  tool: BattleTool;
  onBrushSizeChange: (size: number) => void;
  onToolChange: (tool: BattleTool) => void;
};

const paintBrushSizes = [1, 2, 4];
const smallBrushSizes = [1];

export function OwnerTools({
  brushSize,
  canUseLargeEraser,
  tool,
  onBrushSizeChange,
  onToolChange,
}: OwnerToolsProps) {
  const brushSizes = tool === 'erase' && !canUseLargeEraser ? smallBrushSizes : paintBrushSizes;

  useEffect(() => {
    if (!brushSizes.includes(brushSize)) onBrushSizeChange(brushSizes[0]);
  }, [brushSize, brushSizes, onBrushSizeChange]);

  return (
    <section className="battle-panel battle-owner-tools" aria-label="Owner tools">
      <div className="battle-panel__title">Owner tools</div>
      <div className="battle-tool-tabs">
        <button className={tool === 'paint' ? 'active' : ''} type="button" onClick={() => onToolChange('paint')}>
          Paint
        </button>
        <button className={tool === 'erase' ? 'active' : ''} type="button" onClick={() => onToolChange('erase')}>
          Erase
        </button>
      </div>
      <label className="battle-size-control">
        Size
        <select value={brushSize} onChange={(event) => onBrushSizeChange(Number(event.target.value))}>
          {brushSizes.map((size) => (
            <option key={size} value={size}>
              {size} x {size}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
