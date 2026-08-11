import { useEffect, useState } from 'react';
import { hexToRgb, normalizeHex } from '../../lib/pixelPalettes';

type ColorInspectorProps = {
  color: string;
  onAddToPalette: () => void;
  onColorChange: (color: string) => void;
  onStatus: (status: string) => void;
};

export function ColorInspector({ color, onAddToPalette, onColorChange, onStatus }: ColorInspectorProps) {
  const [hexDraft, setHexDraft] = useState(color);
  const rgb = hexToRgb(color);

  useEffect(() => {
    setHexDraft(color);
  }, [color]);

  const applyHex = () => {
    const normalized = normalizeHex(hexDraft);
    setHexDraft(normalized);
    onColorChange(normalized);
  };

  const copyHex = () => {
    void navigator.clipboard.writeText(color);
    onStatus('HEX copied');
  };

  return (
    <section>
      <h2>Current Color</h2>
      <div className="pf-currentColor">
        <input type="color" value={color} onChange={(event) => onColorChange(event.target.value)} />
        <div className="pf-colorMeta">
          <input
            aria-label="HEX color"
            value={hexDraft}
            onBlur={applyHex}
            onChange={(event) => setHexDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') applyHex();
            }}
          />
          <span>RGB {rgb.r}, {rgb.g}, {rgb.b}</span>
        </div>
      </div>
      <div className="pf-inlineActions">
        <button onClick={copyHex}>Copy HEX</button>
        <button onClick={onAddToPalette}>Add to Palette</button>
      </div>
    </section>
  );
}
