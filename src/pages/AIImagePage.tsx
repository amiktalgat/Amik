import { useState } from 'react';
import { Link } from 'wouter';
import { AIImageGenerator } from '../components/pixel-forge/AIImageGenerator';
import { downloadPng } from '../lib/pixelExport';
import { renderPixelArt, type PixelSettings } from '../lib/pixelForge';
import type { AIImageResult, AIImageSize } from '../lib/aiImageProvider';
import { defaultCustomPalette } from '../lib/pixelPalettes';
import './pixelForge.css';
import '../components/pixel-forge/paletteControls.css';

const defaultSettings: PixelSettings = {
  pixelSize: 32,
  colorCount: 16,
  paletteId: 'original',
  customPalette: defaultCustomPalette,
  dithering: 'none',
};

export function AIImagePage() {
  const [image, setImage] = useState<AIImageResult | null>(null);
  const [settings, setSettings] = useState<PixelSettings>(defaultSettings);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState('AI generator ready');

  const receiveImage = (nextImage: AIImageResult, prompt: string, size: AIImageSize) => {
    setImage(nextImage);
    setSettings((current) => ({ ...current, pixelSize: (1024 / size) as PixelSettings['pixelSize'] }));
    setStatus(`Generated: ${prompt.slice(0, 40)}${prompt.length > 40 ? '...' : ''}`);
  };

  const downloadOriginal = () => {
    if (!image) {
      setStatus('Generate an image first');
      return;
    }

    const link = document.createElement('a');
    link.href = image.imageDataUrl;
    link.download = 'ai-image-original.png';
    link.click();
    setStatus('Original image downloaded');
  };

  const downloadPixelArt = () => {
    if (!image) {
      setStatus('Generate an image first');
      return;
    }

    const sourceImage = new Image();
    sourceImage.onload = () => {
      const sourceCanvas = document.createElement('canvas');
      const pixelCanvas = document.createElement('canvas');
      sourceCanvas.width = sourceImage.naturalWidth;
      sourceCanvas.height = sourceImage.naturalHeight;
      sourceCanvas.getContext('2d')?.drawImage(sourceImage, 0, 0);
      renderPixelArt(pixelCanvas, sourceCanvas, settings);
      downloadPng(pixelCanvas, 'ai-image-pixel-art.png');
      setStatus('Pixel art downloaded');
    };
    sourceImage.onerror = () => setStatus('Image could not be converted');
    sourceImage.src = image.imageDataUrl;
  };

  return (
    <div className="pf-app pf-aiPage">
      <header className="pf-topbar">
        <div className="pf-brand">
          <span className="pf-brandMark" />
          AI Image Generator
        </div>
        <nav className="pf-actions">
          <Link href="/pixel-forge">Editor</Link>
          <Link className="active" href="/ai-image">AI Generator</Link>
        </nav>
      </header>
      <main className="pf-aiPageMain">
        <AIImageGenerator
          conversionSettings={settings}
          customPalette={settings.customPalette}
          image={image}
          isGenerating={isGenerating}
          convertLabel="Download Pixel Art"
          onConversionSettingsChange={setSettings}
          onConvertImage={downloadPixelArt}
          onDownloadOriginal={downloadOriginal}
          onGeneratingChange={setIsGenerating}
          onImage={receiveImage}
          onStatus={setStatus}
        />
      </main>
      <footer className="pf-statusbar">
        <span>{status}</span>
        <span>Generator</span>
        <span>{image ? 'Image ready' : 'No image yet'}</span>
      </footer>
    </div>
  );
}
