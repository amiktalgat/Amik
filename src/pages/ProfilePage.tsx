import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { SupabaseSetupMessage } from '../components/SupabaseSetupMessage';
import { useAuthSession } from '../lib/auth';
import { loadBattleProfile, loadBattleStats, type BattleProfile, type BattleStats } from '../lib/pixelBattle';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { friendlyDataError } from '../lib/userMessages';

export function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();
  const [profile, setProfile] = useState<BattleProfile | null>(null);
  const [stats, setStats] = useState<BattleStats | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) return;
    setProfileLoading(true);
    setMessage('');
    void Promise.all([loadBattleProfile(), loadBattleStats()]).then(([profileResult, statsResult]) => {
      if (profileResult.error) setMessage(friendlyDataError(profileResult.error.message));
      if (statsResult.error) setMessage(friendlyDataError(statsResult.error.message));
      setProfile(profileResult.data ?? null);
      setStats(statsResult.data ?? null);
      setProfileLoading(false);
    });
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
        <section className="empty-state">
          <h2>Loading profile</h2>
          <p>Your player stats will appear here after the account check finishes.</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container">
        <section className="empty-state">
          <h2>No profile yet</h2>
          <p>Sign in to save your pixels, keep your balance, and track your Battle progress.</p>
          <Link className="home-link" href="/auth?next=/profile">Sign in</Link>
        </section>
      </main>
    );
  }

  if (profileLoading) {
    return (
      <main className="container">
        <section className="empty-state">
          <h2>Loading profile</h2>
          <p>Getting your Pixel Battle stats ready.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <nav className="top-nav">
        <Link href="/">Menu</Link>
        <Link href="/battle">Battle</Link>
        <Link href="/pixel-forge">Editor</Link>
        <button className="ghost small" type="button" onClick={signOut}>Sign out</button>
      </nav>
      <section className="card">
        <p className="eyebrow">My profile</p>
        <h2>{profile?.username ?? user.email}</h2>
        {message && <p className="message">{message}</p>}
        <ul className="profile-stats">
          <li><span>Email</span><strong>{user.email}</strong></li>
          <li><span>Joined</span><strong>{formatDate(profile?.created_at)}</strong></li>
          <li><span>Total pixels placed</span><strong>{profile?.placed_pixels ?? 0}</strong></li>
          <li><span>Current balance</span><strong>{profile?.balance ?? 0} / 100</strong></li>
          <li><span>Best streak</span><strong>{profile?.best_streak ?? 0}</strong></li>
          <li><span>Active days</span><strong>{profile?.active_days ?? 1}</strong></li>
          <li><span>My battle history</span><strong>{stats?.myPixels ?? 0}</strong></li>
        </ul>
      </section>
    </main>
  );
}

function formatDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
}
