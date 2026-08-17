import { useRef, useState } from 'react';

type BattleReferencePanelProps = {
  imageUrl: string;
  opacity: number;
  open: boolean;
  position: { x: number; y: number };
  scale: number;
  onClose: () => void;
  onImageChange: (imageUrl: string) => void;
  onOpacityChange: (opacity: number) => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onScaleChange: (scale: number) => void;
  onRemove: () => void;
};

export function BattleReferencePanel({
  imageUrl,
  opacity,
  open,
  position,
  scale,
  onClose,
  onImageChange,
  onOpacityChange,
  onPositionChange,
  onScaleChange,
  onRemove,
}: BattleReferencePanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (!open) return null;

  function loadFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onImageChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) loadFile(file);
  }

  return (
    <section className="battle-reference" aria-label="Reference image window">
      <div className="battle-reference__header">
        <div>
          <p className="battle-panel__title">Reference image</p>
          <h2>Draw from a picture</h2>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <div
        className={`battle-reference__drop ${isDragging ? 'active' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragLeave={() => setIsDragging(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDrop={handleDrop}
      >
        {imageUrl ? <img src={imageUrl} alt="Reference preview" /> : <p>Drop an image here or click to choose one.</p>}
      </div>
      <label className="battle-reference__opacity">
        Overlay opacity
        <input
          type="range"
          min="0.1"
          max="0.8"
          step="0.05"
          value={opacity}
          onChange={(event) => onOpacityChange(Number(event.target.value))}
        />
      </label>
      <label className="battle-reference__opacity">
        Image size {Math.round(scale * 100)}%
        <input
          type="range"
          min="0.25"
          max="2"
          step="0.05"
          value={scale}
          onChange={(event) => onScaleChange(Number(event.target.value))}
        />
      </label>
      <label className="battle-reference__opacity">
        Move X {Math.round(position.x)}
        <input
          type="range"
          min="0"
          max="2000"
          step="10"
          value={position.x}
          onChange={(event) => onPositionChange({ ...position, x: Number(event.target.value) })}
        />
      </label>
      <label className="battle-reference__opacity">
        Move Y {Math.round(position.y)}
        <input
          type="range"
          min="0"
          max="2000"
          step="10"
          value={position.y}
          onChange={(event) => onPositionChange({ ...position, y: Number(event.target.value) })}
        />
      </label>
      <div className="battle-reference__actions">
        <button type="button" onClick={() => inputRef.current?.click()}>Choose image</button>
        <button type="button" disabled={!imageUrl} onClick={onRemove}>Remove</button>
      </div>
      <p className="battle-reference__hint">The image is centered on the canvas under your pixels.</p>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) loadFile(file);
        event.target.value = '';
      }} />
    </section>
  );
}
