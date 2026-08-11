type CustomPaletteEditorProps = {
  colors: string[];
  currentColor: string;
  onChangeColor: (index: number, color: string) => void;
  onRemoveColor: (index: number) => void;
  onSelectColor: (color: string) => void;
};

export function CustomPaletteEditor({
  colors,
  currentColor,
  onChangeColor,
  onRemoveColor,
  onSelectColor,
}: CustomPaletteEditorProps) {
  return (
    <section>
      <h2>Custom Palette</h2>
      <div className="pf-customPalette">
        {colors.map((color, index) => (
          <div className={`pf-customColor ${currentColor === color ? 'active' : ''}`} key={`${color}-${index}`}>
            <button aria-label={`Choose ${color}`} className="pf-swatch" onClick={() => onSelectColor(color)} style={{ backgroundColor: color }} />
            <input
              aria-label={`Edit ${color}`}
              type="color"
              value={color}
              onChange={(event) => onChangeColor(index, event.target.value)}
            />
            <button aria-label={`Remove ${color}`} onClick={() => onRemoveColor(index)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
