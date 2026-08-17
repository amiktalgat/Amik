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
        <section className="empty-state">
          <h2>Checking sign in</h2>
          <p>One moment while we open your workspace.</p>
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
          <h1>Save your pixels, images, and Battle progress.</h1>
          <p>Sign in once, then jump between the editor, AI image studio, and shared Pixel Battle canvas.</p>
        </div>
      </section>

      {user ? (
        <section className="auth-card">
          <p className="eyebrow">Account connected</p>
          <h2>You are signed in</h2>
          <p className="auth-copy">{user.email}</p>
          <div className="actions">
            <button className="primary-button" type="button" onClick={() => navigate(getNextPath())}>
              Continue
            </button>
            <button className="ghost" type="button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </section>
      ) : (
        <Auth onSuccess={() => navigate(getNextPath())} />
      )}
    </main>
  );
}
