import {
  type AnimationFrame,
  type AnimationFps,
  type SpriteSheetOptions,
} from '../../lib/pixelAnimation';
import {
  colorCountOptions,
  pixelSizeOptions,
  type ColorCount,
  type PixelSettings,
  type PixelSize,
  type ScaleLevel,
  type Tool,
  type TransformAction,
  type ZoomLevel,
} from '../../lib/pixelForge';
import type { AIImageResult, AIImageSize } from '../../lib/aiImageProvider';
import { AIImageGenerator } from './AIImageGenerator';
import { AnimationControls } from './AnimationControls';
import type { PaletteId } from '../../lib/pixelPalettes';
import { ColorInspector } from './ColorInspector';
import { CustomPaletteEditor } from './CustomPaletteEditor';
import { DitheringSelector } from './DitheringSelector';
import { PixelForgeExportControls } from './PixelForgeExportControls';
import { PaletteSelector } from './PaletteSelector';
import { PixelForgeTransformControls } from './PixelForgeTransformControls';
import { PixelForgeViewControls } from './PixelForgeViewControls';
import { SpriteSheetGenerator } from './SpriteSheetGenerator';

type PixelForgeRightPanelProps = {
  animationFps: AnimationFps;
  color: string;
  gridOpacity: number;
  aiImage: AIImageResult | null;
  aiConversionSettings: PixelSettings;
  exportScale: ScaleLevel;
  exportSize: string;
  frames: AnimationFrame[];
  isGridVisible: boolean;
  isGeneratingAI: boolean;
  isLoopingAnimation: boolean;
  isPlayingAnimation: boolean;
  mode: 'pixel' | 'animation';
  onionOpacity: number;
  showNextFrame: boolean;
  showPreviousFrame: boolean;
  spriteSheetOptions: SpriteSheetOptions;
  settings: PixelSettings;
  tool: Tool;
  zoom: ZoomLevel | 'fit';
  onAddToPalette: () => void;
  onAIImage: (image: AIImageResult, prompt: string, size: AIImageSize) => void;
  onAIConversionSettingsChange: (settings: PixelSettings) => void;
  onAIGeneratingChange: (isGenerating: boolean) => void;
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
  onGenerate: () => void;
  onReset: () => void;
  onScaleChange: (scale: ScaleLevel) => void;
  onOnionOpacityChange: (opacity: number) => void;
  onPauseAnimation: () => void;
  onPlayAnimation: () => void;
  onSettingsChange: (settings: PixelSettings) => void;
  onShowNextFrameChange: (isVisible: boolean) => void;
  onShowPreviousFrameChange: (isVisible: boolean) => void;
  onSpriteSheetOptionsChange: (options: SpriteSheetOptions) => void;
  onStatus: (status: string) => void;
  onToolChange: (tool: Tool) => void;
  onTransform: (action: TransformAction) => void;
  onStopAnimation: () => void;
  onConvertAIImage: () => void;
  onDownloadAIOriginal: () => void;
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
  aiImage,
  aiConversionSettings,
  exportScale,
  exportSize,
  frames,
  isGridVisible,
  isGeneratingAI,
  isLoopingAnimation,
  isPlayingAnimation,
  mode,
  onionOpacity,
  showNextFrame,
  showPreviousFrame,
  spriteSheetOptions,
  settings,
  tool,
  zoom,
  onAddToPalette,
  onAIConversionSettingsChange,
  onAIImage,
  onAIGeneratingChange,
  onCopyPng,
  onCustomColorChange,
  onCustomColorRemove,
  onColorChange,
  onExportPng,
  onExportPngSequence,
  onExportSpriteSheet,
  onFpsChange,
  onGenerate,
  onGridOpacityChange,
  onGridVisibleChange,
  onLoopAnimationChange,
  onReset,
  onScaleChange,
  onOnionOpacityChange,
  onPauseAnimation,
  onPlayAnimation,
  onSettingsChange,
  onShowNextFrameChange,
  onShowPreviousFrameChange,
  onSpriteSheetOptionsChange,
  onStatus,
  onToolChange,
  onTransform,
  onStopAnimation,
  onConvertAIImage,
  onDownloadAIOriginal,
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
      <AIImageGenerator
        conversionSettings={aiConversionSettings}
        customPalette={settings.customPalette}
        image={aiImage}
        isGenerating={isGeneratingAI}
        onConversionSettingsChange={onAIConversionSettingsChange}
        onDownloadOriginal={onDownloadAIOriginal}
        onGeneratingChange={onAIGeneratingChange}
        onImage={onAIImage}
        onStatus={onStatus}
        onConvertImage={onConvertAIImage}
      />
      <PaletteSelector
        customPalette={settings.customPalette}
        value={settings.paletteId}
        onChange={(paletteId) => changeSetting('paletteId', paletteId as PaletteId)}
      />
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
      <section className="pf-controls">
        <Select
          label="Pixel Size"
          value={String(settings.pixelSize)}
          options={pixelSizeOptions.map((value) => String(value))}
          onChange={(value) => changeSetting('pixelSize', Number(value) as PixelSize)}
        />
        <Select
          label="Colors"
          value={String(settings.colorCount)}
          options={colorCountOptions.map((value) => String(value))}
          onChange={(value) => changeSetting('colorCount', Number(value) as ColorCount)}
        />
        <DitheringSelector value={settings.dithering} onChange={(value) => changeSetting('dithering', value)} />
        <div className="pf-generatorActions">
          <button className="pf-primary" onClick={onGenerate}>
            Generate Pixel Art
          </button>
          <button onClick={onReset}>Reset</button>
        </div>
      </section>
    </aside>
  );
}

type SelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'original' ? 'Original' : option}
          </option>
        ))}
      </select>
    </label>
  );
}
