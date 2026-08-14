import { useState } from 'react';
import {
  aiErrorMessage,
  generateAIImage,
  type AIImageResult,
  type AIImageSize,
  type AIImageStyle,
} from '../lib/aiImageProvider';

const styles: AIImageStyle[] = ['Pixel Art', '8-bit', '16-bit', 'Retro', 'GameBoy', 'Fantasy', 'Cyberpunk'];
const sizes: AIImageSize[] = [16, 32, 64];

type AIImageMakerProps = {
  onStatus: (status: string) => void;
};

export function AIImageMaker({ onStatus }: AIImageMakerProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<AIImageStyle>('Pixel Art');
  const [size, setSize] = useState<AIImageSize>(32);
  const [image, setImage] = useState<AIImageResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('Ready to create a picture');

  async function createImage() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setMessage('Write what picture you want.');
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 75_000);

    setIsGenerating(true);
    setMessage('Drawing...');
    onStatus('AI picture generation started');

    try {
      const result = await generateAIImage(cleanPrompt, { style, size, signal: controller.signal });
      setImage(result);
      setMessage('Picture is ready');
      onStatus('AI picture is ready');
    } catch (error) {
      const errorMessage = aiErrorMessage(error);
      setMessage(errorMessage);
      onStatus(errorMessage);
    } finally {
      window.clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  }

  return (
    <section className="pf-aiPanel">
      <h2>AI Picture Maker</h2>
      <label>
        Picture prompt
        <textarea
          rows={4}
          value={prompt}
          placeholder="A tiny robot wizard in a crystal cave"
          onChange={(event) => setPrompt(event.target.value)}
        />
      </label>
      <Picker label="Style" options={styles} value={style} onChange={setStyle} />
      <Picker
        label="Sprite size"
        options={sizes}
        value={size}
        format={(value) => `${value}x${value}`}
        onChange={setSize}
      />
      <div className="pf-aiActions">
        <button className="pf-primary" type="button" disabled={isGenerating} onClick={() => void createImage()}>
          {isGenerating ? 'Drawing...' : 'Make Picture'}
        </button>
        <a
          className={`pf-downloadButton${image ? '' : ' disabled'}`}
          href={image?.imageDataUrl ?? '#'}
          download="ai-picture.png"
          aria-disabled={!image}
        >
          Download
        </a>
      </div>
      <p className="pf-aiMessage">{message}</p>
      {image && (
        <div className="pf-aiPreview">
          <h3>Generated picture</h3>
          <img src={image.imageDataUrl} alt="AI generated result" />
        </div>
      )}
    </section>
  );
}

type PickerProps<Value extends string | number> = {
  label: string;
  options: Value[];
  value: Value;
  format?: (value: Value) => string;
  onChange: (value: Value) => void;
};

function Picker<Value extends string | number>({
  label,
  options,
  value,
  format = String,
  onChange,
}: PickerProps<Value>) {
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
