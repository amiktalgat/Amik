import type { BattleLeaderboardEntry } from '../../lib/pixelBattle';

type LeaderboardProps = {
  entries: BattleLeaderboardEntry[];
  currentUserId?: string;
  loading: boolean;
};

export function Leaderboard({ entries, currentUserId, loading }: LeaderboardProps) {
  return (
    <section className="battle-panel battle-leaderboard">
      <div className="battle-panel__title">Leaderboard</div>
      {loading ? (
        <p className="battle-leaderboard__empty">Loading top players...</p>
      ) : entries.length === 0 ? (
        <p className="battle-leaderboard__empty">No scores yet. Place the first pixel to appear here.</p>
      ) : (
        <ol className="battle-leaderboard__list">
          {entries.map((entry) => (
            <li className={entry.user_id === currentUserId ? 'active' : ''} key={entry.user_id}>
              <span className="battle-leaderboard__rank">#{entry.rank}</span>
              <span className="battle-leaderboard__name">{entry.username}</span>
              <strong>{entry.placed_pixels}</strong>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
