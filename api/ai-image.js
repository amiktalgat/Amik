import { generateAIImageFromProvider, ProviderError } from '../server/ai-image-provider.mjs';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(404).json({ error: 'AI provider is not configured.' });
    return;
  }

  try {
    const body = typeof request.body === 'object' && request.body !== null ? request.body : {};
    response.status(200).json(await generateAIImageFromProvider(body));
  } catch (error) {
    const status = error instanceof ProviderError ? error.status : 500;
    const message = error instanceof ProviderError ? error.publicMessage : 'AI image generation failed.';
    if (status === 501) {
      response.status(200).json({ error: message, code: 'not_configured' });
      return;
    }
    response.status(status).json({ error: message });
  }
}
