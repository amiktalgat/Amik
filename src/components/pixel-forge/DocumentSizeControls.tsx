import type { CanvasSize } from '../../lib/pixelForge';

type DocumentSizeControlsProps = {
  size: CanvasSize;
  onChange: (size: CanvasSize) => void;
};

export function DocumentSizeControls({ size, onChange }: DocumentSizeControlsProps) {
  const changeSize = (key: keyof CanvasSize, value: string) => {
    onChange({ ...size, [key]: Number(value) });
  };

  return (
    <section className="pf-controls">
      <h2>Canvas Size</h2>
      <div className="pf-sizeGrid">
        <label>
          Width
          <input
            min="16"
            max="2048"
            step="1"
            type="number"
            value={size.width}
            onChange={(event) => changeSize('width', event.target.value)}
          />
        </label>
        <label>
          Height
          <input
            min="16"
            max="2048"
            step="1"
            type="number"
            value={size.height}
            onChange={(event) => changeSize('height', event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
