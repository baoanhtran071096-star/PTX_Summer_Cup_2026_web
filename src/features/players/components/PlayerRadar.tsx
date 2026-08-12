import { RadarChart } from '@/components/ui/RadarChart';
import type { PlayerPerformanceStats } from '@/domain/player/player.entity';

/**
 * Only positive-is-better stats get an axis (goals/assists/mvp) —
 * cards are intentionally excluded, since a bigger radar spike reading
 * as "more red cards" would be a misleading visualization. Card counts
 * are still shown numerically in PlayerStats.
 */
export function PlayerRadar({
  stats,
  maxScale,
  color,
}: {
  stats: PlayerPerformanceStats;
  /** Normalization ceiling — typically the tournament-wide max for each stat. */
  maxScale: { goals: number; assists: number; mvpCount: number };
  color: string;
}) {
  const max = Math.max(1, maxScale.goals, maxScale.assists, maxScale.mvpCount);

  return (
    <RadarChart
      max={max}
      color={color}
      ariaLabel="Biểu đồ phong độ cầu thủ"
      axes={[
        { key: 'goals', label: 'Bàn thắng', value: stats.goals },
        { key: 'assists', label: 'Kiến tạo', value: stats.assists },
        { key: 'mvpCount', label: 'MVP', value: stats.mvpCount },
      ]}
    />
  );
}
