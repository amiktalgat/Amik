import type { TransformAction } from '../../lib/pixelForge';

type PixelForgeTransformControlsProps = {
  onTransform: (action: TransformAction) => void;
};

const transformButtons: { action: TransformAction; label: string }[] = [
  { action: 'flipHorizontal', label: 'Flip Horizontal' },
  { action: 'flipVertical', label: 'Flip Vertical' },
  { action: 'rotateLeft', label: 'Rotate Left' },
  { action: 'rotateRight', label: 'Rotate Right' },
];

export function PixelForgeTransformControls({ onTransform }: PixelForgeTransformControlsProps) {
  return (
    <section>
      <h2>Transform</h2>
      <div className="pf-toolGrid">
        {transformButtons.map((button) => (
          <button key={button.action} onClick={() => onTransform(button.action)}>
            {button.label}
          </button>
        ))}
      </div>
    </section>
  );
}
