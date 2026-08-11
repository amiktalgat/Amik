import { existsSync, readFileSync } from 'node:fs';

loadLocalEnv();

const provider = process.env.AI_IMAGE_PROVIDER ?? 'openai';
const model = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
const timeoutMs = Number(process.env.AI_IMAGE_TIMEOUT_MS ?? 60000);

const allowedStyles = new Set(['Pixel Art', '8-bit', '16-bit', 'Retro', 'GameBoy', 'Fantasy', 'Cyberpunk']);
const allowedSizes = new Set([16, 32, 64]);

export async function generateAIImageFromProvider(body) {
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const style = allowedStyles.has(body.style) ? body.style : 'Pixel Art';
  const size = allowedSizes.has(Number(body.size)) ? Number(body.size) : 32;

  if (!prompt) throw new ProviderError(400, 'Write a prompt before generating.');
  if (provider !== 'openai' || !process.env.OPENAI_API_KEY) {
    throw new ProviderError(501, 'AI provider is not configured.');
  }

  return generateWithOpenAI({ prompt, style, size });
}

export class ProviderError extends Error {
  constructor(status, publicMessage) {
    super(publicMessage);
    this.status = status;
    this.publicMessage = publicMessage;
  }

  static fromResponse(status, payload) {
    if (status === 429) return new ProviderError(429, 'The AI provider is rate limited. Try again in a minute.');
    if (status === 503) return new ProviderError(503, 'The AI provider is unavailable right now.');
    if (status === 400) return new ProviderError(400, safeProviderMessage(payload) ?? 'The AI provider rejected this prompt.');
    return new ProviderError(status >= 500 ? 503 : 502, safeProviderMessage(payload) ?? 'AI provider returned an error.');
  }
}

async function generateWithOpenAI({ prompt, style, size }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: buildImagePrompt(prompt, style, size),
        size: '1024x1024',
        n: 1,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) throw ProviderError.fromResponse(response.status, payload);

    const image = payload?.data?.[0];
    const base64 = typeof image?.b64_json === 'string' ? image.b64_json : '';
    const url = typeof image?.url === 'string' ? image.url : '';

    if (base64) return { imageDataUrl: `data:image/png;base64,${base64}`, mimeType: 'image/png' };
    if (url) return imageUrlToDataUrl(url, controller.signal);

    throw new ProviderError(502, 'The AI provider returned an invalid response.');
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ProviderError(504, 'Generation timed out.');
    }
    throw new ProviderError(503, 'The AI provider is unavailable right now.');
  } finally {
    clearTimeout(timeout);
  }
}

function buildImagePrompt(prompt, style, size) {
  return [
    prompt,
    `Style: ${style}.`,
    `Create a clean square pixel-art source image intended to become an editable ${size}x${size} sprite.`,
    'Use clear silhouettes, readable shapes, limited colors, and no text.',
  ].join(' ');
}

async function imageUrlToDataUrl(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new ProviderError(502, 'Could not download the generated image.');

  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/png';
  const bytes = Buffer.from(await response.arrayBuffer());
  return { imageDataUrl: `data:${mimeType};base64,${bytes.toString('base64')}`, mimeType };
}

function safeProviderMessage(payload) {
  const message = payload?.error?.message;
  return typeof message === 'string' && message.length <= 180 ? message : null;
}

function loadLocalEnv() {
  if (!existsSync('.env')) return;

  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
