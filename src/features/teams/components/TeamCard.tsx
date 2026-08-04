import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ROUTES } from '@/constants/routes';
import { getTeamColorVar, getTeamTextColorVar } from '@/constants/teamColors';
import type { TeamWithSquad } from '../types';

export function TeamCard({ team }: { team: TeamWithSquad }) {
  const color = getTeamColorVar(team.id);
  const textColor = getTeamTextColorVar(team.id);

  return (
    <Link href={ROUTES.team(team.id)} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ptx-space-3)' }}>
            <Avatar src={team.logoUrl} name={team.icon ?? team.name} />
            <div>
              <h3 style={{ fontFamily: 'var(--ptx-font-title)', margin: 0 }}>
                {team.icon} {team.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>{team.fullName}</p>
            </div>
          </div>
          <Badge accentColor={color} textColor={textColor}>OVR {team.ovr}</Badge>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 0 }}>
          Đội trưởng: {team.captainName ?? 'Chưa xác định'} · {team.squad.length} cầu thủ
        </p>
      </Card>
    </Link>
  );
}
