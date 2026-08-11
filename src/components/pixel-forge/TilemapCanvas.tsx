import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { renderTilemapToCanvas, type TileLayer, type TilemapTool, type TileSize } from '../../lib/tilemap';

type TilemapCanvasProps = {
  activeLayerId: string;
  height: number;
  layers: TileLayer[];
  selectedTileId: number;
  tileSize: TileSize;
  tool: TilemapTool;
  width: number;
  onEyedrop: (tileId: number) => void;
  onLayersChange: (layers: TileLayer[]) => void;
  onStatus: (status: string) => void;
};
type CellPoint = { x: number; y: number };

export function TilemapCanvas({
  activeLayerId,
  height,
  layers,
  selectedTileId,
  tileSize,
  tool,
  width,
  onEyedrop,
  onLayersChange,
  onStatus,
}: TilemapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverCell, setHoverCell] = useState<CellPoint | null>(null);
  const [startCell, setStartCell] = useState<CellPoint | null>(null);
  const isPaintingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderTilemapToCanvas(canvas, width, height, tileSize, layers);
  }, [height, layers, tileSize, width]);

  const pointerToCell = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * height);
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    return { x, y };
  };

  const updateActiveLayer = (mutate: (tiles: Array<number | null>) => void) => {
    onLayersChange(layers.map((layer) => {
      if (layer.id !== activeLayerId) return layer;
      const tiles = [...layer.tiles];
      mutate(tiles);
      return { ...layer, tiles };
    }));
  };

  const paintCell = (cell: CellPoint) => {
    const index = cell.y * width + cell.x;
    const activeLayer = layers.find((layer) => layer.id === activeLayerId);
    if (!activeLayer) return;

    if (tool === 'eyedropper') {
      const tileId = activeLayer.tiles[index];
      if (tileId !== null) onEyedrop(tileId);
      onStatus(tileId === null ? 'Empty tile' : 'Tile picked');
      return;
    }

    if (tool === 'fill') {
      fillFrom(cell, activeLayer.tiles[index]);
      return;
    }

    const nextTile = tool === 'eraser' ? null : selectedTileId;
    updateActiveLayer((tiles) => {
      tiles[index] = nextTile;
    });
    onStatus(tool === 'eraser' ? 'Tile erased' : 'Tile painted');
  };

  const fillFrom = (cell: CellPoint, targetTile: number | null) => {
    if (targetTile === selectedTileId) return;
    updateActiveLayer((tiles) => {
      const queue: CellPoint[] = [cell];
      const visited = new Set<string>();
      while (queue.length > 0) {
        const current = queue.shift();
        if (!current) continue;
        const key = `${current.x}:${current.y}`;
        const index = current.y * width + current.x;
        if (visited.has(key) || tiles[index] !== targetTile) continue;
        visited.add(key);
        tiles[index] = selectedTileId;
        if (current.x > 0) queue.push({ x: current.x - 1, y: current.y });
        if (current.x < width - 1) queue.push({ x: current.x + 1, y: current.y });
        if (current.y > 0) queue.push({ x: current.x, y: current.y - 1 });
        if (current.y < height - 1) queue.push({ x: current.x, y: current.y + 1 });
      }
    });
    onStatus('Tile area filled');
  };

  const drawRectangle = (endCell: CellPoint) => {
    if (!startCell) return;
    const minX = Math.min(startCell.x, endCell.x);
    const maxX = Math.max(startCell.x, endCell.x);
    const minY = Math.min(startCell.y, endCell.y);
    const maxY = Math.max(startCell.y, endCell.y);
    updateActiveLayer((tiles) => {
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) tiles[y * width + x] = selectedTileId;
      }
    });
    onStatus('Rectangle placed');
  };

  const stopPainting = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    isPaintingRef.current = false;
    setStartCell(null);
  };

  return (
    <div className="pf-tilemapStage">
      <canvas
        ref={canvasRef}
        onPointerDown={(event) => {
          const cell = pointerToCell(event);
          if (!cell) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setStartCell(cell);
          isPaintingRef.current = true;
          if (tool !== 'rectangle') paintCell(cell);
        }}
        onPointerCancel={stopPainting}
        onPointerMove={(event) => {
          const cell = pointerToCell(event);
          setHoverCell(cell);
          if (cell && isPaintingRef.current && (tool === 'pencil' || tool === 'eraser')) paintCell(cell);
        }}
        onPointerUp={(event) => {
          const cell = pointerToCell(event);
          if (cell && tool === 'rectangle') drawRectangle(cell);
          stopPainting(event);
        }}
        onPointerLeave={() => setHoverCell(null)}
      />
      <span className="pf-tilemapGrid" style={{ backgroundSize: `${100 / width}% ${100 / height}%` }} />
      {hoverCell && (
        <span
          className="pf-tilemapHover"
          style={{
            height: `${100 / height}%`,
            left: `${(hoverCell.x / width) * 100}%`,
            top: `${(hoverCell.y / height) * 100}%`,
            width: `${100 / width}%`,
          }}
        />
      )}
    </div>
  );
}
