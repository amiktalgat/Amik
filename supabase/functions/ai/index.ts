const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const TEXT_MODEL = 'gemini-3.5-flash';
const IMAGE_MODEL = 'gemini-3.1-flash-image';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AIRequest = {
  mode?: unknown;
  prompt?: unknown;
  system?: unknown;
  style?: unknown;
  size?: unknown;
  aspectRatio?: unknown;
};

type GeminiPart = {
  text?: unknown;
  inlineData?: { data?: unknown; mimeType?: unknown };
  inline_data?: { data?: unknown; mime_type?: unknown };
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
};

function json(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Use a POST request.' }, 405);

  try {
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return json({ error: 'AI is not configured yet. Ask a mentor to check the secret.' }, 503);
    }

    const body = (await req.json()) as AIRequest;
    const mode = body.mode === 'image' ? 'image' : 'text';
    return mode === 'image' ? generateImage(body) : generateText(body);
  } catch (error) {
    console.error('AI function failed', error);
    return json({ error: 'Could not call AI. Try again.' }, 500);
  }
});

async function generateText(body: AIRequest) {
  const prompt = cleanString(body.prompt);
  const system = cleanString(body.system);

  if (!prompt) return json({ error: 'Write a request for AI.' }, 400);
  if (prompt.length > 10_000 || system.length > 5_000) {
    return json({ error: 'The request is too long. Make it shorter.' }, 400);
  }

  const data = await callGemini(TEXT_MODEL, 'v1beta', {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ parts: [{ text: prompt }] }],
  });

  const text = data.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === 'string')?.text;
  if (typeof text !== 'string' || !text.trim()) {
    console.error('Gemini returned an empty text response', data);
    return json({ error: 'AI returned an empty answer. Try changing the request.' }, 502);
  }

  return json({ text });
}

async function generateImage(body: AIRequest) {
  const prompt = cleanString(body.prompt);
  const style = cleanImageStyle(body.style);
  const size = cleanImageSize(body.size);
  const aspectRatio = cleanAspectRatio(body.aspectRatio);

  if (!prompt) return json({ error: 'Write a prompt before generating.', code: 'empty_prompt' }, 400);
  if (prompt.length > 2_000) return json({ error: 'The prompt is too long.', code: 'empty_prompt' }, 400);

  let data: GeminiResponse;
  try {
    data = await callGemini(IMAGE_MODEL, 'v1', {
      contents: [{ parts: [{ text: buildImagePrompt(prompt, style, size, aspectRatio) }] }],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gemini image generation failed.';
    return json({ error: message.slice(0, 180), code: 'api_error' }, 502);
  }

  const image = findImagePart(data);
  if (!image) {
    console.error('Gemini returned no image', data);
    return json({ error: 'AI did not return an image. Try a simpler prompt.', code: 'invalid_response' }, 502);
  }

  return json({
    imageDataUrl: `data:${image.mimeType};base64,${image.data}`,
    mimeType: image.mimeType,
  });
}

async function callGemini(model: string, version: 'v1' | 'v1beta', body: object) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  const data = (await response.json()) as GeminiResponse & { error?: { message?: unknown } };
  if (!response.ok) {
    console.error('Gemini request failed', response.status, data);
    const message = typeof data.error?.message === 'string' ? data.error.message : `Gemini failed with ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function findImagePart(data: GeminiResponse) {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const inlineData = part.inlineData ?? part.inline_data;
    const mimeType = inlineData && 'mimeType' in inlineData ? inlineData.mimeType : inlineData?.mime_type;
    if (typeof inlineData?.data === 'string' && typeof mimeType === 'string' && mimeType.startsWith('image/')) {
      return { data: inlineData.data, mimeType };
    }
  }
  return null;
}

function buildImagePrompt(prompt: string, style: string, size: number, aspectRatio: string) {
  const pixelStyles = new Set(['Pixel Art', '8-bit', '16-bit', 'Retro']);
  if (pixelStyles.has(style)) {
    return [
      prompt,
      `Style: ${style}.`,
      `Create clean pixel art for an editable ${size}x${size} sprite.`,
      `Composition: ${aspectRatio} aspect ratio.`,
      'Use readable shapes, limited colors, no text, no watermark, and a simple background.',
    ].join(' ');
  }

  return [
    prompt,
    `Style: ${style}.`,
    `Composition: ${aspectRatio} aspect ratio.`,
    'Create a polished finished image, not pixel art unless the user explicitly asks for it.',
    'Use clear composition, no text, no watermark, and keep it safe for teens.',
  ].join(' ');
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanImageStyle(value: unknown) {
  const styles = new Set([
    'Photo',
    'Illustration',
    'Anime',
    '3D Render',
    'Watercolor',
    'Sticker',
    'Pixel Art',
    '8-bit',
    '16-bit',
    'GameBoy',
    'Retro',
    'Fantasy',
    'Cyberpunk',
  ]);
  return typeof value === 'string' && styles.has(value) ? value : 'Illustration';
}

function cleanImageSize(value: unknown) {
  const size = Number(value);
  return size === 16 || size === 32 || size === 64 ? size : 32;
}

function cleanAspectRatio(value: unknown) {
  const ratios = new Set(['1:1', '16:9', '9:16', '4:3', '3:4']);
  return typeof value === 'string' && ratios.has(value) ? value : '1:1';
}
