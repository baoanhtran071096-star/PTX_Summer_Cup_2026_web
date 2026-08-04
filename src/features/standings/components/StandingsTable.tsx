import type { StandingsRowWithTeam } from '../queries';

export function StandingsTable({ rows }: { rows: StandingsRowWithTeam[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
            <th style={{ padding: 'var(--ptx-space-2)' }}>#</th>
            <th style={{ padding: 'var(--ptx-space-2)' }}>Đội</th>
            <th style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>Trận</th>
            <th style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>T</th>
            <th style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>H</th>
            <th style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>B</th>
            <th style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>HS</th>
            <th style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>Điểm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.teamId} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td style={{ padding: 'var(--ptx-space-2)', color: 'var(--text-muted)' }}>{index + 1}</td>
              <td style={{ padding: 'var(--ptx-space-2)' }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: row.teamColor, marginRight: 'var(--ptx-space-2)' }} />
                {row.teamName}
              </td>
              <td style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>{row.played}</td>
              <td style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>{row.wins}</td>
              <td style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>{row.draws}</td>
              <td style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>{row.losses}</td>
              <td style={{ padding: 'var(--ptx-space-2)', textAlign: 'center' }}>
                {row.goalDifference > 0 ? '+' : ''}
                {row.goalDifference}
              </td>
              <td style={{ padding: 'var(--ptx-space-2)', textAlign: 'center', fontWeight: 700 }}>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
