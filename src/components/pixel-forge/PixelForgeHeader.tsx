import { Link } from 'wouter';

type EditorMode = 'pixel' | 'animation' | 'tilemap';

type PixelForgeHeaderProps = {
  canRedo: boolean;
  canUndo: boolean;
  mode: EditorMode;
  onNew: () => void;
  onOpen: () => void;
  onGenerate: () => void;
  onReset: () => void;
  onExport: () => void;
  onRedo: () => void;
  onUndo: () => void;
  onModeChange: (mode: EditorMode) => void;
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
        <Link href="/">Главное меню</Link>
        <button className={mode === 'pixel' ? 'active' : ''} onClick={() => onModeChange('pixel')}>Pixels</button>
        <button className={mode === 'animation' ? 'active' : ''} onClick={() => onModeChange('animation')}>Animation</button>
        <button className={mode === 'tilemap' ? 'active' : ''} onClick={() => onModeChange('tilemap')}>Map</button>
        <Link href="/ai-image">AI Generator</Link>
        {mode !== 'tilemap' && (
          <>
            <button onClick={onNew}>New</button>
            <button onClick={onOpen}>Open</button>
            <button onClick={onReset}>Reset</button>
            <button disabled={!canUndo} onClick={onUndo}>Undo</button>
            <button disabled={!canRedo} onClick={onRedo}>Redo</button>
            <button onClick={onGenerate}>Make Pixels</button>
            <button className="pf-primary" onClick={onExport}>
              Download PNG
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
