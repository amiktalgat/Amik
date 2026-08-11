import { useEffect, useRef } from 'react';
import { drawTile, tilePalette, type TileSize } from '../../lib/tilemap';

type TilemapPaletteProps = {
  selectedTileId: number;
  tileSize: TileSize;
  onSelectTile: (tileId: number) => void;
};

export function TilemapPalette({ selectedTileId, tileSize, onSelectTile }: TilemapPaletteProps) {
  return (
    <section className="pf-controls">
      <h2>Тайлы</h2>
      <div className="pf-tilePalette">
        {tilePalette.map((tile) => (
          <button
            className={`pf-tileSwatch ${selectedTileId === tile.id ? 'active' : ''}`}
            key={tile.id}
            title={tile.name}
            onClick={() => onSelectTile(tile.id)}
          >
            <TilePreview tileId={tile.id} tileSize={tileSize} />
            <span>{tileNameRu(tile.name)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function tileNameRu(name: string) {
  const labels: Record<string, string> = {
    Grass: 'Трава',
    Stone: 'Камень',
    Water: 'Вода',
    Path: 'Дорога',
    Brick: 'Кирпич',
    Light: 'Свет',
  };
  return labels[name] ?? name;
}

type TilePreviewProps = {
  tileId: number;
  tileSize: TileSize;
};

function TilePreview({ tileId, tileSize }: TilePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const tile = tilePalette.find((item) => item.id === tileId);
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!tile || !canvas || !context) return;
    canvas.width = tileSize;
    canvas.height = tileSize;
    drawTile(context, tile, 0, 0, tileSize);
  }, [tileId, tileSize]);

  return <canvas ref={canvasRef} />;
}
