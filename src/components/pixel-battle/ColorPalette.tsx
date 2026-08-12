import { BATTLE_COLORS } from '../../lib/pixelBattle';

type ColorPaletteProps = {
  color: string;
  onChange: (color: string) => void;
};

export function ColorPalette({ color, onChange }: ColorPaletteProps) {
  return (
    <section className="battle-panel battle-palette" aria-label="Palette">
      <div className="battle-panel__title">Color</div>
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
    </section>
  );
}
