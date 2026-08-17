import { Link } from 'wouter';

const menuItems = [
  {
    href: '/battle',
    title: 'Pixel Battle',
    text: 'Choose a color and place pixels on a shared canvas with other players.',
    hint: 'Start here: pick a color, zoom in, then tap the canvas.',
  },
  {
    href: '/pixel-forge',
    title: 'Pixel Editor',
    text: 'Turn images into pixel art, edit sprites, build palettes, and export your work.',
  },
  {
    href: '/ai-image',
    title: 'AI Image Studio',
    text: 'Ask AI for ideas or generate a picture you can use for inspiration.',
  },
];

export function HomePage() {
  return (
    <main className="container home-menu">
      <nav className="top-nav">
        <Link href="/battle">Battle</Link>
        <Link href="/pixel-forge">Editor</Link>
        <Link href="/ai-image">AI Studio</Link>
        <Link href="/profile">Profile</Link>
      </nav>

      <section className="hello">
        <p className="eyebrow">Welcome</p>
        <h1>Amik Pixel Studio</h1>
        <p>Create pixel art, generate image ideas with AI, and draw together on a shared canvas.</p>
      </section>

      <section className="home-grid" aria-label="Main menu">
        {menuItems.map((item) => (
          <Link className="home-card" href={item.href} key={item.href}>
            {item.hint && <span className="home-card__hint">{item.hint}</span>}
            <strong>{item.title}</strong>
            <span>{item.text}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
