import type { PlayerStatLeader } from '../queries';

export function LeaderboardTable({ title, entries }: { title: string; entries: PlayerStatLeader[] }) {
  return (
    <div>
      <h2 style={{ fontFamily: 'var(--ptx-font-title)' }}>{title}</h2>
      {entries.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Chưa có dữ liệu.</p>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 'var(--ptx-space-2)' }}>
          {entries.map((entry, index) => (
            <li
              key={entry.playerId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 'var(--ptx-space-2) var(--ptx-space-3)',
                borderRadius: 'var(--ptx-radius-sm)',
                background: 'var(--surface-page)',
              }}
            >
              <span>
                {index + 1}. {entry.playerName} <span style={{ color: 'var(--text-muted)' }}>({entry.teamName})</span>
              </span>
              <strong>{entry.value}</strong>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
