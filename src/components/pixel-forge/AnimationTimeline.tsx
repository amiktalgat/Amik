import type { AnimationFrame } from '../../lib/pixelAnimation';

type AnimationTimelineProps = {
  currentFrameIndex: number;
  frames: AnimationFrame[];
  onAddFrame: () => void;
  onDeleteFrame: () => void;
  onDuplicateFrame: () => void;
  onMoveFrame: (direction: -1 | 1) => void;
  onSelectFrame: (index: number) => void;
};

export function AnimationTimeline({
  currentFrameIndex,
  frames,
  onAddFrame,
  onDeleteFrame,
  onDuplicateFrame,
  onMoveFrame,
  onSelectFrame,
}: AnimationTimelineProps) {
  return (
    <section className="pf-timeline" aria-label="Animation timeline">
      <div className="pf-frameStrip">
        {frames.map((frame, index) => (
          <button
            className={`pf-frameButton ${currentFrameIndex === index ? 'active' : ''}`}
            key={frame.id}
            onClick={() => onSelectFrame(index)}
          >
            Frame {index + 1}
          </button>
        ))}
      </div>
      <div className="pf-timelineActions">
        <button onClick={onAddFrame}>Add Frame</button>
        <button onClick={onDuplicateFrame}>Duplicate Frame</button>
        <button disabled={frames.length <= 1} onClick={onDeleteFrame}>Delete Frame</button>
        <button disabled={currentFrameIndex === 0} onClick={() => onMoveFrame(-1)}>Move Left</button>
        <button disabled={currentFrameIndex === frames.length - 1} onClick={() => onMoveFrame(1)}>Move Right</button>
      </div>
    </section>
  );
}
