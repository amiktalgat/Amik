import { MAX_BALANCE, type BattleProfile } from '../../lib/pixelBattle';

type BattleHudProps = {
  profile: BattleProfile | null;
  cursor: { x: number; y: number } | null;
  rechargeText: string;
  nextBonusText: string;
  canPlace: boolean;
};

export function BattleHud({ profile, cursor, rechargeText, nextBonusText, canPlace }: BattleHudProps) {
  const balance = profile?.balance ?? 0;
  const rechargeStatus = balance >= MAX_BALANCE ? 'MAX' : `+1 ${rechargeText}`;

  return (
    <section className="battle-panel battle-hud">
      <div>
        <div className="battle-panel__title">My pixels</div>
        <strong>{balance} / {MAX_BALANCE}</strong>
        <span>{rechargeStatus}</span>
      </div>
      <div>
        <div className="battle-panel__title">Placed</div>
        <strong>{profile?.placed_pixels ?? 0}</strong>
        <span>daily full {nextBonusText}</span>
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
        <p className="battle-hint">Pixels are over. Wait for recharge.</p>
      )}
    </section>
  );
}
