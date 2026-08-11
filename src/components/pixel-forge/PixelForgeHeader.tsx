type PixelForgeHeaderProps = {
  canRedo: boolean;
  canUndo: boolean;
  mode: 'pixel' | 'animation';
  onNew: () => void;
  onOpen: () => void;
  onGenerate: () => void;
  onReset: () => void;
  onExport: () => void;
  onRedo: () => void;
  onUndo: () => void;
  onModeChange: (mode: 'pixel' | 'animation') => void;
};

export function PixelForgeHeader({
  canRedo,
  canUndo,
  mode,
  onNew,
  onOpen,
  onGenerate,
  onReset,
  onExport,
  onRedo,
  onUndo,
  onModeChange,
}: PixelForgeHeaderProps) {
  return (
    <header className="pf-topbar">
      <div className="pf-brand">
        <span className="pf-brandMark" />
        PixelForge
      </div>
      <nav className="pf-actions">
        <button className={mode === 'pixel' ? 'active' : ''} onClick={() => onModeChange('pixel')}>Pixel Editor</button>
        <button className={mode === 'animation' ? 'active' : ''} onClick={() => onModeChange('animation')}>Animation</button>
        <button onClick={onNew}>New</button>
        <button onClick={onOpen}>Open</button>
        <button onClick={onReset}>Reset</button>
        <button disabled={!canUndo} onClick={onUndo}>Undo</button>
        <button disabled={!canRedo} onClick={onRedo}>Redo</button>
        <button onClick={onGenerate}>Generate Pixel Art</button>
        <button className="pf-primary" onClick={onExport}>
          Export PNG
        </button>
      </nav>
    </header>
  );
}
