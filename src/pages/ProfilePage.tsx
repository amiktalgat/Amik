import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { SupabaseSetupMessage } from '../components/SupabaseSetupMessage';
import { useAuthSession } from '../lib/auth';
import { loadBattleProfile, loadBattleStats, type BattleProfile, type BattleStats } from '../lib/pixelBattle';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

export function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();
  const [profile, setProfile] = useState<BattleProfile | null>(null);
  const [stats, setStats] = useState<BattleStats | null>(null);

  useEffect(() => {
    if (!user) return;
    void loadBattleProfile().then(({ data }) => setProfile(data ?? null));
    void loadBattleStats().then(({ data }) => setStats(data ?? null));
  }, [user]);

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
          <Link className="home-link" href="/auth?next=/profile">Войти</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <nav className="top-nav">
        <Link href="/">Главное меню</Link>
        <Link href="/battle">PixelBattle</Link>
        <Link href="/pixel-forge">Редактор</Link>
        <button className="ghost small" type="button" onClick={signOut}>Выйти</button>
      </nav>
      <section className="card">
        <p className="eyebrow">Мой профиль</p>
        <h2>{profile?.username ?? user.email}</h2>
        <ul className="profile-stats">
          <li><span>Email</span><strong>{user.email}</strong></li>
          <li><span>Дата регистрации</span><strong>{formatDate(profile?.created_at)}</strong></li>
          <li><span>Всего установлено пикселей</span><strong>{profile?.placed_pixels ?? 0}</strong></li>
          <li><span>Текущий баланс</span><strong>{profile?.balance ?? 0} / 100</strong></li>
          <li><span>Лучшее достижение</span><strong>{profile?.best_streak ?? 0}</strong></li>
          <li><span>Активных дней</span><strong>{profile?.active_days ?? 1}</strong></li>
          <li><span>Мои пиксели в истории</span><strong>{stats?.myPixels ?? 0}</strong></li>
        </ul>
      </section>
    </main>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'medium' }).format(new Date(value));
}
