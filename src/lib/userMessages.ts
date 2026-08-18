export function friendlyAuthError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'Email or password is incorrect.';
  if (lower.includes('email not confirmed')) return 'Please confirm your email, then try signing in again.';
  if (lower.includes('user already registered')) return 'This email already has an account. Try signing in.';
  if (lower.includes('password')) return 'Check the password. It should be at least 6 characters.';
  if (lower.includes('rate limit') || lower.includes('too many')) return 'Too many tries. Wait a minute and try again.';
  return 'Could not complete sign in. Please try again.';
}

export function friendlyDataError(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes('jwt') || lower.includes('auth')) return 'Please sign in again to continue.';
  if (lower.includes('network') || lower.includes('fetch')) return 'Network problem. Check your connection and try again.';
  if (lower.includes('rate_limited') || lower.includes('too many')) return 'Too many actions. Wait a second and try again.';
  if (lower.includes('not enough pixels')) return 'Not enough pixels yet. Wait for recharge.';
  if (lower.includes('permission') || lower.includes('policy')) return 'You do not have permission to do that.';
  return 'Something did not load. Please refresh or try again.';
}
