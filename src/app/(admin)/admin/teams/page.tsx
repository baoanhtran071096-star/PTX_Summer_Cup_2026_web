import { getAllTeamsWithSquads } from '@/features/teams/queries';
import { updateTeamAction } from '@/features/admin/actions';

export const dynamic = 'force-dynamic';

export default async function AdminTeamsPage() {
  const teams = await getAllTeamsWithSquads();

  return (
    <div>
      <h1>Đội bóng</h1>
      <div style={{ display: 'grid', gap: 'var(--ptx-space-6)' }}>
        {teams.map((team) => (
          <form
            key={team.id}
            action={updateTeamAction}
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--ptx-radius-md)', padding: 'var(--ptx-space-4)', display: 'grid', gap: 'var(--ptx-space-2)', maxWidth: '480px' }}
          >
            <h2 style={{ margin: 0 }}>
              {team.icon} {team.name} (OVR {team.ovr})
            </h2>
            <input type="hidden" name="teamId" value={team.id} />
            <label>
              Đội trưởng
              <input name="captainName" defaultValue={team.captainName ?? ''} style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-1)' }} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--ptx-space-2)' }}>
              <label>
                Tấn công
                <input type="number" name="attack" min={0} max={99} defaultValue={team.stats.attack} style={{ width: '100%' }} />
              </label>
              <label>
                Phòng ngự
                <input type="number" name="defense" min={0} max={99} defaultValue={team.stats.defense} style={{ width: '100%' }} />
              </label>
              <label>
                Tốc độ
                <input type="number" name="speed" min={0} max={99} defaultValue={team.stats.speed} style={{ width: '100%' }} />
              </label>
              <label>
                Thể lực
                <input type="number" name="power" min={0} max={99} defaultValue={team.stats.power} style={{ width: '100%' }} />
              </label>
            </div>
            <button
              type="submit"
              style={{ justifySelf: 'start', background: 'var(--interactive-primary)', color: 'var(--text-on-interactive-primary)', border: 'none', borderRadius: 'var(--ptx-radius-sm)', padding: 'var(--ptx-space-2) var(--ptx-space-4)' }}
            >
              Lưu
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
