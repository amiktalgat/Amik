import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Auth } from '../components/Auth';
import { useAuthSession } from '../lib/auth';

const projectHighlights = [
  'Pixel Editor helps you draw pixel art, build palettes, and save your work.',
  'AI Image Studio creates image ideas when you need inspiration.',
  'Pixel Battle opens a shared canvas where players place pixels together.',
];

export function RegisterPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();

  useEffect(() => {
    if (!loading && user) navigate('/choose', { replace: true });
  }, [loading, navigate, user]);

  if (loading) {
    return (
      <main className="auth-page">
        <section className="empty-state">
          <h2>Opening registration</h2>
          <p>One moment while we prepare your account screen.</p>
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
          <Link className="home-link auth-home-link" href="/">Back to home</Link>
        </div>
        <div>
          <p className="eyebrow">Registration</p>
          <h1>Create an account, then choose what you want to open first.</h1>
          <p>
            Amik Pixel Studio is a creative workspace for pixel art, AI pictures, and a shared
            Pixel Battle canvas.
          </p>
          <ul className="auth-feature-list">
            {projectHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className="auth-side-link" href="/auth">Already have an account? Sign in</Link>
        </div>
      </section>

      <Auth
        copy="Create your account here, then pick AI pictures, Pixel Battle, or the editor."
        initialMode="signup"
        showModeSwitch={false}
        title="Create account"
        onSuccess={() => navigate('/choose')}
      />
    </main>
  );
}
