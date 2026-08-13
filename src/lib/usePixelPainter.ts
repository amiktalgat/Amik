import { useRef, type PointerEvent, type RefObject } from 'react';
import { hexToRgba, rgbToHex, type PixelSize, type Tool } from './pixelForge';

export type PixelCoordinates = {
  x: number;
  y: number;
};

type PixelPainterOptions = {
  canvasRef: RefObject<HTMLCanvasElement>;
  color: string;
  hasImage: boolean;
  pixelSize: PixelSize;
  tool: Tool;
  onColorChange: (color: string) => void;
  onHoverChange: (coordinates: PixelCoordinates | null) => void;
  onStatus: (status: string) => void;
  onUndoStep: () => void;
};

export function usePixelPainter({
  canvasRef,
  color,
  hasImage,
  pixelSize,
  tool,
  onColorChange,
  onHoverChange,
  onStatus,
  onUndoStep,
}: PixelPainterOptions) {
  const isPaintingRef = useRef(false);
  const lastPaintedCellRef = useRef<string | null>(null);
  const lastHoverCellRef = useRef<string | null>(null);

  const pointerToCanvas = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const rawX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const rawY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (rawX < 0 || rawY < 0 || rawX >= canvas.width || rawY >= canvas.height) return null;

    const x = Math.floor(rawX);
    const y = Math.floor(rawY);

    return {
      x,
      y,
      cellX: Math.floor(x / pixelSize),
      cellY: Math.floor(y / pixelSize),
      startX: Math.floor(x / pixelSize) * pixelSize,
      startY: Math.floor(y / pixelSize) * pixelSize,
    };
  };

  const sameColor = (data: Uint8ClampedArray, index: number, target: Uint8ClampedArray) => (
    data[index] === target[0]
    && data[index + 1] === target[1]
    && data[index + 2] === target[2]
    && data[index + 3] === target[3]
  );

  const setCellColor = (
    imageData: ImageData,
    cellX: number,
    cellY: number,
    nextColor: ReturnType<typeof hexToRgba>,
  ) => {
    const startX = cellX * pixelSize;
    const startY = cellY * pixelSize;
    const endX = Math.min(startX + pixelSize, imageData.width);
    const endY = Math.min(startY + pixelSize, imageData.height);

    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const index = (y * imageData.width + x) * 4;
        imageData.data[index] = nextColor.r;
        imageData.data[index + 1] = nextColor.g;
        imageData.data[index + 2] = nextColor.b;
        imageData.data[index + 3] = nextColor.a;
      }
    }
  };

  const fillAt = (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, cellX: number, cellY: number) => {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const targetX = Math.min(cellX * pixelSize, canvas.width - 1);
    const targetY = Math.min(cellY * pixelSize, canvas.height - 1);
    const targetIndex = (targetY * imageData.width + targetX) * 4;
    const targetColor = imageData.data.slice(targetIndex, targetIndex + 4);
    const nextColor = hexToRgba(color);

    if (
      targetColor[0] === nextColor.r
      && targetColor[1] === nextColor.g
      && targetColor[2] === nextColor.b
      && targetColor[3] === nextColor.a
    ) {
      return;
    }

    const cellsWide = Math.ceil(canvas.width / pixelSize);
    const cellsHigh = Math.ceil(canvas.height / pixelSize);
    const visited = new Set<string>();
    const queue: PixelCoordinates[] = [{ x: cellX, y: cellY }];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      const key = `${current.x}:${current.y}`;
      if (visited.has(key) || current.x < 0 || current.y < 0 || current.x >= cellsWide || current.y >= cellsHigh) continue;
      visited.add(key);

      const sampleX = Math.min(current.x * pixelSize, canvas.width - 1);
      const sampleY = Math.min(current.y * pixelSize, canvas.height - 1);
      const sampleIndex = (sampleY * imageData.width + sampleX) * 4;
      if (!sameColor(imageData.data, sampleIndex, targetColor)) continue;

      setCellColor(imageData, current.x, current.y, nextColor);
      queue.push(
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      );
    }

    context.putImageData(imageData, 0, 0);
    onStatus('Area filled');
  };

  const updateHover = (coordinates: PixelCoordinates | null) => {
    const key = coordinates ? `${coordinates.x}:${coordinates.y}` : null;
    if (lastHoverCellRef.current === key) return;
    lastHoverCellRef.current = key;
    onHoverChange(coordinates);
  };

  const paintAt = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { willReadFrequently: true });
    const point = pointerToCanvas(event);
    if (!canvas || !context || !hasImage || !point) return;

    updateHover({ x: point.cellX, y: point.cellY });

    if (tool === 'eyedropper') {
      const pixel = context.getImageData(point.x, point.y, 1, 1).data;
      if (pixel[3] > 0) onColorChange(rgbToHex(pixel[0], pixel[1], pixel[2]));
      onStatus('Color picked');
      return;
    }

    if (tool === 'fill') {
      fillAt(context, canvas, point.cellX, point.cellY);
      return;
    }

    const cellKey = `${point.cellX}:${point.cellY}`;
    if (lastPaintedCellRef.current === cellKey) return;
    lastPaintedCellRef.current = cellKey;

    const width = Math.min(pixelSize, canvas.width - point.startX);
    const height = Math.min(pixelSize, canvas.height - point.startY);

    if (tool === 'eraser') {
      context.clearRect(point.startX, point.startY, width, height);
      return;
    }

    context.fillStyle = color;
    context.fillRect(point.startX, point.startY, width, height);
  };

  const onPaintHover = (event: PointerEvent<HTMLCanvasElement>) => {
    const point = pointerToCanvas(event);
    updateHover(point ? { x: point.cellX, y: point.cellY } : null);
  };

  const onPaintStart = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool !== 'eyedropper') onUndoStep();
    isPaintingRef.current = true;
    lastPaintedCellRef.current = null;
    paintAt(event);
    if (tool === 'eraser') onStatus('Pixel erased');
    if (tool === 'pencil') onStatus('Pixel painted');
  };

  const onPaintMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (isPaintingRef.current && tool !== 'fill' && tool !== 'eyedropper') {
      paintAt(event);
      return;
    }
    onPaintHover(event);
  };

  const onPaintEnd = (event?: PointerEvent<HTMLCanvasElement>) => {
    if (event?.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    isPaintingRef.current = false;
    lastPaintedCellRef.current = null;
  };

  const onPaintLeave = () => {
    updateHover(null);
    isPaintingRef.current = false;
    lastPaintedCellRef.current = null;
  };

  return { onPaintEnd, onPaintHover, onPaintLeave, onPaintMove, onPaintStart };
}
