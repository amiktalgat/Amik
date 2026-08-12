import { Link } from 'wouter';

export function HomePage() {
  return (
    <main className="container">
      <nav className="top-nav">
        <Link href="/battle">PixelBattle</Link>
        <Link href="/pixel-forge">Редактор</Link>
        <Link href="/profile">Профиль</Link>
      </nav>

      <section className="hello">
        <h1>PixelBattle</h1>
        <p>Общий онлайн-холст: выбирай цвет, ставь пиксели и смотри изменения realtime.</p>
        <p className="hello__hint">
          PixelForge тоже остался в проекте: редактор можно открыть отдельной страницей.
        </p>
        <Link className="home-link" href="/battle">
          Играть
        </Link>
      </section>
    </main>
  );
}
