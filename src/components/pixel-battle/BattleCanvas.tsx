import { useEffect, useRef, useState } from 'react';
import { drawCanvasFrame, drawGrid, drawHover, drawPixels, drawReferenceImage } from '../../lib/battleCanvasDrawing';
import { CANVAS_SIZE, clamp, type BattlePixel } from '../../lib/pixelBattle';
import { useCanvasElementSize } from '../../lib/useCanvasElementSize';
import { useLoadedImage } from '../../lib/useLoadedImage';

export type Camera = { x: number; y: number; zoom: number };

const minZoom = 1;
const maxZoom = 32;

type BattleCanvasProps = {
  camera: Camera;
  color: string;
  pixels: BattlePixel[];
  canPlace: boolean;
  referenceImageUrl: string;
  referenceOpacity: number;
  referenceScale: number;
  referencePosition: { x: number; y: number };
  onCameraChange: (camera: Camera) => void;
  onCursorChange: (cursor: { x: number; y: number } | null) => void;
  onPlace: (x: number, y: number) => void;
  onSizeChange: (size: { width: number; height: number }) => void;
};

type PointerState = {
  id: number;
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  moved: boolean;
};

export function BattleCanvas(props: BattleCanvasProps) {
  const { onSizeChange } = props;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointers = useRef(new Map<number, PointerState>());
  const pinchDistance = useRef<number | null>(null);
  const size = useCanvasElementSize(canvasRef, { width: 900, height: 620 });
  const referenceImage = useLoadedImage(props.referenceImageUrl);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const hoverRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    onSizeChange(size);
  }, [onSizeChange, size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * ratio);
    canvas.height = Math.floor(size.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#edf7fb';
    context.fillRect(0, 0, size.width, size.height);
    drawCanvasFrame(context, props.camera, size);
    if (referenceImage) {
      drawReferenceImage(
        context,
        {
          image: referenceImage,
          opacity: props.referenceOpacity,
          scale: props.referenceScale,
          x: props.referencePosition.x,
          y: props.referencePosition.y,
        },
        props.camera,
        size,
      );
    }
    drawPixels(context, props.pixels, props.camera, size);
    drawGrid(context, props.camera, size);
    if (hover) drawHover(context, hover, props.camera, size, props.color, props.canPlace);
  }, [
    hover,
    props.camera,
    props.canPlace,
    props.color,
    props.pixels,
    props.referenceOpacity,
    props.referencePosition.x,
    props.referencePosition.y,
    props.referenceScale,
    referenceImage,
    size,
  ]);

  function screenToWorld(clientX: number, clientY: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.floor(props.camera.x + (clientX - rect.left - size.width / 2) / props.camera.zoom),
      y: Math.floor(props.camera.y + (clientY - rect.top - size.height / 2) / props.camera.zoom),
    };
  }

  function updateCamera(next: Camera) {
    props.onCameraChange({
      x: clamp(next.x, 0, CANVAS_SIZE - 1),
      y: clamp(next.y, 0, CANVAS_SIZE - 1),
      zoom: clamp(next.zoom, minZoom, maxZoom),
    });
  }

  function handleWheel(event: React.WheelEvent<HTMLCanvasElement>) {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.86 : 1.16;
    updateCamera({ ...props.camera, zoom: props.camera.zoom * factor });
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    });
  }
  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const pointer = pointers.current.get(event.pointerId);
    const world = screenToWorld(event.clientX, event.clientY);
    if (world && isInside(world.x, world.y)) {
      const currentHover = hoverRef.current;
      if (!currentHover || currentHover.x !== world.x || currentHover.y !== world.y) {
        hoverRef.current = world;
        setHover(world);
        props.onCursorChange(world);
      }
    }
    if (!pointer) return;
    pointer.moved ||= Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 4;
    const allPointers = [...pointers.current.values()];
    if (allPointers.length === 2) {
      handlePinch(allPointers[0], allPointers[1]);
    } else {
      updateCamera({
        ...props.camera,
        x: props.camera.x - (event.clientX - pointer.lastX) / props.camera.zoom,
        y: props.camera.y - (event.clientY - pointer.lastY) / props.camera.zoom,
      });
    }
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
  }
  function handlePointerUp(event: React.PointerEvent<HTMLCanvasElement>) {
    const pointer = pointers.current.get(event.pointerId);
    pointers.current.delete(event.pointerId);
    pinchDistance.current = null;
    if (!pointer || pointer.moved) return;
    const world = screenToWorld(event.clientX, event.clientY);
    if (world && isInside(world.x, world.y)) props.onPlace(world.x, world.y);
  }
  function handlePinch(first: PointerState, second: PointerState) {
    const distance = Math.hypot(first.lastX - second.lastX, first.lastY - second.lastY);
    if (pinchDistance.current) {
      updateCamera({ ...props.camera, zoom: props.camera.zoom * (distance / pinchDistance.current) });
    }
    pinchDistance.current = distance;
  }

  return (
    <canvas ref={canvasRef} className="battle-canvas" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp} onWheel={handleWheel} onPointerLeave={() => {
        hoverRef.current = null;
        setHover(null);
        props.onCursorChange(null);
      }} />
  );
}

function isInside(x: number, y: number) {
  return x >= 0 && x < CANVAS_SIZE && y >= 0 && y < CANVAS_SIZE;
}
