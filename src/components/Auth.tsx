import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';

type AuthProps = {
  onSuccess?: () => void;
};

export function Auth({ onSuccess }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) return <SupabaseSetupMessage />;

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
              options: { emailRedirectTo: `${window.location.origin}/auth` },
            })
          : supabase.auth.signInWithPassword({ email, password });

      const { error } = await request;

      if (error) {
        setMessage(error.message);
        return;
      }

      if (mode === 'signup') {
        setMessage('Готово! Проверь почту, если нужна подтверждалка.');
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
    <section className="card">
      <p className="eyebrow">Аккаунт</p>
      <h2>{mode === 'signin' ? 'Вход' : 'Регистрация'}</h2>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="пароль (6+ символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <button type="submit" disabled={busy}>
          {busy ? '...' : mode === 'signin' ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <button
        className="ghost"
        type="button"
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      >
        {mode === 'signin' ? 'Нет аккаунта? Зарегистрируйся' : 'Уже есть аккаунт? Войти'}
      </button>
    </section>
  );
}
