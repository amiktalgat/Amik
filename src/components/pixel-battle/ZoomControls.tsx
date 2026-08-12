type ZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onCenter: () => void;
};

export function ZoomControls({ onZoomIn, onZoomOut, onReset, onCenter }: ZoomControlsProps) {
  return (
    <section className="battle-panel battle-zoom" aria-label="Zoom controls">
      <button type="button" title="Zoom in" onClick={onZoomIn}>+</button>
      <button type="button" title="Zoom out" onClick={onZoomOut}>-</button>
      <button type="button" onClick={onReset}>Reset zoom</button>
      <button type="button" onClick={onCenter}>Center</button>
    </section>
  );
}
