import { Link } from 'wouter';

const menuItems = [
  {
    href: '/battle',
    title: 'Pixel Battle',
    text: 'Общий холст: выбирай цвет и ставь пиксели вместе с другими игроками.',
  },
  {
    href: '/pixel-forge',
    title: 'Редактор',
    text: 'Создавай и редактируй pixel art, палитры, анимации и тайлы.',
  },
  {
    href: '/ai-image',
    title: 'ИИ генератор идей',
    text: 'Напиши тему, а AI предложит описание картинки для вдохновения.',
  },
];

export function HomePage() {
  return (
    <main className="container home-menu">
      <nav className="top-nav">
        <Link href="/battle">PixelBattle</Link>
        <Link href="/pixel-forge">Редактор</Link>
        <Link href="/ai-image">ИИ идеи</Link>
        <Link href="/profile">Профиль</Link>
      </nav>

      <section className="hello">
        <h1>Главное меню</h1>
        <p>Выбери, куда перейти.</p>
      </section>

      <section className="home-grid" aria-label="Главное меню">
        {menuItems.map((item) => (
          <Link className="home-card" href={item.href} key={item.href}>
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
