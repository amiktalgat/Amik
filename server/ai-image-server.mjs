import { createServer } from 'node:http';
import { generateAIImageFromProvider, ProviderError } from './ai-image-provider.mjs';

const port = Number(process.env.AI_IMAGE_SERVER_PORT ?? 8787);

createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== 'POST' || request.url !== '/api/ai-image') {
    sendJson(response, 404, { error: 'AI provider is not configured.' });
    return;
  }

  try {
    sendJson(response, 200, await generateAIImageFromProvider(await readJsonBody(request)));
  } catch (error) {
    const status = error instanceof ProviderError ? error.status : 500;
    const message = error instanceof ProviderError ? error.publicMessage : 'AI image generation failed.';
    if (status === 501) {
      sendJson(response, 200, { error: message, code: 'not_configured' });
      return;
    }
    sendJson(response, status, { error: message });
  }
}).listen(port, () => {
  console.log(`AI image server listening on http://localhost:${port}`);
});

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 8000) {
        reject(new ProviderError(413, 'Prompt is too long.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        reject(new ProviderError(400, 'Invalid request.'));
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(payload));
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
