import { useState } from 'react';
import { BATTLE_COLORS, type BattleTool } from '../../lib/pixelBattle';

type ColorPaletteProps = {
  color: string;
  tool: BattleTool;
  onChange: (color: string) => void;
  onToolChange: (tool: BattleTool) => void;
};

export function ColorPalette({ color, tool, onChange, onToolChange }: ColorPaletteProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="battle-panel battle-palette" aria-label="Palette">
      <div className="battle-collapsible-title">
        <div className="battle-panel__title">Color</div>
        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Hide colors' : 'Show colors'}
          type="button"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? '^' : 'v'}
        </button>
      </div>
      {isOpen && (
        <>
          <button
            className={`battle-picker-tool ${tool === 'eyedropper' ? 'active' : ''}`}
            type="button"
            onClick={() => onToolChange(tool === 'eyedropper' ? 'paint' : 'eyedropper')}
          >
            Eyedropper
          </button>
          <div className="battle-swatches">
            {BATTLE_COLORS.map((item) => (
              <button
                aria-label={item}
                className={item.toLowerCase() === color.toLowerCase() ? 'active' : ''}
                key={item}
                style={{ backgroundColor: item }}
                type="button"
                onClick={() => {
                  onChange(item);
                  if (tool === 'eyedropper') onToolChange('paint');
                }}
              />
            ))}
          </div>
          <label className="battle-color-picker">
            Custom
            <input
              type="color"
              value={color}
              onChange={(event) => {
                onChange(event.target.value);
                if (tool === 'eyedropper') onToolChange('paint');
              }}
            />
          </label>
        </>
      )}
    </section>
  );
}
