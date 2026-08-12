import { useEffect, useRef, useState } from 'react';
import {
  aiErrorMessage,
  generateAIImage,
  type AIImageResult,
  type AIImageSize,
  type AIImageStyle,
} from '../../lib/aiImageProvider';
import {
  colorCountOptions,
  pixelSizeOptions,
  renderPixelArt,
  type ColorCount,
  type PixelSettings,
  type PixelSize,
} from '../../lib/pixelForge';
import { predefinedPalettes, type PaletteId } from '../../lib/pixelPalettes';
import { DitheringSelector } from './DitheringSelector';

const styles: AIImageStyle[] = ['Pixel Art', '8-bit', '16-bit', 'Retro', 'GameBoy', 'Fantasy', 'Cyberpunk'];
const sizes: AIImageSize[] = [16, 32, 64];

type AIImageGeneratorProps = {
  conversionSettings: PixelSettings;
  customPalette: string[];
  image: AIImageResult | null;
  isGenerating: boolean;
  onConversionSettingsChange: (settings: PixelSettings) => void;
  onImage: (image: AIImageResult, prompt: string, size: AIImageSize) => void;
  onGeneratingChange: (isGenerating: boolean) => void;
  onConvertImage: () => void;
  onDownloadOriginal: () => void;
  onStatus: (status: string) => void;
  convertLabel?: string;
};

export function AIImageGenerator({
  convertLabel = 'Convert to Pixel Art',
  conversionSettings,
  customPalette,
  image,
  isGenerating,
  onConversionSettingsChange,
  onImage,
  onGeneratingChange,
  onConvertImage,
  onDownloadOriginal,
  onStatus,
}: AIImageGeneratorProps) {
  const sourceCanvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [prompt, setPrompt] = useState('');
  const [lastPrompt, setLastPrompt] = useState('');
  const [style, setStyle] = useState<AIImageStyle>('Pixel Art');
  const [size, setSize] = useState<AIImageSize>(32);
  const [message, setMessage] = useState('AI provider is not configured until the backend has OPENAI_API_KEY.');

  useEffect(() => {
    if (!image) return;

    const nextImage = new Image();
    nextImage.onload = () => {
      const sourceCanvas = sourceCanvasRef.current;
      sourceCanvas.width = nextImage.naturalWidth;
      sourceCanvas.height = nextImage.naturalHeight;
      sourceCanvas.getContext('2d')?.drawImage(nextImage, 0, 0);
      renderPreview();
    };
    nextImage.src = image.imageDataUrl;
  }, [image]);

  useEffect(() => {
    renderPreview();
  }, [conversionSettings]);

  useEffect(() => {
    onConversionSettingsChange({ ...conversionSettings, customPalette });
  }, [customPalette]);

  const renderPreview = () => {
    const previewCanvas = previewCanvasRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    if (!previewCanvas || sourceCanvas.width === 0 || sourceCanvas.height === 0) return;
    renderPixelArt(previewCanvas, sourceCanvas, conversionSettings);
  };

  const changeConversionSetting = <Key extends keyof PixelSettings>(key: Key, value: PixelSettings[Key]) => {
    onConversionSettingsChange({ ...conversionSettings, customPalette, [key]: value });
  };

  const runGenerate = async (nextPrompt = prompt) => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 60000);

    onGeneratingChange(true);
    setMessage('Generating...');
    onStatus('AI image generation started');

    try {
      const result = await generateAIImage(nextPrompt, { style, size, signal: controller.signal });
      setLastPrompt(nextPrompt.trim());
      setMessage('AI image ready');
      onImage(result, nextPrompt.trim(), size);
      onStatus('AI image generated');
    } catch (error) {
      const errorMessage = aiErrorMessage(error);
      setMessage(errorMessage);
      onStatus(errorMessage);
    } finally {
      window.clearTimeout(timeoutId);
      onGeneratingChange(false);
    }
  };

  return (
    <section className="pf-aiPanel">
      <h2>AI Generate</h2>
      <label>
        Prompt
        <textarea
          rows={4}
          value={prompt}
          placeholder="A small pixel art knight fighting a dragon in a dark forest"
          onChange={(event) => setPrompt(event.target.value)}
        />
      </label>
      <SegmentedControl label="Style" options={styles} value={style} onChange={setStyle} />
      <SegmentedControl
        label="Size"
        options={sizes}
        value={size}
        format={(value) => `${value}x${value}`}
        onChange={setSize}
      />
      <div className="pf-aiActions">
        <button className="pf-primary" disabled={isGenerating} onClick={() => void runGenerate()}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
        <button disabled={isGenerating || !lastPrompt} onClick={() => void runGenerate(lastPrompt)}>
          Regenerate
        </button>
      </div>
      <p className="pf-aiMessage">{message}</p>
      {image && (
        <div className="pf-aiPreview">
          <h3>AI Image</h3>
          <img src={image.imageDataUrl} alt="AI generated preview" />
          <div className="pf-aiConvertControls">
            <Select
              label="Pixel Size"
              value={String(conversionSettings.pixelSize)}
              options={pixelSizeOptions.map(String)}
              onChange={(value) => changeConversionSetting('pixelSize', Number(value) as PixelSize)}
            />
            <Select
              label="Colors"
              value={String(conversionSettings.colorCount)}
              options={colorCountOptions.map(String)}
              onChange={(value) => changeConversionSetting('colorCount', Number(value) as ColorCount)}
            />
            <Select
              label="Palette"
              value={conversionSettings.paletteId}
              options={[...predefinedPalettes, { id: 'custom' as const, name: 'Custom' }].map((palette) => palette.id)}
              format={(value) => paletteName(value as PaletteId)}
              onChange={(value) => changeConversionSetting('paletteId', value as PaletteId)}
            />
            <DitheringSelector
              value={conversionSettings.dithering}
              onChange={(value) => changeConversionSetting('dithering', value)}
            />
          </div>
          <h3>Pixel Preview</h3>
          <canvas ref={previewCanvasRef} aria-label="Pixel art conversion preview" />
          <div className="pf-aiActions">
            <button className="pf-primary" onClick={onConvertImage}>{convertLabel}</button>
            <button onClick={onDownloadOriginal}>Download Original</button>
          </div>
        </div>
      )}
    </section>
  );
}

function paletteName(paletteId: PaletteId) {
  if (paletteId === 'custom') return 'Custom';
  return predefinedPalettes.find((palette) => palette.id === paletteId)?.name ?? 'Original';
}

type SegmentedControlProps<Value extends string | number> = {
  label: string;
  options: Value[];
  value: Value;
  format?: (value: Value) => string;
  onChange: (value: Value) => void;
};

function SegmentedControl<Value extends string | number>({
  label,
  options,
  value,
  format = String,
  onChange,
}: SegmentedControlProps<Value>) {
  return (
    <fieldset className="pf-segmented">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <button
            className={option === value ? 'active' : ''}
            key={option}
            type="button"
            onClick={() => onChange(option)}
          >
            {format(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

type SelectProps<Value extends string> = {
  label: string;
  value: Value;
  options: Value[];
  format?: (value: Value) => string;
  onChange: (value: Value) => void;
};

function Select<Value extends string>({
  label,
  value,
  options,
  format = String,
  onChange,
}: SelectProps<Value>) {
  return (
    <label>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value as Value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {format(option)}
          </option>
        ))}
      </select>
    </label>
  );
}
