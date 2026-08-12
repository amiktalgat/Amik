import type { BattlePixel } from './pixelBattle';

export type DrawCamera = { x: number; y: number; zoom: number };
export type DrawSize = { width: number; height: number };

export function drawPixels(
  ctx: CanvasRenderingContext2D,
  pixels: BattlePixel[],
  camera: DrawCamera,
  size: DrawSize,
) {
  for (const pixel of pixels) {
    const sx = size.width / 2 + (pixel.x - camera.x) * camera.zoom;
    const sy = size.height / 2 + (pixel.y - camera.y) * camera.zoom;
    const pixelSize = Math.max(1, camera.zoom);
    if (sx < -pixelSize || sy < -pixelSize || sx > size.width || sy > size.height) continue;
    ctx.fillStyle = pixel.color;
    ctx.fillRect(Math.floor(sx), Math.floor(sy), Math.ceil(pixelSize), Math.ceil(pixelSize));
  }
}

export function drawGrid(ctx: CanvasRenderingContext2D, camera: DrawCamera, size: DrawSize) {
  if (camera.zoom < 8) return;
  const startX = Math.floor(camera.x - size.width / 2 / camera.zoom);
  const endX = Math.ceil(camera.x + size.width / 2 / camera.zoom);
  const startY = Math.floor(camera.y - size.height / 2 / camera.zoom);
  const endY = Math.ceil(camera.y + size.height / 2 / camera.zoom);
  ctx.strokeStyle = 'rgba(23, 32, 51, 0.12)';
  ctx.lineWidth = 1;
  for (let x = startX; x <= endX; x += 1) {
    const sx = Math.floor(size.width / 2 + (x - camera.x) * camera.zoom) + 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, size.height);
    ctx.stroke();
  }
  for (let y = startY; y <= endY; y += 1) {
    const sy = Math.floor(size.height / 2 + (y - camera.y) * camera.zoom) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(size.width, sy);
    ctx.stroke();
  }
}

export function drawHover(
  ctx: CanvasRenderingContext2D,
  hover: { x: number; y: number },
  camera: DrawCamera,
  size: DrawSize,
  color: string,
  canPlace: boolean,
) {
  const sx = size.width / 2 + (hover.x - camera.x) * camera.zoom;
  const sy = size.height / 2 + (hover.y - camera.y) * camera.zoom;
  ctx.globalAlpha = canPlace ? 0.45 : 0.18;
  ctx.fillStyle = color;
  ctx.fillRect(sx, sy, camera.zoom, camera.zoom);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(sx + 0.5, sy + 0.5, Math.max(1, camera.zoom - 1), Math.max(1, camera.zoom - 1));
}
