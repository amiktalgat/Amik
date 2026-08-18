import type { AnimationFrame } from '../../lib/pixelAnimation';

type AnimationTimelineProps = {
  currentFrameIndex: number;
  frames: AnimationFrame[];
  isPlaying: boolean;
  onAddFrame: () => void;
  onDeleteFrame: () => void;
  onDuplicateFrame: () => void;
  onMoveFrame: (direction: -1 | 1) => void;
  onSelectFrame: (index: number) => void;
  onStart: () => void;
  onStop: () => void;
};

export function AnimationTimeline({
  currentFrameIndex,
  frames,
  isPlaying,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onMoveFrame,
  onSelectFrame,
  onStart,
  onStop,
}: AnimationTimelineProps) {
  return (
    <section className="pf-timeline" aria-label="Animation timeline">
      <div className="pf-frameStrip">
        {frames.map((frame, index) => (
          <button
            className={`pf-frameButton ${currentFrameIndex === index ? 'active' : ''}`}
            key={frame.id}
            title={`Frame ${index + 1}`}
            onClick={() => onSelectFrame(index)}
          >
            <span aria-hidden="true">▣</span>
            {index + 1}
          </button>
        ))}
      </div>
      <div className="pf-timelineActions">
        <button aria-label="Start" className="pf-primary" disabled={isPlaying} title="Start" onClick={onStart}>▶</button>
        <button aria-label="Stop" disabled={!isPlaying} title="Stop" onClick={onStop}>■</button>
        <button aria-label="Add frame" title="Add frame" onClick={onAddFrame}>+</button>
        <button aria-label="Duplicate frame" title="Duplicate frame" onClick={onDuplicateFrame}>⧉</button>
        <button aria-label="Delete frame" disabled={frames.length <= 1} title="Delete frame" onClick={onDeleteFrame}>×</button>
        <button aria-label="Move frame left" disabled={currentFrameIndex === 0} title="Move frame left" onClick={() => onMoveFrame(-1)}>←</button>
        <button aria-label="Move frame right" disabled={currentFrameIndex === frames.length - 1} title="Move frame right" onClick={() => onMoveFrame(1)}>→</button>
      </div>
    </section>
  );
}
