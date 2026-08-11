export type PaletteId = 'original' | 'gameBoy' | 'nes' | 'grayscale' | 'sunset' | 'ocean' | 'pico' | 'custom';

export type PixelPalette = {
  id: PaletteId;
  name: string;
  colors: string[];
};

export const predefinedPalettes: PixelPalette[] = [
  { id: 'original', name: 'Original', colors: [] },
  { id: 'gameBoy', name: 'Game Boy', colors: ['#0F380F', '#306230', '#8BAC0F', '#9BBC0F'] },
  { id: 'nes', name: 'NES', colors: ['#000000', '#7C7C7C', '#BCBCBC', '#FFFFFF', '#A80020', '#E45C10', '#FCBC3C', '#008088', '#0078F8', '#0000BC', '#940084', '#00A800'] },
  { id: 'grayscale', name: 'Grayscale', colors: ['#111111', '#333333', '#666666', '#999999', '#CCCCCC', '#F7F7F7'] },
  { id: 'sunset', name: 'Sunset', colors: ['#2D1B46', '#6D3B6D', '#C04C64', '#F78C6B', '#FFD166', '#FFF3B0'] },
  { id: 'ocean', name: 'Ocean', colors: ['#071A2C', '#0B3D5C', '#146C94', '#19A7CE', '#AFD3E2', '#F6F1F1'] },
  { id: 'pico', name: 'Pico', colors: ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'] },
];

export const defaultCustomPalette = ['#7C5CFF', '#43D9C7', '#FFD166', '#EF476F'];

export function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex);
  const value = normalized.slice(1);

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

export function normalizeHex(value: string) {
  const trimmed = value.trim().replace(/^#/, '');
  const expanded = trimmed.length === 3 ? trimmed.split('').map((item) => item + item).join('') : trimmed;
  const valid = /^[0-9a-fA-F]{6}$/.test(expanded) ? expanded : '7C5CFF';
  return `#${valid.toUpperCase()}`;
}

export function paletteForRender(paletteId: PaletteId, customPalette: string[]) {
  if (paletteId === 'original') return [];
  if (paletteId === 'custom') return customPalette.map(hexToRgb);

  const palette = predefinedPalettes.find((item) => item.id === paletteId);
  return palette ? palette.colors.map(hexToRgb) : [];
}
