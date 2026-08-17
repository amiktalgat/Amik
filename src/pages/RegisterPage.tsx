import { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Auth } from '../components/Auth';
import { useAuthSession } from '../lib/auth';

const projectHighlights = [
  'Draw pixel art in the editor and export your work.',
  'Generate image ideas with AI when you need inspiration.',
  'Join Pixel Battle and place pixels on a shared canvas.',
];

export function RegisterPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();

  useEffect(() => {
    if (user) navigate('/pixel-forge');
  }, [navigate, user]);

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
    return null;
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div>
          <Link className="auth-logo" href="/">Amik Pixel Studio</Link>
          <Link className="home-link auth-home-link" href="/">Back to home</Link>
        </div>
        <div>
          <p className="eyebrow">Register</p>
          <h1>Create art, test ideas, and draw with other players.</h1>
          <p>
            Amik Pixel Studio is a small creative workspace with a pixel editor, AI image tools,
            and a live Pixel Battle canvas.
          </p>
          <ul className="auth-feature-list">
            {projectHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className="auth-side-link" href="/auth">Already have an account? Sign in</Link>
        </div>
      </section>

      <Auth initialMode="signup" showModeSwitch={false} onSuccess={() => navigate('/pixel-forge')} />
    </main>
  );
}
