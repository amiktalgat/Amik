import type { PixelSize, ScaleLevel } from './pixelForge';

export function makePngCanvas(source: HTMLCanvasElement, pixelSize: PixelSize, scale: ScaleLevel) {
  const pixelWidth = Math.ceil(source.width / pixelSize);
  const pixelHeight = Math.ceil(source.height / pixelSize);
  const sourceContext = source.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) return null;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = pixelWidth * scale;
  exportCanvas.height = pixelHeight * scale;

  const exportContext = exportCanvas.getContext('2d');
  if (!exportContext) return null;

  const sourceData = sourceContext.getImageData(0, 0, source.width, source.height);
  exportContext.imageSmoothingEnabled = false;
  exportContext.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

  for (let y = 0; y < pixelHeight; y += 1) {
    for (let x = 0; x < pixelWidth; x += 1) {
      const sourceX = Math.min(x * pixelSize, source.width - 1);
      const sourceY = Math.min(y * pixelSize, source.height - 1);
      const index = (sourceY * sourceData.width + sourceX) * 4;
      exportContext.fillStyle = `rgba(${sourceData.data[index]}, ${sourceData.data[index + 1]}, ${sourceData.data[index + 2]}, ${sourceData.data[index + 3] / 255})`;
      exportContext.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  return exportCanvas;
}

export function makeScaledPngCanvas(source: HTMLCanvasElement, scale: ScaleLevel) {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = source.width * scale;
  exportCanvas.height = source.height * scale;

  const exportContext = exportCanvas.getContext('2d');
  if (!exportContext) return null;

  exportContext.imageSmoothingEnabled = false;
  exportContext.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportContext.drawImage(source, 0, 0, exportCanvas.width, exportCanvas.height);
  return exportCanvas;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export function downloadPng(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function canCopyPng() {
  return Boolean(navigator.clipboard && 'ClipboardItem' in window);
}
