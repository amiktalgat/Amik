import { useEffect } from 'react';
import type { BattleTool } from '../../lib/pixelBattle';

type OwnerToolsProps = {
  brushSize: number;
  brushSizes: number[];
  canErase: boolean;
  tool: BattleTool;
  onBrushSizeChange: (size: number) => void;
  onToolChange: (tool: BattleTool) => void;
};

export function OwnerTools({
  brushSize,
  brushSizes,
  canErase,
  tool,
  onBrushSizeChange,
  onToolChange,
}: OwnerToolsProps) {
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
        {canErase && (
          <button className={tool === 'erase' ? 'active' : ''} type="button" onClick={() => onToolChange('erase')}>
            Erase
          </button>
        )}
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
