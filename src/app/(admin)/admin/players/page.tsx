import { getAllPlayersWithStats } from '@/features/players/queries';
import { getAllTeamsWithSquads } from '@/features/teams/queries';
import { updatePlayerAction } from '@/features/admin/actions';

export const dynamic = 'force-dynamic';

const POSITIONS = ['GK', 'DF', 'MF', 'FW'] as const;

export default async function AdminPlayersPage() {
  const [players, teams] = await Promise.all([getAllPlayersWithStats(), getAllTeamsWithSquads()]);

  return (
    <div>
      <h1>Cầu thủ</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', maxWidth: '720px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)' }}>
            <th>Tên</th>
            <th>Đội</th>
            <th>Vị trí</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
              <td>
                <form id={`player-form-${player.id}`} action={updatePlayerAction}>
                  <input type="hidden" name="playerId" value={player.id} />
                  <input name="name" defaultValue={player.name} style={{ width: '100%', padding: 'var(--ptx-space-1)' }} />
                </form>
              </td>
              <td>
                <select name="teamId" form={`player-form-${player.id}`} defaultValue={player.teamId}>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select name="position" form={`player-form-${player.id}`} defaultValue={player.position}>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <button type="submit" form={`player-form-${player.id}`}>
                  Lưu
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
