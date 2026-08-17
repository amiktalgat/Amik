import { CANVAS_SIZE, type BattlePixel } from './pixelBattle';

export type DrawCamera = { x: number; y: number; zoom: number };
export type DrawSize = { width: number; height: number };
export type ReferenceImage = {
  image: HTMLImageElement;
  opacity: number;
  scale: number;
  x: number;
  y: number;
};

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
  if (camera.zoom < 3) return;
  const canvasLeft = size.width / 2 - camera.x * camera.zoom;
  const canvasTop = size.height / 2 - camera.y * camera.zoom;
  const canvasSide = CANVAS_SIZE * camera.zoom;
  const startX = Math.max(0, Math.floor(camera.x - size.width / 2 / camera.zoom));
  const endX = Math.min(CANVAS_SIZE, Math.ceil(camera.x + size.width / 2 / camera.zoom));
  const startY = Math.max(0, Math.floor(camera.y - size.height / 2 / camera.zoom));
  const endY = Math.min(CANVAS_SIZE, Math.ceil(camera.y + size.height / 2 / camera.zoom));

  ctx.save();
  ctx.beginPath();
  ctx.rect(canvasLeft, canvasTop, canvasSide, canvasSide);
  ctx.clip();
  ctx.strokeStyle = 'rgba(23, 32, 51, 0.16)';
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
  ctx.restore();
}

export function drawReferenceImage(
  ctx: CanvasRenderingContext2D,
  reference: ReferenceImage,
  camera: DrawCamera,
  size: DrawSize,
) {
  const maxWorldSize = 640;
  const scale = Math.min(maxWorldSize / reference.image.naturalWidth, maxWorldSize / reference.image.naturalHeight, 1);
  const worldWidth = reference.image.naturalWidth * scale * reference.scale;
  const worldHeight = reference.image.naturalHeight * scale * reference.scale;
  const worldLeft = reference.x - worldWidth / 2;
  const worldTop = reference.y - worldHeight / 2;
  const sx = size.width / 2 + (worldLeft - camera.x) * camera.zoom;
  const sy = size.height / 2 + (worldTop - camera.y) * camera.zoom;

  ctx.save();
  ctx.globalAlpha = reference.opacity;
  ctx.drawImage(reference.image, sx, sy, worldWidth * camera.zoom, worldHeight * camera.zoom);
  ctx.restore();
}

export function drawCanvasFrame(ctx: CanvasRenderingContext2D, camera: DrawCamera, size: DrawSize) {
  const left = size.width / 2 - camera.x * camera.zoom;
  const top = size.height / 2 - camera.y * camera.zoom;
  const side = CANVAS_SIZE * camera.zoom;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(left, top, side, side);
  ctx.strokeStyle = '#172033';
  ctx.lineWidth = Math.max(2, Math.min(6, camera.zoom * 0.45));
  ctx.strokeRect(left + 0.5, top + 0.5, side - 1, side - 1);
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
