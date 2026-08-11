import { zoomLevels, type ZoomLevel } from '../../lib/pixelForge';

type PixelForgeViewControlsProps = {
  gridOpacity: number;
  isGridVisible: boolean;
  zoom: ZoomLevel | 'fit';
  onFit: () => void;
  onGridOpacityChange: (opacity: number) => void;
  onGridVisibleChange: (isVisible: boolean) => void;
  onZoomChange: (zoom: ZoomLevel) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function PixelForgeViewControls({
  gridOpacity,
  isGridVisible,
  zoom,
  onFit,
  onGridOpacityChange,
  onGridVisibleChange,
  onZoomChange,
  onZoomIn,
  onZoomOut,
}: PixelForgeViewControlsProps) {
  return (
    <section className="pf-controls">
      <h2>Zoom</h2>
      <div className="pf-toolGrid">
        <button onClick={onZoomIn}>Zoom +</button>
        <button onClick={onZoomOut}>Zoom -</button>
        <button onClick={onFit}>Fit</button>
        <button onClick={() => onZoomChange(1)}>100%</button>
      </div>
      <select
        value={zoom === 'fit' ? 'fit' : String(zoom)}
        onChange={(event) => onZoomChange(Number(event.target.value) as ZoomLevel)}
      >
        <option value="fit" disabled>
          Fit
        </option>
        {zoomLevels.map((level) => (
          <option key={level} value={level}>
            {level * 100}%
          </option>
        ))}
      </select>
      <h2>Pixel Grid</h2>
      <label className="pf-checkbox">
        <input type="checkbox" checked={isGridVisible} onChange={(event) => onGridVisibleChange(event.target.checked)} />
        Show grid
      </label>
      <label>
        Opacity {gridOpacity}%
        <input
          type="range"
          min="10"
          max="100"
          step="10"
          value={gridOpacity}
          onChange={(event) => onGridOpacityChange(Number(event.target.value))}
        />
      </label>
    </section>
  );
}
