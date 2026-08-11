import { useRef, useState, type RefObject } from 'react';
import type { PixelSettings } from './pixelForge';

const maxHistoryStates = 50;

export type CanvasDocumentState = {
  canvasDataUrl: string | null;
  color: string;
  hasImage: boolean;
  sourceDataUrl: string | null;
  settings: PixelSettings;
};

type CanvasHistory = {
  undo: CanvasDocumentState[];
  redo: CanvasDocumentState[];
};

type CanvasHistoryOptions = {
  canvasRef: RefObject<HTMLCanvasElement>;
  sourceCanvasRef: RefObject<HTMLCanvasElement>;
  getDocumentState: () => Omit<CanvasDocumentState, 'canvasDataUrl' | 'sourceDataUrl'>;
  restoreDocumentState: (state: CanvasDocumentState) => void;
  setOutputSize: (size: string) => void;
  setStatus: (status: string) => void;
};

const cloneSettings = (settings: PixelSettings): PixelSettings => ({
  ...settings,
  customPalette: [...settings.customPalette],
});

function restoreCanvasSnapshot(canvas: HTMLCanvasElement | null, dataUrl: string | null) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const context = canvas?.getContext('2d');
    if (!canvas || !context || !dataUrl) {
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
      }
      resolve(null);
      return;
    }

    const image = new Image();
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.clearRect(0, 0, image.width, image.height);
      context.drawImage(image, 0, 0);
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => resolve(null);
    image.src = dataUrl;
  });
}

export function useCanvasHistory({
  canvasRef,
  sourceCanvasRef,
  getDocumentState,
  restoreDocumentState,
  setOutputSize,
  setStatus,
}: CanvasHistoryOptions) {
  const [history, setHistory] = useState<CanvasHistory>({ undo: [], redo: [] });
  const historyRef = useRef(history);

  const syncHistory = (nextHistory: CanvasHistory) => {
    historyRef.current = nextHistory;
    setHistory(nextHistory);
  };

  const canvasSnapshot = (canvas: HTMLCanvasElement | null) => {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return '';
    return canvas.toDataURL('image/png');
  };

  const captureState = () => {
    const state = getDocumentState();
    const canvasDataUrl = canvasSnapshot(canvasRef.current);
    const sourceDataUrl = canvasSnapshot(sourceCanvasRef.current);
    if (state.hasImage && !canvasDataUrl) return null;
    return {
      ...state,
      canvasDataUrl: canvasDataUrl || null,
      sourceDataUrl: sourceDataUrl || null,
      settings: cloneSettings(state.settings),
    };
  };

  const isSameState = (first: CanvasDocumentState, second: CanvasDocumentState) => (
    first.canvasDataUrl === second.canvasDataUrl
    && first.color === second.color
    && first.hasImage === second.hasImage
    && first.sourceDataUrl === second.sourceDataUrl
    && JSON.stringify(first.settings) === JSON.stringify(second.settings)
  );

  const clearHistory = () => syncHistory({ undo: [], redo: [] });

  const saveUndoStep = () => {
    const snapshot = captureState();
    if (!snapshot) return;

    const latest = historyRef.current;
    const previous = latest.undo[latest.undo.length - 1];
    if (previous && isSameState(previous, snapshot)) return;

    syncHistory({
      undo: [...latest.undo, snapshot].slice(-maxHistoryStates),
      redo: [],
    });
  };

  const restoreSnapshot = (snapshot: CanvasDocumentState) => {
    void restoreCanvasSnapshot(canvasRef.current, snapshot.canvasDataUrl).then((size) => {
      void restoreCanvasSnapshot(sourceCanvasRef.current, snapshot.sourceDataUrl);
      restoreDocumentState({ ...snapshot, settings: cloneSettings(snapshot.settings) });
      setOutputSize(size ? `${size.width} x ${size.height}px` : '');
    });
  };

  const undo = () => {
    const latest = historyRef.current;
    const previous = latest.undo[latest.undo.length - 1];
    const current = captureState();
    if (!previous || !current) return;

    syncHistory({
      undo: latest.undo.slice(0, -1),
      redo: [...latest.redo, current].slice(-maxHistoryStates),
    });
    restoreSnapshot(previous);
    setStatus('Undo');
  };

  const redo = () => {
    const latest = historyRef.current;
    const next = latest.redo[latest.redo.length - 1];
    const current = captureState();
    if (!next || !current) return;

    syncHistory({
      undo: [...latest.undo, current].slice(-maxHistoryStates),
      redo: latest.redo.slice(0, -1),
    });
    restoreSnapshot(next);
    setStatus('Redo');
  };

  return {
    canRedo: history.redo.length > 0,
    canUndo: history.undo.length > 0,
    clearHistory,
    saveUndoStep,
    undo,
    redo,
  };
}
