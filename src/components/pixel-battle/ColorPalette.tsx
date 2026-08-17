import { useState } from 'react';
import { BATTLE_COLORS } from '../../lib/pixelBattle';

type ColorPaletteProps = {
  color: string;
  onChange: (color: string) => void;
};

export function ColorPalette({ color, onChange }: ColorPaletteProps) {
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
          <div className="battle-swatches">
            {BATTLE_COLORS.map((item) => (
              <button
                aria-label={item}
                className={item.toLowerCase() === color.toLowerCase() ? 'active' : ''}
                key={item}
                style={{ backgroundColor: item }}
                type="button"
                onClick={() => onChange(item)}
              />
            ))}
          </div>
          <label className="battle-color-picker">
            Custom
            <input type="color" value={color} onChange={(event) => onChange(event.target.value)} />
          </label>
        </>
      )}
    </section>
  );
}
