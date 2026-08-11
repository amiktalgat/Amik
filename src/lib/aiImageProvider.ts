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
    not_configured: 'AI provider is not configured.',
    empty_prompt: 'Write a prompt before generating.',
    rate_limited: 'The AI provider is rate limited. Try again in a minute.',
    unavailable: 'The AI provider is unavailable right now.',
    timeout: 'Generation timed out. Try a smaller prompt or generate again.',
    network: 'Network error. Check your connection and try again.',
    invalid_response: 'The AI provider returned an invalid response.',
    api_error: error.message || 'AI provider returned an error.',
  };

  return messages[error.code];
}

export async function generateAIImage(prompt: string, options: AIImageOptions): Promise<AIImageResult> {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) throw new AIImageError('empty_prompt', 'Prompt is empty.');

  let response: Response;
  try {
    response = await fetch('/api/ai-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        style: options.style,
        size: options.size,
      }),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AIImageError('timeout', 'The request timed out.');
    }
    throw new AIImageError('network', 'Could not reach the AI provider.');
  }

  const payload = await readJson(response);
  if (isAIErrorPayload(payload)) {
    throw new AIImageError(payload.code ?? statusToCode(response.status), payload.error);
  }

  if (!response.ok) {
    throw new AIImageError(statusToCode(response.status), errorFromPayload(payload));
  }

  if (!isAIImagePayload(payload)) {
    throw new AIImageError('invalid_response', 'Missing image data.');
  }

  return payload;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AIImageError('invalid_response', 'Response was not valid JSON.');
  }
}

function statusToCode(status: number): AIImageErrorCode {
  if (status === 400) return 'empty_prompt';
  if (status === 404 || status === 501) return 'not_configured';
  if (status === 408 || status === 504) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'unavailable';
  return 'api_error';
}

function errorFromPayload(payload: unknown) {
  if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
    return payload.error;
  }
  return 'AI provider returned an error.';
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
