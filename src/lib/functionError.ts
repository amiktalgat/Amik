type FunctionErrorPayload = {
  code?: unknown;
  error?: unknown;
  message?: unknown;
};

export async function getFunctionErrorMessage(error: unknown) {
  const fallback = error instanceof Error ? error.message : 'Request failed.';
  const context = getErrorContext(error);
  if (!context) return fallback;

  try {
    const payload = await context.clone().json() as FunctionErrorPayload;
    const message = typeof payload.error === 'string'
      ? payload.error
      : typeof payload.message === 'string'
        ? payload.message
        : fallback;
    const code = typeof payload.code === 'string' ? payload.code : '';
    return code ? `${message} (${code})` : message;
  } catch {
    try {
      const text = await context.clone().text();
      return text.trim() || fallback;
    } catch {
      return fallback;
    }
  }
}

function getErrorContext(error: unknown) {
  if (!error || typeof error !== 'object' || !('context' in error)) return null;
  const context = error.context;
  return context instanceof Response ? context : null;
}
