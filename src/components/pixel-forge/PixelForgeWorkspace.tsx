import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type RefObject } from 'react';
import type { CanvasSize, PixelSize, ZoomLevel } from '../../lib/pixelForge';
import type { PixelCoordinates } from '../../lib/usePixelPainter';
import { PixelForgeEmptyState } from './PixelForgeEmptyState';

type PixelForgeWorkspaceProps = {
  canvasRef: RefObject<HTMLCanvasElement>;
  canvasSize: CanvasSize;
  hoverPixel: PixelCoordinates | null;
  isDragging: boolean;
  hasImage: boolean;
  gridOpacity: number;
  nextFrameDataUrl: string | null;
  onionOpacity: number;
  previousFrameDataUrl: string | null;
  isGridVisible: boolean;
  pixelSize: PixelSize;
  zoom: ZoomLevel | 'fit';
  onDrop: (file: File | undefined) => void;
  onDragState: (isDragging: boolean) => void;
  onOpen: () => void;
  onDemo: () => void;
  onPaintEnd: (event?: PointerEvent<HTMLCanvasElement>) => void;
  onPaintHover: (event: PointerEvent<HTMLCanvasElement>) => void;
  onPaintLeave: () => void;
  onPaintMove: (event: PointerEvent<HTMLCanvasElement>) => void;
  onPaintStart: (event: PointerEvent<HTMLCanvasElement>) => void;
};

export function PixelForgeWorkspace({
  canvasRef,
  canvasSize,
  hoverPixel,
  isDragging,
  hasImage,
  gridOpacity,
  nextFrameDataUrl,
  onionOpacity,
  previousFrameDataUrl,
  isGridVisible,
  pixelSize,
  zoom,
  onDrop,
  onDragState,
  onOpen,
  onDemo,
  onPaintEnd,
  onPaintHover,
  onPaintLeave,
  onPaintStart,
  onPaintMove,
}: PixelForgeWorkspaceProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [shellSize, setShellSize] = useState({ width: 0, height: 0 });
  const canvas = canvasRef.current;
  const measuredCanvas = canvas && canvas.width > 0 && canvas.height > 0
    ? { width: canvas.width, height: canvas.height }
    : canvasSize;
  const fitScale = shellSize.width > 0 && shellSize.height > 0
    ? Math.min(shellSize.width / measuredCanvas.width, shellSize.height / measuredCanvas.height)
    : 1;
  const displayScale = zoom === 'fit' ? fitScale : Math.min(zoom, fitScale);
  const canvasStyle = ({
    height: `${Math.max(1, Math.floor(measuredCanvas.height * displayScale))}px`,
    width: `${Math.max(1, Math.floor(measuredCanvas.width * displayScale))}px`,
  } satisfies CSSProperties);
  const canMeasureCanvas = Boolean(canvas && canvas.width > 0 && canvas.height > 0);
  const gridStyle = canMeasureCanvas && canvas ? ({
    backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
    backgroundSize: `${(pixelSize / canvas.width) * 100}% ${(pixelSize / canvas.height) * 100}%`,
    opacity: gridOpacity / 100,
  } satisfies CSSProperties) : undefined;

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      setShellSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);
  const hoverStyle = canMeasureCanvas && canvas && hoverPixel ? ({
    left: `${((hoverPixel.x * pixelSize) / canvas.width) * 100}%`,
    top: `${((hoverPixel.y * pixelSize) / canvas.height) * 100}%`,
    width: `${(Math.min(pixelSize, canvas.width - hoverPixel.x * pixelSize) / canvas.width) * 100}%`,
    height: `${(Math.min(pixelSize, canvas.height - hoverPixel.y * pixelSize) / canvas.height) * 100}%`,
  } satisfies CSSProperties) : undefined;

  return (
    <main
      className={`pf-workspace ${isDragging ? 'dragover' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragState(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        onDragState(false);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onDragState(false);
        onDrop(event.dataTransfer.files[0]);
      }}
    >
      {!hasImage && <PixelForgeEmptyState onOpen={onOpen} onDemo={onDemo} />}
      <div ref={shellRef} className={`pf-canvasShell ${hasImage ? '' : 'hidden'}`}>
        <div className="pf-canvasStage" style={canvasStyle}>
          <canvas
            ref={canvasRef}
            width="640"
            height="640"
            style={canvasStyle}
            onPointerCancel={onPaintEnd}
            onPointerDown={onPaintStart}
            onPointerEnter={onPaintHover}
            onPointerLeave={onPaintLeave}
            onPointerMove={onPaintMove}
            onPointerUp={onPaintEnd}
          />
          {previousFrameDataUrl && (
            <img
              className="pf-onionSkin previous"
              src={previousFrameDataUrl}
              style={{ opacity: onionOpacity / 100 }}
              alt=""
            />
          )}
          {nextFrameDataUrl && (
            <img
              className="pf-onionSkin next"
              src={nextFrameDataUrl}
              style={{ opacity: onionOpacity / 100 }}
              alt=""
            />
          )}
          {isGridVisible && gridStyle && <span className="pf-pixelGrid" style={gridStyle} />}
          {hoverStyle && <span className="pf-pixelHover" style={hoverStyle} />}
        </div>
      </div>
    </main>
  );
}
