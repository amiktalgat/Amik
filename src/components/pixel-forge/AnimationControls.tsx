import { fpsOptions, type AnimationFps } from '../../lib/pixelAnimation';
import type { ScaleLevel } from '../../lib/pixelForge';

type AnimationControlsProps = {
  fps: AnimationFps;
  isLooping: boolean;
  isPlaying: boolean;
  onionOpacity: number;
  scale: ScaleLevel;
  showNextFrame: boolean;
  showPreviousFrame: boolean;
  onExportPngSequence: () => void;
  onFpsChange: (fps: AnimationFps) => void;
  onGifExport: () => void;
  onLoopChange: (isLooping: boolean) => void;
  onOnionOpacityChange: (opacity: number) => void;
  onPause: () => void;
  onPlay: () => void;
  onScaleChange: (scale: ScaleLevel) => void;
  onShowNextFrameChange: (isVisible: boolean) => void;
  onShowPreviousFrameChange: (isVisible: boolean) => void;
  onStop: () => void;
};

export function AnimationControls({
  fps,
  isLooping,
  isPlaying,
  onionOpacity,
  scale,
  showNextFrame,
  showPreviousFrame,
  onExportPngSequence,
  onFpsChange,
  onGifExport,
  onLoopChange,
  onOnionOpacityChange,
  onPause,
  onPlay,
  onScaleChange,
  onShowNextFrameChange,
  onShowPreviousFrameChange,
  onStop,
}: AnimationControlsProps) {
  return (
    <section className="pf-controls">
      <h2>Animation</h2>
      <div className="pf-toolGrid">
        <button className={isPlaying ? 'active' : ''} onClick={onPlay}>Play</button>
        <button disabled={!isPlaying} onClick={onPause}>Pause</button>
        <button onClick={onStop}>Stop</button>
      </div>
      <label>
        FPS
        <select value={fps} onChange={(event) => onFpsChange(Number(event.target.value) as AnimationFps)}>
          {fpsOptions.map((value) => (
            <option key={value} value={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="pf-checkbox">
        <input type="checkbox" checked={isLooping} onChange={(event) => onLoopChange(event.target.checked)} />
        Loop
      </label>
      <h2>Onion Skin</h2>
      <label className="pf-checkbox">
        <input
          type="checkbox"
          checked={showPreviousFrame}
          onChange={(event) => onShowPreviousFrameChange(event.target.checked)}
        />
        Previous Frame
      </label>
      <label className="pf-checkbox">
        <input
          type="checkbox"
          checked={showNextFrame}
          onChange={(event) => onShowNextFrameChange(event.target.checked)}
        />
        Next Frame
      </label>
      <label>
        Opacity {onionOpacity}%
        <input
          type="range"
          min="10"
          max="80"
          step="10"
          value={onionOpacity}
          onChange={(event) => onOnionOpacityChange(Number(event.target.value))}
        />
      </label>
      <h2>Export Animation</h2>
      <label>
        Scale
        <select value={scale} onChange={(event) => onScaleChange(Number(event.target.value) as ScaleLevel)}>
          {[1, 2, 4, 8, 16].map((level) => (
            <option key={level} value={level}>{level}x</option>
          ))}
        </select>
      </label>
      <div className="pf-generatorActions">
        <button className="pf-primary" onClick={onExportPngSequence}>PNG Sequence</button>
        <button onClick={onGifExport}>GIF</button>
      </div>
    </section>
  );
}
