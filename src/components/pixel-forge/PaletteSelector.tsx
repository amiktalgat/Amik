import { predefinedPalettes, type PaletteId } from '../../lib/pixelPalettes';

type PaletteSelectorProps = {
  customPalette: string[];
  value: PaletteId;
  onChange: (paletteId: PaletteId) => void;
};

export function PaletteSelector({ customPalette, value, onChange }: PaletteSelectorProps) {
  return (
    <section>
      <h2>Palettes</h2>
      <div className="pf-paletteList">
        {[...predefinedPalettes, { id: 'custom' as const, name: 'Custom', colors: customPalette }].map((palette) => (
          <button
            className={`pf-paletteOption ${value === palette.id ? 'active' : ''}`}
            key={palette.id}
            onClick={() => onChange(palette.id)}
          >
            <span>{palette.name}</span>
            <span className="pf-miniPalette">
              {(palette.colors.length > 0 ? palette.colors : ['#111722', '#E6EDF7']).slice(0, 8).map((color) => (
                <span className="pf-miniSwatch" key={`${palette.id}-${color}`} style={{ backgroundColor: color }} />
              ))}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
