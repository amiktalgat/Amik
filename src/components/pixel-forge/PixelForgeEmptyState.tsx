type PixelForgeEmptyStateProps = {
  onOpen: () => void;
  onDemo: () => void;
};

export function PixelForgeEmptyState({ onOpen, onDemo }: PixelForgeEmptyStateProps) {
  return (
    <div className="pf-emptyState">
      <div className="pf-emptyIcon">PF</div>
      <h1>Drop an image here</h1>
      <p>Open a picture to turn it into pixel art, or start with the demo to see how the editor works.</p>
      <div className="pf-emptyActions">
        <button className="pf-primary" onClick={onOpen}>
          Open Image
        </button>
        <button onClick={onDemo}>Try Demo</button>
      </div>
    </div>
  );
}
