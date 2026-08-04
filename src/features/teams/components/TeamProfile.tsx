import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { TeamRadar } from './TeamRadar';
import { SquadList } from './SquadList';
import { getTeamColorVar, getTeamTextColorVar } from '@/constants/teamColors';
import type { TeamWithSquad } from '../types';

export function TeamProfile({ team }: { team: TeamWithSquad }) {
  const color = getTeamColorVar(team.id);
  const textColor = getTeamTextColorVar(team.id);

  return (
    <div style={{ display: 'grid', gap: 'var(--ptx-space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ptx-space-4)' }}>
        <Avatar src={team.logoUrl} name={team.icon ?? team.name} size={72} />
        <h1 style={{ fontFamily: 'var(--ptx-font-logo)', margin: 0 }}>
          {team.icon} {team.name}
        </h1>
        <Badge accentColor={color} textColor={textColor}>OVR {team.ovr}</Badge>
      </div>
      <p style={{ color: 'var(--text-muted)' }}>
        {team.fullName} · Đội trưởng: {team.captainName ?? 'Chưa xác định'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--ptx-space-8)', alignItems: 'start' }}>
        <Card>
          <TeamRadar stats={team.stats} color={color} />
        </Card>
        <Card>
          <h2 style={{ fontFamily: 'var(--ptx-font-title)', marginTop: 0 }}>Đội hình</h2>
          <SquadList squad={team.squad} />
        </Card>
      </div>
    </div>
  );
}
