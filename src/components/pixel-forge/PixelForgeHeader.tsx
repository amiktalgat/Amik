type PixelForgeHeaderProps = {
  canRedo: boolean;
  canUndo: boolean;
  mode: 'pixel' | 'animation' | 'tilemap';
  onNew: () => void;
  onOpen: () => void;
  onGenerate: () => void;
  onReset: () => void;
  onExport: () => void;
  onRedo: () => void;
  onUndo: () => void;
  onModeChange: (mode: 'pixel' | 'animation' | 'tilemap') => void;
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
        <button className={mode === 'pixel' ? 'active' : ''} onClick={() => onModeChange('pixel')}>Пиксели</button>
        <button className={mode === 'animation' ? 'active' : ''} onClick={() => onModeChange('animation')}>Анимация</button>
        <button className={mode === 'tilemap' ? 'active' : ''} onClick={() => onModeChange('tilemap')}>Карта</button>
        {mode !== 'tilemap' && (
          <>
            <button onClick={onNew}>Новый</button>
            <button onClick={onOpen}>Открыть</button>
            <button onClick={onReset}>Сброс</button>
            <button disabled={!canUndo} onClick={onUndo}>Назад</button>
            <button disabled={!canRedo} onClick={onRedo}>Вперёд</button>
            <button onClick={onGenerate}>Сделать пиксели</button>
            <button className="pf-primary" onClick={onExport}>
              Скачать PNG
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
