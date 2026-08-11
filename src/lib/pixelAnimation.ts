import { makePngCanvas } from './pixelExport';
import type { PixelSize, ScaleLevel } from './pixelForge';

export type AnimationFrame = {
  id: string;
  dataUrl: string | null;
  width: number;
  height: number;
};

export const fpsOptions = [1, 2, 4, 6, 8, 12, 24] as const;
export type AnimationFps = (typeof fpsOptions)[number];
export type SpriteSheetMode = 'horizontal' | 'vertical' | 'grid';

export type SpriteSheetOptions = {
  mode: SpriteSheetMode;
  columns: number;
  rows: number;
  padding: number;
  spacing: number;
};

export function createFrame(dataUrl: string | null, width: number, height: number): AnimationFrame {
  return {
    id: crypto.randomUUID(),
    dataUrl,
    width,
    height,
  };
}

export function canvasToFrameData(canvas: HTMLCanvasElement | null) {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width,
    height: canvas.height,
  };
}

export function makeBlankFrame(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return createFrame(canvas.toDataURL('image/png'), width, height);
}

export function drawFrameToCanvas(frame: AnimationFrame, canvas: HTMLCanvasElement | null) {
  return new Promise<void>((resolve) => {
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      resolve();
      return;
    }

    canvas.width = frame.width;
    canvas.height = frame.height;
    context.clearRect(0, 0, frame.width, frame.height);
    if (!frame.dataUrl) {
      resolve();
      return;
    }

    const image = new Image();
    image.onload = () => {
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, frame.width, frame.height);
      context.drawImage(image, 0, 0, frame.width, frame.height);
      resolve();
    };
    image.onerror = () => resolve();
    image.src = frame.dataUrl;
  });
}

export function cloneFrame(frame: AnimationFrame) {
  return createFrame(frame.dataUrl, frame.width, frame.height);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function exportPngSequence(frames: AnimationFrame[]) {
  frames.forEach((frame, index) => {
    if (frame.dataUrl) downloadDataUrl(frame.dataUrl, `pixelforge-frame-${index + 1}.png`);
  });
}

export async function makeSpriteSheetCanvas(
  frames: AnimationFrame[],
  pixelSize: PixelSize,
  scale: ScaleLevel,
  options: SpriteSheetOptions,
) {
  const renderedFrames = frames.filter((frame) => frame.dataUrl);
  if (renderedFrames.length === 0) return null;

  const sourceCanvases = await Promise.all(renderedFrames.map((frame) => frameToExportCanvas(frame, pixelSize, scale)));
  const exportCanvases = sourceCanvases.filter((canvas): canvas is HTMLCanvasElement => Boolean(canvas));
  if (exportCanvases.length === 0) return null;

  const cellWidth = Math.max(...exportCanvases.map((canvas) => canvas.width));
  const cellHeight = Math.max(...exportCanvases.map((canvas) => canvas.height));
  const layout = getSpriteSheetLayout(exportCanvases.length, options);
  const sheet = document.createElement('canvas');
  sheet.width = (options.padding * 2) + (cellWidth * layout.columns) + (options.spacing * (layout.columns - 1));
  sheet.height = (options.padding * 2) + (cellHeight * layout.rows) + (options.spacing * (layout.rows - 1));

  const context = sheet.getContext('2d');
  if (!context) return null;

  context.imageSmoothingEnabled = false;
  exportCanvases.forEach((canvas, index) => {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    const x = options.padding + column * (cellWidth + options.spacing);
    const y = options.padding + row * (cellHeight + options.spacing);
    context.drawImage(canvas, x, y);
  });
  return sheet;
}

export function getSpriteSheetLayout(frameCount: number, options: SpriteSheetOptions) {
  if (options.mode === 'horizontal') return { columns: Math.max(1, frameCount), rows: 1 };
  if (options.mode === 'vertical') return { columns: 1, rows: Math.max(1, frameCount) };

  const columns = Math.max(1, options.columns);
  const requiredRows = Math.ceil(frameCount / columns);
  return { columns, rows: Math.max(1, options.rows, requiredRows) };
}

async function frameToExportCanvas(frame: AnimationFrame, pixelSize: PixelSize, scale: ScaleLevel) {
  const canvas = document.createElement('canvas');
  await drawFrameToCanvas(frame, canvas);
  return makePngCanvas(canvas, pixelSize, scale);
}
