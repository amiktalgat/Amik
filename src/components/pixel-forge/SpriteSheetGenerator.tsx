import { useEffect, useRef, useState } from 'react';
import {
  getSpriteSheetLayout,
  makeSpriteSheetCanvas,
  type AnimationFrame,
  type SpriteSheetMode,
  type SpriteSheetOptions,
} from '../../lib/pixelAnimation';
import type { PixelSize, ScaleLevel } from '../../lib/pixelForge';

type SpriteSheetGeneratorProps = {
  frames: AnimationFrame[];
  options: SpriteSheetOptions;
  pixelSize: PixelSize;
  scale: ScaleLevel;
  onExport: () => void;
  onOptionsChange: (options: SpriteSheetOptions) => void;
};

const modes: { id: SpriteSheetMode; label: string }[] = [
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'grid', label: 'Grid' },
];

export function SpriteSheetGenerator({
  frames,
  options,
  pixelSize,
  scale,
  onExport,
  onOptionsChange,
}: SpriteSheetGeneratorProps) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const [previewSize, setPreviewSize] = useState('No frames');
  const filledFrameCount = frames.filter((frame) => frame.dataUrl).length;
  const layout = getSpriteSheetLayout(filledFrameCount, options);

  useEffect(() => {
    let isActive = true;
    void makeSpriteSheetCanvas(frames, pixelSize, scale, options).then((sheet) => {
      if (!isActive) return;
      const preview = previewRef.current;
      const context = preview?.getContext('2d');
      if (!preview || !context || !sheet) {
        if (preview && context) {
          context.clearRect(0, 0, preview.width, preview.height);
          preview.width = 0;
          preview.height = 0;
        }
        setPreviewSize('No frames');
        return;
      }

      preview.width = sheet.width;
      preview.height = sheet.height;
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, preview.width, preview.height);
      context.drawImage(sheet, 0, 0);
      setPreviewSize(`${sheet.width} x ${sheet.height}px`);
    });

    return () => {
      isActive = false;
    };
  }, [frames, options, pixelSize, scale]);

  const changeNumber = (key: 'columns' | 'rows' | 'padding' | 'spacing', value: string) => {
    const nextValue = Math.max(key === 'padding' || key === 'spacing' ? 0 : 1, Math.floor(Number(value) || 0));
    onOptionsChange({ ...options, [key]: nextValue });
  };

  return (
    <section className="pf-controls">
      <h2>Sprite Sheet Generator</h2>
      <fieldset className="pf-segmented">
        <legend>Mode</legend>
        <div>
          {modes.map((mode) => (
            <button
              className={options.mode === mode.id ? 'active' : ''}
              key={mode.id}
              type="button"
              onClick={() => onOptionsChange({ ...options, mode: mode.id })}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="pf-sheetGrid">
        <NumberInput label="Columns" value={options.columns} onChange={(value) => changeNumber('columns', value)} />
        <NumberInput label="Rows" value={options.rows} onChange={(value) => changeNumber('rows', value)} />
        <NumberInput label="Padding" value={options.padding} min={0} onChange={(value) => changeNumber('padding', value)} />
        <NumberInput label="Spacing" value={options.spacing} min={0} onChange={(value) => changeNumber('spacing', value)} />
      </div>
      <div className="pf-sheetMeta">
        {layout.columns} columns x {layout.rows} rows | {previewSize}
      </div>
      <div className="pf-sheetPreview">
        <canvas ref={previewRef} aria-label="Preview Sprite Sheet" />
      </div>
      <button className="pf-primary" disabled={filledFrameCount === 0} onClick={onExport}>
        Export PNG
      </button>
    </section>
  );
}

type NumberInputProps = {
  label: string;
  min?: number;
  value: number;
  onChange: (value: string) => void;
};

function NumberInput({ label, min = 1, value, onChange }: NumberInputProps) {
  return (
    <label>
      {label}
      <input min={min} step="1" type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
