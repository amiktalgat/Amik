import { createImagePalette, reduceImageToPalette, type DitheringMode } from './pixelPalette';
import { paletteForRender, type PaletteId } from './pixelPalettes';

export type Tool = 'pencil' | 'eraser' | 'eyedropper' | 'fill';
export type TransformAction = 'flipHorizontal' | 'flipVertical' | 'rotateLeft' | 'rotateRight';
export type ZoomLevel = 1 | 2 | 4 | 8 | 16;
export type ScaleLevel = 1 | 2 | 4 | 8 | 16;

export const pixelSizeOptions = [8, 16, 24, 32, 48, 64, 96, 128] as const;
export const colorCountOptions = [4, 8, 12, 16, 24, 32] as const;
export const zoomLevels = [1, 2, 4, 8, 16] as const;
export const scaleLevels = [1, 2, 4, 8, 16] as const;

export type PixelSize = (typeof pixelSizeOptions)[number];
export type ColorCount = (typeof colorCountOptions)[number];

export type PixelSettings = {
  pixelSize: PixelSize;
  colorCount: ColorCount;
  paletteId: PaletteId;
  customPalette: string[];
  dithering: DitheringMode;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export const paletteColors = [
  '#7C5CFF',
  '#43D9C7',
  '#FFD166',
  '#EF476F',
  '#06D6A0',
  '#118AB2',
  '#F78C6B',
  '#E6EDF7',
  '#20283A',
  '#0B0D12',
  '#8F9BB3',
  '#B8F7FF',
];

export const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) => clamp(value, 0, 255).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase();
}

export function hexToRgba(hex: string) {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    a: 255,
  };
}

export function renderPixelArt(
  canvas: HTMLCanvasElement,
  original: HTMLCanvasElement,
  settings: PixelSettings,
  targetSize?: CanvasSize,
) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  const size = targetSize ?? fitInside(original.width, original.height, 1200);
  canvas.width = size.width;
  canvas.height = size.height;

  const resizedCanvas = document.createElement('canvas');
  resizedCanvas.width = size.width;
  resizedCanvas.height = size.height;

  const resizedContext = resizedCanvas.getContext('2d');
  if (!resizedContext) return;

  resizedContext.imageSmoothingEnabled = false;
  resizedContext.clearRect(0, 0, size.width, size.height);
  resizedContext.drawImage(original, 0, 0, size.width, size.height);

  const smallCanvas = document.createElement('canvas');
  smallCanvas.width = Math.max(1, Math.round(size.width / settings.pixelSize));
  smallCanvas.height = Math.max(1, Math.round(size.height / settings.pixelSize));

  const smallContext = smallCanvas.getContext('2d', { willReadFrequently: true });
  if (!smallContext) return;

  smallContext.imageSmoothingEnabled = false;
  smallContext.drawImage(resizedCanvas, 0, 0, smallCanvas.width, smallCanvas.height);

  const imageData = smallContext.getImageData(0, 0, smallCanvas.width, smallCanvas.height);
  const renderPalette = paletteForRender(settings.paletteId, settings.customPalette);
  const palette = renderPalette.length > 0 ? renderPalette : createImagePalette(imageData, settings.colorCount);
  if (palette.length > 0) {
    smallContext.putImageData(reduceImageToPalette(imageData, palette, settings.dithering), 0, 0);
  }

  context.clearRect(0, 0, size.width, size.height);
  context.imageSmoothingEnabled = false;
  context.drawImage(smallCanvas, 0, 0, size.width, size.height);
}

export function fitInside(width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function transformCanvas(canvas: HTMLCanvasElement, action: TransformAction) {
  const context = canvas.getContext('2d');
  if (!context || canvas.width === 0 || canvas.height === 0) return;

  const source = document.createElement('canvas');
  source.width = canvas.width;
  source.height = canvas.height;
  const sourceContext = source.getContext('2d');
  if (!sourceContext) return;

  sourceContext.imageSmoothingEnabled = false;
  sourceContext.drawImage(canvas, 0, 0);

  const shouldRotate = action === 'rotateLeft' || action === 'rotateRight';
  const nextWidth = shouldRotate ? source.height : source.width;
  const nextHeight = shouldRotate ? source.width : source.height;

  canvas.width = nextWidth;
  canvas.height = nextHeight;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, nextWidth, nextHeight);

  if (action === 'flipHorizontal') {
    context.translate(nextWidth, 0);
    context.scale(-1, 1);
  }

  if (action === 'flipVertical') {
    context.translate(0, nextHeight);
    context.scale(1, -1);
  }

  if (action === 'rotateLeft') {
    context.translate(0, nextHeight);
    context.rotate(-Math.PI / 2);
  }

  if (action === 'rotateRight') {
    context.translate(nextWidth, 0);
    context.rotate(Math.PI / 2);
  }

  context.drawImage(source, 0, 0);
  context.setTransform(1, 0, 0, 1, 0, 0);
}

export function drawDemoArt(source: HTMLCanvasElement, seed: number) {
  const context = source.getContext('2d');
  if (!context) return;

  const size = source.width;
  const cell = size / 16;
  context.fillStyle = '#101520';
  context.fillRect(0, 0, size, size);

  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const hue = (x * 18 + y * 9 + seed) % 360;
      context.fillStyle = `hsl(${hue} 78% ${38 + ((x + y) % 5) * 7}%)`;
      context.fillRect(x * cell, y * cell, cell, cell);
    }
  }

  context.fillStyle = 'rgba(255,255,255,.9)';
  context.fillRect(cell * 5, cell * 4, cell * 2, cell * 2);
  context.fillRect(cell * 10, cell * 4, cell * 2, cell * 2);
  context.fillStyle = '#111722';
  context.fillRect(cell * 5.5, cell * 4.5, cell, cell);
  context.fillRect(cell * 10.5, cell * 4.5, cell, cell);
  context.fillStyle = '#ff5c8a';
  context.fillRect(cell * 6, cell * 10, cell * 5, cell);
}
