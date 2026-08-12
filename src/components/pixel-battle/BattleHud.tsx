import { MAX_BALANCE, RECHARGE_SECONDS, type BattleProfile } from '../../lib/pixelBattle';

type BattleHudProps = {
  profile: BattleProfile | null;
  cursor: { x: number; y: number } | null;
  secondsLeft: number | null;
  canPlace: boolean;
};

export function BattleHud({ profile, cursor, secondsLeft, canPlace }: BattleHudProps) {
  const balance = profile?.balance ?? 0;
  const rechargeText =
    balance >= MAX_BALANCE ? 'MAX' : `+1 in ${(secondsLeft ?? RECHARGE_SECONDS).toFixed(1)}s`;

  return (
    <section className="battle-panel battle-hud">
      <div>
        <div className="battle-panel__title">Pixels</div>
        <strong>{balance} / {MAX_BALANCE}</strong>
        <span>{rechargeText}</span>
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
