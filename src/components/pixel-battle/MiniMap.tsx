import { CANVAS_SIZE, type BattlePixel } from '../../lib/pixelBattle';

type MiniMapProps = {
  pixels: BattlePixel[];
  view: { x: number; y: number; width: number; height: number };
  onJump: (x: number, y: number) => void;
};

export function MiniMap({ pixels, view, onJump }: MiniMapProps) {
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * CANVAS_SIZE;
    const y = ((event.clientY - rect.top) / rect.height) * CANVAS_SIZE;
    onJump(x, y);
  }

  const box = {
    left: `${(view.x / CANVAS_SIZE) * 100}%`,
    top: `${(view.y / CANVAS_SIZE) * 100}%`,
    width: `${(view.width / CANVAS_SIZE) * 100}%`,
    height: `${(view.height / CANVAS_SIZE) * 100}%`,
  };

  return (
    <section className="battle-panel battle-minimap">
      <div className="battle-panel__title">Mini-map</div>
      <button className="battle-minimap__map" type="button" onClick={handleClick}>
        {pixels.map((pixel) => (
          <span
            key={`${pixel.x}:${pixel.y}`}
            style={{
              backgroundColor: pixel.color,
              left: `${(pixel.x / CANVAS_SIZE) * 100}%`,
              top: `${(pixel.y / CANVAS_SIZE) * 100}%`,
            }}
          />
        ))}
        <i style={box} />
      </button>
    </section>
  );
}
