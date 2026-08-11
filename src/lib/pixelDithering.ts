import { nearestColor, type Pixel } from './pixelPalette';

export type DitheringMode = 'none' | 'floydSteinberg' | 'bayer2' | 'bayer4' | 'bayer8';

export const ditheringOptions: { id: DitheringMode; name: string }[] = [
  { id: 'none', name: 'None' },
  { id: 'floydSteinberg', name: 'Floyd-Steinberg' },
  { id: 'bayer2', name: 'Bayer 2×2' },
  { id: 'bayer4', name: 'Bayer 4×4' },
  { id: 'bayer8', name: 'Bayer 8×8' },
];

const bayer2 = [
  [0, 2],
  [3, 1],
];

const bayer4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const bayer8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

export function orderedDitherImageToPalette(
  imageData: ImageData,
  palette: Pixel[],
  dithering: DitheringMode,
) {
  const matrix = dithering === 'bayer2' ? bayer2 : dithering === 'bayer4' ? bayer4 : bayer8;
  const matrixSize = matrix.length;
  const matrixArea = matrixSize * matrixSize;
  const strength = 72;
  const { data, width, height } = imageData;

  for (let y = 0; y < height; y += 1) {
    const row = matrix[y % matrixSize];

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (data[index + 3] === 0) continue;

      const threshold = ((row[x % matrixSize] + 0.5) / matrixArea - 0.5) * strength;
      const color = nearestColor(
        {
          r: clampChannel(data[index] + threshold),
          g: clampChannel(data[index + 1] + threshold),
          b: clampChannel(data[index + 2] + threshold),
        },
        palette,
      );

      data[index] = color.r;
      data[index + 1] = color.g;
      data[index + 2] = color.b;
    }
  }

  return imageData;
}

export function floydSteinbergDitherImageToPalette(imageData: ImageData, palette: Pixel[]) {
  const { data, width, height } = imageData;
  const channels = new Float32Array(data.length);
  channels.set(data);

  const addError = (x: number, y: number, error: Pixel, factor: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const index = (y * width + x) * 4;
    channels[index] += error.r * factor;
    channels[index + 1] += error.g * factor;
    channels[index + 2] += error.b * factor;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (data[index + 3] === 0) continue;

      const oldColor = {
        r: clampChannel(channels[index]),
        g: clampChannel(channels[index + 1]),
        b: clampChannel(channels[index + 2]),
      };
      const nextColor = nearestColor(oldColor, palette);
      const error = {
        r: oldColor.r - nextColor.r,
        g: oldColor.g - nextColor.g,
        b: oldColor.b - nextColor.b,
      };

      data[index] = nextColor.r;
      data[index + 1] = nextColor.g;
      data[index + 2] = nextColor.b;

      addError(x + 1, y, error, 7 / 16);
      addError(x - 1, y + 1, error, 3 / 16);
      addError(x, y + 1, error, 5 / 16);
      addError(x + 1, y + 1, error, 1 / 16);
    }
  }

  return imageData;
}
