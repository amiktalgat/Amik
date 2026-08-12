import { DAILY_BONUS_PIXELS, MAX_BALANCE, type BattleProfile } from '../../lib/pixelBattle';

type BattleHudProps = {
  profile: BattleProfile | null;
  cursor: { x: number; y: number } | null;
  nextBonusText: string;
  canPlace: boolean;
};

export function BattleHud({ profile, cursor, nextBonusText, canPlace }: BattleHudProps) {
  const balance = profile?.balance ?? 0;
  const bonusText = balance >= MAX_BALANCE ? 'MAX' : `+${DAILY_BONUS_PIXELS} ${nextBonusText}`;

  return (
    <section className="battle-panel battle-hud">
      <div>
        <div className="battle-panel__title">My pixels</div>
        <strong>{balance} / {MAX_BALANCE}</strong>
        <span>{bonusText}</span>
      </div>
      <div>
        <div className="battle-panel__title">Placed</div>
        <strong>{profile?.placed_pixels ?? 0}</strong>
        <span>by you</span>
      </div>
      <div>
        <div className="battle-panel__title">Cursor</div>
        <strong>X: {cursor?.x ?? '-'}</strong>
        <strong>Y: {cursor?.y ?? '-'}</strong>
      </div>
      {!canPlace && (
        <p className="battle-hint">
          Sign in to place pixels. Guests can still explore the canvas.
        </p>
      )}
      {profile && balance === 0 && (
        <p className="battle-hint">Pixels are over. Come back for the daily bonus.</p>
      )}
    </section>
  );
}
