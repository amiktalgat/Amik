import { Link, useLocation } from 'wouter';
import { Auth } from '../components/Auth';
import { useAuthSession } from '../lib/auth';
import { supabase } from '../lib/supabase';

function getNextPath() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next?.startsWith('/') ? next : '/pixel-forge';
}

export function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <main className="auth-page">
        <p className="empty">Проверяем вход...</p>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <Link className="auth-logo" href="/">
          PixelForge
        </Link>
        <div>
          <p className="eyebrow">Только для пользователей</p>
          <h1>Сначала аккаунт, потом редактор</h1>
          <p>
            Регистрация теперь обязательна: без входа страницы проекта будут возвращать сюда.
          </p>
        </div>
      </section>

      {user ? (
        <section className="auth-card">
          <p className="eyebrow">Аккаунт подключен</p>
          <h2>Ты уже вошёл</h2>
          <p className="auth-copy">{user.email}</p>
          <div className="actions">
            <button className="primary-button" type="button" onClick={() => navigate(getNextPath())}>
              Продолжить
            </button>
            <button className="ghost" type="button" onClick={signOut}>
              Выйти
            </button>
          </div>
        </section>
      ) : (
        <Auth onSuccess={() => navigate(getNextPath())} />
      )}
    </main>
  );
}
