import type { BattleTool } from '../../lib/pixelBattle';

type OwnerToolsProps = {
  brushSize: number;
  tool: BattleTool;
  onBrushSizeChange: (size: number) => void;
  onToolChange: (tool: BattleTool) => void;
};

const brushSizes = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48];

export function OwnerTools({ brushSize, tool, onBrushSizeChange, onToolChange }: OwnerToolsProps) {
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
