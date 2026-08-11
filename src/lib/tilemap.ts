export type TileSize = 8 | 16 | 32;
export type TilemapTool = 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'rectangle';

export type TileDefinition = {
  id: number;
  name: string;
  colors: [string, string, string];
  pattern: 'solid' | 'grass' | 'stone' | 'water' | 'path' | 'brick';
};

export type TileLayer = {
  id: string;
  name: string;
  isVisible: boolean;
  tiles: Array<number | null>;
};

export const tileSizes: TileSize[] = [8, 16, 32];

export const tilePalette: TileDefinition[] = [
  { id: 0, name: 'Grass', colors: ['#2E9B4F', '#51C878', '#1E6F3A'], pattern: 'grass' },
  { id: 1, name: 'Stone', colors: ['#5F6C7B', '#99A7B8', '#333B48'], pattern: 'stone' },
  { id: 2, name: 'Water', colors: ['#1267D8', '#43D9C7', '#0C356D'], pattern: 'water' },
  { id: 3, name: 'Path', colors: ['#9B7342', '#D4A35E', '#5F4329'], pattern: 'path' },
  { id: 4, name: 'Brick', colors: ['#9B3D3D', '#D96557', '#572323'], pattern: 'brick' },
  { id: 5, name: 'Light', colors: ['#FFD166', '#FFF0A3', '#B87822'], pattern: 'solid' },
];

export function makeEmptyTiles(width: number, height: number) {
  return Array<number | null>(width * height).fill(null);
}

export function makeLayer(name: string, width: number, height: number): TileLayer {
  return {
    id: crypto.randomUUID(),
    name,
    isVisible: true,
    tiles: makeEmptyTiles(width, height),
  };
}

export function makeDefaultLayers(width: number, height: number) {
  return ['Background', 'Ground', 'Objects', 'Foreground'].map((name) => makeLayer(name, width, height));
}

export function makeStarterLayers(width: number, height: number) {
  const layers = makeDefaultLayers(width, height);
  const background = layers[0];
  const ground = layers[1];
  const objects = layers[2];

  background.tiles = background.tiles.map((_, index) => {
    const y = Math.floor(index / width);
    return y < Math.floor(height * 0.36) ? 2 : 0;
  });

  ground.tiles = ground.tiles.map((_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    const center = Math.floor(width / 2);
    if (Math.abs(x - center) <= 2 && y > Math.floor(height * 0.38)) return 3;
    if (y === Math.floor(height * 0.36) && x > 2 && x < width - 3) return 1;
    return null;
  });

  objects.tiles = objects.tiles.map((_, index) => {
    const x = index % width;
    const y = Math.floor(index / width);
    if ((x === 5 && y === 10) || (x === 18 && y === 8)) return 4;
    if ((x === 4 && y === 9) || (x === 19 && y === 7)) return 5;
    return null;
  });

  return layers;
}

export function drawTile(
  context: CanvasRenderingContext2D,
  tile: TileDefinition,
  x: number,
  y: number,
  size: number,
) {
  context.fillStyle = tile.colors[0];
  context.fillRect(x, y, size, size);

  if (tile.pattern === 'solid') return;

  context.fillStyle = tile.colors[1];
  if (tile.pattern === 'grass') {
    for (let i = 1; i < size; i += 4) context.fillRect(x + i, y + ((i * 3) % size), 1, 3);
  }
  if (tile.pattern === 'stone') {
    context.fillRect(x + 2, y + 2, size - 4, 2);
    context.fillRect(x + 3, y + size - 5, size - 6, 2);
  }
  if (tile.pattern === 'water') {
    for (let row = 2; row < size; row += 5) context.fillRect(x + (row % 4), y + row, size - 4, 2);
  }
  if (tile.pattern === 'path') {
    context.fillRect(x + 1, y + 1, 2, 2);
    context.fillRect(x + size - 4, y + size - 5, 2, 2);
  }
  if (tile.pattern === 'brick') {
    const half = Math.max(2, Math.floor(size / 2));
    context.fillRect(x, y + half, size, 1);
    context.fillRect(x + half, y, 1, half);
    context.fillRect(x + Math.floor(half / 2), y + half, 1, half);
  }

  context.fillStyle = tile.colors[2];
  context.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
}

export function exportTilemapJson(width: number, height: number, tileSize: TileSize, layers: TileLayer[]) {
  return {
    width,
    height,
    tileSize,
    palette: tilePalette.map(({ id, name, pattern }) => ({ id, name, pattern })),
    layers: layers.map(({ name, isVisible, tiles }) => ({ name, isVisible, tiles })),
  };
}

export function renderTilemapToCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  tileSize: TileSize,
  layers: TileLayer[],
) {
  const context = canvas.getContext('2d');
  if (!context) return false;

  canvas.width = width * tileSize;
  canvas.height = height * tileSize;
  context.clearRect(0, 0, canvas.width, canvas.height);
  layers.filter((layer) => layer.isVisible).forEach((layer) => {
    layer.tiles.forEach((tileId, index) => {
      const tile = tilePalette.find((item) => item.id === tileId);
      if (!tile) return;
      drawTile(context, tile, (index % width) * tileSize, Math.floor(index / width) * tileSize, tileSize);
    });
  });

  return true;
}
