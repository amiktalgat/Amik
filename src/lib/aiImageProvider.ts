import { isSupabaseConfigured, supabase } from './supabase';

export type AIImageStyle = 'Pixel Art' | '8-bit' | '16-bit' | 'Retro' | 'GameBoy' | 'Fantasy' | 'Cyberpunk';
export type AIImageSize = 16 | 32 | 64;

export type AIImageOptions = {
  style: AIImageStyle;
  size: AIImageSize;
  signal?: AbortSignal;
};

export type AIImageResult = {
  imageDataUrl: string;
  mimeType: string;
};

export type AIImageErrorCode =
  | 'not_configured'
  | 'empty_prompt'
  | 'rate_limited'
  | 'unavailable'
  | 'timeout'
  | 'network'
  | 'invalid_response'
  | 'api_error';

export class AIImageError extends Error {
  constructor(
    public code: AIImageErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AIImageError';
  }
}

export function aiErrorMessage(error: unknown) {
  if (!(error instanceof AIImageError)) return 'AI image generation failed. Please try again.';

  const messages: Record<AIImageErrorCode, string> = {
    not_configured: 'Supabase or Gemini is not configured yet.',
    empty_prompt: 'Write a prompt before generating.',
    rate_limited: 'The AI provider is rate limited. Try again in a minute.',
    unavailable: 'The AI provider is unavailable right now.',
    timeout: 'Generation timed out. Try a smaller prompt or generate again.',
    network: 'Network error. Check your connection and try again.',
    invalid_response: 'The AI provider returned no image.',
    api_error: error.message || 'AI provider returned an error.',
  };

  return messages[error.code];
}

export async function generateAIImage(prompt: string, options: AIImageOptions): Promise<AIImageResult> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) throw new AIImageError('empty_prompt', 'Prompt is empty.');
  if (!isSupabaseConfigured) throw new AIImageError('not_configured', 'Supabase is not configured.');

  const abortPromise = new Promise<never>((_, reject) => {
    options.signal?.addEventListener('abort', () => {
      reject(new AIImageError('timeout', 'The request timed out.'));
    }, { once: true });
  });

  try {
    const { data, error } = await Promise.race([
      supabase.functions.invoke<unknown>('ai', {
        body: {
          mode: 'image',
          prompt: cleanPrompt,
          style: options.style,
          size: options.size,
        },
      }),
      abortPromise,
    ]);

    if (error) throw new AIImageError('api_error', error.message);
    if (isAIErrorPayload(data)) throw new AIImageError(data.code ?? 'api_error', data.error);
    if (!isAIImagePayload(data)) throw new AIImageError('invalid_response', 'Missing image data.');

    return data;
  } catch (error) {
    if (error instanceof AIImageError) throw error;
    throw new AIImageError('network', 'Could not reach the AI provider.');
  }
}

function isAIErrorPayload(payload: unknown): payload is { error: string; code?: AIImageErrorCode } {
  return Boolean(
    payload
      && typeof payload === 'object'
      && 'error' in payload
      && typeof payload.error === 'string',
  );
}

function isAIImagePayload(payload: unknown): payload is AIImageResult {
  return Boolean(
    payload
      && typeof payload === 'object'
      && 'imageDataUrl' in payload
      && typeof payload.imageDataUrl === 'string'
      && payload.imageDataUrl.startsWith('data:image/')
      && 'mimeType' in payload
      && typeof payload.mimeType === 'string',
  );
}
