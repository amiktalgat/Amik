import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Auth } from '../components/Auth';
import { useAuthSession } from '../lib/auth';

function getNextPath() {
  const next = new URLSearchParams(window.location.search).get('next');
  if (!next || next === '/pixel-forge') return '/choose';
  return next.startsWith('/') ? next : '/choose';
}

export function AuthPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();

  useEffect(() => {
    if (!loading && user) navigate(getNextPath(), { replace: true });
  }, [loading, navigate, user]);

  if (loading) {
    return (
      <main className="auth-page">
        <section className="empty-state">
          <h2>Checking sign in</h2>
          <p>One moment while we open your workspace.</p>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="auth-page auth-page--single">
        <section className="empty-state">
          <h2>Opening workspace</h2>
          <p>You are already signed in.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div>
          <Link className="auth-logo" href="/">Amik Pixel Studio</Link>
          <Link className="home-link auth-home-link" href="/">Back to menu</Link>
        </div>
        <div>
          <p className="eyebrow">Your creative account</p>
          <h1>Welcome back to your creative workspace.</h1>
          <p>Sign in to continue drawing, editing, and tracking your Pixel Battle progress.</p>
          <Link className="auth-side-link" href="/register">Need an account? Register</Link>
        </div>
      </section>

      <Auth initialMode="signin" showModeSwitch={false} onSuccess={() => navigate(getNextPath())} />
    </main>
  );
}
