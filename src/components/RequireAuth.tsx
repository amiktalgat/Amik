import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useAuthSession } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';

type RequireAuthProps = {
  children: ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();

  useEffect(() => {
    if (!loading && !user && isSupabaseConfigured) {
      const next = encodeURIComponent(window.location.pathname);
      navigate(`/auth?next=${next}`, { replace: true });
    }
  }, [loading, navigate, user]);

  if (!isSupabaseConfigured) {
    return (
      <main className="container">
        <SupabaseSetupMessage />
      </main>
    );
  }

  if (loading || !user) {
    return (
      <main className="container">
        <section className="empty-state">
          <h2>Checking your account</h2>
          <p>We are opening the right screen for you. If this takes too long, sign in again.</p>
        </section>
      </main>
    );
  }

  return children;
}
