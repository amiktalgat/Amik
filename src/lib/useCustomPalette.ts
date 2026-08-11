import { normalizeHex } from './pixelPalettes';
import type { PixelSettings } from './pixelForge';

type CustomPaletteOptions = {
  color: string;
  settings: PixelSettings;
  changeSettings: (settings: PixelSettings) => void;
  setColor: (color: string) => void;
  setStatus: (status: string) => void;
};

export function useCustomPalette({
  color,
  settings,
  changeSettings,
  setColor,
  setStatus,
}: CustomPaletteOptions) {
  const addToCustomPalette = () => {
    const nextColor = normalizeHex(color);
    if (settings.customPalette.includes(nextColor)) {
      setStatus('Color already in Custom');
      return;
    }
    changeSettings({ ...settings, customPalette: [...settings.customPalette, nextColor], paletteId: 'custom' });
    setStatus('Color added to Custom');
  };

  const changeCustomColor = (index: number, nextColor: string) => {
    const normalizedColor = normalizeHex(nextColor);
    const customPalette = settings.customPalette.map((item, itemIndex) => (
      itemIndex === index ? normalizedColor : item
    ));
    changeSettings({ ...settings, customPalette, paletteId: 'custom' });
    setColor(normalizedColor);
    setStatus('Custom color updated');
  };

  const removeCustomColor = (index: number) => {
    if (settings.customPalette.length <= 1) {
      setStatus('Custom needs at least one color');
      return;
    }
    const customPalette = settings.customPalette.filter((_, itemIndex) => itemIndex !== index);
    changeSettings({ ...settings, customPalette, paletteId: 'custom' });
    setStatus('Custom color removed');
  };

  return {
    addToCustomPalette,
    changeCustomColor,
    removeCustomColor,
  };
}
