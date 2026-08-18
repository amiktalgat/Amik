import type { User } from '@supabase/supabase-js';
import { Link } from 'wouter';
import type { BattleStats } from '../../lib/pixelBattle';

type BattleHeaderProps = {
  user: User | null;
  onlineCount: number;
  stats: BattleStats | null;
  onReferenceOpen: () => void;
  onTutorialOpen: () => void;
};

export function BattleHeader({
  user,
  onlineCount,
  stats,
  onReferenceOpen,
  onTutorialOpen,
}: BattleHeaderProps) {
  return (
    <header className="battle-header">
      <Link className="battle-logo" href="/battle">PixelBattle</Link>
      <div className="battle-header__stats">
        <span className="battle-status">Online: {onlineCount}</span>
        <span>Placed: {stats?.placedPixels ?? 0}</span>
      </div>
      <nav className="battle-header__nav">
        <button className="battle-text-button battle-help-button" type="button" onClick={onReferenceOpen}>
          Image
        </button>
        <button className="battle-text-button battle-help-button" type="button" onClick={onTutorialOpen}>
          Help
        </button>
        <Link href="/choose">Menu</Link>
        <Link href="/profile">Profile</Link>
        {!user && (
          <Link className="battle-login" href="/auth?next=/battle">Sign in</Link>
        )}
      </nav>
    </header>
  );
}
