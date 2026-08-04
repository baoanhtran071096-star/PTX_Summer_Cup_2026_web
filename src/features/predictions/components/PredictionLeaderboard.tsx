import type { LeaderboardEntry } from '../queries';

export function PredictionLeaderboard({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>Chưa có ai dự đoán. Hãy là người đầu tiên!</p>;
  }

  return (
    <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 'var(--ptx-space-2)' }}>
      {entries.map((entry, index) => (
        <li
          key={entry.ticketCode}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: 'var(--ptx-space-2) var(--ptx-space-3)',
            borderRadius: 'var(--ptx-radius-sm)',
            background: 'var(--surface-page)',
          }}
        >
          <span>
            {index + 1}. {entry.displayName}
          </span>
          <strong>{entry.points} điểm</strong>
        </li>
      ))}
    </ol>
  );
}
