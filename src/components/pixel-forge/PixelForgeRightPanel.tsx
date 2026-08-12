import {
  type AnimationFrame,
  type AnimationFps,
  type SpriteSheetOptions,
} from '../../lib/pixelAnimation';
import {
  type CanvasSize,
  type PixelSettings,
  type ScaleLevel,
  type Tool,
  type TransformAction,
  type ZoomLevel,
} from '../../lib/pixelForge';
import { AnimationControls } from './AnimationControls';
import type { PaletteId } from '../../lib/pixelPalettes';
import { ColorInspector } from './ColorInspector';
import { CustomPaletteEditor } from './CustomPaletteEditor';
import { DocumentSizeControls } from './DocumentSizeControls';
import { PixelForgeExportControls } from './PixelForgeExportControls';
import { PaletteSelector } from './PaletteSelector';
import { PixelForgeTransformControls } from './PixelForgeTransformControls';
import { PixelForgeViewControls } from './PixelForgeViewControls';
import { SpriteSheetGenerator } from './SpriteSheetGenerator';

type PixelForgeRightPanelProps = {
  animationFps: AnimationFps;
  color: string;
  gridOpacity: number;
  exportScale: ScaleLevel;
  exportSize: string;
  frames: AnimationFrame[];
  isGridVisible: boolean;
  isLoopingAnimation: boolean;
  isPlayingAnimation: boolean;
  mode: 'pixel' | 'animation';
  onionOpacity: number;
  showNextFrame: boolean;
  showPreviousFrame: boolean;
  spriteSheetOptions: SpriteSheetOptions;
  canvasSize: CanvasSize;
  settings: PixelSettings;
  tool: Tool;
  zoom: ZoomLevel | 'fit';
  onAddToPalette: () => void;
  onCopyPng: () => void;
  onCustomColorChange: (index: number, color: string) => void;
  onCustomColorRemove: (index: number) => void;
  onColorChange: (color: string) => void;
  onExportPng: () => void;
  onExportPngSequence: () => void;
  onExportSpriteSheet: () => void;
  onFpsChange: (fps: AnimationFps) => void;
  onGridOpacityChange: (opacity: number) => void;
  onGridVisibleChange: (isVisible: boolean) => void;
  onLoopAnimationChange: (isLooping: boolean) => void;
  onScaleChange: (scale: ScaleLevel) => void;
  onOnionOpacityChange: (opacity: number) => void;
  onPauseAnimation: () => void;
  onPlayAnimation: () => void;
  onCanvasSizeChange: (size: CanvasSize) => void;
  onSettingsChange: (settings: PixelSettings) => void;
  onShowNextFrameChange: (isVisible: boolean) => void;
  onShowPreviousFrameChange: (isVisible: boolean) => void;
  onSpriteSheetOptionsChange: (options: SpriteSheetOptions) => void;
  onStatus: (status: string) => void;
  onToolChange: (tool: Tool) => void;
  onTransform: (action: TransformAction) => void;
  onStopAnimation: () => void;
  onZoomChange: (zoom: ZoomLevel) => void;
  onZoomFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

const tools: Tool[] = ['pencil', 'eraser', 'eyedropper', 'fill'];

export function PixelForgeRightPanel({
  animationFps,
  color,
  gridOpacity,
  exportScale,
  exportSize,
  frames,
  isGridVisible,
  isLoopingAnimation,
  isPlayingAnimation,
  mode,
  onionOpacity,
  showNextFrame,
  showPreviousFrame,
  spriteSheetOptions,
  canvasSize,
  settings,
  tool,
  zoom,
  onAddToPalette,
  onCopyPng,
  onCustomColorChange,
  onCustomColorRemove,
  onColorChange,
  onExportPng,
  onExportPngSequence,
  onExportSpriteSheet,
  onFpsChange,
  onGridOpacityChange,
  onGridVisibleChange,
  onLoopAnimationChange,
  onScaleChange,
  onOnionOpacityChange,
  onPauseAnimation,
  onPlayAnimation,
  onCanvasSizeChange,
  onSettingsChange,
  onShowNextFrameChange,
  onShowPreviousFrameChange,
  onSpriteSheetOptionsChange,
  onStatus,
  onToolChange,
  onTransform,
  onStopAnimation,
  onZoomChange,
  onZoomFit,
  onZoomIn,
  onZoomOut,
}: PixelForgeRightPanelProps) {
  const changeSetting = <Key extends keyof PixelSettings>(key: Key, value: PixelSettings[Key]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <aside className="pf-sidebar pf-rightPanel">
      {mode === 'animation' && (
        <>
          <AnimationControls
            fps={animationFps}
            isLooping={isLoopingAnimation}
            isPlaying={isPlayingAnimation}
            onionOpacity={onionOpacity}
            scale={exportScale}
            showNextFrame={showNextFrame}
            showPreviousFrame={showPreviousFrame}
            onExportPngSequence={onExportPngSequence}
            onFpsChange={onFpsChange}
            onLoopChange={onLoopAnimationChange}
            onOnionOpacityChange={onOnionOpacityChange}
            onPause={onPauseAnimation}
            onPlay={onPlayAnimation}
            onScaleChange={onScaleChange}
            onShowNextFrameChange={onShowNextFrameChange}
            onShowPreviousFrameChange={onShowPreviousFrameChange}
            onStop={onStopAnimation}
          />
          <SpriteSheetGenerator
            frames={frames}
            options={spriteSheetOptions}
            pixelSize={settings.pixelSize}
            scale={exportScale}
            onExport={onExportSpriteSheet}
            onOptionsChange={onSpriteSheetOptionsChange}
          />
        </>
      )}
      <PaletteSelector
        customPalette={settings.customPalette}
        value={settings.paletteId}
        onChange={(paletteId) => changeSetting('paletteId', paletteId as PaletteId)}
      />
      <DocumentSizeControls size={canvasSize} onChange={onCanvasSizeChange} />
      <ColorInspector color={color} onAddToPalette={onAddToPalette} onColorChange={onColorChange} onStatus={onStatus} />
      <CustomPaletteEditor
        colors={settings.customPalette}
        currentColor={color}
        onChangeColor={onCustomColorChange}
        onRemoveColor={onCustomColorRemove}
        onSelectColor={onColorChange}
      />
      <section>
        <h2>Tools</h2>
        <div className="pf-toolGrid">
          {tools.map((item) => (
            <button className={`pf-tool ${tool === item ? 'active' : ''}`} key={item} onClick={() => onToolChange(item)}>
              {item === 'eyedropper' ? 'Eyedropper' : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </section>
      <PixelForgeViewControls
        gridOpacity={gridOpacity}
        isGridVisible={isGridVisible}
        zoom={zoom}
        onFit={onZoomFit}
        onGridOpacityChange={onGridOpacityChange}
        onGridVisibleChange={onGridVisibleChange}
        onZoomChange={onZoomChange}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
      <PixelForgeTransformControls onTransform={onTransform} />
      <PixelForgeExportControls
        scale={exportScale}
        sizeLabel={exportSize}
        onCopy={onCopyPng}
        onExport={onExportPng}
        onScaleChange={onScaleChange}
      />
    </aside>
  );
}
