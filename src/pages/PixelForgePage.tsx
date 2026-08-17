import { type ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { PixelForgeHeader } from '../components/pixel-forge/PixelForgeHeader';
import { PixelForgeLeftPanel } from '../components/pixel-forge/PixelForgeLeftPanel';
import { PixelForgeRightPanel } from '../components/pixel-forge/PixelForgeRightPanel';
import { PixelForgeWorkspace } from '../components/pixel-forge/PixelForgeWorkspace';
import { AnimationTimeline } from '../components/pixel-forge/AnimationTimeline';
import { TilemapEditor } from '../components/pixel-forge/TilemapEditor';
import {
  canvasToFrameData,
  cloneFrame,
  createFrame,
  drawFrameToCanvas,
  exportPngSequence,
  makeBlankFrame,
  makeSpriteSheetCanvas,
  type AnimationFps,
  type AnimationFrame,
  type SpriteSheetOptions,
} from '../lib/pixelAnimation';
import {
  acceptedImageTypes,
  drawDemoArt,
  renderPixelArt,
  transformCanvas,
  zoomLevels,
  clamp,
  fitInside,
  type CanvasSize,
  type PixelSettings,
  type ScaleLevel,
  type Tool,
  type TransformAction,
  type ZoomLevel,
} from '../lib/pixelForge';
import { canCopyPng, canvasToPngBlob, downloadPng, makeScaledPngCanvas } from '../lib/pixelExport';
import { defaultCustomPalette, normalizeHex } from '../lib/pixelPalettes';
import { useCanvasHistory } from '../lib/useCanvasHistory';
import { useCustomPalette } from '../lib/useCustomPalette';
import { usePixelPainter, type PixelCoordinates } from '../lib/usePixelPainter';
import './pixelForge.css';
import '../components/pixel-forge/paletteControls.css';

const defaultSettings: PixelSettings = {
  pixelSize: 16,
  colorCount: 16,
  paletteId: 'original',
  customPalette: defaultCustomPalette,
  dithering: 'none',
};

type EditorMode = 'pixel' | 'animation' | 'tilemap';
type EditorMenu = 'guide' | 'palette' | 'size' | 'color' | 'tools' | 'view' | 'transform' | 'export' | 'animation';

const editorMenus: Array<{ id: EditorMenu; label: string; animationOnly?: boolean }> = [
  { id: 'guide', label: 'Guide' },
  { id: 'palette', label: 'Palette' },
  { id: 'size', label: 'Size' },
  { id: 'color', label: 'Color' },
  { id: 'tools', label: 'Tools' },
  { id: 'view', label: 'View' },
  { id: 'transform', label: 'Move' },
  { id: 'export', label: 'Export' },
  { id: 'animation', label: 'Anim', animationOnly: true },
];

const defaultSpriteSheetOptions: SpriteSheetOptions = {
  mode: 'horizontal',
  columns: 4,
  rows: 1,
  padding: 0,
  spacing: 0,
};

const defaultCanvasSize: CanvasSize = {
  width: 640,
  height: 640,
};

export function PixelForgePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalRef = useRef(document.createElement('canvas'));
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState('image');
  const [mode, setMode] = useState<EditorMode>('pixel');
  const [color, setColor] = useState('#7C5CFF');
  const [hasImage, setHasImage] = useState(false);
  const [hoverPixel, setHoverPixel] = useState<PixelCoordinates | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<EditorMenu>('palette');
  const [gridOpacity, setGridOpacity] = useState(40);
  const [exportScale, setExportScale] = useState<ScaleLevel>(1);
  const [outputSize, setOutputSize] = useState('');
  const [canvasSize, setCanvasSize] = useState<CanvasSize>(defaultCanvasSize);
  const [settings, setSettings] = useState(defaultSettings);
  const [tool, setTool] = useState<Tool>('pencil');
  const [zoom, setZoom] = useState<ZoomLevel | 'fit'>('fit');
  const [frames, setFrames] = useState<AnimationFrame[]>(() => [createFrame(null, defaultCanvasSize.width, defaultCanvasSize.height)]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [animationFps, setAnimationFps] = useState<AnimationFps>(6);
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [isLoopingAnimation, setIsLoopingAnimation] = useState(true);
  const [showPreviousFrame, setShowPreviousFrame] = useState(true);
  const [showNextFrame, setShowNextFrame] = useState(false);
  const [onionOpacity, setOnionOpacity] = useState(35);
  const [spriteSheetOptions, setSpriteSheetOptions] = useState<SpriteSheetOptions>(defaultSpriteSheetOptions);
  const [status, setStatus] = useState('Ready');
  const [toast, setToast] = useState('');
  const toastTimerRef = useRef<number | null>(null);
  const skipNextGenerateRef = useRef(false);
  const framesRef = useRef(frames);
  const currentFrameRef = useRef(currentFrameIndex);
  const history = useCanvasHistory({
    canvasRef,
    sourceCanvasRef: originalRef,
    getDocumentState: () => ({ color, hasImage, settings }),
    restoreDocumentState: (state) => {
      skipNextGenerateRef.current = true;
      setColor(state.color);
      setHasImage(state.hasImage);
      setHoverPixel(null);
      setSettings(state.settings);
    },
    setOutputSize,
    setStatus,
  });

  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    currentFrameRef.current = currentFrameIndex;
  }, [currentFrameIndex]);

  const updateCurrentFrameData = useCallback(() => {
    const frameData = canvasToFrameData(canvasRef.current);
    if (!frameData) return;

    setFrames((currentFrames) => currentFrames.map((frame, index) => (
      index === currentFrameRef.current ? { ...frame, ...frameData } : frame
    )));
  }, []);

  const getFreshFrames = useCallback(() => {
    const frameData = canvasToFrameData(canvasRef.current);
    return framesRef.current.map((frame, index) => (
      index === currentFrameRef.current && frameData ? { ...frame, ...frameData } : frame
    ));
  }, []);

  const prepareBlankCanvas = useCallback((width = 640, height = 640) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return null;

    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    originalRef.current.width = width;
    originalRef.current.height = height;
    originalRef.current.getContext('2d')?.clearRect(0, 0, width, height);
    setCanvasSize({ width, height });
    setHasImage(true);
    setOutputSize(`${width} x ${height}px`);
    return canvasToFrameData(canvas);
  }, []);

  const selectFrame = useCallback((index: number) => {
    updateCurrentFrameData();
    const nextFrame = framesRef.current[index];
    if (!nextFrame) return;

    setCurrentFrameIndex(index);
    setHoverPixel(null);
    setHasImage(Boolean(nextFrame.dataUrl));
    void drawFrameToCanvas(nextFrame, canvasRef.current).then(() => {
      setOutputSize(`${nextFrame.width} x ${nextFrame.height}px`);
      setStatus(`Frame ${index + 1}`);
    });
  }, [updateCurrentFrameData]);
  const changeColor = (nextColor: string) => {
    const normalizedColor = normalizeHex(nextColor);
    if (hasImage && normalizedColor !== color) history.saveUndoStep();
    setColor(normalizedColor);
  };
  const painter = usePixelPainter({
    canvasRef,
    color,
    hasImage,
    pixelSize: settings.pixelSize,
    tool,
    onColorChange: changeColor,
    onHoverChange: setHoverPixel,
    onStatus: setStatus,
    onUndoStep: history.saveUndoStep,
  });

  const finishPainting = (event?: Parameters<typeof painter.onPaintEnd>[0]) => {
    painter.onPaintEnd(event);
    if (mode === 'animation') updateCurrentFrameData();
  };

  const showToast = useCallback((message: string) => {
    setToast(message);
    setStatus(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(''), 2200);
  }, []);

  const generatePixelArt = (
    message = 'Pixel art generated',
    nextSettings = settings,
    remember = false,
    nextCanvasSize = canvasSize,
  ) => {
    if (!canvasRef.current || originalRef.current.width === 0 || originalRef.current.height === 0) return;
    if (remember) history.saveUndoStep();
    renderPixelArt(canvasRef.current, originalRef.current, nextSettings, nextCanvasSize);
    setOutputSize(`${canvasRef.current.width} x ${canvasRef.current.height}px`);
    setStatus(message);
    if (mode === 'animation') updateCurrentFrameData();
  };

  useEffect(() => {
    if (skipNextGenerateRef.current) {
      skipNextGenerateRef.current = false;
      return;
    }
    if (hasImage) generatePixelArt('Settings updated');
  }, [hasImage, settings]);

  useEffect(() => {
    if (mode !== 'animation' && activeMenu === 'animation') setActiveMenu('palette');
  }, [activeMenu, mode]);

  const prepareOriginal = (width: number, height: number, resetHistory = true) => {
    originalRef.current.width = width;
    originalRef.current.height = height;
    setHasImage(true);
    if (resetHistory) history.clearHistory();
  };

  const loadFile = (file: File | undefined) => {
    if (!file || !acceptedImageTypes.includes(file.type)) {
      setStatus('Choose a PNG, JPG, JPEG, or WebP image');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const nextCanvasSize = fitInside(image.naturalWidth, image.naturalHeight, 420);
        prepareOriginal(image.naturalWidth, image.naturalHeight);
        setCanvasSize(nextCanvasSize);
        const context = originalRef.current.getContext('2d');
        context?.clearRect(0, 0, originalRef.current.width, originalRef.current.height);
        context?.drawImage(image, 0, 0);
        window.requestAnimationFrame(() => generatePixelArt(`Loaded ${file.name}`, settings, false, nextCanvasSize));
      };
      image.onerror = () => showToast('Image could not be loaded');
      image.src = String(reader.result);
    };
    reader.onerror = () => showToast('Image file could not be read');
    reader.readAsDataURL(file);
  };

  const makeDemo = (seed = 42) => {
    prepareOriginal(defaultCanvasSize.width, defaultCanvasSize.height);
    setCanvasSize(defaultCanvasSize);
    drawDemoArt(originalRef.current, seed);
    window.requestAnimationFrame(() => generatePixelArt('Demo loaded', settings, false, defaultCanvasSize));
  };

  const clearDocument = () => {
    canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    originalRef.current.getContext('2d')?.clearRect(0, 0, originalRef.current.width, originalRef.current.height);
    if (inputRef.current) inputRef.current.value = '';
    setHasImage(false);
    setHoverPixel(null);
    setFrames([createFrame(null, defaultCanvasSize.width, defaultCanvasSize.height)]);
    setCurrentFrameIndex(0);
    setIsPlayingAnimation(false);
    setCanvasSize(defaultCanvasSize);
    history.clearHistory();
    setOutputSize('');
    setStatus('New document');
  };

  const resetDocument = () => {
    if (hasImage) history.saveUndoStep();
    setSettings(defaultSettings);
    generatePixelArt('Reset to original image', defaultSettings);
  };

  const changeSettings = (nextSettings: PixelSettings) => {
    if (hasImage) history.saveUndoStep();
    setSettings(nextSettings);
  };

  const changeCanvasSize = (nextSize: CanvasSize) => {
    const safeSize = {
      width: Math.round(clamp(nextSize.width || 16, 16, 2048)),
      height: Math.round(clamp(nextSize.height || 16, 16, 2048)),
    };
    if (safeSize.width === canvasSize.width && safeSize.height === canvasSize.height) return;

    if (!hasImage) {
      prepareBlankCanvas(safeSize.width, safeSize.height);
      setStatus('Canvas size changed');
      return;
    }

    history.saveUndoStep();
    setCanvasSize(safeSize);
    generatePixelArt('Canvas size changed', settings, false, safeSize);
  };

  const changeZoom = (nextZoom: ZoomLevel) => {
    setZoom(nextZoom);
    setStatus(`Zoom ${nextZoom * 100}%`);
  };

  const stepZoom = (direction: 1 | -1) => {
    const currentZoom = zoom === 'fit' ? 1 : zoom;
    const currentIndex = zoomLevels.indexOf(currentZoom);
    const nextIndex = Math.max(0, Math.min(zoomLevels.length - 1, currentIndex + direction));
    changeZoom(zoomLevels[nextIndex]);
  };

  const fitZoom = () => {
    setZoom('fit');
    setStatus('Zoom fit');
  };

  const changeGridOpacity = (opacity: number) => {
    setGridOpacity(opacity);
    setStatus(`Grid opacity ${opacity}%`);
  };

  const transformImage = (action: TransformAction) => {
    if (!hasImage || !canvasRef.current) return;
    history.saveUndoStep();
    transformCanvas(canvasRef.current, action);
    transformCanvas(originalRef.current, action);
    if (mode === 'animation') updateCurrentFrameData();
    setCanvasSize({ width: canvasRef.current.width, height: canvasRef.current.height });
    setHoverPixel(null);
    setOutputSize(`${canvasRef.current.width} x ${canvasRef.current.height}px`);
    setStatus('Image transformed');
  };

  const customPalette = useCustomPalette({ color, settings, changeSettings, setColor, setStatus });

  const getExportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0 || canvas.height === 0) return null;
    return makeScaledPngCanvas(canvas, exportScale);
  }, [exportScale]);

  const exportImage = useCallback(() => {
    if (!hasImage) {
      showToast('Nothing to export');
      return;
    }

    window.requestAnimationFrame(() => {
      const exportCanvas = getExportCanvas();
      if (!exportCanvas) {
        showToast('Nothing to export');
        return;
      }
      downloadPng(exportCanvas, 'pixelforge-art.png');
      showToast('PNG exported');
    });
  }, [getExportCanvas, hasImage, showToast]);

  const copyPng = async () => {
    if (!canCopyPng()) {
      showToast('Copy PNG is not supported in this browser');
      return;
    }

    const exportCanvas = getExportCanvas();
    const pngBlob = exportCanvas ? await canvasToPngBlob(exportCanvas) : null;
    if (!pngBlob) {
      showToast('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      showToast('PNG copied');
    } catch {
      showToast('Browser blocked Copy PNG');
    }
  };

  const changeMode = (nextMode: EditorMode) => {
    if (mode === 'animation') updateCurrentFrameData();
    if (nextMode === 'animation') {
      const frameData = canvasToFrameData(canvasRef.current);
      if (frameData) {
        setFrames((currentFrames) => currentFrames.map((frame, index) => (
          index === currentFrameIndex ? { ...frame, ...frameData } : frame
        )));
      }
      setActiveSection('animation');
    }
    setMode(nextMode);
    setIsPlayingAnimation(false);
    setStatus(nextMode === 'animation' ? 'Animation mode' : nextMode === 'tilemap' ? 'Tilemap Editor mode' : 'Pixel Editor mode');
  };

  const addFrame = () => {
    updateCurrentFrameData();
    const size = canvasRef.current && canvasRef.current.width > 0
      ? { width: canvasRef.current.width, height: canvasRef.current.height }
      : { width: 640, height: 640 };
    const nextFrame = makeBlankFrame(size.width, size.height);
    const nextIndex = currentFrameIndex + 1;

    setFrames((currentFrames) => [
      ...currentFrames.slice(0, nextIndex),
      nextFrame,
      ...currentFrames.slice(nextIndex),
    ]);
    setCurrentFrameIndex(nextIndex);
    setHasImage(true);
    void drawFrameToCanvas(nextFrame, canvasRef.current);
    prepareBlankCanvas(size.width, size.height);
    setStatus(`Frame ${nextIndex + 1} added`);
  };

  const duplicateFrame = () => {
    const freshFrames = getFreshFrames();
    setFrames(freshFrames);
    const sourceFrame = freshFrames[currentFrameIndex];
    if (!sourceFrame) return;

    const nextFrame = cloneFrame(sourceFrame);
    const nextIndex = currentFrameIndex + 1;
    setFrames((currentFrames) => [
      ...currentFrames.slice(0, nextIndex),
      nextFrame,
      ...currentFrames.slice(nextIndex),
    ]);
    setCurrentFrameIndex(nextIndex);
    void drawFrameToCanvas(nextFrame, canvasRef.current);
    setHasImage(Boolean(nextFrame.dataUrl));
    setStatus(`Frame ${currentFrameIndex + 1} duplicated`);
  };

  const deleteFrame = () => {
    if (framesRef.current.length <= 1) return;
    const nextFrames = framesRef.current.filter((_, index) => index !== currentFrameIndex);
    const nextIndex = Math.max(0, currentFrameIndex - 1);
    setFrames(nextFrames);
    setCurrentFrameIndex(nextIndex);
    void drawFrameToCanvas(nextFrames[nextIndex], canvasRef.current);
    setHasImage(Boolean(nextFrames[nextIndex].dataUrl));
    setStatus('Frame deleted');
  };

  const moveFrame = (direction: -1 | 1) => {
    updateCurrentFrameData();
    const nextIndex = currentFrameIndex + direction;
    if (nextIndex < 0 || nextIndex >= framesRef.current.length) return;

    setFrames((currentFrames) => {
      const nextFrames = [...currentFrames];
      const currentFrame = nextFrames[currentFrameIndex];
      nextFrames[currentFrameIndex] = nextFrames[nextIndex];
      nextFrames[nextIndex] = currentFrame;
      return nextFrames;
    });
    setCurrentFrameIndex(nextIndex);
    setStatus(direction === -1 ? 'Frame moved left' : 'Frame moved right');
  };

  const playAnimation = () => {
    setFrames(getFreshFrames());
    setIsPlayingAnimation(true);
    setStatus('Animation playing');
  };

  const pauseAnimation = () => {
    setIsPlayingAnimation(false);
    setStatus('Animation paused');
  };

  const stopAnimation = () => {
    setIsPlayingAnimation(false);
    selectFrame(0);
    setStatus('Animation stopped');
  };

  const exportAnimationSequence = () => {
    const freshFrames = getFreshFrames();
    setFrames(freshFrames);
    window.requestAnimationFrame(() => {
      exportPngSequence(freshFrames);
      showToast('PNG sequence exported');
    });
  };

  const exportSpriteSheet = async () => {
    const freshFrames = getFreshFrames();
    setFrames(freshFrames);
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const spriteSheet = await makeSpriteSheetCanvas(freshFrames, settings.pixelSize, exportScale, spriteSheetOptions);
    if (!spriteSheet) {
      showToast('Nothing to export');
      return;
    }
    downloadPng(spriteSheet, 'pixelforge-sprite-sheet.png');
    showToast('Sprite sheet exported');
  };

  useEffect(() => {
    if (!isPlayingAnimation || mode !== 'animation') return undefined;

    const timer = window.setInterval(() => {
      const lastIndex = framesRef.current.length - 1;
      const nextIndex = currentFrameRef.current + 1;
      if (nextIndex > lastIndex) {
        if (!isLoopingAnimation) {
          setIsPlayingAnimation(false);
          return;
        }
        selectFrame(0);
        return;
      }
      selectFrame(nextIndex);
    }, 1000 / animationFps);

    return () => window.clearInterval(timer);
  }, [animationFps, isLoopingAnimation, isPlayingAnimation, mode, selectFrame]);

  useEffect(() => {
    const isTextField = (target: EventTarget | null) => (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
      || target instanceof HTMLElement && target.isContentEditable
    );

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || event.altKey || event.metaKey || isTextField(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        exportImage();
        return;
      }
      if (key === 'z' && event.shiftKey) {
        event.preventDefault();
        history.redo();
        return;
      }
      if (key === 'z') {
        event.preventDefault();
        history.undo();
        return;
      }
      if (key === 'y') {
        event.preventDefault();
        history.redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exportImage, history]);

  const exportWidth = canvasRef.current ? canvasRef.current.width : 0;
  const exportHeight = canvasRef.current ? canvasRef.current.height : 0;
  const exportSize = hasImage
    ? `${exportWidth} x ${exportHeight} + ${exportScale}x = ${exportWidth * exportScale} x ${exportHeight * exportScale}px`
    : 'No image loaded';

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => loadFile(event.target.files?.[0]);
  const editorPanelMode = mode === 'tilemap' ? 'pixel' : mode;
  const openMenu = (menu: EditorMenu) => {
    setActiveMenu(menu);
    setIsMenuOpen(true);
  };
  const activeMenuLabel = editorMenus.find((item) => item.id === activeMenu)?.label ?? 'Menu';
  const editorControls = (
    <>
      {activeMenu === 'guide' && (
        <PixelForgeLeftPanel activeSection={activeSection} onSectionChange={setActiveSection} />
      )}
      {activeMenu !== 'guide' && (
        <PixelForgeRightPanel
          animationFps={animationFps}
          color={color}
          exportScale={exportScale}
          exportSize={exportSize}
          frames={frames}
          gridOpacity={gridOpacity}
          isGridVisible={isGridVisible}
          isLoopingAnimation={isLoopingAnimation}
          isPlayingAnimation={isPlayingAnimation}
          mode={editorPanelMode}
          onionOpacity={onionOpacity}
          panel={activeMenu}
          settings={settings}
          showNextFrame={showNextFrame}
          showPreviousFrame={showPreviousFrame}
          spriteSheetOptions={spriteSheetOptions}
          canvasSize={canvasSize}
          tool={tool}
          zoom={zoom}
          onAddToPalette={customPalette.addToCustomPalette}
          onCopyPng={() => void copyPng()}
          onColorChange={changeColor}
          onCustomColorChange={customPalette.changeCustomColor}
          onCustomColorRemove={customPalette.removeCustomColor}
          onExportPng={exportImage}
          onExportPngSequence={exportAnimationSequence}
          onExportSpriteSheet={() => void exportSpriteSheet()}
          onFpsChange={setAnimationFps}
          onGridOpacityChange={changeGridOpacity}
          onGridVisibleChange={setIsGridVisible}
          onLoopAnimationChange={setIsLoopingAnimation}
          onScaleChange={setExportScale}
          onOnionOpacityChange={setOnionOpacity}
          onPauseAnimation={pauseAnimation}
          onPlayAnimation={playAnimation}
          onCanvasSizeChange={changeCanvasSize}
          onSettingsChange={changeSettings}
          onShowNextFrameChange={setShowNextFrame}
          onShowPreviousFrameChange={setShowPreviousFrame}
          onSpriteSheetOptionsChange={setSpriteSheetOptions}
          onStatus={setStatus}
          onToolChange={setTool}
          onTransform={transformImage}
          onStopAnimation={stopAnimation}
          onZoomChange={changeZoom}
          onZoomFit={fitZoom}
          onZoomIn={() => stepZoom(1)}
          onZoomOut={() => stepZoom(-1)}
        />
      )}
    </>
  );

  return (
    <div className={`pf-app ${mode !== 'tilemap' ? 'pf-app--drawer' : ''}`}>
      <PixelForgeHeader
        canRedo={history.canRedo}
        canUndo={history.canUndo}
        mode={mode}
        onNew={clearDocument}
        onOpen={() => inputRef.current?.click()}
        onGenerate={() => generatePixelArt('Pixel art generated', settings, true)}
        onReset={resetDocument}
        onExport={exportImage}
        onModeChange={changeMode}
        onRedo={history.redo}
        onUndo={history.undo}
      />
      {mode !== 'tilemap' && (
        <div className="pf-menuRail" aria-label="Editor menus">
          {editorMenus
            .filter((item) => !item.animationOnly || mode === 'animation')
            .map((item) => (
              <button
                className={activeMenu === item.id ? 'active' : ''}
                key={item.id}
                type="button"
                onClick={() => openMenu(item.id)}
              >
                {item.label}
              </button>
            ))}
        </div>
      )}
      {mode === 'tilemap' ? (
        <TilemapEditor onStatus={setStatus} />
      ) : (
        <>
          {isMenuOpen && (
            <>
              <button className="pf-menuOverlay" type="button" aria-label="Close menu" onClick={() => setIsMenuOpen(false)} />
              <aside className="pf-menuDrawer" aria-label="Editor menu">
                <div className="pf-menuDrawer__header">
                  <h2>{activeMenuLabel}</h2>
                  <button type="button" onClick={() => setIsMenuOpen(false)}>Close</button>
                </div>
                {editorControls}
              </aside>
            </>
          )}
          <PixelForgeWorkspace
            canvasRef={canvasRef}
            canvasSize={canvasSize}
            gridOpacity={gridOpacity}
            hasImage={hasImage}
            hoverPixel={hoverPixel}
            isGridVisible={isGridVisible}
            isDragging={isDragging}
            nextFrameDataUrl={mode === 'animation' && showNextFrame ? frames[currentFrameIndex + 1]?.dataUrl ?? null : null}
            onionOpacity={onionOpacity}
            previousFrameDataUrl={mode === 'animation' && showPreviousFrame ? frames[currentFrameIndex - 1]?.dataUrl ?? null : null}
            pixelSize={settings.pixelSize}
            zoom={zoom}
            onDemo={() => makeDemo()}
            onDragState={setIsDragging}
            onDrop={loadFile}
            onOpen={() => inputRef.current?.click()}
            onPaintEnd={finishPainting}
            onPaintHover={painter.onPaintHover}
            onPaintLeave={painter.onPaintLeave}
            onPaintMove={painter.onPaintMove}
            onPaintStart={painter.onPaintStart}
          />
        </>
      )}
      {mode === 'animation' && (
        <AnimationTimeline
          currentFrameIndex={currentFrameIndex}
          frames={frames}
          onAddFrame={addFrame}
          onDeleteFrame={deleteFrame}
          onDuplicateFrame={duplicateFrame}
          onMoveFrame={moveFrame}
          onSelectFrame={selectFrame}
        />
      )}
      <footer className="pf-statusbar">
        <span>{status}</span>
        <span>{mode === 'tilemap' ? 'Grid: on' : hoverPixel ? `X: ${hoverPixel.x} | Y: ${hoverPixel.y}` : 'X: - | Y: -'}</span>
        <span>{mode === 'tilemap' ? 'Tilemap Editor' : hasImage ? `${outputSize} | ${tool} | ${zoom === 'fit' ? 'Fit' : `${zoom * 100}%`}` : 'No image loaded'}</span>
      </footer>
      {toast && <div className="pf-toast">{toast}</div>}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" hidden onChange={onFileChange} />
    </div>
  );
}
