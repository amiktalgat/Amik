import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';

type AuthProps = {
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
};

export function Auth({ initialMode = 'signup', onSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;

  function getRedirectUrl() {
    return `${window.location.origin}/auth${window.location.search}`;
  }

  async function handleGoogleSignIn() {
    setGoogleBusy(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectUrl() },
    });

    if (error) {
      setMessage(error.message);
      setGoogleBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const request = mode === 'signup'
        ? supabase.auth.signUp({
            email,
            password,
            options: { data: { username }, emailRedirectTo: getRedirectUrl() },
          })
        : supabase.auth.signInWithPassword({ email, password });

      const { data, error } = await request;

      if (error) {
        setMessage(error.message);
        return;
      }

      if (mode === 'signup' && !data.session) {
        setMessage('Account created. Check your email if Supabase asks for confirmation.');
        return;
      }

      onSuccess?.();
    } catch {
      setMessage('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-switch" aria-label="Choose auth action">
        <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => setMode('signup')}>
          Create account
        </button>
        <button className={mode === 'signin' ? 'active' : ''} type="button" onClick={() => setMode('signin')}>
          Sign in
        </button>
      </div>

      <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
      <p className="auth-copy">Use an account to save your artwork, stats, and Pixel Battle progress.</p>

      <button className="google-button" type="button" onClick={handleGoogleSignIn} disabled={busy || googleBusy}>
        <span aria-hidden="true">G</span>
        {googleBusy ? 'Opening Google...' : 'Continue with Google'}
      </button>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {mode === 'signup' && (
          <label>
            Username
            <input
              type="text"
              placeholder="pixel_master"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              maxLength={24}
              required
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </section>
  );
}
