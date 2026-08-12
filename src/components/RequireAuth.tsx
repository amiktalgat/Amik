import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { SupabaseSetupMessage } from './SupabaseSetupMessage';
import { useAuthSession } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';

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
        <p className="empty">Проверяем аккаунт...</p>
      </main>
    );
  }

  return children;
}
