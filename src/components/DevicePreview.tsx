import { useEffect, useState, type ReactNode } from 'react';

type DeviceMode = 'desktop' | 'mobile';

type DevicePreviewProps = {
  children: ReactNode;
};

const storageKey = 'amikDeviceMode';

export function DevicePreview({ children }: DevicePreviewProps) {
  const [mode, setMode] = useState<DeviceMode>(() => {
    const savedMode = localStorage.getItem(storageKey);
    return savedMode === 'mobile' ? 'mobile' : 'desktop';
  });

  useEffect(() => {
    localStorage.setItem(storageKey, mode);
  }, [mode]);

  return (
    <div className={`device-preview device-preview--${mode}`}>
      <div className="device-toolbar" aria-label="Preview mode">
        <button
          className={mode === 'desktop' ? 'active' : ''}
          type="button"
          onClick={() => setMode('desktop')}
        >
          Desktop
        </button>
        <button
          className={mode === 'mobile' ? 'active' : ''}
          type="button"
          onClick={() => setMode('mobile')}
        >
          Mobile
        </button>
      </div>
      <div className="device-frame">
        <div className="device-stage">{children}</div>
      </div>
    </div>
  );
}
