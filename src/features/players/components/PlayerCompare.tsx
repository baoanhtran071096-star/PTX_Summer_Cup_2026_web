import { Card } from '@/components/ui/Card';
import { getTeamColorVar } from '@/constants/teamColors';
import { calculateStatsMaxScale } from '@/domain/player/rules';
import { PlayerRating } from './PlayerRating';
import { PlayerStats } from './PlayerStats';
import { PlayerRadar } from './PlayerRadar';
import type { PlayerWithStats } from '../types';

export function PlayerCompare({ players }: { players: PlayerWithStats[] }) {
  if (players.length < 2) {
    return (
      <p style={{ color: 'var(--text-muted)' }}>
        Chọn 2 cầu thủ để so sánh (ví dụ: ?a=1&amp;b=9).
      </p>
    );
  }

  const maxScale = calculateStatsMaxScale(players.map((p) => p.stats));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${players.length}, 1fr)`, gap: 'var(--ptx-space-6)' }}>
      {players.map((player) => {
        const color = getTeamColorVar(player.teamId);
        return (
          <Card key={player.id} style={{ borderTop: `4px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--ptx-font-title)' }}>{player.name}</h3>
              <PlayerRating rating={player.rating} />
            </div>
            <p style={{ color: 'var(--text-muted)' }}>{player.teamName}</p>
            <PlayerRadar stats={player.stats} maxScale={maxScale} color={color} />
            <PlayerStats stats={player.stats} />
          </Card>
        );
      })}
    </div>
  );
}
