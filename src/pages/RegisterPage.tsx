import { Link, useLocation } from 'wouter';
import { Auth } from '../components/Auth';
import { useAuthSession } from '../lib/auth';
import { supabase } from '../lib/supabase';

const projectHighlights = [
  'Pixel Editor помогает рисовать пиксель-арт, собирать палитры и сохранять результат.',
  'AI Image Studio придумывает идеи и создаёт картинки для вдохновения.',
  'Pixel Battle даёт общее поле, где игроки вместе ставят пиксели.',
];

export function RegisterPage() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuthSession();

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) {
    return (
      <main className="auth-page">
        <section className="empty-state">
          <h2>Открываем регистрацию</h2>
          <p>Секунду, готовим страницу аккаунта.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-hero">
        <div>
          <Link className="auth-logo" href="/">Amik Pixel Studio</Link>
          <Link className="home-link auth-home-link" href="/">На главную</Link>
        </div>
        <div>
          <p className="eyebrow">Регистрация</p>
          <h1>Amik Pixel Studio — место, где можно рисовать, придумывать идеи и играть в Pixel Battle.</h1>
          <p>
            Создай аккаунт, чтобы сохранять свои рисунки, прогресс в битве пикселей и быстро
            переходить между редактором, AI-студией и общим canvas.
          </p>
          <ul className="auth-feature-list">
            {projectHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <Link className="auth-side-link" href="/auth">Уже есть аккаунт? Войти</Link>
        </div>
      </section>

      {user ? (
        <section className="auth-card">
          <p className="eyebrow">Аккаунт подключён</p>
          <h2>Ты уже вошёл</h2>
          <p className="auth-copy">{user.email}</p>
          <div className="actions">
            <button className="primary-button" type="button" onClick={() => navigate('/pixel-forge')}>
              Перейти в редактор
            </button>
            <button className="ghost" type="button" onClick={signOut}>
              Выйти
            </button>
          </div>
        </section>
      ) : (
        <Auth
          copy="Зарегистрируйся здесь, чтобы твои рисунки, картинки и статистика Pixel Battle сохранялись."
          initialMode="signup"
          showModeSwitch={false}
          title="Создать аккаунт"
          onSuccess={() => navigate('/pixel-forge')}
        />
      )}
    </main>
  );
}
