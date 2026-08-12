import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';

type AuthProps = {
  onSuccess?: () => void;
};

export function Auth({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
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
      options: {
        redirectTo: getRedirectUrl(),
      },
    });

    if (error) {
      setMessage(error.message);
      setGoogleBusy(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    try {
      const request =
        mode === 'signup'
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

      if (mode === 'signup') {
        if (data.session) {
          onSuccess?.();
          return;
        }

        setMessage('Аккаунт создан. Проверь почту, если Supabase попросит подтвердить email.');
        return;
      }

      onSuccess?.();
    } catch {
      setMessage('Что-то пошло не так. Попробуй ещё раз.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-card">
      <div className="auth-switch" aria-label="Выбор действия">
        <button
          className={mode === 'signup' ? 'active' : ''}
          type="button"
          onClick={() => setMode('signup')}
        >
          Регистрация
        </button>
        <button
          className={mode === 'signin' ? 'active' : ''}
          type="button"
          onClick={() => setMode('signin')}
        >
          Вход
        </button>
      </div>

      <h2>{mode === 'signup' ? 'Создай аккаунт' : 'Войди в аккаунт'}</h2>
      <p className="auth-copy">Аккаунт нужен, чтобы открыть PixelForge и сохранить личные данные.</p>

      <button
        className="google-button"
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy || googleBusy}
      >
        <span aria-hidden="true">G</span>
        {googleBusy ? 'Открываем Google...' : 'Продолжить с Google'}
      </button>

      <div className="auth-divider">
        <span>или</span>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {mode === 'signup' && (
          <label>
            Username
            <input
              type="text"
              placeholder="pixel_master"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            placeholder="минимум 6 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? 'Подождите...' : mode === 'signup' ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
    </section>
  );
}
