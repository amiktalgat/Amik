import { useEffect, useState, type ReactNode } from 'react';

type DeviceMode = 'desktop' | 'mobile';

type DevicePreviewProps = {
  children: ReactNode;
};

const storageKey = 'amikDeviceMode';

export function DevicePreview({ children }: DevicePreviewProps) {
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [mode, setMode] = useState<DeviceMode>(() => {
    const savedMode = localStorage.getItem(storageKey);
    return savedMode === 'mobile' ? 'mobile' : 'desktop';
  });

  useEffect(() => {
    localStorage.setItem(storageKey, mode);
  }, [mode]);

  return (
    <div className={`device-preview device-preview--${mode}`}>
      <div className={`device-toolbar ${isToolbarOpen ? 'open' : ''}`} aria-label="Preview mode">
        <button
          className="device-toolbar__toggle"
          type="button"
          onClick={() => setIsToolbarOpen((current) => !current)}
        >
          View
        </button>
        {isToolbarOpen && (
          <div className="device-toolbar__options">
            <button
              className={mode === 'desktop' ? 'active' : ''}
              type="button"
              onClick={() => {
                setMode('desktop');
                setIsToolbarOpen(false);
              }}
            >
              Desktop
            </button>
            <button
              className={mode === 'mobile' ? 'active' : ''}
              type="button"
              onClick={() => {
                setMode('mobile');
                setIsToolbarOpen(false);
              }}
            >
              Mobile
            </button>
          </div>
        )}
      </div>
      <div className="device-frame">
        <div className="device-stage">{children}</div>
      </div>
    </div>
  );
}
