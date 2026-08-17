import { Link } from 'wouter';

const choices = [
  {
    href: '/ai-image',
    title: 'AI pictures',
    text: 'Generate an image or get a visual idea before you start drawing.',
  },
  {
    href: '/battle',
    title: 'Pixel Battle',
    text: 'Join the shared canvas and place pixels with other players.',
  },
  {
    href: '/pixel-forge',
    title: 'Pixel editor',
    text: 'Draw pixel art, edit sprites, build palettes, and export your work.',
  },
];

export function ChooseWorkspacePage() {
  return (
    <main className="container choice-page">
      <section className="choice-hero">
        <p className="eyebrow">Main menu</p>
        <h1>Choose one of three pages</h1>
        <p>Open AI pictures, Pixel Battle, or the pixel editor. You can come back here later.</p>
      </section>

      <section className="choice-grid" aria-label="Choose workspace">
        {choices.map((choice) => (
          <Link className="choice-card" href={choice.href} key={choice.href}>
            <strong>{choice.title}</strong>
            <span>{choice.text}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
