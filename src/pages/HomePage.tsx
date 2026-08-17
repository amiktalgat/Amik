import { Link } from 'wouter';

const menuItems = [
  {
    href: '/battle',
    title: 'Pixel Battle',
    text: 'Choose a color and place pixels on a shared canvas with other players.',
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
      <section className="home-landing" aria-labelledby="home-title">
        <div className="home-intro">
          <p className="eyebrow">Welcome</p>
          <h1 id="home-title">Amik Pixel Studio</h1>
          <p>
            A creative app for drawing pixel art, generating image ideas with AI, and joining a shared
            Pixel Battle canvas.
          </p>
        </div>

        <aside className="home-auth-panel" aria-label="Account actions">
          <h2>Start creating</h2>
          <p>Make an account to save your art and Battle progress, or sign in if you already have one.</p>
          <div className="home-auth-actions">
            <Link className="home-auth-button home-auth-button--primary" href="/auth?mode=signup">
              Create account
            </Link>
            <Link className="home-auth-button" href="/auth?mode=signin">
              Sign in
            </Link>
          </div>
        </aside>
      </section>

      <section className="home-grid" aria-label="Main menu">
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
