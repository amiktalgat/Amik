import {
  floydSteinbergDitherImageToPalette,
  orderedDitherImageToPalette,
  type DitheringMode,
} from './pixelDithering';

export { ditheringOptions, type DitheringMode } from './pixelDithering';

export type Pixel = {
  r: number;
  g: number;
  b: number;
};

export function colorDistance(first: Pixel, second: Pixel) {
  const red = first.r - second.r;
  const green = first.g - second.g;
  const blue = first.b - second.b;
  return red * red + green * green + blue * blue;
}

export function nearestColor(pixel: Pixel, palette: Pixel[]) {
  let best = palette[0];
  let bestDistance = colorDistance(pixel, best);

  for (let index = 1; index < palette.length; index += 1) {
    const color = palette[index];
    const distance = colorDistance(pixel, color);
    if (distance < bestDistance) {
      best = color;
      bestDistance = distance;
    }
  }

  return best;
}

export function createImagePalette(imageData: ImageData, colorCount: number) {
  const step = colorCount <= 8 ? 64 : 32;
  const buckets = new Map<string, { color: Pixel; count: number }>();

  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index + 3] === 0) continue;

    const color = {
      r: Math.round(imageData.data[index] / step) * step,
      g: Math.round(imageData.data[index + 1] / step) * step,
      b: Math.round(imageData.data[index + 2] / step) * step,
    };
    const key = `${color.r}-${color.g}-${color.b}`;
    const bucket = buckets.get(key);
    buckets.set(key, bucket ? { color, count: bucket.count + 1 } : { color, count: 1 });
  }

  return [...buckets.values()]
    .sort((first, second) => second.count - first.count)
    .slice(0, colorCount)
    .map((bucket) => bucket.color);
}

export function reduceImageToPalette(imageData: ImageData, palette: Pixel[], dithering: DitheringMode = 'none') {
  if (palette.length === 0) return imageData;

  if (dithering === 'floydSteinberg') return floydSteinbergDitherImageToPalette(imageData, palette);
  if (dithering !== 'none') return orderedDitherImageToPalette(imageData, palette, dithering);

  for (let index = 0; index < imageData.data.length; index += 4) {
    if (imageData.data[index + 3] === 0) continue;

    const color = nearestColor(
      {
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
      },
      palette,
    );

    imageData.data[index] = color.r;
    imageData.data[index + 1] = color.g;
    imageData.data[index + 2] = color.b;
  }

  return imageData;
}
