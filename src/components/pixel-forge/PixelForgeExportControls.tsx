import { scaleLevels, type ScaleLevel } from '../../lib/pixelForge';

type PixelForgeExportControlsProps = {
  scale: ScaleLevel;
  sizeLabel: string;
  onCopy: () => void;
  onExport: () => void;
  onScaleChange: (scale: ScaleLevel) => void;
};

export function PixelForgeExportControls({
  scale,
  sizeLabel,
  onCopy,
  onExport,
  onScaleChange,
}: PixelForgeExportControlsProps) {
  return (
    <section className="pf-controls">
      <h2>Export PNG</h2>
      <label>
        Scale
        <select value={scale} onChange={(event) => onScaleChange(Number(event.target.value) as ScaleLevel)}>
          {scaleLevels.map((level) => (
            <option key={level} value={level}>
              {level}x
            </option>
          ))}
        </select>
      </label>
      <span className="pf-exportSize">{sizeLabel}</span>
      <div className="pf-generatorActions">
        <button className="pf-primary" onClick={onExport}>
          Export PNG
        </button>
        <button onClick={onCopy}>Copy PNG</button>
      </div>
    </section>
  );
}
