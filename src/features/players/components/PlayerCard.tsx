import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ROUTES } from '@/constants/routes';
import { getTeamColorVar } from '@/constants/teamColors';
import { PlayerRating } from './PlayerRating';
import type { PlayerWithStats } from '../types';

const POSITION_LABELS: Record<PlayerWithStats['position'], string> = {
  GK: 'Thủ môn',
  DF: 'Hậu vệ',
  MF: 'Tiền vệ',
  FW: 'Tiền đạo',
};

export function PlayerCard({ player }: { player: PlayerWithStats }) {
  const color = getTeamColorVar(player.teamId);

  if (player.legacyId == null) return null;

  return (
    <Link href={ROUTES.player(player.legacyId)} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card style={{ borderTop: `4px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ptx-space-3)' }}>
            <Avatar src={player.avatarUrl} name={player.name} />
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--ptx-font-title)' }}>{player.name}</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                {POSITION_LABELS[player.position]} · {player.teamName}
              </p>
            </div>
          </div>
          <PlayerRating rating={player.rating} />
        </div>
      </Card>
    </Link>
  );
}
