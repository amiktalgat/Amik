import { Link, useLocation } from 'wouter';
import { Entries } from '../components/Entries';
import { SupabaseSetupMessage } from '../components/SupabaseSetupMessage';
import { useAuthSession } from '../lib/auth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="container">
        <SupabaseSetupMessage />
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container">
        <p className="empty">Загружаем профиль...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container">
        <section className="card">
          <h2>Нужно войти</h2>
          <p className="empty">Профиль доступен только после входа в аккаунт.</p>
          <Link className="home-link" href="/auth">
            Войти
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <nav className="top-nav">
        <Link href="/">Главная</Link>
        <Link href="/pixel-forge">Редактор</Link>
        <button className="ghost small" type="button" onClick={signOut}>
          Выйти
        </button>
      </nav>
      <Entries userEmail={user.email ?? 'пользователь'} />
    </main>
  );
}
