import { Link } from 'wouter';
import { useAuthSession } from '../lib/auth';

export function HomePage() {
  const { user } = useAuthSession();

  return (
    <main className="container">
      <nav className="top-nav">
        <Link href="/pixel-forge">Редактор</Link>
        <Link href={user ? '/profile' : '/auth'}>{user ? 'Профиль' : 'Войти'}</Link>
      </nav>

      <section className="hello">
        <h1>PixelForge</h1>
        <p>Современный редактор Pixel Art на Vite, React, TypeScript и Canvas API.</p>
        <p className="hello__hint">
          Загружай PNG, JPG, JPEG или WebP, превращай изображение в пиксель-арт и экспортируй PNG.
        </p>
        <Link className="home-link" href="/pixel-forge">
          Открыть редактор
        </Link>
      </section>
    </main>
  );
}
