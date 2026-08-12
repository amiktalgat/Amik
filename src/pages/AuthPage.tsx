import { Link, useLocation } from 'wouter';
import { Auth } from '../components/Auth';
import { useAuthSession } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (loading) {
    return (
      <main className="container">
        <p className="empty">Проверяем вход...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <nav className="top-nav">
        <Link href="/">Главная</Link>
        <Link href="/pixel-forge">Редактор</Link>
      </nav>

      {user ? (
        <section className="card">
          <p className="eyebrow">Аккаунт подключен</p>
          <h2>Ты уже вошёл</h2>
          <p className="empty">{user.email}</p>
          <div className="actions">
            <Link className="home-link" href="/profile">
              Открыть профиль
            </Link>
            <button className="ghost" type="button" onClick={signOut}>
              Выйти
            </button>
          </div>
        </section>
      ) : (
        <Auth onSuccess={() => navigate('/profile')} />
      )}
    </main>
  );
}
