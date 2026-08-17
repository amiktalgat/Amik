import { Link } from 'wouter';

export function HomePage() {
  return (
    <main className="container home-menu">
      <section className="home-landing" aria-labelledby="home-title">
        <div className="home-intro">
          <p className="eyebrow">Welcome</p>
          <h1 id="home-title">Amik Pixel Studio</h1>
          <p>
            Register or sign in first, then open the editor, AI studio, and shared Pixel Battle canvas
            from your workspace.
          </p>
        </div>

        <aside className="home-auth-panel" aria-label="Account actions">
          <h2>Start creating</h2>
          <p>Make an account to save your art and Battle progress, or sign in if you already have one.</p>
          <div className="home-auth-actions">
            <Link className="home-auth-button home-auth-button--primary" href="/register">
              Create account
            </Link>
            <Link className="home-auth-button" href="/auth">
              Sign in
            </Link>
          </div>
        </aside>
      </section>
    </main>
  );
}
