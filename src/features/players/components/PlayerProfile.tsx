import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { getTeamColorVar } from '@/constants/teamColors';
import { PlayerRating } from './PlayerRating';
import { PlayerStats } from './PlayerStats';
import { PlayerRadar } from './PlayerRadar';
import type { PlayerWithStats } from '../types';

const POSITION_LABELS: Record<PlayerWithStats['position'], string> = {
  GK: 'Thủ môn',
  DF: 'Hậu vệ',
  MF: 'Tiền vệ',
  FW: 'Tiền đạo',
};

export function PlayerProfile({
  player,
  maxScale,
}: {
  player: PlayerWithStats;
  maxScale: { goals: number; assists: number; mvpCount: number };
}) {
  const color = getTeamColorVar(player.teamId);

  return (
    <div style={{ display: 'grid', gap: 'var(--ptx-space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ptx-space-4)' }}>
        <Avatar src={player.avatarUrl} name={player.name} size={72} />
        <h1 style={{ fontFamily: 'var(--ptx-font-logo)', margin: 0 }}>{player.name}</h1>
        <PlayerRating rating={player.rating} />
      </div>
      <p style={{ color: 'var(--text-muted)' }}>
        {POSITION_LABELS[player.position]} · {player.teamName}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 'var(--ptx-space-8)', alignItems: 'start' }}>
        <Card>
          <PlayerRadar stats={player.stats} maxScale={maxScale} color={color} />
        </Card>
        <Card>
          <h2 style={{ fontFamily: 'var(--ptx-font-title)', marginTop: 0 }}>Thống kê mùa giải</h2>
          <PlayerStats stats={player.stats} />
        </Card>
      </div>
    </div>
  );
}
